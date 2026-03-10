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
      res.status(error.statusCode || 500).json({ message: "Failed to fetch events", error })
    );
};

exports.getEventById = (req, res) => {
  const { id } = req.params;

  eventService
    .getEventById(id)
    .then((event) => res.json(toLegacyEventShape(event)))
    .catch((error) =>
      res.status(error.statusCode || 500).json({ message: "Failed to fetch event", error })
    );
};
