const userService = require("../services/userService");
const fs = require("fs");
const path = require("path");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

class UserController {
  static async getUsers(req, res) {
    try {
      const users = await userService.getUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getUserById(req, res) {
    try {
      const id = req.params.id;
      const requester = req.user;

      if (!requester || (String(requester.user_id) !== String(id) && requester.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const user = await userService.getUserById(id);

      if (!user) return res.status(404).json({ message: "User not found" });

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async uploadAvatar(req, res) {
    try {
      const id = req.params.id;

      // authorization: only owner or admin
      const requester = req.user;
      if (!requester || (String(requester.user_id) !== String(id) && requester.role !== 'admin')) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      // save file to uploads/avatars
      const uploadsDir = path.join(__dirname, "..", "uploads", "avatars");
      ensureDir(uploadsDir);

      const ext = (req.file.originalname.match(/\.([^.]+)$/) || [])[1] || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, req.file.buffer);

      const publicPath = `/uploads/avatars/${fileName}`;

      await userService.updateUserAvatar(id, publicPath);

      res.json({ message: "Avatar uploaded", avatar: publicPath });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const updatedUser = await userService.updateUser(req.params.id, req.body || {});
      res.json(updatedUser);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || "Failed to update user" });
    }
  }

  static async deleteUser(req, res) {
    try {
      const result = await userService.deleteUser(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 500).json({ message: err.message || "Failed to delete user" });
    }
  }
}

module.exports = UserController;
