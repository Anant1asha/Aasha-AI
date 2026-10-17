export class RewardLedger {
  constructor() {
    this.events = new Map();
    this.balance = 0;
  }

  issue(event, { coins = 0, xp = 0, badge = null, verified = false } = {}) {
    if (!event || typeof event !== 'object' || typeof event.eventId !== 'string' || !event.eventId.trim()) {
      return { issued: false, reason: 'invalid_event' };
    }
    if (!verified) {
      return { issued: false, reason: 'verification_required' };
    }
    if (this.events.has(event.eventId)) {
      return { issued: false, reason: 'duplicate', balance: this.balance };
    }
    const delta = { coins, xp, badge };
    this.events.set(event.eventId, delta);
    this.balance += coins;
    return { issued: true, ...delta, balance: this.balance };
  }
}

