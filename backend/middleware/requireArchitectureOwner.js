
const mongoose = require("mongoose");
const Architecture = require("../models/Architecture");

async function requireArchitectureOwner(req, res, next) {
  try {
    const architectureId =
      req.params.architectureId || req.params.id;

    if (!mongoose.isValidObjectId(architectureId)) {
      return res.status(400).json({
        message: "Invalid architecture ID.",
      });
    }

    const architecture = await Architecture.findOne({
      _id: architectureId,
      userId: req.user._id,
    });

    if (!architecture) {
      return res.status(404).json({
        message: "Architecture not found.",
      });
    }

    req.architecture = architecture;

    next();
  } catch (error) {
    console.error("Architecture ownership error:", error.message);

    return res.status(500).json({
      message: "Failed to verify architecture ownership.",
    });
  }
}

module.exports = requireArchitectureOwner;

