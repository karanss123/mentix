import Store from "../models/Store.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";

/**
 * Seed permissions + roles for a store
 */
const seedStoreAccess = async (storeId) => {
  const permissionKeys = [
    "stores:view",
    "stores:update",

    "categories:view",
    "categories:create",
    "categories:update",
    "categories:delete",

    "products:view",
    "products:create",
    "products:update",
    "products:delete",

    "users:view",
    "users:update",
    "users:delete",

    "roles:view",
    "roles:create",
    "roles:update",
    "roles:delete",

    "permissions:view",
  ];

  const permDocs = [];

  for (const key of permissionKeys) {
    const p = await Permission.findOneAndUpdate(
      { storeId, key, isActive: true },
      { $setOnInsert: { storeId, key, description: "" } },
      { upsert: true, new: true }
    );

    permDocs.push(p);
  }

  const allPermIds = permDocs.map((p) => p._id);

  const pick = (keys) =>
    permDocs.filter((p) => keys.includes(p.key)).map((p) => p._id);

  const adminPerms = allPermIds;

  const shopkeeperPerms = pick([
    "categories:view",
    "products:view",
    "products:create",
    "products:update",
  ]);

  const userPerms = pick(["categories:view", "products:view"]);

  await Role.findOneAndUpdate(
    { storeId, name: "admin", isActive: true },
    { $setOnInsert: { storeId, name: "admin", permissions: adminPerms } },
    { upsert: true, new: true }
  );

  await Role.findOneAndUpdate(
    { storeId, name: "shopkeeper", isActive: true },
    { $setOnInsert: { storeId, name: "shopkeeper", permissions: shopkeeperPerms } },
    { upsert: true, new: true }
  );

  await Role.findOneAndUpdate(
    { storeId, name: "user", isActive: true },
    { $setOnInsert: { storeId, name: "user", permissions: userPerms } },
    { upsert: true, new: true }
  );
};

/* =========================
   SUPERADMIN: GET STORES
========================= */
export const getStores = async (req, res) => {
  try {
    const stores = await Store.find({ isActive: true }).sort({
      createdAt: -1,
    });

    res.json({ stores });
  } catch (e) {
    console.error("getStores error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   SUPERADMIN: CREATE STORE
========================= */
export const createStore = async (req, res) => {
  try {
    const name = (req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Store name is required" });
    }

    const storePayload = {
      name,
      contact: {
        phone: (req.body.phone || "").trim(),
        email: (req.body.email || "").trim(),
        address: (req.body.address || "").trim(),
        availability: (req.body.availability || "").trim(),
        social: {
          facebook: (req.body.facebook || "").trim(),
          instagram: (req.body.instagram || "").trim(),
          youtube: (req.body.youtube || "").trim(),
          pinterest: (req.body.pinterest || "").trim(),
        },
      },
    };

    const store = await Store.create(storePayload);

    await seedStoreAccess(store._id);

    res.status(201).json({
      message: "Store created successfully",
      store,
    });
  } catch (e) {
    console.error("createStore error:", e);

    if (e?.code === 11000) {
      return res.status(400).json({ message: "Store already exists" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   STORE CONTEXT: GET CURRENT STORE
========================= */
export const getCurrentStore = async (req, res) => {
  try {
    const freshStore = await Store.findOne({
      _id: req.store._id,
      isActive: true,
    });

    if (!freshStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json(freshStore);
  } catch (e) {
    console.error("getCurrentStore error:", e);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   STORE ADMIN / SUPERADMIN:
   UPDATE CURRENT STORE DETAILS
========================= */
export const updateCurrentStore = async (req, res) => {
  try {
    const storeId = req.store?._id;

    if (!storeId) {
      return res.status(400).json({ message: "Store context missing" });
    }

    const updateData = {
      name: (req.body.name || "").trim(),
      contact: {
        phone: (req.body.phone || "").trim(),
        email: (req.body.email || "").trim(),
        address: (req.body.address || "").trim(),
        availability: (req.body.availability || "").trim(),
        social: {
          facebook: (req.body.facebook || "").trim(),
          instagram: (req.body.instagram || "").trim(),
          youtube: (req.body.youtube || "").trim(),
          pinterest: (req.body.pinterest || "").trim(),
        },
      },
    };

    if (!updateData.name) {
      delete updateData.name;
    }

    const store = await Store.findOneAndUpdate(
      { _id: storeId, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({
      message: "Store updated successfully",
      store,
    });
  } catch (e) {
    console.error("updateCurrentStore error:", e);

    if (e?.code === 11000) {
      return res.status(400).json({ message: "Store name already exists" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   SUPERADMIN: UPDATE STORE BY ID
========================= */
export const updateStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = {
      name: (req.body.name || "").trim(),
      contact: {
        phone: (req.body.phone || "").trim(),
        email: (req.body.email || "").trim(),
        address: (req.body.address || "").trim(),
        availability: (req.body.availability || "").trim(),
        social: {
          facebook: (req.body.facebook || "").trim(),
          instagram: (req.body.instagram || "").trim(),
          youtube: (req.body.youtube || "").trim(),
          pinterest: (req.body.pinterest || "").trim(),
        },
      },
    };

    if (!updateData.name) {
      delete updateData.name;
    }

    const store = await Store.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({
      message: "Store updated successfully",
      store,
    });
  } catch (e) {
    console.error("updateStoreById error:", e);

    if (e?.code === 11000) {
      return res.status(400).json({ message: "Store name already exists" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   SUPERADMIN: DELETE STORE
========================= */
export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findOneAndUpdate(
      { _id: id, isActive: true },
      {
        $set: {
          isActive: false,
          deletedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    // optional cleanup: soft delete roles + permissions of this store too
    await Role.updateMany(
      { storeId: id, isActive: true },
      {
        $set: {
          isActive: false,
          deletedAt: new Date(),
        },
      }
    );

    await Permission.updateMany(
      { storeId: id, isActive: true },
      {
        $set: {
          isActive: false,
          deletedAt: new Date(),
        },
      }
    );

    res.json({ message: "Store deleted successfully" });
  } catch (e) {
    console.error("deleteStore error:", e);
    res.status(500).json({ message: "Server error" });
  }
};