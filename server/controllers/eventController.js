const eventService = require("../services/eventService");

function toLegacyEventShape(event) {
  return {
    ...event,
    event_id: event.event_id ?? event.id,
    event_date: event.event_date ?? event.date,
    max_participant: event.max_participant ?? event.slots,
    organizer_id: event.organizer_id ?? event.organizer ?? null
  };
}

// GET ALL
exports.getAllEvents = (req, res) => {
  eventService
    .getEvents()
    .then((events) => res.json(events.map(toLegacyEventShape)))
    .catch((error) =>
      res.status(500).json({ message: "Failed", error: error.message })
    );
};

// GET BY ID
exports.getEventById = (req, res) => {
  const { id } = req.params;

  eventService
    .getEventById(id)
    .then((event) => res.json(toLegacyEventShape(event)))
    .catch((error) =>
      res.status(500).json({ message: "Failed", error: error.message })
    );
};

// SEARCH
exports.searchEvents = (req, res) => {
  const keyword = req.query.q || "";

  eventService
    .searchEvents(keyword)
    .then((events) => res.json(events.map(toLegacyEventShape)))
    .catch((error) =>
      res.status(500).json({ message: "Failed", error: error.message })
    );
};


// ================= CREATE =================
exports.createEvent = async (req, res) => {
  try {
    const id = await eventService.createEvent(req.body);
    res.json({ message: "created", event_id: id });
  } catch (err) {
    res.status(500).json({ message: "create failed", error: err.message });
  }
};

// ================= UPDATE =================
exports.updateEvent = async (req, res) => {
  const { id } = req.params;

  try {
    await eventService.updateEvent(id, req.body);
    res.json({ message: "updated" });
  } catch (err) {
    res.status(500).json({ message: "update failed", error: err.message });
  }
};

// ================= DELETE =================
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    await eventService.deleteEvent(id);
    res.json({ message: "deleted" });
  } catch (err) {
    res.status(500).json({ message: "delete failed", error: err.message });
  }
};

// ---------------- INTEREST ----------------
exports.addInterested = async (req, res) => {
  const userId = req.user.user_id;
  const eventId = req.params.id;

  try {
    await eventService.addInterested(userId, eventId);
    res.json({ message: "Interested added" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add interested",
      error: error.message
    });
  }
};

exports.removeInterested = async (req, res) => {
  const userId = req.user.user_id;
  const eventId = req.params.id;

  try {
    await eventService.removeInterested(userId, eventId);
    res.json({ message: "Interested removed" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove interested",
      error: error.message
    });
  }
};

exports.checkInterested = async (req, res) => {
  const userId = req.user.user_id;
  const eventId = req.params.id;

  try {
    const isInterested = await eventService.checkInterested(userId, eventId);
    res.json({ isInterested });
  } catch (error) {
    res.status(500).json({
      message: "Failed to check interested",
      error: error.message
    });
  }
};

exports.getUserInterested = async (req, res) => {
  const userId = req.user.user_id;

  try {
    const rows = await eventService.getUserInterested(userId);
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get interested",
      error: error.message
    });
  }
};

// ---------------- REGISTER ----------------
exports.registerEvent = async (req, res) => {
  const userId = req.user.user_id;
  const eventId = req.params.id;

  try {
    const registrationId = await eventService.registerEvent(userId, eventId);
    res.json({
      message: "Registration created. Waiting for payment.",
      registration_id: registrationId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to register event",
      error: error.message
    });
  }
};

exports.cancelRegistration = async (req, res) => {
  const userId = req.user.user_id;
  const eventId = req.params.id;

  try {
    await eventService.cancelRegistration(userId, eventId);
    res.json({ message: "Registration cancelled" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to cancel registration",
      error: error.message
    });
  }
};

exports.checkRegistration = async (req, res) => {
  const userId = req.user.user_id;
  const eventId = req.params.id;

  try {
    const result = await eventService.checkRegistration(userId, eventId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Failed to check registration",
      error: error.message
    });
  }
};