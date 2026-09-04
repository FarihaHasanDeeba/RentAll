import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { startReminderScheduler } from './services/reminderScheduler.js';

// Ensure every schema is registered before any populate() call needs it.
import './models/User.js';
import './models/Item.js';
import './models/Rental.js';
import './models/Payment.js';
import './models/Agreement.js';
import './models/MailMessage.js';
import './models/SmsMessage.js';
import './models/DamageLog.js';
import './models/ChatMessage.js';
import './models/Settlement.js';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
    startReminderScheduler();
  })
  .catch((err) => {
    console.error('[server] failed to connect to MongoDB', err);
    process.exit(1);
  });
