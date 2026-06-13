import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const exploredStoreSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    exploredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // ✅ Staff/admin roles ke liye fixed store possible
    // ✅ Normal user ke liye null rahega
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: false,
      default: null,
      index: true,
    },

    // ✅ Normal user ne kaunse stores explore kiye
    exploredStores: {
      type: [exploredStoreSchema],
      default: [],
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    otp: { type: String },
    otpExpires: { type: Date },

    isVerified: {
      type: Boolean,
      default: false,
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

/*
  ✅ Store-wise unique email
  - staff/admin same email across different stores possible
*/
userSchema.index(
  { storeId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
      storeId: { $type: "objectId" },
    },
  }
);

/*
  ✅ Global unique email when storeId is null
  - normal users
  - superadmin
*/
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
      storeId: null,
    },
  }
);

/* =========================
   Password Hash Middleware
========================= */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* =========================
   Password Compare Method
========================= */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/* =========================
   Track explored store
========================= */
userSchema.methods.markStoreExplored = function (storeId) {
  if (!storeId) return;

  const idStr = String(storeId);

  const alreadyExists = this.exploredStores.some(
    (item) => String(item.storeId) === idStr
  );

  if (!alreadyExists) {
    this.exploredStores.push({
      storeId,
      exploredAt: new Date(),
    });
  }
};

export default mongoose.model("User", userSchema);