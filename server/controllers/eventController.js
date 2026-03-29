const eventService = require("../services/eventService");
const { query } = require("../utils/dbHelpers");
const { sendRegistrationConfirmation, sendEventCancellationEmail } = require("../utils/mailer");


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
    const userId = req.user.user_id;

    // Check if user is verified organizer
    const org = await eventService.getVerifiedOrganizer(userId);
    
    if (!org) {
      return res.status(403).json({ 
        message: "You must be a verified organizer to create events. Please complete organizer approval first.",
        code: "NOT_VERIFIED_ORGANIZER"
      });
    }

    // Add organizer_id to request body
    req.body.organizer_id = org.organizer_id;
    
    const id = await eventService.createEvent(req.body);
    res.json({ message: "created", event_id: id });
  } catch (err) {
    res.status(500).json({ message: "create failed", error: err.message });
  }
};

// ================= UPDATE =================
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;

  try {
    // Check if user is verified organizer
    const org = await eventService.getVerifiedOrganizer(userId);
    
    if (!org) {
      return res.status(403).json({ 
        message: "You must be a verified organizer to update events" 
      });
    }

    // Check if user owns this event
    const event = await eventService.getEventById(id);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (Number(event.organizer_id) !== Number(org.organizer_id)) {
      return res.status(403).json({ 
        message: "You can only update your own events" 
      });
    }

    // Check if there are active registrations
    const registrations = await eventService.getEventRegistrationCount(id);
    
    if (registrations > 0) {
      return res.status(409).json({
        message: `Cannot edit event with ${registrations} active registration(s). Please cancel their registrations first.`
      });
    }

    if (req.body.event_date) {
      const nextEventDate = new Date(req.body.event_date);
      if (Number.isNaN(nextEventDate.getTime()) || nextEventDate <= new Date()) {
        return res.status(400).json({
          message: "Event date must be later than the current time"
        });
      }
    }

    // Ensure organizer_id remains set
    req.body.organizer_id = org.organizer_id;

    await eventService.updateEvent(id, req.body);
    res.json({ message: "updated" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ 
      message: err.message || "update failed", 
      error: err.message 
    });
  }
};

// ================= DELETE =================
exports.deleteEvent = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;

  try {
    // Check if user is verified organizer
    const org = await eventService.getVerifiedOrganizer(userId);
    
    if (!org) {
      return res.status(403).json({ 
        message: "You must be a verified organizer to delete events" 
      });
    }

    // Check if user owns this event
    const event = await eventService.getEventById(id);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (Number(event.organizer_id) !== Number(org.organizer_id)) {
      return res.status(403).json({ 
        message: "You can only delete your own events" 
      });
    }

    await eventService.deleteEvent(id);
    res.json({ message: "deleted" });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: err.message, error: err.message });
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
    // Check if user is the organizer of this event
    const event = await eventService.getEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const org = await eventService.getVerifiedOrganizer(userId);
    
    if (org && event.organizer_id === org.organizer_id) {
      return res.status(403).json({ 
        message: "You cannot register for your own event",
        code: "CANNOT_REGISTER_OWN_EVENT"
      });
    }

    const registrationId = await eventService.registerEvent(userId, eventId);

    // Send payment reminder email
    try {
      const [[user], [event]] = await Promise.all([
        query("SELECT username, email FROM users WHERE user_id = ? LIMIT 1", [userId]),
        query("SELECT title, event_date FROM event WHERE event_id = ? LIMIT 1", [eventId]),
      ]);
      if (user?.email && event?.title) {
        sendRegistrationConfirmation({
          to: user.email,
          username: user.username,
          eventTitle: event.title,
          eventDate: event.event_date,
        }).catch((err) => console.error("Registration email failed:", err.message));
      }
    } catch (mailErr) {
      console.error("Registration email lookup failed:", mailErr.message);
    }

    res.json({
      message: "Registration created. Waiting for payment.",
      registration_id: registrationId
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: "Failed to register event",
      error: error.message
    });
  }
};

exports.cancelRegistration = async (req, res) => {
  const userId = req.user.user_id;
  const eventId = req.params.id;

  try {
    // Check if the registration was confirmed (paid) before cancelling
    const regRows = await query(
      `SELECT r.registration_status, e.title, e.event_date
       FROM event_registration r
       JOIN event e ON e.event_id = r.event_id
       WHERE r.user_id = ? AND r.event_id = ? LIMIT 1`,
      [userId, eventId]
    );
    const wasPaid = regRows.length > 0 && regRows[0].registration_status === "confirmed";

    await eventService.cancelRegistration(userId, eventId);

    // Send cancellation email if user had already paid
    if (wasPaid) {
      try {
        const userRows = await query("SELECT username, email FROM users WHERE user_id = ? LIMIT 1", [userId]);
        const user = userRows[0];
        if (user?.email && regRows[0]?.title) {
          sendEventCancellationEmail({
            to: user.email,
            username: user.username,
            eventTitle: regRows[0].title,
            eventDate: regRows[0].event_date,
          }).catch((err) => console.error("Cancellation email failed:", err.message));
        }
      } catch (mailErr) {
        console.error("Cancellation email lookup failed:", mailErr.message);
      }
    }

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
