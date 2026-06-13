import Order from "../models/Order.js";

/* ================= CREATE ORDER ================= */
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    const storeId = req.storeId || req.user?.storeId;

    if (!storeId) {
      return res.status(400).json({ msg: "Store not found in request" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: "No items" });
    }

    if (
      !shippingAddress ||
      !shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.pincode
    ) {
      return res
        .status(400)
        .json({ msg: "Complete shipping address is required" });
    }

    const finalPaymentMethod =
      paymentMethod && ["COD", "ONLINE"].includes(paymentMethod)
        ? paymentMethod
        : "COD";

    const cleanItems = items.map((item) => ({
      productId: String(item.productId || item._id || ""),
      name: item.name || "",
      image: item.image || "",
      price: Number(item.price) || 0,
      qty: Number(item.qty) || 0,
      size: item.size || "",
    }));

    const invalidItem = cleanItems.find(
      (item) =>
        !item.productId ||
        !item.name ||
        item.price <= 0 ||
        item.qty <= 0
    );

    if (invalidItem) {
      return res.status(400).json({ msg: "Invalid order items" });
    }

    const itemsPrice = cleanItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    const gstAmount = Number((itemsPrice * 0.05).toFixed(2));
    const platformFee = 20;
    const deliveryFee = itemsPrice > 999 ? 0 : 40;
    const totalPrice = Number(
      (itemsPrice + gstAmount + platformFee + deliveryFee).toFixed(2)
    );

    const isOnline = finalPaymentMethod === "ONLINE";

    const order = new Order({
      user: req.user._id,
      storeId,
      orderItems: cleanItems,
      shippingAddress,

      paymentMethod: finalPaymentMethod,
      paymentStatus: isOnline ? "paid" : "pending",
      isPaid: isOnline,
      paidAt: isOnline ? new Date() : null,
      paymentId: isOnline ? `MOCKPAY_${Date.now()}` : "",

      itemsPrice,
      gstAmount,
      platformFee,
      deliveryFee,
      totalPrice,

      status: "Pending",
    });

    const savedOrder = await order.save();

    res.status(201).json({
      msg: isOnline
        ? "Mock payment success & order placed"
        : "Order placed successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* ================= GET MY ORDERS ================= */
export const getMyOrders = async (req, res) => {
  try {
    const storeId = req.storeId || req.user?.storeId;

    const orders = await Order.find({
      user: req.user._id,
      storeId,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error fetching orders" });
  }
};

/* ================= GET ALL ORDERS ================= */
export const getAllOrders = async (req, res) => {
  try {
    const role = String(
      req.userRole || req.user?.role?.name || req.user?.role || ""
    ).toLowerCase();

    if (!["admin", "shopkeeper", "ca", "superadmin"].includes(role)) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    const query =
      role === "superadmin"
        ? {}
        : { storeId: req.storeId || req.user?.storeId };

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching orders" });
  }
};

/* ================= UPDATE ORDER STATUS (ADMIN) ================= */
export const updateOrderStatus = async (req, res) => {
  try {
    const role = String(
      req.userRole || req.user?.role?.name || req.user?.role || ""
    ).toLowerCase();

    if (!["admin", "shopkeeper", "ca", "superadmin"].includes(role)) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    const { status } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    order.status = status;

    // COD delivered
    if (status === "Delivered" && order.paymentMethod === "COD") {
      order.isPaid = true;
      order.paymentStatus = "paid";
      order.paidAt = new Date();
    }

    // COD cancelled
    if (status === "Cancelled" && order.paymentMethod === "COD") {
      order.paymentStatus = "failed";
    }

    // ONLINE cancelled → refund
    if (status === "Cancelled" && order.paymentMethod === "ONLINE") {
      order.paymentStatus = "refunded";
    }

    const updated = await order.save();

    res.json({ msg: "Updated", order: updated });
  } catch (error) {
    res.status(500).json({ msg: "Error updating order" });
  }
};

/* ================= USER CANCEL ORDER ================= */
export const cancelMyOrder = async (req, res) => {
  try {
    const storeId = req.storeId || req.user?.storeId;

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
      storeId,
    });

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (!["Pending", "Confirmed"].includes(order.status)) {
      return res.status(400).json({ msg: "Cannot cancel this order" });
    }

    order.status = "Cancelled";

    // COD
    if (order.paymentMethod === "COD") {
      order.paymentStatus = "failed";
    }

    // ONLINE
    if (order.paymentMethod === "ONLINE") {
      order.paymentStatus = "refunded";
    }

    const updatedOrder = await order.save();

    res.json({
      msg: "Order cancelled successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error cancelling order" });
  }
};