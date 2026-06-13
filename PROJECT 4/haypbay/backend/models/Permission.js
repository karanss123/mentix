import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

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

// Store-wise unique only for active permissions
permissionSchema.index(
  { storeId: 1, key: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

export default mongoose.model("Permission", permissionSchema);