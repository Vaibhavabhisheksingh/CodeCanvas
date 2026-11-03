// const mongoose = require("mongoose");

// const architectureSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//       minlength: 1,
//       maxlength: 100,
//     },

//     description: {
//       type: String,
//       default: "",
//       maxlength: 500,
//     },

//     nodes: {
//       type: [mongoose.Schema.Types.Mixed],
//       required: true,
//       default: [],
//     },

//     edges: {
//       type: [mongoose.Schema.Types.Mixed],
//       required: true,
//       default: [],
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model(
//   "Architecture",
//   architectureSchema
// );


const mongoose = require("mongoose");

const architectureSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    nodes: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      default: [],
    },

    edges: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Architecture",
  architectureSchema
);

