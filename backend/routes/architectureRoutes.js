// const express = require("express");
// const mongoose = require("mongoose");
// const Architecture = require("../models/Architecture");

// const router = express.Router();

// // Create a new architecture
// router.post("/", async (req, res) => {
//   try {
//     const { name, description = "", nodes, edges } = req.body;

//     if (!name || !name.trim()) {
//       return res.status(400).json({
//         message: "Architecture name is required",
//       });
//     }

//     if (!Array.isArray(nodes) || !Array.isArray(edges)) {
//       return res.status(400).json({
//         message: "Nodes and edges must be arrays",
//       });
//     }

//     const architecture = await Architecture.create({
//       name,
//       description,
//       nodes,
//       edges,
//     });

//     return res.status(201).json({
//       message: "Architecture saved successfully",
//       architecture,
//     });
//   } catch (error) {
//     console.error("Create architecture error:", error);

//     return res.status(500).json({
//       message: "Failed to save architecture",
//     });
//   }
// });

// // List all architectures
// router.get("/", async (req, res) => {
//   try {
//     const architectures = await Architecture.find()
//       .select("name description createdAt updatedAt")
//       .sort({ updatedAt: -1 })
//       .lean();

//     return res.json({ architectures });
//   } catch (error) {
//     console.error("List architectures error:", error);

//     return res.status(500).json({
//       message: "Failed to fetch architectures",
//     });
//   }
// });

// // Get one architecture
// router.get("/:id", async (req, res) => {
//   try {
//     if (!mongoose.isValidObjectId(req.params.id)) {
//       return res.status(400).json({
//         message: "Invalid architecture ID",
//       });
//     }

//     const architecture = await Architecture.findById(
//       req.params.id
//     );

//     if (!architecture) {
//       return res.status(404).json({
//         message: "Architecture not found",
//       });
//     }

//     return res.json({ architecture });
//   } catch (error) {
//     console.error("Get architecture error:", error);

//     return res.status(500).json({
//       message: "Failed to fetch architecture",
//     });
//   }
// });

// // Update an architecture
// router.put("/:id", async (req, res) => {
//   try {
//     if (!mongoose.isValidObjectId(req.params.id)) {
//       return res.status(400).json({
//         message: "Invalid architecture ID",
//       });
//     }

//     const { name, description, nodes, edges } = req.body;

//     const updates = {};

//     if (name !== undefined) {
//       if (typeof name !== "string" || !name.trim()) {
//         return res.status(400).json({
//           message: "Architecture name cannot be empty",
//         });
//       }

//       updates.name = name.trim();
//     }

//     if (description !== undefined) {
//       if (typeof description !== "string") {
//         return res.status(400).json({
//           message: "Description must be a string",
//         });
//       }

//       updates.description = description;
//     }

//     if (nodes !== undefined) {
//       if (!Array.isArray(nodes)) {
//         return res.status(400).json({
//           message: "Nodes must be an array",
//         });
//       }

//       updates.nodes = nodes;
//     }

//     if (edges !== undefined) {
//       if (!Array.isArray(edges)) {
//         return res.status(400).json({
//           message: "Edges must be an array",
//         });
//       }

//       updates.edges = edges;
//     }

//     const architecture = await Architecture.findByIdAndUpdate(
//       req.params.id,
//       { $set: updates },
//       { new: true, runValidators: true }
//     );

//     if (!architecture) {
//       return res.status(404).json({
//         message: "Architecture not found",
//       });
//     }

//     return res.json({
//       message: "Architecture updated successfully",
//       architecture,
//     });
//   } catch (error) {
//     console.error("Update architecture error:", error);

//     return res.status(500).json({
//       message: "Failed to update architecture",
//     });
//   }
// });

// // Delete an architecture
// router.delete("/:id", async (req, res) => {
//   try {
//     if (!mongoose.isValidObjectId(req.params.id)) {
//       return res.status(400).json({
//         message: "Invalid architecture ID",
//       });
//     }

//     const architecture = await Architecture.findByIdAndDelete(
//       req.params.id
//     );

