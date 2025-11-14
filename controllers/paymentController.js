const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/paymentModel");
const Order = require("../models/orderModel");

// 🔵 Stripe Payment (Visa/MasterCard)
exports.stripeInit = async (req, res) => {
  try {
    const { orderId } = req.body;

    // جلب الطلب اللي المستخدم عايز يدفعه
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // إنشاء عملية دفع في Stripe (مبلغ + العملة)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.totalPrice * 100, // Stripe بيتعامل بالسنت
      currency: "usd",
      payment_method_types: ["card"],
    });

    // تسجيل عملية الدفع في قاعدة البيانات
    const payment = await Payment.create({
      user: req.user.id,
      order: orderId,
      method: "stripe",
      amount: order.totalPrice,
      status: "pending", // لحد ما العميل يكمل الدفع في الواجهة الأمامية
      transactionId: paymentIntent.id,
    });

    // إرسال client secret للعميل علشان يكمل الدفع
    res.json({
      message: "Stripe payment initialized",
      clientSecret: paymentIntent.client_secret,
      payment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🟡 PayPal Payment (Simulated / Fake)
exports.paypalPay = async (req, res) => {
  const { orderId } = req.body;

  // جلب الطلب
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  // إنشاء رقم عملية وهمي
  const transactionId = "PAYPAL-" + Date.now();

  // تسجيل الدفع ناجح فوريًا (بما أننا بنعمل simulation)
  const payment = await Payment.create({
    user: req.user.id,
    order: orderId,
    method: "paypal",
    amount: order.totalPrice,
    status: "paid", // تم الدفع مباشرًا
    transactionId,
  });

  // تحديث حالة الطلب
  order.paymentStatus = "paid";
  order.orderStatus = "processing";
  await order.save();

  res.json({
    message: "PayPal payment successful",
    payment,
  });
};

// 🟠 Cash On Delivery
exports.cashPay = async (req, res) => {
  const { orderId } = req.body;

  // جلب الطلب
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  // تسجيل "الدفع عند الاستلام"
  const payment = await Payment.create({
    user: req.user.id,
    order: orderId,
    method: "cash",
    amount: order.totalPrice,
    status: "pending", // لسه الدفع ما تمّش
  });

  // تحديث حالة الطلب
  order.paymentStatus = "pending";
  order.orderStatus = "pending";
  await order.save();

  res.json({
    message: "Cash payment selected",
    payment,
  });
};
