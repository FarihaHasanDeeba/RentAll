import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import paymentRoutes from './routes/paymentRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import agreementRoutes from './routes/agreementRoutes.js';
import mailboxRoutes from './routes/mailboxRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/rentals', rentalRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/mailbox', mailboxRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
