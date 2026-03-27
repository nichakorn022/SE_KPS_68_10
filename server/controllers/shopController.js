const shopService = require("../services/shopService");

exports.getShops = (req, res) => {
  shopService
    .getShops()
    .then((result) => res.json(result))
    .catch((error) => res.status(500).json({ message: "Failed to fetch shops", error }));
};

exports.getShopById = (req, res) => {
  const { id } = req.params;

  shopService
    .getShopById(id)
    .then((result) => res.json(result))
    .catch((error) =>
      res.status(error.statusCode || 500).json({ message: "Failed to fetch shop", error })
    );
};

exports.createShop = (req, res) => {
  shopService
    .createShop(req.body)
    .then((result) => res.status(201).json(result))
    .catch((error) =>
        res.status(error.statusCode || 500).json({ message: "Failed to create shop", error })
    );
};

exports.updateShopVerification = (req, res) => {
  const { id } = req.params;

  shopService
    .updateShopVerification(id, req.body.verified_status)
    .then((result) => res.json(result))
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to update shop verification", error: error.message })
    );
};
