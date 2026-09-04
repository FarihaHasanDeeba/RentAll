import Rental from '../models/Rental.js';
import DamageLog from '../models/DamageLog.js';
import ChatMessage from '../models/ChatMessage.js';

async function resolveSender(rental, role) {
  const userId = role === 'Lender' ? rental.lender : rental.renter;
  return userId;
}

// GET /api/rentals/:id/damage-logs
export async function listDamageLogs(req, res) {
  const logs = await DamageLog.find({ rental: req.params.id })
    .populate('reportedBy', 'name role')
    .sort({ createdAt: 1 });
  res.json(logs);
}

// POST /api/rentals/:id/damage-logs { description, claimedAmount, role }
// `role` simulates which party is filing the claim (there's no login system).
export async function createDamageLog(req, res) {
  const rental = await Rental.findById(req.params.id);
  if (!rental) return res.status(404).json({ message: 'Rental not found' });

  const { description, claimedAmount, role = 'Lender' } = req.body;
  if (!description || claimedAmount == null) {
    return res.status(400).json({ message: 'description and claimedAmount are required' });
  }

  const reportedBy = await resolveSender(rental, role);
  const log = await DamageLog.create({ rental: rental._id, reportedBy, description, claimedAmount });
  const populated = await log.populate('reportedBy', 'name role');
  res.status(201).json(populated);
}

// GET /api/rentals/:id/messages
export async function listMessages(req, res) {
  const messages = await ChatMessage.find({ rental: req.params.id })
    .populate('sender', 'name')
    .sort({ createdAt: 1 });
  res.json(messages);
}

// POST /api/rentals/:id/messages { body, role }
export async function createMessage(req, res) {
  const rental = await Rental.findById(req.params.id);
  if (!rental) return res.status(404).json({ message: 'Rental not found' });

  const { body, role = 'Renter' } = req.body;
  if (!body) return res.status(400).json({ message: 'body is required' });

  const sender = await resolveSender(rental, role);
  const message = await ChatMessage.create({ rental: rental._id, sender, role, body });
  const populated = await message.populate('sender', 'name');
  res.status(201).json(populated);
}
