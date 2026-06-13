import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    /* ================= CONTACT DETAILS ================= */
    contact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
      availability: { type: String, default: "" },

      social: {
        facebook: { type: String, default: "" },
        instagram: { type: String, default: "" },
        youtube: { type: String, default: "" },
        pinterest: { type: String, default: "" },
      },
    },

    /* ================= STATUS ================= */
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ✅ unique active store name
storeSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

export default mongoose.model("Store", storeSchema);