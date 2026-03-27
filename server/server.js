const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const productImageRoutes = require("./routes/productImageRoutes");
const shopRoutes = require("./routes/shopRoutes");
const eventRoutes = require("./routes/eventRoutes");
const shopImageRoutes = require("./routes/shopImageRoutes");
const orderRoutes = require("./routes/orderRoutes");
const orderDetailRoutes = require("./routes/orderDetailRoutes");
<<<<<<< Updated upstream
const registrationRoutes = require("./routes/registrationRoutes");
const userAddressRoutes = require("./routes/userAddressRoutes");
=======
const organizerRoutes = require("./routes/organizerRoutes");
const reportRoutes = require("./routes/reportRoutes");
>>>>>>> Stashed changes

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-images", productImageRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/shop-images", shopImageRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-details", orderDetailRoutes);
<<<<<<< Updated upstream
app.use("/api/registrations", registrationRoutes);
app.use("/api/user-addresses", userAddressRoutes);
=======
app.use("/api/organizers", organizerRoutes);
app.use("/api/reports", reportRoutes);


>>>>>>> Stashed changes

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
