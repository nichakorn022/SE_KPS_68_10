const userAddressService = require("../userAddressService");

function getUserId(req) {
  return req.user?.user_id;
}

exports.getAddresses = async (req, res) => {
  try {
    const rows = await userAddressService.getAddressesByUser(getUserId(req));
    return res.json(rows);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: "Failed to fetch addresses", error: error.message });
  }
};

exports.getDefaultAddress = async (req, res) => {
  try {
    const row = await userAddressService.getDefaultAddressByUser(getUserId(req));
    return res.json(row);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: "Failed to fetch default address", error: error.message });
  }
};

exports.getAddressById = async (req, res) => {
  try {
    const row = await userAddressService.getAddressById(getUserId(req), req.params.id);
    return res.json(row);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: "Failed to fetch address", error: error.message });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const row = await userAddressService.createAddress(getUserId(req), req.body);
    return res.status(201).json(row);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: "Failed to create address", error: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const row = await userAddressService.updateAddress(getUserId(req), req.params.id, req.body);
    return res.json(row);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: "Failed to update address", error: error.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const row = await userAddressService.setDefaultAddress(getUserId(req), req.params.id);
    return res.json(row);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: "Failed to set default address", error: error.message });
  }
};
