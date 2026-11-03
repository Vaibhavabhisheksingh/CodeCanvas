"use client";
import "./page.css";
import { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import ArchitectureNode from "./components/ArchitectureNode";
import ComponentSidebar from "./components/ComponentSidebar";
import PropertiesPanel from "./components/PropertiesPanel";
import SimulationResults from "./components/SimulationResults";
import ArchitectureHealthReport from "./components/ArchitectureHealthReport";

import {
  validateArchitecture,
  propagateTraffic,
  calculateUtilization,
  calculateQueueingMetrics,
  calculateEndToEndLatency,
  analyzeArchitectureHealth,
} from "./lib/graphEngine";

import { apiFetch } from "./lib/api";

const API_URL = "/api/architectures";
const VERSION_API_URL = "/api/versions";

async function authenticatedFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include",
  });
}

const nodeTypes = {
  client: ArchitectureNode,
  loadBalancer: ArchitectureNode,
  server: ArchitectureNode,
  cache: ArchitectureNode,
  database: ArchitectureNode,
};

const initialNodes = [
  {
    id: "client-1",
    type: "client",
    position: { x: 100, y: 150 },
    data: { label: "Client", capacity: 10000, servers: 1 },
  },
  {
    id: "server-1",
    type: "server",
    position: { x: 400, y: 150 },
    data: { label: "Server", capacity: 5000, servers: 1 },
  },
  {
    id: "database-1",
    type: "database",
    position: { x: 700, y: 150 },
    data: { label: "Database", capacity: 3000, servers: 1 },
  },
];

const initialEdges = [
  {
    id: "client-server",
    source: "client-1",
    target: "server-1",
    animated: true,
  },
  {
    id: "server-database",
    source: "server-1",
    target: "database-1",
    animated: true,
  },
];

