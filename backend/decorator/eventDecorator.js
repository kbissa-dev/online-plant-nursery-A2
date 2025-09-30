// Base Decorator
class EventDecorator {
  constructor(event) {
    this.event = event;
  }

  format() {
    return {
      id: this.event._id,
      title: this.event.title ? this.event.title.toUpperCase() : '',
      date: this.event.date ? new Date(this.event.date).toLocaleDateString() : null,
      location: this.event.location || '',
      isFeatured:
        Array.isArray(this.event.attendees) && this.event.attendees.length > 100,
    };
  }
}

// City-based Decorators
class SydneyEventDecorator extends EventDecorator {
  format() {
    const base = super.format();
    return { ...base, cityTag: "Sydney" };
  }
}

class MelbourneEventDecorator extends EventDecorator {
  format() {
    const base = super.format();
    return { ...base, cityTag: "Melbourne" };
  }
}

class BrisbaneEventDecorator extends EventDecorator {
  format() {
    const base = super.format();
    return { ...base, cityTag: "Brisbane" };
  }
}

// Export all decorators
module.exports = {
  EventDecorator,
  SydneyEventDecorator,
  MelbourneEventDecorator,
  BrisbaneEventDecorator
};
