import Product from "../models/Product.js";
import Category from "../models/Category.js";
import fs from "fs";
import path from "path";

/* =========================
   HELPER: DELETE IMAGE
========================= */
const deleteImage = (image) => {
  if (!image) return;

  const safeName = path.basename(image);
  const filePath = path.join(process.cwd(), "uploads", safeName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/* =========================
   CREATE PRODUCT
========================= */
export const createProduct = async (req, res) => {
  try {
    const { name, price, description, category } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: "Name, price, category required" });
    }

    const categoryExists = await Category.findOne({
      _id: category,
      storeId: req.storeId,
      isActive: true,
    });

    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const images = req.files?.map((file) => file.filename) || [];

    const product = await Product.create({
      storeId: req.storeId,
      name: name.trim(),
      price: Number(price),
      description: description?.trim() || "",
      category,
      images,
      isActive: true,
      deletedAt: null,
    });

    const populatedProduct = await Product.findById(product._id).populate(
      "category",
      "name"
    );

    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET ALL PRODUCTS (ADMIN)
========================= */
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({
      storeId: req.storeId,
      isActive: true,
      deletedAt: null,
    })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET SINGLE PRODUCT (PROTECTED)
========================= */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      storeId: req.storeId,
      isActive: true,
      deletedAt: null,
    }).populate("category", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Get Product By Id Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET SINGLE PRODUCT (PUBLIC)
========================= */
export const getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
      deletedAt: null,
    }).populate("category", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Public product error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   UPDATE PRODUCT
========================= */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      storeId: req.storeId,
      isActive: true,
      deletedAt: null,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { name, price, description, category } = req.body;

    if (name !== undefined) product.name = name.trim();
    if (price !== undefined) product.price = Number(price);
    if (description !== undefined) product.description = description.trim();

    if (category) {
      const categoryExists = await Category.findOne({
        _id: category,
        storeId: req.storeId,
        isActive: true,
      });

      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category" });
      }

      product.category = category;
    }

    // new uploaded images add karne ke liye
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.filename);
      product.images = [...(product.images || []), ...newImages];
    }

    // deletedImages support
    if (req.deletedImages && Array.isArray(req.deletedImages) && req.deletedImages.length > 0) {
      req.deletedImages.forEach((img) => deleteImage(img));
      product.images = (product.images || []).filter(
        (img) => !req.deletedImages.includes(img)
      );
    }

    await product.save();

    const updatedProduct = await Product.findById(product._id).populate(
      "category",
      "name"
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DELETE PRODUCT
========================= */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      storeId: req.storeId,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = false;
    product.deletedAt = new Date();

    await product.save();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   HOME PRODUCTS
========================= */
export const getHomeProducts = async (req, res) => {
  try {
    const { storeId } = req.params;

    const products = await Product.find({
      storeId,
      isActive: true,
      deletedAt: null,
    })
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error("Get Home Products Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   CATEGORY PRODUCTS
========================= */
export const getHomeProductsByCategory = async (req, res) => {
  try {
    const { storeId, categoryName } = req.params;

    const products = await Product.find({
      storeId,
      isActive: true,
      deletedAt: null,
    }).populate("category", "name");

    const q = categoryName.toLowerCase().trim();

    const filtered = products.filter((p) => {
      const cat = p.category?.name?.toLowerCase().trim() || "";
      return cat === q || cat.includes(q);
    });

    res.json(filtered);
  } catch (error) {
    console.error("Get Products By Category Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   SEARCH PRODUCTS (PUBLIC)
========================= */
export const searchHomeProducts = async (req, res) => {
  try {
    const { storeId } = req.params;
    const keyword = req.query.q?.trim() || "";

    const query = {
      storeId,
      isActive: true,
      deletedAt: null,
    };

    let products = await Product.find(query).populate("category", "name");

    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();

      products = products.filter((product) => {
        const name = product.name?.toLowerCase() || "";
        const description = product.description?.toLowerCase() || "";
        const category = product.category?.name?.toLowerCase() || "";
        const price = String(product.price || "");

        return (
          name.includes(lowerKeyword) ||
          description.includes(lowerKeyword) ||
          category.includes(lowerKeyword) ||
          price.includes(lowerKeyword)
        );
      });
    }

    res.json(products);
  } catch (error) {
    console.error("Search Home Products Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   SEARCH PRODUCTS (ADMIN)
========================= */
export const searchProducts = async (req, res) => {
  try {
    const keyword = req.query.q?.trim() || "";

    const query = {
      storeId: req.storeId,
      isActive: true,
      deletedAt: null,
    };

    let products = await Product.find(query).populate("category", "name");

    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();

      products = products.filter((product) => {
        const name = product.name?.toLowerCase() || "";
        const description = product.description?.toLowerCase() || "";
        const category = product.category?.name?.toLowerCase() || "";
        const price = String(product.price || "");

        return (
          name.includes(lowerKeyword) ||
          description.includes(lowerKeyword) ||
          category.includes(lowerKeyword) ||
          price.includes(lowerKeyword)
        );
      });
    }

    res.json(products);
  } catch (error) {
    console.error("Search Products Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};