function HomeCanvas() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [healthReport, setHealthReport] = useState(null);
  const [trafficInput, setTrafficInput] = useState(10000);

  // Architecture persistence state
  const [architectureName, setArchitectureName] = useState("");
  const [savedArchitectures, setSavedArchitectures] = useState([]);
  const [selectedArchitectureId, setSelectedArchitectureId] = useState("");

  const [persistenceMessage, setPersistenceMessage] = useState("");
  const [persistenceError, setPersistenceError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingArchitectures, setIsLoadingArchitectures] = useState(false);

  // Version history state
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [architectureVersions, setArchitectureVersions] = useState([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [selectedVersionNumbers, setSelectedVersionNumbers] = useState([]);
  const [isVersionActionRunning, setIsVersionActionRunning] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        const response = await apiFetch("/auth/me");

        if (!response.ok) {
          window.location.replace("/login");
          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setCurrentUser(data.user || data);
          setAuthChecking(false);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);

        if (!cancelled) {
          window.location.replace("/login");
        }
      }
    }

    verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      window.location.replace("/login");
    }
  }
  // --------------------------------------------------
  // FETCH SAVED ARCHITECTURES
  // --------------------------------------------------

  const fetchArchitectures = useCallback(async () => {
    setIsLoadingArchitectures(true);

    try {
      const response = await apiFetch("/architectures"); //fetch(API_URL)
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch architectures.");
      }

      setSavedArchitectures(result.architectures || []);
      setPersistenceError(false);
      setPersistenceMessage("");
    } catch (error) {
      setPersistenceError(true);
      setPersistenceMessage(
        `${error.message}. Make sure the backend is running on port 5000.`,
      );
    } finally {
      setIsLoadingArchitectures(false);
    }
  }, []);

  useEffect(() => {
    fetchArchitectures();
  }, [fetchArchitectures]);

  // Health results belong to the exact graph and traffic analyzed.
  useEffect(() => {
    setHealthReport(null);
  }, [nodes, edges, trafficInput]);

  // --------------------------------------------------
  // FETCH ARCHITECTURE VERSION HISTORY
  // GET /api/versions/:architectureId
  // --------------------------------------------------

  const fetchArchitectureVersions = useCallback(
    async (architectureId = selectedArchitectureId) => {
      if (!architectureId) {
        setArchitectureVersions([]);
        return;
      }

      setIsLoadingVersions(true);

      try {
        const response = await authenticatedFetch(
          `${VERSION_API_URL}/${encodeURIComponent(architectureId)}`,
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load version history.");
        }

        setArchitectureVersions(result.versions || []);
      } catch (error) {
        setPersistenceError(true);
        setPersistenceMessage(
          error.message || "Failed to load version history.",
        );
      } finally {
        setIsLoadingVersions(false);
      }
    },
    [selectedArchitectureId],
  );

  // --------------------------------------------------
  // OPEN VERSION HISTORY
  // --------------------------------------------------

  const handleOpenVersionHistory = useCallback(async () => {
    if (!selectedArchitectureId) {
      setPersistenceError(true);
      setPersistenceMessage(
        "Select or save an architecture before opening version history.",
      );
      return;
    }

    setIsVersionHistoryOpen(true);
    setSelectedVersion(null);

    await fetchArchitectureVersions(selectedArchitectureId);
  }, [selectedArchitectureId, fetchArchitectureVersions]);

  // --------------------------------------------------
  // CREATE A VERSION SNAPSHOT
  // POST /api/versions/:architectureId
  // --------------------------------------------------

  const handleCreateVersion = useCallback(async () => {
    if (!selectedArchitectureId) {
      setPersistenceError(true);
      setPersistenceMessage(
        "Save this architecture before creating a version.",
      );
      return;
    }

    const trimmedName = architectureName.trim();

    if (!trimmedName) {
      setPersistenceError(true);
      setPersistenceMessage("Architecture name cannot be empty.");
      return;
    }

    setIsVersionActionRunning(true);

    try {
      const response = await authenticatedFetch(
        `${VERSION_API_URL}/${encodeURIComponent(selectedArchitectureId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            description: "",
            nodes,
            edges,
            changeSummary: "Manual snapshot from CodeCanvas",
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to create architecture version.",
        );
      }

      setPersistenceError(false);
      setPersistenceMessage(
        `Version ${result.version?.versionNumber ?? ""} created successfully.`,
      );

      await fetchArchitectureVersions(selectedArchitectureId);
    } catch (error) {
      setPersistenceError(true);
      setPersistenceMessage(
        error.message || "Failed to create architecture version.",
      );
    } finally {
      setIsVersionActionRunning(false);
    }
  }, [
    selectedArchitectureId,
    architectureName,
    nodes,
    edges,
    fetchArchitectureVersions,
  ]);

  // --------------------------------------------------
  // PREVIEW A VERSION
  // GET /api/versions/:architectureId/:versionNumber
  // --------------------------------------------------

  const handlePreviewVersion = useCallback(
    async (versionNumber) => {
      if (!selectedArchitectureId) return;

      setIsVersionActionRunning(true);

      try {
        const response = await authenticatedFetch(
          `${VERSION_API_URL}/${encodeURIComponent(selectedArchitectureId)}/${versionNumber}`,
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load selected version.");
        }

        const version = result.version;

        setNodes(version.nodes || []);
        setEdges(version.edges || []);
        setArchitectureName(version.name || "");
        setSelectedVersion(version.versionNumber);

        setSelectedNodeId(null);
        setValidationResult(null);
        setSimulationResult(null);
        setHealthReport(null);

        setPersistenceError(false);
        setPersistenceMessage(
          `Previewing version ${version.versionNumber}. This preview has not been saved as the current architecture.`,
        );

        window.setTimeout(() => {
          fitView({ padding: 0.2, duration: 250 });
        }, 50);
      } catch (error) {
        setPersistenceError(true);
        setPersistenceMessage(error.message || "Failed to preview version.");
      } finally {
        setIsVersionActionRunning(false);
      }
    },
    [selectedArchitectureId, setNodes, setEdges, fitView],
  );

  // --------------------------------------------------
  // RESTORE A VERSION WITH A PRE-RESTORE BACKUP
  // POST /api/versions/:architectureId/:versionNumber/restore
  // --------------------------------------------------

  const handleRestoreVersion = useCallback(
    async (versionNumber) => {
      if (!selectedArchitectureId) return;

      const confirmed = window.confirm(
        `Restore version ${versionNumber}? CodeCanvas will first save a backup of the current canvas as a new version.`,
      );

      if (!confirmed) return;

      setIsVersionActionRunning(true);

      try {
        // Preserve the current canvas before rollback.
        const backupResponse = await authenticatedFetch(
          `${VERSION_API_URL}/${encodeURIComponent(selectedArchitectureId)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: architectureName.trim() || "Untitled Architecture",
              description: "",
              nodes,
              edges,
              changeSummary: `Automatic backup before restoring version ${versionNumber}`,
            }),
          },
        );

        const backupResult = await backupResponse.json();

        if (!backupResponse.ok) {
          throw new Error(
            backupResult.message ||
              "Could not create a pre-restore backup. Restore cancelled.",
          );
        }

        // Restore the selected saved version.
        const restoreResponse = await authenticatedFetch(
          `${VERSION_API_URL}/${encodeURIComponent(selectedArchitectureId)}/${versionNumber}/restore`,
          {
            method: "POST",
          },
        );

        const restoreResult = await restoreResponse.json();

        if (!restoreResponse.ok) {
          throw new Error(
            restoreResult.message || "Failed to restore architecture version.",
          );
        }

        const restored = restoreResult.architecture;

        setNodes(restored.nodes || []);
        setEdges(restored.edges || []);
        setArchitectureName(restored.name || "");

        setSelectedNodeId(null);
        setValidationResult(null);
        setSimulationResult(null);
        setHealthReport(null);
        setSelectedVersion(versionNumber);

        setPersistenceError(false);
        setPersistenceMessage(
          `Version ${versionNumber} restored. Previous canvas saved as backup version ${backupResult.version?.versionNumber ?? ""}.`,
        );

        await Promise.all([
          fetchArchitectureVersions(selectedArchitectureId),
          fetchArchitectures(),
        ]);

        window.setTimeout(() => {
          fitView({ padding: 0.2, duration: 250 });
        }, 50);
      } catch (error) {
        setPersistenceError(true);
        setPersistenceMessage(
          error.message || "Failed to restore architecture version.",
        );
      } finally {
        setIsVersionActionRunning(false);
      }
    },
    [
      selectedArchitectureId,
      architectureName,
      nodes,
      edges,
      setNodes,
      setEdges,
      fetchArchitectureVersions,
      fetchArchitectures,
      fitView,
    ],
  );
  // SELECT OR DESELECT ONE VERSION
  const handleToggleVersionSelection = useCallback((versionNumber) => {
    setSelectedVersionNumbers((current) =>
      current.includes(versionNumber)
        ? current.filter((number) => number !== versionNumber)
        : [...current, versionNumber],
    );
  }, []);

  // SELECT ALL OR DESELECT ALL VERSIONS
  const handleSelectAllVersions = useCallback(() => {
    setSelectedVersionNumbers((current) =>
      current.length === architectureVersions.length
        ? []
        : architectureVersions.map((version) => version.versionNumber),
    );
  }, [architectureVersions]);

  // DELETE ONE VERSION
  const handleDeleteVersion = useCallback(
    async (versionNumber) => {
      if (!selectedArchitectureId) return;

      const confirmed = window.confirm(
        `Permanently delete version ${versionNumber}? This cannot be undone.`,
      );

      if (!confirmed) return;

      setIsVersionActionRunning(true);

      try {
        const response = await authenticatedFetch(
          `${VERSION_API_URL}/${encodeURIComponent(
            selectedArchitectureId,
          )}/${versionNumber}`,
          { method: "DELETE" },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to delete version.");
        }

        setSelectedVersionNumbers((current) =>
          current.filter((number) => number !== versionNumber),
        );

        setPersistenceError(false);
        setPersistenceMessage(`Version ${versionNumber} deleted successfully.`);

        await fetchArchitectureVersions(selectedArchitectureId);
      } catch (error) {
        setPersistenceError(true);
        setPersistenceMessage(error.message || "Failed to delete version.");
      } finally {
        setIsVersionActionRunning(false);
      }
    },
    [selectedArchitectureId, fetchArchitectureVersions],
  );

  // DELETE SELECTED VERSIONS
  const handleDeleteSelectedVersions = useCallback(async () => {
    if (!selectedArchitectureId || selectedVersionNumbers.length === 0) {
      return;
    }

    const count = selectedVersionNumbers.length;

    const confirmed = window.confirm(
      `Permanently delete all ${count} selected version(s)? This cannot be undone.`,
    );

    if (!confirmed) return;

    setIsVersionActionRunning(true);

    try {
      const results = await Promise.all(
        selectedVersionNumbers.map(async (versionNumber) => {
          const response = await authenticatedFetch(
            `${VERSION_API_URL}/${encodeURIComponent(
              selectedArchitectureId,
            )}/${versionNumber}`,
            { method: "DELETE" },
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              result.message || `Failed to delete version ${versionNumber}.`,
            );
          }

          return versionNumber;
        }),
      );

      setSelectedVersionNumbers([]);

      setPersistenceError(false);
      setPersistenceMessage(
        `${results.length} version(s) deleted successfully.`,
      );

      await fetchArchitectureVersions(selectedArchitectureId);
    } catch (error) {
      setPersistenceError(true);
      setPersistenceMessage(
        error.message || "Failed to delete selected versions.",
      );

      await fetchArchitectureVersions(selectedArchitectureId);
    } finally {
      setIsVersionActionRunning(false);
    }
  }, [
    selectedArchitectureId,
    selectedVersionNumbers,
    fetchArchitectureVersions,
  ]);

  // DELETE ALL VERSIONS
  const handleDeleteAllVersions = useCallback(async () => {
    if (!selectedArchitectureId || architectureVersions.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete ALL ${architectureVersions.length} versions? The saved architecture itself will NOT be deleted. This cannot be undone.`,
    );

    if (!confirmed) return;

    setIsVersionActionRunning(true);

    try {
      const response = await authenticatedFetch(
        `${VERSION_API_URL}/${encodeURIComponent(selectedArchitectureId)}`,
        { method: "DELETE" },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete all versions.");
      }

      setArchitectureVersions([]);
      setSelectedVersionNumbers([]);

      setPersistenceError(false);
      setPersistenceMessage(
        result.message || "All versions deleted successfully.",
      );
    } catch (error) {
      setPersistenceError(true);
      setPersistenceMessage(error.message || "Failed to delete all versions.");
    } finally {
      setIsVersionActionRunning(false);
    }
  }, [selectedArchitectureId, architectureVersions.length]);

  // --------------------------------------------------
  // CONNECT NODES
  // --------------------------------------------------

  const onConnect = useCallback(
    (connection) => {
      setEdges((currentEdges) => addEdge(connection, currentEdges));
    },
    [setEdges],
  );

  // --------------------------------------------------
  // ADD COMPONENT FROM SIDEBAR
  // --------------------------------------------------

  const onAddComponent = useCallback(
    (component) => {
      setNodes((currentNodes) => {
        const count = currentNodes.length;

        const existingCount = currentNodes.filter(
          (node) => node.type === component.type,
        ).length;

        const componentNumber = existingCount + 1;

        const newNode = {
          id: `${component.type}-${Date.now()}`,
          type: component.type,
          position: {
            x: 100 + (count % 3) * 220,
            y: 100 + Math.floor(count / 3) * 150,
          },
          data: {
            label:
              componentNumber === 1
                ? component.label
                : `${component.label} ${componentNumber}`,
            capacity: 5000,
            servers: 1,
          },
        };

        return [...currentNodes, newNode];
      });
    },
    [setNodes],
  );

  // --------------------------------------------------
  // DRAG AND DROP COMPONENTS
  // --------------------------------------------------

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const componentData = event.dataTransfer.getData(
        "application/codecanvas",
      );

      if (!componentData || !reactFlowWrapper.current) {
        return;
      }

      let component;

      try {
        component = JSON.parse(componentData);
      } catch {
        setPersistenceError(true);
        setPersistenceMessage("Could not read the dropped component data.");
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setNodes((currentNodes) => {
        const existingCount = currentNodes.filter(
          (node) => node.type === component.type,
        ).length;

        const componentNumber = existingCount + 1;

        return [
          ...currentNodes,
          {
            id: `${component.type}-${crypto.randomUUID()}`,
            type: component.type,
            position,
            data: {
              label:
                componentNumber === 1
                  ? component.label
                  : `${component.label} ${componentNumber}`,
              capacity: 5000,
              servers: 1,
            },
          },
        ];
      });
    },
    [screenToFlowPosition, setNodes],
  );

  // --------------------------------------------------
  // UPDATE NODE PROPERTIES
  // --------------------------------------------------

  const handleSaveProperties = useCallback(
    (nodeId, updatedData) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...updatedData,
                },
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  // --------------------------------------------------
  // VALIDATE ARCHITECTURE
  // --------------------------------------------------

  const handleValidateArchitecture = useCallback(() => {
    const result = validateArchitecture(nodes, edges);
    setValidationResult(result);
  }, [nodes, edges]);

  // --------------------------------------------------
  // RUN PERFORMANCE SIMULATION
  // --------------------------------------------------

  const handleRunSimulation = useCallback(() => {
    try {
      const trafficValue = Number(trafficInput);

      if (!Number.isFinite(trafficValue) || trafficValue <= 0) {
        throw new Error("Enter a positive traffic value.");
      }

      const validation = validateArchitecture(nodes, edges);

      if (!validation.valid) {
        setValidationResult(validation);
        setSimulationResult(null);
        return;
      }

      const traffic = propagateTraffic(nodes, edges, trafficValue);
      const performance = calculateUtilization(nodes, traffic);
      const queueing = calculateQueueingMetrics(nodes, traffic);

      const endToEndLatency = calculateEndToEndLatency(nodes, edges, queueing);

      setValidationResult(null);

      setSimulationResult({
        traffic,
        performance,
        queueing,
        endToEndLatency,
      });
    } catch (error) {
      setSimulationResult(null);

      setValidationResult({
        valid: false,
        errors: [error.message],
      });
    }
  }, [nodes, edges, trafficInput]);

  // --------------------------------------------------
  // ANALYZE ARCHITECTURE HEALTH
  // --------------------------------------------------

  const handleAnalyzeArchitecture = useCallback(() => {
    try {
      const trafficValue = Number(trafficInput);

      if (!Number.isFinite(trafficValue) || trafficValue <= 0) {
        throw new Error("Enter a positive traffic value before analysis.");
      }

      const validation = validateArchitecture(nodes, edges);

      if (!validation.valid) {
        setHealthReport(null);
        setValidationResult(validation);
        return;
      }

      const traffic = propagateTraffic(nodes, edges, trafficValue);
      const performance = calculateUtilization(nodes, traffic);
      const queueing = calculateQueueingMetrics(nodes, traffic);

      const endToEndLatency = calculateEndToEndLatency(nodes, edges, queueing);

      const report = analyzeArchitectureHealth(
        nodes,
        edges,
        performance,
        queueing,
      );

      setValidationResult(null);

      setSimulationResult({
        traffic,
        performance,
        queueing,
        endToEndLatency,
      });

      setHealthReport(report);
    } catch (error) {
      setHealthReport(null);

      setValidationResult({
        valid: false,
        errors: [error.message || "Architecture analysis failed."],
      });
    }
  }, [nodes, edges, trafficInput]);

  // --------------------------------------------------
  // SAVE NEW ARCHITECTURE
  // POST /api/architectures
  // --------------------------------------------------

  const handleSaveNewArchitecture = useCallback(async () => {
    const trimmedName = architectureName.trim();

    if (!trimmedName) {
      setPersistenceError(true);
      setPersistenceMessage("Enter a name before saving the architecture.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await apiFetch("/architectures", {
        //fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          description: "",
          nodes,
          edges,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save architecture.");
      }

      const saved = result.architecture;

      setSelectedArchitectureId(saved._id);
      setArchitectureName(saved.name);

      setPersistenceError(false);
      setPersistenceMessage("Architecture saved successfully.");

      await fetchArchitectures();
    } catch (error) {
      setPersistenceError(true);
      setPersistenceMessage(error.message || "Failed to save architecture.");
    } finally {
      setIsSaving(false);
    }
  }, [architectureName, nodes, edges, fetchArchitectures]);

  // --------------------------------------------------
  // UPDATE EXISTING ARCHITECTURE
  // PUT /api/architectures/:id
  // --------------------------------------------------

  const handleUpdateArchitecture = useCallback(async () => {
    if (!selectedArchitectureId) {
      setPersistenceError(true);
      setPersistenceMessage("Select an architecture before saving changes.");
      return;
    }

    const trimmedName = architectureName.trim();

    if (!trimmedName) {
      setPersistenceError(true);
      setPersistenceMessage("Architecture name cannot be empty.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await authenticatedFetch(
        `${API_URL}/${encodeURIComponent(selectedArchitectureId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            nodes,
            edges,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update architecture.");
      }

      setArchitectureName(result.architecture.name);

      setPersistenceError(false);
      setPersistenceMessage("Architecture changes saved successfully.");

      await fetchArchitectures();
    } catch (error) {
      setPersistenceError(true);
      setPersistenceMessage(error.message || "Failed to update architecture.");
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedArchitectureId,
    architectureName,
    nodes,
    edges,
    fetchArchitectures,
  ]);

  // --------------------------------------------------
  // LOAD ARCHITECTURE
  // GET /api/architectures/:id
  // --------------------------------------------------

  const handleLoadArchitecture = useCallback(async () => {
    if (!selectedArchitectureId) {
      setPersistenceError(true);
      setPersistenceMessage("Choose an architecture to load.");
      return;
    }

    try {
      const response = await authenticatedFetch(
        `${API_URL}/${encodeURIComponent(selectedArchitectureId)}`,
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load architecture.");
      }

      const architecture = result.architecture;

      setNodes(architecture.nodes || []);
      setEdges(architecture.edges || []);
      setArchitectureName(architecture.name || "");
      setSelectedArchitectureId(architecture._id);

      setSelectedNodeId(null);
      setValidationResult(null);
      setSimulationResult(null);
      setHealthReport(null);
      setSelectedVersion(null);

      setPersistenceError(false);
      setPersistenceMessage(`Loaded "${architecture.name}".`);

      window.setTimeout(() => {
        fitView({
          padding: 0.2,
          duration: 250,
        });
      }, 50);
    } catch (error) {
      setPersistenceError(true);
      setPersistenceMessage(error.message || "Failed to load architecture.");
    }
  }, [selectedArchitectureId, setNodes, setEdges, fitView]);

  // --------------------------------------------------
  // DELETE ARCHITECTURE
  // DELETE /api/architectures/:id
  // --------------------------------------------------

  const handleDeleteArchitecture = useCallback(async () => {
    if (!selectedArchitectureId) {
      setPersistenceError(true);
      setPersistenceMessage("Choose an architecture to delete.");
      return;
    }

    const architectureToDelete = savedArchitectures.find(
      (architecture) => architecture._id === selectedArchitectureId,
    );

    const confirmed = window.confirm(
      `Delete "${
        architectureToDelete?.name || "this architecture"
      }" permanently?`,
    );

    if (!confirmed) return;

    try {
      const response = await authenticatedFetch(
        `${API_URL}/${encodeURIComponent(selectedArchitectureId)}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete architecture.");
      }

      setSavedArchitectures((current) =>
        current.filter(
          (architecture) => architecture._id !== selectedArchitectureId,
        ),
      );

      setSelectedArchitectureId("");
      setArchitectureName("");
      setArchitectureVersions([]);
      setIsVersionHistoryOpen(false);
      setSelectedVersion(null);

      setPersistenceError(false);
      setPersistenceMessage("Architecture deleted successfully.");

      await fetchArchitectures();
    } catch (error) {
      setPersistenceError(true);
      setPersistenceMessage(error.message || "Failed to delete architecture.");
    }
  }, [selectedArchitectureId, savedArchitectures, fetchArchitectures]);

  // --------------------------------------------------
  // COMMON BUTTON STYLE
  // --------------------------------------------------

  const persistenceButtonStyle = {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "white",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap",
  };

  // --------------------------------------------------
  // USER INTERFACE
  // --------------------------------------------------

  if (authChecking || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Verifying your CodeCanvas session...</p>
      </div>
    );
  }

  return (
    <main
      className="codecanvas-dashboard"
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* MAIN HEADER */}

      <header
        className="dashboard-header"
        style={{
          minHeight: "60px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px",
          padding: "10px 24px",
          background: "#111827",
          color: "white",
          fontSize: "22px",
          fontWeight: 700,
        }}
      >
        <span>CodeCanvas</span>

        <span
          style={{
            fontSize: "13px",
            fontWeight: 400,
          }}
        >
          System Architecture Builder
        </span>

        <button
          onClick={handleValidateArchitecture}
          style={{
            marginLeft: "auto",
            padding: "10px 16px",
            border: "none",
            borderRadius: "6px",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Validate Architecture
        </button>

        <button
          onClick={handleAnalyzeArchitecture}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "6px",
            background: "#7c3aed",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Analyze Architecture
        </button>

        <input
          type="number"
          min="1"
          value={trafficInput}
          onChange={(event) => setTrafficInput(event.target.value)}
          aria-label="Incoming traffic in requests per second"
          style={{
            width: "110px",
            padding: "9px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
          }}
        />

        <button
          onClick={handleRunSimulation}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "6px",
            background: "#16a34a",
            color: "white",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Run Simulation
        </button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-300">
            {currentUser.name || currentUser.email}
          </span>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ARCHITECTURE SAVE / LOAD TOOLBAR */}

      <section
        className="dashboard-toolbar"
        aria-label="Architecture persistence controls"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <input
          value={architectureName}
          onChange={(event) => setArchitectureName(event.target.value)}
          placeholder="Architecture name"
          aria-label="Architecture name"
          maxLength={100}
          style={{
            width: "190px",
            padding: "9px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
          }}
        />

        <button
          onClick={handleSaveNewArchitecture}
          disabled={isSaving}
          style={{
            ...persistenceButtonStyle,
            background: "#2563eb",
            color: "white",
            borderColor: "#2563eb",
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          {isSaving ? "Saving..." : "Save New"}
        </button>

        <button
          onClick={handleUpdateArchitecture}
          disabled={isSaving || !selectedArchitectureId}
          style={{
            ...persistenceButtonStyle,
            opacity: isSaving || !selectedArchitectureId ? 0.5 : 1,
          }}
        >
          Save Changes
        </button>

        <select
          value={selectedArchitectureId}
          onChange={(event) => {
            const id = event.target.value;

            setSelectedArchitectureId(id);
            setSelectedVersion(null);

            const selected = savedArchitectures.find(
              (architecture) => architecture._id === id,
            );

            if (selected) {
              setArchitectureName(selected.name);
            }

            setArchitectureVersions([]);
          }}
          aria-label="Select saved architecture"
          style={{
            minWidth: "200px",
            maxWidth: "280px",
            padding: "9px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            background: "white",
          }}
        >
          <option value="">
            {isLoadingArchitectures
              ? "Loading architectures..."
              : "Select saved architecture"}
          </option>

          {savedArchitectures.map((architecture) => (
            <option key={architecture._id} value={architecture._id}>
              {architecture.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleLoadArchitecture}
          disabled={!selectedArchitectureId}
          style={{
            ...persistenceButtonStyle,
            opacity: selectedArchitectureId ? 1 : 0.5,
          }}
        >
          Load
        </button>

        <button
          onClick={handleDeleteArchitecture}
          disabled={!selectedArchitectureId}
          style={{
            ...persistenceButtonStyle,
            color: "#b91c1c",
            opacity: selectedArchitectureId ? 1 : 0.5,
          }}
        >
          Delete
        </button>

        <button
          onClick={fetchArchitectures}
          disabled={isLoadingArchitectures}
          style={{
            ...persistenceButtonStyle,
            opacity: isLoadingArchitectures ? 0.5 : 1,
          }}
        >
          Refresh List
        </button>

        <button
          onClick={handleOpenVersionHistory}
          disabled={!selectedArchitectureId || isLoadingVersions}
          style={{
            ...persistenceButtonStyle,
            background: "#0f766e",
            color: "white",
            borderColor: "#0f766e",
            opacity: !selectedArchitectureId || isLoadingVersions ? 0.5 : 1,
          }}
        >
          Version History
        </button>
      </section>

      {/* BACKEND STATUS MESSAGE */}

      {persistenceMessage && (
        <div
          role="status"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            padding: "8px 16px",
            background: persistenceError ? "#fee2e2" : "#dcfce7",
            color: persistenceError ? "#991b1b" : "#166534",
            borderBottom: "1px solid #e5e7eb",
            fontSize: "13px",
          }}
        >
          <span>{persistenceMessage}</span>

          <button
            className="dismissButton"
            onClick={() => setPersistenceMessage("")}
            aria-label="Dismiss status message"
            // style={styles.dismissButton}
            
          >
            ×
          </button>
        </div>
      )}

      {/* ARCHITECTURE VALIDATION RESULTS */}

      {validationResult && (
        <div
          style={{
            position: "relative",
            padding: "12px 45px 12px 20px",
            background: validationResult.valid ? "#dcfce7" : "#fee2e2",
            color: validationResult.valid ? "#166534" : "#991b1b",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <button
            className="dismissButton"
            onClick={() => setValidationResult(null)}
            aria-label="Dismiss validation results"
            // style={styles.dismissButton}
          >
            ×
          </button>

          <strong>
            {validationResult.valid
              ? "Architecture is valid!"
              : "Architecture validation failed"}
          </strong>

          {validationResult.errors.length > 0 && (
            <ul style={{ marginBottom: 0 }}>
              {validationResult.errors.map((error, index) => (
                <li key={`${index}-${error}`}>{error}</li>
              ))}
            </ul>
          )}

          {validationResult.valid && (
            <p>
              Processing order: {validationResult.topologicalOrder.join(" → ")}
            </p>
          )}
        </div>
      )}

      {/* MAIN ARCHITECTURE EDITOR */}

      <div
        className="dashboard-workspace"
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
        }}
      >
        <ComponentSidebar onAddComponent={onAddComponent} />

        <section
          ref={reactFlowWrapper}
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </section>

        {/* HEALTH REPORT, SIMULATION RESULTS, OR NODE PROPERTIES */}

        {healthReport ? (
          <ArchitectureHealthReport
            report={healthReport}
            onClose={() => setHealthReport(null)}
          />
        ) : simulationResult ? (
          <SimulationResults
            result={simulationResult}
            onClose={() => setSimulationResult(null)}
          />
        ) : (
          <PropertiesPanel
            node={nodes.find((node) => node.id === selectedNodeId) || null}
            onSave={handleSaveProperties}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* VERSION HISTORY MODAL */}

      {isVersionHistoryOpen && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsVersionHistoryOpen(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="version-history-title"
            style={{
              width: "min(850px, 100%)",
              maxHeight: "85vh",
              overflow: "auto",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              padding: "22px",
              color: "#111827",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <div>
                <h2
                  id="version-history-title"
                  style={{ margin: 0, fontSize: "22px" }}
                >
                  Architecture Version History
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  {architectureName || "Selected architecture"} ·{" "}
                  {architectureVersions.length} version(s)
                </p>
              </div>

              <button
                onClick={() => setIsVersionHistoryOpen(false)}
                style={persistenceButtonStyle}
              >
                Close
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                margin: "16px 0",
              }}
            >
              <button
                onClick={handleCreateVersion}
                disabled={isVersionActionRunning}
                style={{
                  ...persistenceButtonStyle,
                  background: "#2563eb",
                  color: "white",
                  borderColor: "#2563eb",
                  opacity: isVersionActionRunning ? 0.6 : 1,
                }}
              >
                {isVersionActionRunning
                  ? "Working..."
                  : "Create Snapshot of Current Canvas"}
              </button>

              <button
                onClick={handleDeleteSelectedVersions}
                disabled={
                  isVersionActionRunning || selectedVersionNumbers.length === 0
                }
                style={{
                  padding: "9px 14px",
                  borderRadius: "6px",
                  border: "1px solid #b91c1c",
                  background: "#b91c1c",
                  color: "white",
                  cursor: "pointer",
                  opacity:
                    isVersionActionRunning ||
                    selectedVersionNumbers.length === 0
                      ? 0.5
                      : 1,
                }}
              >
                Delete Selected ({selectedVersionNumbers.length})
              </button>

              <button
                onClick={handleDeleteAllVersions}
                disabled={
                  isVersionActionRunning || architectureVersions.length === 0
                }
                style={{
                  padding: "9px 14px",
                  borderRadius: "6px",
                  border: "1px solid #7f1d1d",
                  background: "#7f1d1d",
                  color: "white",
                  cursor: "pointer",
                  opacity:
                    isVersionActionRunning || architectureVersions.length === 0
                      ? 0.5
                      : 1,
                }}
              >
                Delete All Versions
              </button>

              <button
                onClick={() =>
                  fetchArchitectureVersions(selectedArchitectureId)
                }
                disabled={isLoadingVersions || isVersionActionRunning}
                style={{
                  ...persistenceButtonStyle,
                  opacity:
                    isLoadingVersions || isVersionActionRunning ? 0.6 : 1,
                }}
              >
                {isLoadingVersions ? "Refreshing..." : "Refresh History"}
              </button>
            </div>

            <p
              style={{
                color: "#4b5563",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              <strong>Preview</strong> loads a snapshot into the editor without
              updating the saved architecture. <strong>Restore</strong> updates
              the saved architecture and creates a backup of the current canvas
              first.
            </p>

            {isLoadingVersions ? (
              <p>Loading versions...</p>
            ) : architectureVersions.length === 0 ? (
              <div
                style={{
                  padding: "28px",
                  textAlign: "center",
                  background: "#f9fafb",
                  borderRadius: "8px",
                  color: "#6b7280",
                }}
              >
                No versions yet. Select{" "}
                <strong>Create Snapshot of Current Canvas</strong> to save the
                first version.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "10px",
                  marginTop: "14px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      architectureVersions.length > 0 &&
                      selectedVersionNumbers.length ===
                        architectureVersions.length
                    }
                    onChange={handleSelectAllVersions}
                    disabled={isVersionActionRunning}
                  />
                  Select All Versions
                </label>
                {architectureVersions.map((version) => (
                  <article
                    key={version._id || version.versionNumber}
                    style={{
                      border:
                        selectedVersion === version.versionNumber
                          ? "2px solid #2563eb"
                          : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "14px",
                      background:
                        selectedVersion === version.versionNumber
                          ? "#eff6ff"
                          : "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "16px" }}>
                          Version {version.versionNumber}
                        </strong>

                        <span
                          style={{
                            marginLeft: "8px",
                            color: "#6b7280",
                            fontSize: "12px",
                          }}
                        >
                          {version.createdAt
                            ? new Date(version.createdAt).toLocaleString()
                            : "Date unavailable"}
                        </span>

                        <div
                          style={{
                            marginTop: "5px",
                            fontWeight: 600,
                          }}
                        >
                          {version.name}
                        </div>

                        <div
                          style={{
                            marginTop: "5px",
                            color: "#6b7280",
                            fontSize: "13px",
                          }}
                        >
                          {version.nodeCount ?? version.nodes?.length ?? 0}{" "}
                          components ·{" "}
                          {version.edgeCount ?? version.edges?.length ?? 0}{" "}
                          connections
                        </div>

                        <div
                          style={{
                            marginTop: "6px",
                            color: "#374151",
                            fontSize: "13px",
                          }}
                        >
                          {version.changeSummary || "Architecture snapshot"}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: "7px",
                        }}
                      >
                        <button
                          onClick={() =>
                            handlePreviewVersion(version.versionNumber)
                          }
                          disabled={isVersionActionRunning}
                          style={{
                            ...persistenceButtonStyle,
                            background: "#f3f4f6",
                            opacity: isVersionActionRunning ? 0.5 : 1,
                          }}
                        >
                          Preview
                        </button>

                        <button
                          onClick={() =>
                            handleRestoreVersion(version.versionNumber)
                          }
                          disabled={isVersionActionRunning}
                          style={{
                            ...persistenceButtonStyle,
                            background: "#b91c1c",
                            color: "white",
                            borderColor: "#b91c1c",
                            opacity: isVersionActionRunning ? 0.5 : 1,
                          }}
                        >
                          Restore
                        </button>
                        <input
                          type="checkbox"
                          aria-label={`Select version ${version.versionNumber}`}
                          checked={selectedVersionNumbers.includes(
                            version.versionNumber,
                          )}
                          onChange={() =>
                            handleToggleVersionSelection(version.versionNumber)
                          }
                          disabled={isVersionActionRunning}
                        />

                        <button
                          onClick={() =>
                            handleDeleteVersion(version.versionNumber)
                          }
                          disabled={isVersionActionRunning}
                          style={{
                            padding: "8px 12px",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            background: "white",
                            color: "#b91c1c",
                            cursor: "pointer",
                            opacity: isVersionActionRunning ? 0.5 : 1,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

// ReactFlow hooks require a ReactFlowProvider parent.
export default function Home() {
  return (
    <ReactFlowProvider>
      <HomeCanvas />
    </ReactFlowProvider>
  );
}
