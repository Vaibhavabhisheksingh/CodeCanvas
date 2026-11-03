const express = require("express");
const mongoose = require("mongoose");

const Architecture = require("../models/Architecture");
const ArchitectureVersion = require("../models/ArchitectureVersion");
const authenticateUser = require("../middleware/authMiddleware");
const requireArchitectureOwner = require("../middleware/requireArchitectureOwner");

const router = express.Router();
router.use(authenticateUser);

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateSnapshotBody(body) {
  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return "Nodes and edges must be arrays.";
  }

  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    body.name.trim().length > 100
  ) {
    return "A valid architecture name is required.";
  }

  return null;
}

// CREATE A VERSION SNAPSHOT
router.post("/:architectureId",requireArchitectureOwner, async (req, res) => {
  try {
    const { architectureId } = req.params;

    if (!isValidId(architectureId)) {
      return res.status(400).json({
        message: "Invalid architecture ID.",
      });
    }

    const validationError = validateSnapshotBody(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      });
    }

    // const architecture = await Architecture.findById(architectureId);

    // if (!architecture) {
    //   return res.status(404).json({
    //     message: "Architecture not found.",
    //   });
    // }

    const architecture = req.architecture; // Retrieved from requireArchitectureOwner middleware 

    const latestVersion = await ArchitectureVersion.findOne({
      architectureId,
    })
      .sort({ versionNumber: -1 })
      .select("versionNumber")
      .lean();

    const versionNumber = (latestVersion?.versionNumber || 0) + 1;

    const version = await ArchitectureVersion.create({
      architectureId,
      versionNumber,
      name: req.body.name.trim(),
      description: req.body.description || "",
      nodes: req.body.nodes,
      edges: req.body.edges,
      changeSummary:
        typeof req.body.changeSummary === "string"
          ? req.body.changeSummary.trim().slice(0, 500)
          : "Architecture snapshot",
    });

    return res.status(201).json({
      message: "Architecture version created successfully.",
      version,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A version with this number already exists. Retry the request.",
      });
    }

    console.error("Create version error:", error);

    return res.status(500).json({
      message: "Failed to create architecture version.",
    });
  }
});

// GET ALL VERSIONS FOR ONE ARCHITECTURE
router.get("/:architectureId",requireArchitectureOwner, async (req, res) => {
  try {
    const { architectureId } = req.params;

    if (!isValidId(architectureId)) {
      return res.status(400).json({
        message: "Invalid architecture ID.",
      });
    }

    const architecture = await Architecture.findById(architectureId)
      .select("_id name")
      .lean();

    if (!architecture) {
      return res.status(404).json({
        message: "Architecture not found.",
      });
    }

    const versions = await ArchitectureVersion.find({
      architectureId,
    })
      .sort({ versionNumber: -1 })
      .select(
        "versionNumber name description changeSummary nodes edges createdAt updatedAt"
      )
      .lean();

    return res.json({
      architecture,
      versions: versions.map((version) => ({
        ...version,
        nodeCount: version.nodes.length,
        edgeCount: version.edges.length,
      })),
    });
  } catch (error) {
    console.error("List versions error:", error);

    return res.status(500).json({
      message: "Failed to fetch architecture versions.",
    });
  }
});

// DELETE ALL VERSIONS FOR ONE ARCHITECTURE
// The saved architecture itself is preserved.
router.delete("/:architectureId",requireArchitectureOwner, async (req, res) => {
  try {
    const { architectureId } = req.params;

    if (!isValidId(architectureId)) {
      return res.status(400).json({
        message: "Invalid architecture ID.",
      });
    }

    const architecture = await Architecture.findById(architectureId)
      .select("_id")
      .lean();

    if (!architecture) {
      return res.status(404).json({
        message: "Architecture not found.",
      });
    }

    const result = await ArchitectureVersion.deleteMany({
      architectureId,
    });

    return res.json({
      message: `Deleted ${
        result.deletedCount || 0
      } version(s). The current architecture was kept.`,
      deletedCount: result.deletedCount || 0,
    });
  } catch (error) {
    console.error("Delete all versions error:", error);

    return res.status(500).json({
      message: "Failed to delete architecture versions.",
    });
  }
});

// GET ONE SPECIFIC VERSION
router.get("/:architectureId/:versionNumber",requireArchitectureOwner, async (req, res) => {
  try {
    const { architectureId, versionNumber: rawVersionNumber } = req.params;

    const versionNumber = Number(rawVersionNumber);

    if (
      !isValidId(architectureId) ||
      !Number.isInteger(versionNumber) ||
      versionNumber < 1
    ) {
      return res.status(400).json({
        message: "Invalid architecture ID or version number.",
      });
    }

    const version = await ArchitectureVersion.findOne({
      architectureId,
      versionNumber,
    }).lean();

    if (!version) {
      return res.status(404).json({
        message: "Architecture version not found.",
      });
    }

    return res.json({ version });
  } catch (error) {
    console.error("Fetch version error:", error);

    return res.status(500).json({
      message: "Failed to fetch architecture version.",
    });
  }
});

// DELETE ONE SPECIFIC VERSION
router.delete(
  "/:architectureId/:versionNumber",
  requireArchitectureOwner,
  async (req, res) => {
    try {
      const {
        architectureId,
        versionNumber: rawVersionNumber,
      } = req.params;

      const versionNumber = Number(rawVersionNumber);

      if (
        !isValidId(architectureId) ||
        !Number.isInteger(versionNumber) ||
        versionNumber < 1
      ) {
        return res.status(400).json({
          message: "Invalid architecture ID or version number.",
        });
      }

      const architecture = await Architecture.findById(architectureId)
        .select("_id")
        .lean();

      if (!architecture) {
        return res.status(404).json({
          message: "Architecture not found.",
        });
      }

      const deletedVersion =
        await ArchitectureVersion.findOneAndDelete({
          architectureId,
          versionNumber,
        });

      if (!deletedVersion) {
        return res.status(404).json({
          message: "Architecture version not found.",
        });
      }

      return res.json({
        message: `Version ${versionNumber} deleted successfully.`,
        versionNumber,
      });
    } catch (error) {
      console.error("Delete version error:", error);

      return res.status(500).json({
        message: "Failed to delete architecture version.",
      });
    }
  }
);

// RESTORE A VERSION
router.post(
  "/:architectureId/:versionNumber/restore",
  requireArchitectureOwner,
  async (req, res) => {
    try {
      const {
        architectureId,
        versionNumber: rawVersionNumber,
      } = req.params;

      const versionNumber = Number(rawVersionNumber);

      if (
        !isValidId(architectureId) ||
        !Number.isInteger(versionNumber) ||
        versionNumber < 1
      ) {
        return res.status(400).json({
          message: "Invalid architecture ID or version number.",
        });
      }
      

      const [architecture, snapshot] = await Promise.all([
        Architecture.findById(architectureId),
        ArchitectureVersion.findOne({
          architectureId,
          versionNumber,
        }),
      ]);

      if (!architecture) {
        return res.status(404).json({
          message: "Architecture not found.",
        });
      }

      if (!snapshot) {
        return res.status(404).json({
          message: "Architecture version not found.",
        });
      }

      architecture.name = snapshot.name;
      architecture.description = snapshot.description;
      architecture.nodes = snapshot.nodes;
      architecture.edges = snapshot.edges;

      await architecture.save();

      return res.json({
        message: `Version ${versionNumber} restored successfully.`,
        architecture,
      });
    } catch (error) {
      console.error("Restore version error:", error);

      return res.status(500).json({
        message: "Failed to restore architecture version.",
      });
    }
  }
);

module.exports = router;