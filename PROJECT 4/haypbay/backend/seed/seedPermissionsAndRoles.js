import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

import Permission from "../models/Permission.js";
import Role from "../models/Role.js";

dotenv.config();

const PERMISSIONS = [
  // Profile
  { key: "profile:view", description: "View profile" },
  { key: "profile:update", description: "Update profile" },

  // Categories
  { key: "categories:view", description: "View categories" },
  { key: "categories:create", description: "Create category" },
  { key: "categories:update", description: "Update category" },
  { key: "categories:delete", description: "Delete category" },

  // Products
  { key: "products:view", description: "View products" },
  { key: "products:create", description: "Create product" },
  { key: "products:update", description: "Update product" },
  { key: "products:delete", description: "Delete product" },

  // Roles
  { key: "roles:view", description: "View roles" },
  { key: "roles:create", description: "Create role" },
  { key: "roles:update", description: "Update role" },
  { key: "roles:delete", description: "Delete role" },
  { key: "roles:assign_permissions", description: "Assign permissions to role" },

  // Users
  { key: "users:view", description: "View users" },
  { key: "users:update", description: "Update users" },
  { key: "users:delete", description: "Delete users" },
];

const run = async () => {
  try {
    await connectDB();

    console.log("🌱 Seeding permissions...");

    const insertedPermissions = [];

    for (const perm of PERMISSIONS) {
      const doc = await Permission.findOneAndUpdate(
        { key: perm.key.toLowerCase() },
        { $set: perm },
        { upsert: true, new: true }
      );

      insertedPermissions.push(doc);
    }

    console.log("✅ Permissions seeded");

    const permMap = new Map(
      insertedPermissions.map((p) => [p.key, p._id])
    );

    const pick = (keys) =>
      keys.map((k) => permMap.get(k)).filter(Boolean);

    console.log("🌱 Seeding roles...");

    const roles = [
      {
        name: "admin",
        permissions: insertedPermissions.map((p) => p._id), // ALL
      },
      {
        name: "shopkeeper",
        permissions: pick([
          "profile:view",
          "profile:update",
          "categories:view",
          "products:view",
          "products:create",
          "products:update",
        ]),
      },
      {
        name: "manager",
        permissions: pick([
          "profile:view",
          "profile:update",
          "categories:view",
          "categories:create",
          "categories:update",
          "products:view",
          "products:create",
          "products:update",
          "users:view",
          "users:update",
          "roles:view",
        ]),
      },
      {
        name: "user",
        permissions: pick([
          "profile:view",
          "profile:update",
          "products:view",
          "categories:view",
        ]),
      },
    ];

    for (const role of roles) {
      await Role.findOneAndUpdate(
        { name: role.name },
        {
          $set: {
            name: role.name,
            permissions: role.permissions,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
    }

    console.log("✅ Roles seeded successfully");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
};

run();
