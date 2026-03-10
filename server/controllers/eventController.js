const db = require("../db");

// GET ALL EVENTS
exports.getAllEvents = (req, res) => {
  db.query("SELECT * FROM event", (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    res.json(results);
  });
};

// GET EVENT BY ID
exports.getEventById = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM event WHERE event_id = ?",
    [id],
    (err, results) => {

      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(results[0]);
    }
  );
};