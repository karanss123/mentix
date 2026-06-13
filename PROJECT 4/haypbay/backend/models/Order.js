import mongoose from "mongoose";

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    orderItems: [
      {
        productId: String,
        name: String,
        image: String,
        price: Number,
        qty: Number,
        size: String,
      },
    ],

    shippingAddress: {
      name: String,
      phone: String,
      address: String,
      city: String,
      pincode: String,
    },

    /* ================= PAYMENT ================= */

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    paidAt: {
      type: Date,
    },

    paymentId: {
      type: String,
    },

    /* ================= PRICE ================= */

    itemsPrice: Number,
    gstAmount: Number,
    platformFee: Number,
    deliveryFee: Number,
    totalPrice: Number,

    /* ================= ORDER STATUS ================= */

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);