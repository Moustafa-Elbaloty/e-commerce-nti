const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();
app.use(express.json());

//  الاتصال بقاعدة البيانات
connectDB();

// ✅ مسارات المستخدم
//  استدعاء راوت المستخدمين
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const vendorRoutes = require("./routes/vendorRoutes");
app.use("/api/vendor", vendorRoutes);

const productRoutes = require("./routes/productRoutes");
app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("home page");
});

app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
