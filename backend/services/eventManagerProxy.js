class EventManagerProxy {
  constructor(eventManager) {
    this.eventManager = eventManager;
  }

  async createEvent(user, eventData) {
    if (!user || !user.isCommunityMember) {
      throw new Error('Only community members can create events');
    }
    console.log('[Proxy] Access granted for createEvent');
    return this.eventManager.createEvent(eventData);
  }

  async getEvents() {
    console.log('[Proxy] Forwarding getEvents call');
    return this.eventManager.getEvents();
  }
}

module.exports = EventManagerProxy;
