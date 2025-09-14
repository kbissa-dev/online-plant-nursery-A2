// Base Notifier
class Notifier {
  send(message) {
    console.log("Base notifier: " + message);
  }
}

// Decorator
class NotifierDecorator {
  constructor(notifier) {
    this.notifier = notifier;
  }
  send(message) {
    this.notifier.send(message);
  }
}

// Concrete decorators
class EmailNotifier extends NotifierDecorator {
  send(message) {
    super.send(message);
    console.log("📧 Email sent: " + message);
    // integrate with real email provider here
  }
}

class SMSNotifier extends NotifierDecorator {
  send(message) {
    super.send(message);
    console.log("📱 SMS sent: " + message);
  }
}

class ToastNotifier extends NotifierDecorator {
  send(message) {
    super.send(message);
    console.log("🔔 Toast notification: " + message);
  }
}

// Factory to build channel stack
function buildNotifier(channels = []) {
  let notifier = new Notifier();
  if (channels.includes("email")) notifier = new EmailNotifier(notifier);
  if (channels.includes("sms")) notifier = new SMSNotifier(notifier);
  if (channels.includes("toast")) notifier = new ToastNotifier(notifier);
  return notifier;
}

module.exports = { buildNotifier };
