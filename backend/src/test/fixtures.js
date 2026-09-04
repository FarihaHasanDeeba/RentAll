import User from '../models/User.js';
import Item from '../models/Item.js';
import Rental from '../models/Rental.js';

// Builds the exact scenario used throughout the spec: daily rate 500,
// 3 days, deposit 5000 -> rentalCost 1500, totalAmount 6500.
export async function buildScenario({
  dailyRate = 500,
  days = 3,
  securityDeposit = 5000,
  status = 'Requested',
  paymentStatus = 'Pending',
} = {}) {
  const lender = await User.create({ name: 'Lender A', email: `lender-${Date.now()}-${Math.random()}@test.com`, role: 'Lender' });
  const renter = await User.create({ name: 'Renter A', email: `renter-${Date.now()}-${Math.random()}@test.com`, role: 'Renter' });
  const item = await Item.create({ title: 'Test Item', dailyRate, securityDeposit, owner: lender._id });

  const rentalCost = dailyRate * days;
  const totalAmount = rentalCost + securityDeposit;

  const rental = await Rental.create({
    item: item._id,
    renter: renter._id,
    lender: lender._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    days,
    dailyRate,
    securityDeposit,
    rentalCost,
    totalAmount,
    status,
    paymentStatus,
    securityDepositStatus: paymentStatus === 'Paid' ? 'held' : 'pending',
  });

  return { lender, renter, item, rental };
}
