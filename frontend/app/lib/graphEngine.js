export function buildGraph(nodes, edges) {
  const nodeIds = new Set();
  const adjacencyList = {};
  const incomingEdges = {};

  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      throw new Error(`Duplicate node ID: ${node.id}`);
    }

    nodeIds.add(node.id);
    adjacencyList[node.id] = [];
    incomingEdges[node.id] = [];
  }

  const seenEdges = new Set();

  for (const edge of edges) {
    const { source, target } = edge;

    if (!nodeIds.has(source) || !nodeIds.has(target)) {
      throw new Error(`Invalid connection: ${source} -> ${target}`);
    }

    if (source === target) {
      throw new Error(`Self-connections are not allowed: ${source}`);
    }

    const edgeKey = `${source}->${target}`;

    if (seenEdges.has(edgeKey)) {
      throw new Error(`Duplicate connection: ${source} -> ${target}`);
    }

    seenEdges.add(edgeKey);
    adjacencyList[source].push(target);
    incomingEdges[target].push(source);
  }

  return {
    adjacencyList,
    incomingEdges,
  };
}

export function topologicalSort(nodes, adjacencyList) {
  const indegree = {};

  for (const node of nodes) {
    indegree[node.id] = 0;
  }

  for (const source of Object.keys(adjacencyList)) {
    for (const target of adjacencyList[source]) {
      indegree[target]++;
    }
  }

  const queue = nodes
    .filter((node) => indegree[node.id] === 0)
    .map((node) => node.id);

  const order = [];

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    order.push(current);

    for (const neighbor of adjacencyList[current]) {
      indegree[neighbor]--;

      if (indegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (order.length !== nodes.length) {
    throw new Error(
      "Architecture contains a cycle. Cyclic architectures are not supported yet.",
    );
  }

  return order;
}

export function validateArchitecture(nodes, edges) {
  if (nodes.length === 0) {
    return {
      valid: false,
      errors: ["Add at least one component."],
    };
  }

  const errors = [];

  const supportedTypes = new Set([
    "client",
    "loadBalancer",
    "server",
    "cache",
    "database",
  ]);

  for (const node of nodes) {
    if (!supportedTypes.has(node.type)) {
      errors.push(`Unsupported component type: ${node.type}`);
    }

    if (
      !node.data?.label ||
      typeof node.data.label !== "string" ||
      !node.data.label.trim()
    ) {
      errors.push(`Component ${node.id} needs a valid name.`);
    }

    const capacity = Number(node.data?.capacity);
    const servers = Number(node.data?.servers);

    if (!Number.isFinite(capacity) || capacity <= 0) {
      errors.push(`Component ${node.id} needs a positive capacity.`);
    }

    if (!Number.isInteger(servers) || servers < 1) {
      errors.push(`Component ${node.id} needs at least one instance.`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  try {
    const { adjacencyList, incomingEdges } = buildGraph(nodes, edges);

    const order = topologicalSort(nodes, adjacencyList);

    const clients = nodes.filter((node) => node.type === "client");
    const servers = nodes.filter((node) => node.type === "server");
    const databases = nodes.filter((node) => node.type === "database");

    if (clients.length === 0) {
      errors.push("Add at least one Client.");
    }

    if (servers.length === 0) {
      errors.push("Add at least one Server.");
    }

    if (databases.length === 0) {
      errors.push("Add at least one Database.");
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Clients must be starting points.
    for (const node of clients) {
      if (incomingEdges[node.id].length > 0) {
        errors.push(`${node.data.label} cannot have incoming connections.`);
      }

      if (adjacencyList[node.id].length === 0) {
        errors.push(`${node.data.label} must connect to another component.`);
      }
    }

    // Databases must be terminal destinations.
    for (const node of databases) {
      if (adjacencyList[node.id].length > 0) {
        errors.push(`${node.data.label} cannot have outgoing connections.`);
      }

      if (incomingEdges[node.id].length === 0) {
        errors.push(`${node.data.label} needs an incoming connection.`);
      }
    }

    // Intermediate components must have incoming and outgoing connections.
    for (const node of nodes) {
      if (node.type === "client" || node.type === "database") {
        continue;
      }

      if (incomingEdges[node.id].length === 0) {
        errors.push(`${node.data.label} has no incoming connection.`);
      }

      if (adjacencyList[node.id].length === 0) {
        errors.push(`${node.data.label} has no outgoing connection.`);
      }
    }

    // Find all components reachable from any Client.
    const reachableFromClients = new Set();
    const queue = clients.map((node) => node.id);

    for (const client of clients) {
      reachableFromClients.add(client.id);
    }

    for (let index = 0; index < queue.length; index++) {
      const current = queue[index];

      for (const neighbor of adjacencyList[current]) {
        if (!reachableFromClients.has(neighbor)) {
          reachableFromClients.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    for (const node of nodes) {
      if (!reachableFromClients.has(node.id)) {
        errors.push(`${node.data.label} is not reachable from any Client.`);
      }
    }

    // Build a reversed graph to find components that can reach a Database.
    const reverseGraph = {};

    for (const node of nodes) {
      reverseGraph[node.id] = [];
    }

    for (const edge of edges) {
      reverseGraph[edge.target].push(edge.source);
    }

    const canReachDatabase = new Set();
    const reverseQueue = databases.map((node) => node.id);

    for (const database of databases) {
      canReachDatabase.add(database.id);
    }

    for (let index = 0; index < reverseQueue.length; index++) {
      const current = reverseQueue[index];

      for (const neighbor of reverseGraph[current]) {
        if (!canReachDatabase.has(neighbor)) {
          canReachDatabase.add(neighbor);
          reverseQueue.push(neighbor);
        }
      }
    }

    for (const node of nodes) {
      if (!canReachDatabase.has(node.id)) {
        errors.push(`${node.data.label} has no path to any Database.`);
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    return {
      valid: true,
      errors: [],
      graph: adjacencyList,
      topologicalOrder: order,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [error.message],
    };
  }
}

export function propagateTraffic(nodes, edges, trafficPerClient = 10000) {
  if (!Number.isFinite(trafficPerClient) || trafficPerClient <= 0) {
    throw new Error("Traffic must be a positive number.");
  }

  const validation = validateArchitecture(nodes, edges);

  if (!validation.valid) {
    throw new Error(
      `Cannot simulate invalid architecture: ${validation.errors.join(" ")}`,
    );
  }

  const { graph, topologicalOrder } = validation;

  const trafficByNode = {};
  const trafficByEdge = {};

  for (const node of nodes) {
    trafficByNode[node.id] = 0;
  }

  const clients = nodes.filter((node) => node.type === "client");

  for (const client of clients) {
    trafficByNode[client.id] += trafficPerClient;
  }

  for (const nodeId of topologicalOrder) {
    const outgoingNodes = graph[nodeId];
    const outgoingTraffic = trafficByNode[nodeId];

    if (outgoingNodes.length === 0) {
      continue;
    }

    const trafficPerConnection = outgoingTraffic / outgoingNodes.length;

    for (const targetId of outgoingNodes) {
      const edgeKey = `${nodeId}->${targetId}`;

      trafficByEdge[edgeKey] = trafficPerConnection;

      trafficByNode[targetId] += trafficPerConnection;
    }
  }

  return {
    trafficByNode,
    trafficByEdge,
    totalIncomingTraffic: clients.length * trafficPerClient,
  };
}

export function calculateUtilization(nodes, trafficResult) {
  const results = nodes.map((node) => {
    const incomingTraffic = trafficResult.trafficByNode[node.id] ?? 0;

    const capacityPerInstance = Number(node.data.capacity);
    const instances = Number(node.data.servers);

    const totalCapacity = capacityPerInstance * instances;

    const utilization = (incomingTraffic / totalCapacity) * 100;

    let status = "green";

    if (utilization >= 100) {
      status = "red";
    } else if (utilization >= 70) {
      status = "yellow";
    }

    return {
      nodeId: node.id,
      name: node.data.label,
      type: node.type,
      incomingTraffic,
      capacityPerInstance,
      instances,
      totalCapacity,
      utilization: Number(utilization.toFixed(2)),
      status,
      overloaded: utilization >= 100,
    };
  });

  const bottlenecks = results.filter((component) => component.overloaded);

  return {
    components: results,
    bottlenecks,
    hasBottlenecks: bottlenecks.length > 0,
  };
}

function factorial(n) {
  let result = 1;

  for (let i = 2; i <= n; i++) {
    result *= i;
  }

  return result;
}

export function calculateQueueingMetrics(nodes, trafficResult) {
  return nodes.map((node) => {
    const arrivalRate = trafficResult.trafficByNode[node.id] ?? 0;

    // Clients generate requests; they are not modeled as service queues.
    if (node.type === "client") {
      return {
        nodeId: node.id,
        name: node.data.label,
        model: "N/A",
        arrivalRate,
        serviceRate: null,
        instances: 0,
        utilization: null,
        averageQueueWaitSeconds: null,
        averageResponseSeconds: null,
        stable: true,
        message: "Client generates traffic; no service queue modeled.",
      };
    }

    const serviceRate = Number(node.data.capacity);
    const instances = Number(node.data.servers);

    if (
      !Number.isFinite(arrivalRate) ||
      arrivalRate < 0 ||
      !Number.isFinite(serviceRate) ||
      serviceRate <= 0 ||
      !Number.isInteger(instances) ||
      instances < 1
    ) {
      throw new Error(`Invalid queueing parameters for ${node.data.label}.`);
    }

    const totalServiceRate = instances * serviceRate;
    const utilization = arrivalRate / totalServiceRate;

    const result = {
      nodeId: node.id,
      name: node.data.label,
      model: instances === 1 ? "M/M/1" : "M/M/c",
      arrivalRate,
      serviceRate,
      instances,
      utilization: Number((utilization * 100).toFixed(2)),
      averageQueueWaitSeconds: null,
      averageResponseSeconds: null,
      stable: arrivalRate < totalServiceRate,
      message: "",
    };

    // No steady-state waiting-time estimate for an unstable queue.
    if (arrivalRate >= totalServiceRate) {
      result.message =
        "Unstable: arrival rate must be below total service capacity.";
      return result;
    }

    // M/M/1: one service instance.
    if (instances === 1) {
      const averageQueueWait =
        arrivalRate === 0
          ? 0
          : arrivalRate / (serviceRate * (serviceRate - arrivalRate));

      const averageResponse = 1 / (serviceRate - arrivalRate);

      result.averageQueueWaitSeconds = averageQueueWait;
      result.averageResponseSeconds = averageResponse;
      result.message = "Steady-state M/M/1 estimate.";

      return result;
    }

    // M/M/c: multiple parallel service instances.
    const offeredLoad = arrivalRate / serviceRate;

    let sum = 0;

    for (let n = 0; n < instances; n++) {
      sum += offeredLoad ** n / factorial(n);
    }

    const lastTerm =
      offeredLoad ** instances / (factorial(instances) * (1 - utilization));

    const probabilityWait = lastTerm / (sum + lastTerm);

    const averageQueueWait = probabilityWait / (totalServiceRate - arrivalRate);

    const averageResponse = averageQueueWait + 1 / serviceRate;

    result.averageQueueWaitSeconds = averageQueueWait;
    result.averageResponseSeconds = averageResponse;
    result.message = "Steady-state M/M/c estimate.";

    return result;
  });
}

export function calculateEndToEndLatency(nodes, edges, queueingResults) {
  const validation = validateArchitecture(nodes, edges);

  if (!validation.valid) {
    throw new Error(`Invalid architecture: ${validation.errors.join(", ")}`);
  }

  const { graph, topologicalOrder } = validation;

  const queueingByNode = new Map(
    queueingResults.map((result) => [result.nodeId, result]),
  );

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const latencyByNode = new Map();

  const reverseOrder = [...topologicalOrder].reverse();

  for (const nodeId of reverseOrder) {
    const node = nodeById.get(nodeId);

    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // Clients generate traffic; their processing latency is not modeled.
    // if (node.type === "client") {
    //   latencyByNode.set(nodeId, 0);
    //   continue;
    // }
    if (node.type === "client") {
      const outgoingNodes = graph[nodeId] ?? [];

      if (outgoingNodes.length === 0) {
        latencyByNode.set(nodeId, null);
        continue;
      }

      const branchWeight = 1 / outgoingNodes.length;

      let downstreamLatency = 0;
      let unavailable = false;

      for (const nextNodeId of outgoingNodes) {
        const nextLatency = latencyByNode.get(nextNodeId);

        if (nextLatency === null || nextLatency === undefined) {
          unavailable = true;
          break;
        }

        downstreamLatency += branchWeight * nextLatency;
      }

      latencyByNode.set(nodeId, unavailable ? null : downstreamLatency);

      continue;
    }

    const queueing = queueingByNode.get(nodeId);

    if (
      !queueing ||
      !queueing.stable ||
      queueing.averageResponseSeconds === null ||
      !Number.isFinite(queueing.averageResponseSeconds)
    ) {
      latencyByNode.set(nodeId, null);
      continue;
    }

    const localLatency = queueing.averageResponseSeconds;
    const outgoingNodes = graph[nodeId] ?? [];

    // A terminal component contributes only its own response time.
    if (outgoingNodes.length === 0) {
      latencyByNode.set(nodeId, localLatency);
      continue;
    }

    // The current simulator splits traffic evenly across outgoing edges.
    const branchWeight = 1 / outgoingNodes.length;

    let downstreamLatency = 0;
    let unavailable = false;

    for (const nextNodeId of outgoingNodes) {
      const nextLatency = latencyByNode.get(nextNodeId);

      if (nextLatency === null || nextLatency === undefined) {
        unavailable = true;
        break;
      }

      downstreamLatency += branchWeight * nextLatency;
    }

    latencyByNode.set(
      nodeId,
      unavailable ? null : localLatency + downstreamLatency,
    );
  }

  const clients = nodes.filter((node) => node.type === "client");

  const byClient = clients.map((client) => {
    const latencySeconds = latencyByNode.get(client.id);

    return {
      nodeId: client.id,
      name: client.data.label,
      latencySeconds,
      latencyMs: latencySeconds === null ? null : latencySeconds * 1000,
      available: latencySeconds !== null,
    };
  });

  const unavailableClients = byClient.filter((client) => !client.available);

  const averageEndToEndSeconds =
    unavailableClients.length > 0
      ? null
      : byClient.reduce((sum, client) => sum + client.latencySeconds, 0) /
        byClient.length;

  return {
    byClient,
    averageEndToEndSeconds,
    averageEndToEndMs:
      averageEndToEndSeconds === null ? null : averageEndToEndSeconds * 1000,
    available: averageEndToEndSeconds !== null,
    message:
      averageEndToEndSeconds === null
        ? "End-to-end latency is unavailable because at least one request path contains an unstable or unmodeled component."
        : "Estimated end-to-end latency calculated successfully.",
  };
}

function canClientReachDatabase(nodes, edges, clientId, removedNodeId = null) {
  if (clientId === removedNodeId) {
    return false;
  }

  const databases = new Set(
    nodes
      .filter((node) => node.type === "database" && node.id !== removedNodeId)
      .map((node) => node.id),
  );

  const adjacencyList = {};

  for (const node of nodes) {
    if (node.id !== removedNodeId) {
      adjacencyList[node.id] = [];
    }
  }

  for (const edge of edges) {
    if (
      edge.source !== removedNodeId &&
      edge.target !== removedNodeId &&
      adjacencyList[edge.source] &&
      adjacencyList[edge.target]
    ) {
      adjacencyList[edge.source].push(edge.target);
    }
  }

  const visited = new Set([clientId]);
  const queue = [clientId];

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];

    if (databases.has(current)) {
      return true;
    }

    for (const neighbor of adjacencyList[current] ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return false;
}

export function detectSinglePointsOfFailure(nodes, edges) {
  const clients = nodes.filter((node) => node.type === "client");

  const intermediateNodes = nodes.filter(
    (node) => node.type !== "client" && node.type !== "database",
  );

  const findings = [];

  for (const node of intermediateNodes) {
    const affectedClients = clients.filter(
      (client) =>
        canClientReachDatabase(nodes, edges, client.id) &&
        !canClientReachDatabase(nodes, edges, client.id, node.id),
    );

    if (affectedClients.length > 0) {
      findings.push({
        id: `spof-${node.id}`,
        nodeId: node.id,
        componentName: node.data?.label || node.id,
        category: "Reliability",
        severity: "high",
        title: "Potential single point of failure",
        description:
          `Removing "${node.data?.label || node.id}" would leave ` +
          `${affectedClients.length} client(s) without a path to any database.`,
        recommendation:
          "Consider adding an independent alternative path or redundant components, " +
          "then recheck the architecture.",
      });
    }
  }

  return findings;
}

export function analyzeArchitectureHealth(
  nodes,
  edges,
  performance,
  queueingResults = [],
) {
  const findings = [];
  const queueingByNode = new Map(
    queueingResults.map((item) => [item.nodeId, item]),
  );

  for (const component of performance?.components ?? []) {
    const utilization = Number(component.utilization);

    if (!Number.isFinite(utilization)) {
      continue;
    }

    if (utilization >= 100) {
      findings.push({
        id: `capacity-${component.nodeId}`,
        nodeId: component.nodeId,
        componentName: component.name,
        category: "Performance",
        severity: "critical",
        title: "Component capacity exceeded",
        description:
          `${component.name} receives ${component.incomingTraffic.toLocaleString()} ` +
          `requests/sec but its total configured capacity is ` +
          `${component.totalCapacity.toLocaleString()} requests/sec.`,
        recommendation:
          "Increase service capacity or instance count, or redesign traffic distribution. " +
          "Run the simulation again to verify the result.",
      });
    } else if (utilization >= 85) {
      findings.push({
        id: `capacity-${component.nodeId}`,
        nodeId: component.nodeId,
        componentName: component.name,
        category: "Performance",
        severity: "high",
        title: "Limited capacity headroom",
        description:
          `${component.name} is operating at ${utilization}% utilization, ` +
          "leaving limited capacity for traffic spikes.",
        recommendation:
          "Evaluate additional instances or capacity headroom using realistic peak traffic.",
      });
    } else if (utilization >= 70) {
      findings.push({
        id: `capacity-${component.nodeId}`,
        nodeId: component.nodeId,
        componentName: component.name,
        category: "Performance",
        severity: "medium",
        title: "Elevated utilization",
        description: `${component.name} is operating at ${utilization}% utilization.`,
        recommendation:
          "Monitor expected traffic growth and check whether additional capacity is needed.",
      });
    }

    const queueing = queueingByNode.get(component.nodeId);

    if (
      queueing &&
      queueing.model !== "N/A" &&
      queueing.stable === false &&
      utilization < 100
    ) {
      findings.push({
        id: `queue-${component.nodeId}`,
        nodeId: component.nodeId,
        componentName: component.name,
        category: "Queueing",
        severity: "critical",
        title: "Unstable queue",
        description: `${component.name} cannot sustain the modeled arrival rate under the configured queueing assumptions.`,
        recommendation:
          "Increase service capacity or reduce incoming traffic, then rerun the simulation.",
      });
    }
  }

  findings.push(...detectSinglePointsOfFailure(nodes, edges));

  const severityPenalty = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
  };

  const totalPenalty = findings.reduce(
    (total, finding) => total + severityPenalty[finding.severity],
    0,
  );

  const score = Math.max(0, 100 - totalPenalty);

  const counts = {
    critical: findings.filter((item) => item.severity === "critical").length,
    high: findings.filter((item) => item.severity === "high").length,
    medium: findings.filter((item) => item.severity === "medium").length,
    low: findings.filter((item) => item.severity === "low").length,
  };

  let rating = "Excellent";

  if (score < 50) {
    rating = "Poor";
  } else if (score < 70) {
    rating = "Needs improvement";
  } else if (score < 85) {
    rating = "Good";
  } else if (score < 100) {
    rating = "Very good";
  }

  return {
    score,
    rating,
    findings,
    counts,
    analyzedComponents: nodes.length,
    hasCriticalFindings: counts.critical > 0,
    analyzedAt: new Date().toISOString(),
    scoringNote:
      "The score is a heuristic based on implemented checks, not a standardized industry reliability rating.",
  };
}
