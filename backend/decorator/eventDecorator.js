// backend/decorator/eventDecorator.js
class EventDecorator {
  constructor(event) {
    this.event = event;
  }

  formatForCommunityFeed() {
    return {
      id: this.event._id,
      title: this.event.title ? this.event.title.toUpperCase() : '',
      date: this.event.date ? new Date(this.event.date).toLocaleDateString() : null,
      location: this.event.location || '',
      isFeatured: Array.isArray(this.event.attendees) && this.event.attendees.length > 100, // highlight popular events
    };
  }
}

module.exports = EventDecorator;