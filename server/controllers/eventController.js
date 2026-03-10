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

exports.getAllEvents = (req, res) => {
  eventService
    .getEvents()
    .then((events) => res.json(events.map(toLegacyEventShape)))
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to fetch events", error: error.message })
    );
};

exports.getEventById = (req, res) => {
  const { id } = req.params;

  eventService
    .getEventById(id)
    .then((event) => res.json(toLegacyEventShape(event)))
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to fetch event", error: error.message })
    );
};

exports.createEvent = (req, res) => {
  eventService
    .createEvent(req.body)
    .then((eventId) =>
      res.status(201).json({
        message: "Event created successfully",
        event_id: eventId
      })
    )
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to create event", error: error.message })
    );
};

exports.updateEvent = (req, res) => {
  const { id } = req.params;

  eventService
    .updateEvent(id, req.body)
    .then(() =>
      res.json({
        message: "Event updated successfully"
      })
    )
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to update event", error: error.message })
    );
};

exports.deleteEvent = (req, res) => {
  const { id } = req.params;

  eventService
    .deleteEvent(id)
    .then(() =>
      res.json({
        message: "Event deleted successfully"
      })
    )
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to delete event", error: error.message })
    );
};

exports.searchEvents = (req, res) => {
  const keyword = req.query.q || "";

  eventService
    .searchEvents(keyword)
    .then((events) => res.json(events.map(toLegacyEventShape)))
    .catch((error) =>
      res
        .status(error.statusCode || 500)
        .json({ message: "Failed to search events", error: error.message })
    );
};