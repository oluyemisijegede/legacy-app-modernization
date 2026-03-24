const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const registerMetrics = require("./monitoring/metrics");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

registerMetrics(app);

/* Serve Web UI */
app.use(express.static(path.join(__dirname, "public")));

const products = [
  { id: 1, name: "Laptop", price: 1200 },
  { id: 2, name: "Phone", price: 800 },
  { id: 3, name: "Headphones", price: 150 },
  { id: 4, name: "Keyboard", price: 90 }
];

let cart = [];

/* API ROUTES */

app.get("/products", (req, res) => {
  res.json(products);
});

app.post("/cart", (req, res) => {

  const { productId } = req.body;

  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  cart.push(product);

  res.json(cart);
});

app.get("/cart", (req, res) => {
  res.json(cart);
});

app.post("/checkout", (req, res) => {

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  cart = [];

  res.json({
    message: "Order successful",
    total
  });

});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});