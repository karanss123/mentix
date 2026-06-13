import { useEffect, useMemo, useState } from "react";
import { useStore } from "../../context/StoreContext"; // ✅ NEW (store change listener)
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Products.css";
import api from "../../api/axios"; // ✅ token + x-store-id auto

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000"; // ✅ for image URLs only

const ProductManager = () => {
  const { activeStore } = useStore(); // ✅ NEW
  const activeStoreId = activeStore?._id || ""; // ✅ NEW

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [existingImages, setExistingImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [editId, setEditId] = useState(null);

  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // ✅ safe user
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setRole(user?.role || "");
  }, [user]);

  const getFileName = (urlOrName) => {
    if (!urlOrName) return "";
    if (String(urlOrName).includes("/uploads/"))
      return String(urlOrName).split("/uploads/")[1];
    return urlOrName;
  };

  // ✅ Fetch categories (store-wise)
  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories");
      setCategories(res.data || []);
    } catch (err) {
      console.log("Categories error:", err?.response?.data || err.message);
      setCategories([]);
    }
  };

  // ✅ Fetch products (store-wise)
  const fetchProducts = async () => {
    try {
      setLoading(true);

      console.log("🛒 Fetching products for store:", activeStoreId);

      const res = await api.get("/api/products");
      setProducts(res.data?.products || res.data || []);
    } catch (err) {
      console.error("Products error:", err?.response?.data || err.message);
      alert(err?.response?.data?.message || "Failed to fetch products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: refetch when store changes
  useEffect(() => {
    if (!token) return;

    // store not selected yet
    if (!activeStoreId) {
      setProducts([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    fetchCategories();
    fetchProducts();
    // eslint-disable-next-line
  }, [token, activeStoreId]); // ✅ NEW

  // Cleanup previews
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviews]);

  const onImageChange = (e) => {
    // (optional) agar shopkeeper ko images allow nahi:
    if (String(role).toLowerCase() === "shopkeeper") return;

    const files = Array.from(e.target.files);
    const total = existingImages.length + files.length;

    if (total > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    const existingPreviews = existingImages.map(
      (img) => `${API_BASE}/uploads/${img}`
    );
    const newPreviews = files.map((file) => URL.createObjectURL(file));

    setImages(files);
    setImagePreviews([...existingPreviews, ...newPreviews]);
  };

  const removeExistingImage = (imgUrlOrName) => {
    const filename = getFileName(imgUrlOrName);

    setDeletedImages((prev) => [...prev, filename]);
    setExistingImages((prev) => prev.filter((x) => x !== filename));
    setImagePreviews((prev) => prev.filter((u) => !u.includes(filename)));
  };

  const removeNewImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));

    setImagePreviews((prev) => {
      const url = prev[index];
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDescription("");
    setCategory("");

    imagePreviews.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });

    setImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setDeletedImages([]);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) return alert("Select category");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", Number(price));
    formData.append("description", description);
    formData.append("category", category);

    images.forEach((img) => formData.append("images", img));
    formData.append("deletedImages", JSON.stringify(deletedImages));

    try {
      const options = { headers: { "Content-Type": "multipart/form-data" } };

      if (editId) {
        await api.put(`/api/products/${editId}`, formData, options);
        alert("Product updated");
      } else {
        await api.post("/api/products", formData, options);
        alert("Product added");
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      alert(err?.response?.data?.message || "Error");
    }
  };

  const handleEdit = (product) => {
    setEditId(product._id);
    setName(product.name || "");
    setPrice(product.price ?? "");
    setDescription(product.description || "");
    setCategory(product.category?._id || "");

    const imgs = product.images || [];
    setExistingImages(imgs);
    setDeletedImages([]);
    setImages([]);
    setImagePreviews(imgs.map((img) => `${API_BASE}/uploads/${img}`));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete product?")) return;

    try {
      await api.delete(`/api/products/${id}`);
      fetchProducts();
      alert("Product deleted");
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <div>Loading...</div>;

  const columns = [
    { name: "#", selector: (_, i) => i + 1, width: "60px" },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Category", selector: (row) => row.category?.name, sortable: true },
    { name: "Price", selector: (row) => `₹${row.price}`, sortable: true },
    {
      name: "Images",
      cell: (row) => (
        <div style={{ display: "flex", gap: "5px" }}>
          {row.images?.map((img, i) => (
            <img
              key={i}
              src={`${API_BASE}/uploads/${img}`}
              alt="product"
              width="50"
              style={{ borderRadius: "6px" }}
            />
          ))}
        </div>
      ),
    },
    {
      name: "Actions",
      cell: (row) => (
        <div style={{ display: "flex", gap: "5px" }}>
          <button
            className="btn btn-warning btn-sm"
            onClick={() => handleEdit(row)}
          >
            Edit
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleDelete(row._id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mt-5">
      <h2>{editId ? "Edit Product" : "Add Product"}</h2>

      {/* ✅ Active store indicator */}
      <p style={{ color: "gray" }}>
        Store: <b>{activeStore?.name || activeStoreId || "Not selected"}</b>
      </p>

      <form className="admin-form-inline mb-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input type="file" accept="image/*" multiple onChange={onImageChange} />

        {/* ✅ CLEAN PREVIEW */}
        <div className="preview-row">
          {imagePreviews.map((img, i) => {
            const isExisting =
              img.includes("/uploads/") && !img.startsWith("blob:");

            return (
              <div key={`${img}-${i}`} className="preview-item">
                <img src={img} alt="preview" className="preview-img" />

                <button
                  type="button"
                  className="preview-remove"
                  onClick={() =>
                    isExisting ? removeExistingImage(img) : removeNewImage(i)
                  }
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <button type="submit" className="btn btn-primary mt-2">
          {editId ? "Update Product" : "Add Product"}
        </button>

        {editId && (
          <button
            type="button"
            className="btn btn-secondary mt-2 ms-2"
            onClick={resetForm}
          >
            Cancel
          </button>
        )}
      </form>

      <DataTable columns={columns} data={products} pagination striped />
    </div>
  );
};

export default ProductManager;