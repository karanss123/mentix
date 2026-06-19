import Order from "../models/Order.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const buildOrderPricing = (items) => {
  const cleanItems = items.map((item) => ({
    productId: String(item.productId || item._id || ""),
    name: item.name || "",
    image: item.image || "",
    price: Number(item.price) || 0,
    qty: Number(item.qty) || 0,
    size: item.size || "",
  }));

  const invalidItem = cleanItems.find(
    (item) => !item.productId || !item.name || item.price <= 0 || item.qty <= 0
  );

  if (invalidItem) {
    return { error: "Invalid order items" };
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

  return { cleanItems, itemsPrice, gstAmount, platformFee, deliveryFee, totalPrice };
};

const validateShippingAddress = (shippingAddress) => {
  return (
    shippingAddress &&
    shippingAddress.name &&
    shippingAddress.phone &&
    shippingAddress.address &&
    shippingAddress.city &&
    shippingAddress.pincode
  );
};

/* ================= CREATE COD ORDER ================= */
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const storeId = req.storeId || req.user?.storeId;

    if (!storeId) return res.status(400).json({ msg: "Store not found in request" });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: "No items" });
    }

    if (!validateShippingAddress(shippingAddress)) {
      return res.status(400).json({ msg: "Complete shipping address is required" });
    }

    const finalPaymentMethod =
      paymentMethod && ["COD", "ONLINE"].includes(paymentMethod)
        ? paymentMethod
        : "COD";

    if (finalPaymentMethod === "ONLINE") {
      return res.status(400).json({ msg: "Use Razorpay API for online orders" });
    }

    const pricing = buildOrderPricing(items);
    if (pricing.error) return res.status(400).json({ msg: pricing.error });

    const order = new Order({
      user: req.user._id,
      storeId,
      orderItems: pricing.cleanItems,
      shippingAddress,
      paymentMethod: "COD",
      paymentStatus: "pending",
      isPaid: false,
      paidAt: null,
      paymentId: "",
      itemsPrice: pricing.itemsPrice,
      gstAmount: pricing.gstAmount,
      platformFee: pricing.platformFee,
      deliveryFee: pricing.deliveryFee,
      totalPrice: pricing.totalPrice,
      status: "Pending",
    });

    const savedOrder = await order.save();

    res.status(201).json({
      msg: "Order placed successfully",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

/* ================= CREATE RAZORPAY ORDER ================= */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const storeId = req.storeId || req.user?.storeId;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ msg: "Razorpay keys missing" });
    }

    if (!storeId) return res.status(400).json({ msg: "Store not found in request" });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ msg: "No items" });
    }

    if (!validateShippingAddress(shippingAddress)) {
      return res.status(400).json({ msg: "Complete shipping address is required" });
    }

    const pricing = buildOrderPricing(items);
    if (pricing.error) return res.status(400).json({ msg: pricing.error });

    const order = await Order.create({
      user: req.user._id,
      storeId,
      orderItems: pricing.cleanItems,
      shippingAddress,
      paymentMethod: "ONLINE",
      paymentStatus: "pending",
      isPaid: false,
      paidAt: null,
      paymentId: "",
      itemsPrice: pricing.itemsPrice,
      gstAmount: pricing.gstAmount,
      platformFee: pricing.platformFee,
      deliveryFee: pricing.deliveryFee,
      totalPrice: pricing.totalPrice,
      status: "Pending",
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(pricing.totalPrice * 100),
      currency: "INR",
      receipt: String(order._id),
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.status(201).json({
      key: process.env.RAZORPAY_KEY_ID,
      order,
      razorpayOrder,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    res.status(500).json({ msg: "Unable to create Razorpay order" });
  }
};

/* ================= VERIFY RAZORPAY PAYMENT ================= */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      storeId: req.storeId || req.user?.storeId,
      razorpayOrderId: razorpay_order_id,
    });

    if (!order) return res.status(404).json({ msg: "Order not found" });

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({ msg: "Payment verification failed" });
    }

    order.paymentStatus = "paid";
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;

    const updatedOrder = await order.save();

    res.json({
      msg: "Payment verified and order placed",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ msg: "Payment verification error" });
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
      role === "superadmin" ? {} : { storeId: req.storeId || req.user?.storeId };

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ msg: "Error fetching orders" });
  }
};

/* ================= UPDATE ORDER STATUS ================= */
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

    if (!order) return res.status(404).json({ msg: "Order not found" });

    order.status = status;

    if (status === "Delivered" && order.paymentMethod === "COD") {
      order.isPaid = true;
      order.paymentStatus = "paid";
      order.paidAt = new Date();
    }

    if (status === "Cancelled" && order.paymentMethod === "COD") {
      order.paymentStatus = "failed";
    }

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

    if (!order) return res.status(404).json({ msg: "Order not found" });

    if (!["Pending", "Confirmed"].includes(order.status)) {
      return res.status(400).json({ msg: "Cannot cancel this order" });
    }

    order.status = "Cancelled";

    if (order.paymentMethod === "COD") {
      order.paymentStatus = "failed";
    }

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