//     if (!architecture) {
//       return res.status(404).json({
//         message: "Architecture not found",
//       });
//     }

//     return res.json({
//       message: "Architecture deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete architecture error:", error);

//     return res.status(500).json({
//       message: "Failed to delete architecture",
//     });
//   }
// });

// module.exports = router;


const express = require("express");
const mongoose = require("mongoose");

const Architecture = require("../models/Architecture");
const ArchitectureVersion = require("../models/ArchitectureVersion");
const authenticateUser = require("../middleware/authMiddleware");
const requireArchitectureOwner = require("../middleware/requireArchitectureOwner");

const router = express.Router();

// Every architecture endpoint requires a valid JWT.
router.use(authenticateUser);

// CREATE ARCHITECTURE
router.post("/", async (req, res) => {
  try {
    const { name, description = "", nodes, edges } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100
    ) {
      return res.status(400).json({
        message: "Architecture name must contain 1–100 characters.",
      });
    }

    if (
      typeof description !== "string" ||
      description.length > 500
    ) {
      return res.status(400).json({
        message: "Description must be a string of at most 500 characters.",
      });
    }

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({
        message: "Nodes and edges must be arrays.",
      });
    }

    const architecture = await Architecture.create({
      userId: req.user._id,
      name: name.trim(),
      description,
      nodes,
      edges,
    });

    return res.status(201).json({
      message: "Architecture saved successfully.",
      architecture,
    });
  } catch (error) {
    console.error("Create architecture error:", error.message);

    return res.status(500).json({
      message: "Failed to save architecture.",
    });
  }
});

// LIST ONLY THE LOGGED-IN USER'S ARCHITECTURES
router.get("/", async (req, res) => {
  try {
    const architectures = await Architecture.find({
      userId: req.user._id,
    })
      .select("name description createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({ architectures });
  } catch (error) {
    console.error("List architectures error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch architectures.",
    });
  }
});

// GET ONE OWNED ARCHITECTURE
router.get("/:id", requireArchitectureOwner, async (req, res) => {
  return res.json({
    architecture: req.architecture,
  });
});

// UPDATE AN OWNED ARCHITECTURE
router.put("/:id", requireArchitectureOwner, async (req, res) => {
  try {
    const { name, description, nodes, edges } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 100
      ) {
        return res.status(400).json({
          message: "Architecture name must contain 1–100 characters.",
        });
      }

      updates.name = name.trim();
    }

    if (description !== undefined) {
      if (
        typeof description !== "string" ||
        description.length > 500
      ) {
        return res.status(400).json({
          message: "Description must be a string of at most 500 characters.",
        });
      }

      updates.description = description;
    }

    if (nodes !== undefined) {
      if (!Array.isArray(nodes)) {
        return res.status(400).json({
          message: "Nodes must be an array.",
        });
      }

      updates.nodes = nodes;
    }

    if (edges !== undefined) {
      if (!Array.isArray(edges)) {
        return res.status(400).json({
          message: "Edges must be an array.",
        });
      }

      updates.edges = edges;
    }

    const architecture = await Architecture.findOneAndUpdate(
      {
        _id: req.architecture._id,
        userId: req.user._id,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!architecture) {
      return res.status(404).json({
        message: "Architecture not found.",
      });
    }

    return res.json({
      message: "Architecture updated successfully.",
      architecture,
    });
  } catch (error) {
    console.error("Update architecture error:", error.message);

    return res.status(500).json({
      message: "Failed to update architecture.",
    });
  }
});

// DELETE AN OWNED ARCHITECTURE AND ITS VERSION HISTORY
router.delete("/:id", requireArchitectureOwner, async (req, res) => {
  try {
    const architectureId = req.architecture._id;

    await Architecture.deleteOne({
      _id: architectureId,
      userId: req.user._id,
    });

    await ArchitectureVersion.deleteMany({
      architectureId,
    });

    return res.json({
      message: "Architecture and its version history deleted successfully.",
    });
  } catch (error) {
    console.error("Delete architecture error:", error.message);

    return res.status(500).json({
      message: "Failed to delete architecture.",
    });
  }
});

module.exports = router;

