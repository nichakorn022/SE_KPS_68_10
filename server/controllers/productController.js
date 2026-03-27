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

exports.getOwnProducts = (req, res) => {
  productService
    .getProductsByOwner(req.user.user_id)
    .then((result) => res.json(result))
    .catch((error) =>
      res.status(error.statusCode || 500).json({ message: "Failed to fetch your products", error: error.message })
    );
};

exports.createOwnProduct = (req, res) => {
  productService
    .createProductByOwner(req.user.user_id, req.body)
    .then((result) => res.status(201).json(result))
    .catch((error) =>
      res.status(error.statusCode || 500).json({ message: "Failed to create product", error: error.message })
    );
};

exports.updateOwnProduct = (req, res) => {
  const { id } = req.params;

  productService
    .updateProductByOwner(req.user.user_id, id, req.body)
    .then((result) => res.json(result))
    .catch((error) =>
      res.status(error.statusCode || 500).json({ message: "Failed to update product", error: error.message })
    );
};

exports.deleteOwnProduct = (req, res) => {
  const { id } = req.params;

  productService
    .deleteProductByOwner(req.user.user_id, id)
    .then((result) => res.json(result))
    .catch((error) =>
      res.status(error.statusCode || 500).json({ message: "Failed to delete product", error: error.message })
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
