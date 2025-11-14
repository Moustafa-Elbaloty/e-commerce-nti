const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();
app.use(express.json());

// اتصال بقاعدة البيانات
connectDB();

// ############# Routes #############

// Auth Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// Cart Routes
const cartRoutes = require("./routes/cartRoutes");
app.use("/api/cart", cartRoutes);

// Order Routes
const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

// ###################################

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("home page");
});

app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
