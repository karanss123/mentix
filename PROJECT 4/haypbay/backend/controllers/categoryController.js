import Category from "../models/Category.js";

// Get all categories (store-wise)
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      storeId: req.storeId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create category (permission middleware handles access)
export const createCategory = async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const exists = await Category.findOne({
      storeId: req.storeId,
      name,
      isActive: true,
    });

    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const newCategory = await Category.create({
      storeId: req.storeId,
      name,
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Create category error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({ message: "Category already exists" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Update category (permission middleware handles access)
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const name = (req.body.name || "").trim();

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const exists = await Category.findOne({
      storeId: req.storeId,
      name,
      isActive: true,
      _id: { $ne: id },
    });

    if (exists) {
      return res.status(400).json({ message: "Category name already exists" });
    }

    const updated = await Category.findOneAndUpdate(
      { _id: id, storeId: req.storeId, isActive: true },
      { name },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update category error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({ message: "Category name already exists" });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// Delete category (soft delete)
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Category.findOneAndUpdate(
      { _id: id, storeId: req.storeId, isActive: true },
      { isActive: false, deletedAt: new Date() },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};