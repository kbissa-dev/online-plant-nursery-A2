const router = require('express').Router();
const c = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

// ---- Event CRUD ----
router.post('/', protect, c.createEvent);          // Create new event
router.put('/:id', protect, c.updateEvent);        // Update event
router.delete('/:id', protect, c.deleteEvent);     // Delete event

// ---- Fetch events ----
router.get('/', c.listEvents);                     // List all events (public)
router.get('/:id', c.getEvent);                    // Get single event (public)

// ---- RSVP ----
router.post('/:id/rsvp', protect, c.rsvpEvent);    // RSVP to event

module.exports = router;
