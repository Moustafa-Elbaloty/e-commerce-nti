const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");

// 🟢 Create Order (Checkout)
exports.createOrder = async (req, res) => {
  const { paymentMethod, vendorId } = req.body;

  const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    quantity: item.quantity,
    price: item.product.price,
    totalItemPrice: item.product.price * item.quantity,
  }));

  const totalPrice = orderItems.reduce((total, item) => total + item.totalItemPrice, 0);

  const order = await Order.create({
    user: req.user.id,
    vendor: vendorId,
    items: orderItems,
    paymentMethod,
    totalPrice,
  });

  cart.items = [];
  await cart.save();

  res.json({
    message: "Order created successfully",
    order,
  });
};

// 🟢 Get all orders for current user
exports.getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .populate("items.product")
    .populate("vendor");

  res.json(orders);
};

// 🟢 Get single order
exports.getOrderById = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id,
  })
    .populate("items.product")
    .populate("vendor");

  if (!order) return res.status(404).json({ message: "Order not found" });

  res.json(order);
};

// 🟢 Cancel order (only pending)
exports.cancelOrder = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.orderStatus !== "pending") {
    return res
      .status(400)
      .json({ message: "Only pending orders can be cancelled" });
  }

  order.orderStatus = "cancelled";
  await order.save();

  res.json({ message: "Order cancelled", order });
};

// 🟢 Vendor/Admin update status
exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) return res.status(404).json({ message: "Order not found" });

  order.orderStatus = status;
  await order.save();

  res.json({ message: "Order status updated", order });
};
