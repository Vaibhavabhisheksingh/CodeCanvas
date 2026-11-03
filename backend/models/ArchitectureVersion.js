const mongoose = require("mongoose");

const architectureVersionSchema = new mongoose.Schema(
  {
    architectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Architecture",
      required: true,
      index: true,
    },

    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    nodes: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    edges: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    changeSummary: {
      type: String,
      default: "Architecture snapshot",
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

architectureVersionSchema.index(
  { architectureId: 1, versionNumber: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "ArchitectureVersion",
  architectureVersionSchema,
);
