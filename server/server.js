const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const shopRoutes = require("./routes/shopRoutes");
const eventRoutes = require("./routes/eventRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderDetailRoutes = require("./routes/orderDetailRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/shops", shopRoutes);
app.use('/api/events', eventRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-details", orderDetailRoutes);



app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
