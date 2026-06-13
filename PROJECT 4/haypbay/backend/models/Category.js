import mongoose from "mongoose";

const categorySchema = mongoose.Schema(
  {
    // ✅ Store reference (MOST IMPORTANT)
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ Soft delete support (recommended)
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


// ✅ Store-wise unique category name (only active ones)
categorySchema.index(
  { storeId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;