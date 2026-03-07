const productService = require("../services/productService");

exports.getProducts = (req, res) => {
  productService
    .getProducts()
    .then((result) => res.json(result))
    .catch((error) => res.status(500).json({ message: "Failed to fetch products", error }));
};

exports.getProductById = (req, res) => {
  const { id } = req.params;

  productService
    .getProductById(id)
    .then((result) => res.json(result))
    .catch((error) =>
      res.status(error.statusCode || 500).json({ message: "Failed to fetch product", error })
    );
};

exports.createProduct = (req, res) => {
  productService
    .createProduct(req.body)
    .then((result) => res.status(201).json(result))
    .catch((error) =>
      res.status(error.statusCode || 500).json({ message: "Failed to create product", error })
    );
};

exports.updateProduct = (req, res) => {
  const { id } = req.params;

  productService
    .updateProduct(id, req.body)
    .then((result) => res.json(result))
    .catch((error) =>
      res.status(error.statusCode || 500).json({ message: "Failed to update product", error })
    );
};

exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  productService
    .deleteProduct(id)
    .then((result) => res.json(result))
    .catch((error) =>
      res.status(error.statusCode || 500).json({ message: "Failed to delete product", error })
    );
};
