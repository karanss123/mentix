import mongoose from "mongoose";
import "./Permission.js";

const roleSchema = new mongoose.Schema(
  {
    // ✅ Store scope
    // - store roles => storeId required (admin/shopkeeper etc)
    // - superadmin/global roles => storeId = null
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: false,
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/*
  ✅ Store-wise unique roles (active only)
*/
roleSchema.index(
  { storeId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
      storeId: { $type: "objectId" },
    },
  }
);

/*
  ✅ Global roles unique (superadmin etc) (active only)
*/
roleSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
      storeId: null,
    },
  }
);

export default mongoose.model("Role", roleSchema);