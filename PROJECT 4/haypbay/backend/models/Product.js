import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // ✅ Store scope (MOST IMPORTANT)
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // ✅ Category (must belong to same store)
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    images: [{ type: String }],

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

// ✅ helpful indexes (store-wise)
productSchema.index({ storeId: 1, createdAt: -1 });
productSchema.index({ storeId: 1, category: 1 });

const Product = mongoose.model("Product", productSchema);
export default Product;