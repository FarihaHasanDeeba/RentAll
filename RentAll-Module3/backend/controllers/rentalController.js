const crypto = require("crypto");
const Rental = require("../models/Rental");
const Item = require("../models/Item");
const User = require("../models/User");
const DamageIncident = require("../models/DamageIncident");

const STATUSES = [
  "REQUESTED","ACCEPTED","REJECTED","CHECKED_OUT","IN_USE",
  "RETURNED","DAMAGE_REPORTED","CHECKED_APPROVED","CLOSED"
];

const TRANSITIONS = {
  REQUESTED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["CHECKED_OUT"],
  CHECKED_OUT: ["IN_USE", "RETURNED"],
  IN_USE: ["RETURNED", "DAMAGE_REPORTED"],
  RETURNED: ["CHECKED_APPROVED", "DAMAGE_REPORTED"],
  DAMAGE_REPORTED: ["CHECKED_APPROVED"],
  CHECKED_APPROVED: ["CLOSED"],
  REJECTED: [],
  CLOSED: []
};

const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ""));
const fail = (res, status, message) => res.status(status).json({ success: false, message });

const populateRental = (query) =>
  query
    .populate("renterId", "name email phone role location")
    .populate("lenderId", "name email phone role location")
    .populate("itemId", "title description category rentalPricePerDay securityDeposit images location ownerId")
    .populate("statusHistory.actorId", "name email role")
    .populate("handoverSpot.proposedBy", "name email role");

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (v) => (Number(v) * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getParties(rental) {
  const [renter, lender] = await Promise.all([
    User.findById(rental.renterId),
    User.findById(rental.lenderId)
  ]);
  return { renter, lender };
}

async function sendOtpSms(users, otp, purpose) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMS provider is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM.");
    }
    return { sent: false, developmentOtp: otp };
  }

  const axios = require("axios");
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const recipients = [...new Set(users.map((u) => u?.phone).filter(Boolean))];
  for (const to of recipients) {
    await axios.post(
      url,
      new URLSearchParams({
        To: to,
        From: TWILIO_FROM,
        Body: `RentAll ${purpose} verification OTP: ${otp}. It expires in 15 minutes.`
      }),
      { auth: { username: TWILIO_ACCOUNT_SID, password: TWILIO_AUTH_TOKEN } }
    );
  }
  return { sent: true };
}

const submitRentRequest = async (req, res) => {
  try {
    const { renterId, itemId, startDate, endDate } = req.body;
    if (![renterId, itemId, startDate, endDate].every(Boolean))
      return fail(res, 400, "renterId, itemId, startDate and endDate are required.");
    if (!isObjectId(renterId) || !isObjectId(itemId))
      return fail(res, 400, "Invalid renterId or itemId.");

    const [renter, item] = await Promise.all([User.findById(renterId), Item.findById(itemId)]);
    if (!renter) return fail(res, 404, "Renter not found.");
    if (renter.role !== "RENTER") return fail(res, 403, "Only RENTER users can submit rental requests.");
    if (!item) return fail(res, 404, "Item not found.");
    if (!item.isAvailable) return fail(res, 400, "This item is currently unavailable.");
    if (String(item.ownerId) === String(renterId)) return fail(res, 400, "You cannot rent your own item.");

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
      return fail(res, 400, "Invalid start date or end date.");
    if (start >= end) return fail(res, 400, "End date must be after start date.");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) return fail(res, 400, "Rental cannot start in the past.");

    const conflict = await Rental.findOne({
      itemId,
      status: { $in: ["REQUESTED", "ACCEPTED", "CHECKED_OUT", "IN_USE"] },
      startDate: { $lt: end },
      endDate: { $gt: start }
    });
    if (conflict) return fail(res, 409, "This item is already reserved for some or all of these dates.");

    const rentalDays = Math.max(1, Math.ceil((end - start) / 86400000));
    const rental = await Rental.create({
      renterId,
      lenderId: item.ownerId,
      itemId,
      startDate: start,
      endDate: end,
      rentalAmount: rentalDays * Number(item.rentalPricePerDay),
      securityDeposit: Number(item.securityDeposit),
      status: "REQUESTED",
      depositStatus: "PENDING",
      paymentStatus: "PENDING",
      statusHistory: [{ status: "REQUESTED", at: new Date(), note: "Rental request submitted.", actorId: renterId }]
    });

    return res.status(201).json({
      success: true,
      message: "Rental request submitted successfully.",
      rental: await populateRental(Rental.findById(rental._id))
    });
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error while submitting rental request.");
  }
};

const updateRentalStatus = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { newStatus, actorId, note } = req.body;
    if (!isObjectId(rentalId) || !isObjectId(actorId)) return fail(res, 400, "Invalid rentalId or actorId.");
    if (!STATUSES.includes(newStatus)) return fail(res, 400, "Invalid status.");

    const rental = await Rental.findById(rentalId);
    const actor = await User.findById(actorId);
    if (!rental) return fail(res, 404, "Rental not found.");
    if (!actor) return fail(res, 404, "User not found.");

    const isRenter = String(actor._id) === String(rental.renterId);
    const isLender = String(actor._id) === String(rental.lenderId);
    if (!isRenter && !isLender) return fail(res, 403, "You are not a party to this rental.");

    if (!TRANSITIONS[rental.status]?.includes(newStatus))
      return fail(res, 400, `Cannot transition from ${rental.status} to ${newStatus}.`);

    // Handover statuses must be produced by successful OTP verification.
    if (["CHECKED_OUT", "RETURNED"].includes(newStatus))
      return fail(res, 400, `${newStatus} must be completed through OTP handover verification.`);

    if (newStatus === "ACCEPTED" && !isLender) return fail(res, 403, "Only the lender can accept a request.");
    if (newStatus === "REJECTED" && !isLender) return fail(res, 403, "Only the lender can reject a request.");
    if (newStatus === "IN_USE" && !isRenter) return fail(res, 403, "Only the renter can mark an item as IN_USE.");
    if (newStatus === "CHECKED_APPROVED" && !isLender) return fail(res, 403, "Only the lender can approve a returned item.");
    if (newStatus === "CLOSED" && !isLender) return fail(res, 403, "Only the lender can close a rental.");

    rental.status = newStatus;
    rental.statusHistory.push({ status: newStatus, at: new Date(), note: note || "", actorId });

    if (newStatus === "ACCEPTED") {
      rental.depositStatus = "HELD";
    } else if (newStatus === "CHECKED_APPROVED") {
      if (rental.depositStatus === "FROZEN") return fail(res, 400, "Resolve the damage incident before approving the return.");
      rental.depositStatus = "RELEASED";
    } else if (newStatus === "CLOSED") {
      if (rental.depositStatus === "FROZEN") return fail(res, 400, "Escrow is frozen. Resolve the damage incident first.");
      // Preserve a legitimate damage deduction when closing the rental.
      if (rental.depositStatus !== "DEDUCTED") rental.depositStatus = "RELEASED";
    }

    await rental.save();
    return res.json({ success: true, message: "Rental status updated successfully.", rental: await populateRental(Rental.findById(rental._id)) });
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error while updating rental status.");
  }
};

const getRentalStatusHistory = async (req, res) => {
  try {
    if (!isObjectId(req.params.rentalId)) return fail(res, 400, "Invalid rentalId.");
    const rental = await Rental.findById(req.params.rentalId).populate("statusHistory.actorId", "name email role");
    if (!rental) return fail(res, 404, "Rental not found.");
    res.json({ success: true, currentStatus: rental.status, statusHistory: rental.statusHistory });
  } catch (e) { fail(res, 500, "Server error while retrieving status history."); }
};

const setPickupLocation = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { address, latitude, longitude, radiusKm } = req.body;
    if (!isObjectId(rentalId)) return fail(res, 400, "Invalid rentalId.");
    if (!address || latitude === undefined || longitude === undefined) return fail(res, 400, "address, latitude and longitude are required.");
    const lat = Number(latitude), lng = Number(longitude), radius = radiusKm === undefined ? 1.2 : Number(radiusKm);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180)
      return fail(res, 400, "Invalid coordinates.");
    if (!Number.isFinite(radius) || radius <= 0 || radius > 25) return fail(res, 400, "radiusKm must be between 0 and 25.");

    const rental = await Rental.findById(rentalId);
    if (!rental) return fail(res, 404, "Rental not found.");
    const actorId = req.body.actorId;
    if (!isObjectId(actorId) || ![String(rental.renterId), String(rental.lenderId)].includes(String(actorId)))
      return fail(res, 403, "Only the renter or lender can set pickup location.");

    rental.pickupLocation = { address: String(address).trim(), latitude: lat, longitude: lng };
    rental.pickupRadiusKm = radius;
    await rental.save();
    res.json({ success: true, message: "Pickup location saved.", pickupLocation: rental.pickupLocation, pickupRadiusKm: radius });
  } catch (e) { console.error(e); fail(res, 500, "Server error while setting pickup location."); }
};

const proposeHandoverSpot = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { name, address, latitude, longitude, placeId, mapsUrl, source, proposedBy } = req.body;
    if (!isObjectId(rentalId) || !isObjectId(proposedBy)) return fail(res, 400, "Invalid rentalId or proposedBy.");
    if (!name || !address || latitude === undefined || longitude === undefined) return fail(res, 400, "name, address, latitude and longitude are required.");
    const rental = await Rental.findById(rentalId);
    if (!rental) return fail(res, 404, "Rental not found.");
    if (![String(rental.renterId), String(rental.lenderId)].includes(String(proposedBy))) return fail(res, 403, "Only the renter or lender can propose a handover spot.");

    const lat = Number(latitude), lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return fail(res, 400, "Invalid coordinates.");
    if (rental.pickupLocation?.latitude != null) {
      const distance = haversineKm(rental.pickupLocation.latitude, rental.pickupLocation.longitude, lat, lng);
      if (distance > Number(rental.pickupRadiusKm || 1.2))
        return fail(res, 400, `Handover spot is ${distance.toFixed(2)} km from pickup center, outside the ${rental.pickupRadiusKm} km radius.`);
    }

    rental.handoverSpot = {
      name: String(name).trim(), address: String(address).trim(), latitude: lat, longitude: lng,
      placeId: placeId || null, mapsUrl: mapsUrl || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      source: source || "GOOGLE_MAPS", proposedBy, confirmedByRenter: false, confirmedByLender: false
    };
    await rental.save();
    res.json({ success: true, message: "Handover spot proposed.", handoverSpot: rental.handoverSpot });
  } catch (e) { console.error(e); fail(res, 500, "Server error while proposing handover spot."); }
};

const confirmHandoverSpot = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { userId } = req.body;
    if (!isObjectId(rentalId) || !isObjectId(userId)) return fail(res, 400, "Invalid rentalId or userId.");
    const rental = await Rental.findById(rentalId);
    if (!rental) return fail(res, 404, "Rental not found.");
    if (!rental.handoverSpot?.name) return fail(res, 400, "No handover spot has been proposed.");
    if (String(userId) === String(rental.renterId)) rental.handoverSpot.confirmedByRenter = true;
    else if (String(userId) === String(rental.lenderId)) rental.handoverSpot.confirmedByLender = true;
    else return fail(res, 403, "User is not authorized.");
    await rental.save();
    res.json({ success: true, message: "Handover spot confirmed.", handoverSpot: rental.handoverSpot });
  } catch (e) { fail(res, 500, "Server error while confirming handover spot."); }
};

const generateHandoverOTP = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { purpose, requestedBy } = req.body;
    if (!isObjectId(rentalId) || !isObjectId(requestedBy)) return fail(res, 400, "Invalid rentalId or requestedBy.");
    if (!["CHECKOUT", "RETURN"].includes(purpose)) return fail(res, 400, "Purpose must be CHECKOUT or RETURN.");

    const rental = await Rental.findById(rentalId);
    if (!rental) return fail(res, 404, "Rental not found.");
    if (![String(rental.renterId), String(rental.lenderId)].includes(String(requestedBy))) return fail(res, 403, "You are not a party to this rental.");

    if (purpose === "CHECKOUT" && rental.status !== "ACCEPTED") return fail(res, 400, "Checkout OTP can only be generated after the rental is accepted.");
    if (purpose === "RETURN" && rental.status !== "IN_USE") return fail(res, 400, "Return OTP can only be generated while the item is in use.");
    if (!rental.handoverSpot?.confirmedByRenter || !rental.handoverSpot?.confirmedByLender)
      return fail(res, 400, "Both renter and lender must confirm the handover spot first.");

    const otp = crypto.randomInt(100000, 1000000).toString();
    rental.handover = {
      purpose, otpHash: crypto.createHash("sha256").update(otp).digest("hex"),
      otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000), verified: false, verifiedAt: null,
      itemMatchesDescription: false, attempts: 0
    };
    await rental.save();

    const { renter, lender } = await getParties(rental);
    let delivery;
    try { delivery = await sendOtpSms([renter, lender], otp, purpose); }
    catch (smsError) { return fail(res, 503, smsError.message); }

    const response = {
      success: true,
      message: delivery.sent ? "OTP generated and sent to the registered phone numbers." : "OTP generated (development mode; SMS provider not configured).",
      expiresAt: rental.handover.otpExpiresAt
    };
    if (delivery.developmentOtp) response.otp = delivery.developmentOtp;
    res.json(response);
  } catch (e) { console.error(e); fail(res, 500, "Server error while generating handover OTP."); }
};

const verifyHandoverOTP = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { otp, itemMatchesDescription, userId } = req.body;
    if (!isObjectId(rentalId) || !isObjectId(userId) || !otp) return fail(res, 400, "rentalId, otp and userId are required.");
    const rental = await Rental.findById(rentalId);
    if (!rental) return fail(res, 404, "Rental not found.");
    if (![String(rental.renterId), String(rental.lenderId)].includes(String(userId))) return fail(res, 403, "You are not a party to this rental.");
    if (!rental.handover?.otpHash) return fail(res, 400, "No active OTP. Generate a new OTP first.");
    if (rental.handover.verified) return fail(res, 400, "Handover already verified.");
    if (!rental.handover.otpExpiresAt || new Date() > rental.handover.otpExpiresAt) return fail(res, 400, "OTP has expired.");
    if (rental.handover.attempts >= 3) return fail(res, 400, "Maximum OTP attempts exceeded. Generate a new OTP.");

    const hash = crypto.createHash("sha256").update(String(otp).trim()).digest("hex");
    if (hash !== rental.handover.otpHash) {
      rental.handover.attempts += 1;
      await rental.save();
      return res.status(400).json({ success: false, message: "Invalid OTP.", attemptsRemaining: Math.max(0, 3 - rental.handover.attempts) });
    }
    if (itemMatchesDescription !== true && itemMatchesDescription !== "true")
      return fail(res, 400, "Item condition must be confirmed before completing the handover.");

    const oldStatus = rental.status;
    const purpose = rental.handover.purpose;
    if (purpose === "CHECKOUT" && oldStatus !== "ACCEPTED") return fail(res, 400, "Rental is no longer ready for checkout.");
    if (purpose === "RETURN" && oldStatus !== "IN_USE") return fail(res, 400, "Rental is no longer ready for return.");

    rental.handover.verified = true;
    rental.handover.verifiedAt = new Date();
    rental.handover.itemMatchesDescription = true;
    rental.handover.attempts += 1;
    rental.status = purpose === "CHECKOUT" ? "CHECKED_OUT" : "RETURNED";
    if (purpose === "RETURN") rental.returnedAt = new Date();
    rental.statusHistory.push({
      status: rental.status, at: new Date(),
      note: `${purpose} handover verified by OTP. Item condition confirmed.`,
      actorId: userId
    });
    await rental.save();
    res.json({ success: true, message: "Handover verified successfully.", rental: await populateRental(Rental.findById(rental._id)) });
  } catch (e) { console.error(e); fail(res, 500, "Server error while verifying handover OTP."); }
};

const reportDamage = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { reportedBy, description, estimatedCost = 0, photos = [] } = req.body;
    if (!isObjectId(rentalId) || !isObjectId(reportedBy) || !description?.trim())
      return fail(res, 400, "rentalId, reportedBy and description are required.");
    const rental = await Rental.findById(rentalId);
    if (!rental) return fail(res, 404, "Rental not found.");
    if (![String(rental.renterId), String(rental.lenderId)].includes(String(reportedBy)))
      return fail(res, 403, "Only the renter or lender can report damage.");
    if (!["CHECKED_OUT", "IN_USE", "RETURNED"].includes(rental.status))
      return fail(res, 400, "Damage can only be reported during an active/return inspection.");

    const active = await DamageIncident.findOne({ rentalId, status: { $in: ["OPEN", "UNDER_REVIEW"] } });
    if (active) return fail(res, 409, "There is already an open damage incident for this rental.");

    const cost = Number(estimatedCost);
    if (!Number.isFinite(cost) || cost < 0) return fail(res, 400, "estimatedCost must be a non-negative number.");
    const incident = await DamageIncident.create({
      rentalId, reportedBy, description: description.trim(), estimatedCost: cost,
      photos: Array.isArray(photos) ? photos.filter(Boolean) : [], status: "OPEN"
    });
    rental.status = "DAMAGE_REPORTED";
    rental.escrowFrozenAt = new Date();
    rental.escrowFrozenReason = `Damage incident ${incident._id}`;
    rental.depositStatus = "FROZEN";
    rental.statusHistory.push({ status: "DAMAGE_REPORTED", at: new Date(), note: `Damage reported: ${description.trim()}`, actorId: reportedBy });
    await rental.save();
    res.status(201).json({
      success: true, message: "Damage reported successfully. Escrow/deposit is frozen.",
      damageIncident: await DamageIncident.findById(incident._id).populate("reportedBy", "name email phone"),
      rental: { id: rental._id, status: rental.status, depositStatus: rental.depositStatus }
    });
  } catch (e) { console.error(e); fail(res, 500, "Server error while reporting damage."); }
};

const getDamageIncidents = async (req, res) => {
  try {
    if (!isObjectId(req.params.rentalId)) return fail(res, 400, "Invalid rentalId.");
    const incidents = await DamageIncident.find({ rentalId: req.params.rentalId })
      .populate("reportedBy", "name email phone role").sort({ createdAt: -1 });
    res.json({ success: true, damageIncidents: incidents });
  } catch (e) { fail(res, 500, "Server error while retrieving damage incidents."); }
};

const updateDamageIncident = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { status, resolution, resolvedBy } = req.body;
    if (!isObjectId(incidentId) || !isObjectId(resolvedBy)) return fail(res, 400, "Invalid incidentId or resolvedBy.");
    if (!["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"].includes(status)) return fail(res, 400, "Invalid damage status.");
    const incident = await DamageIncident.findById(incidentId);
    if (!incident) return fail(res, 404, "Damage incident not found.");
    const rental = await Rental.findById(incident.rentalId);
    if (!rental) return fail(res, 404, "Rental not found.");
    if (String(rental.lenderId) !== String(resolvedBy)) return fail(res, 403, "Only the lender can resolve a damage incident.");

    if (status === "RESOLVED" && !["DEDUCT_FROM_DEPOSIT", "NO_ACTION"].includes(resolution))
      return fail(res, 400, "Resolution must be DEDUCT_FROM_DEPOSIT or NO_ACTION.");
    if (status === "REJECTED" && resolution !== "NO_ACTION") return fail(res, 400, "Rejected incidents must use NO_ACTION.");

    incident.status = status;
    incident.resolution = resolution || incident.resolution;
    if (status === "RESOLVED" || status === "REJECTED") incident.resolvedAt = new Date();

    if (status === "RESOLVED" || status === "REJECTED") {
      if (status === "RESOLVED" && resolution === "DEDUCT_FROM_DEPOSIT") {
        const deduction = Math.min(Number(incident.estimatedCost || 0), Number(rental.securityDeposit || 0));
        incident.deductedAmount = deduction;
        rental.depositStatus = deduction > 0 ? "DEDUCTED" : "RELEASED";
      } else {
        incident.deductedAmount = 0;
        rental.depositStatus = "RELEASED";
      }
      rental.escrowFrozenAt = null;
      rental.escrowFrozenReason = null;
      rental.status = "CHECKED_APPROVED";
      rental.statusHistory.push({
        status: "CHECKED_APPROVED", at: new Date(),
        note: `Damage incident ${incident._id} ${status.toLowerCase()} with resolution ${resolution || "NO_ACTION"}.`,
        actorId: resolvedBy
      });
    }
    await incident.save();
    await rental.save();
    res.json({ success: true, message: "Damage incident updated.", damageIncident: incident, rental: { id: rental._id, status: rental.status, depositStatus: rental.depositStatus } });
  } catch (e) { console.error(e); fail(res, 500, "Server error while updating damage incident."); }
};

const getRentalById = async (req, res) => {
  try {
    if (!isObjectId(req.params.rentalId)) return fail(res, 400, "Invalid rentalId.");
    const rental = await populateRental(Rental.findById(req.params.rentalId));
    if (!rental) return fail(res, 404, "Rental not found.");
    res.json({ success: true, rental });
  } catch (e) { fail(res, 500, "Server error while retrieving rental."); }
};

const getUserRentals = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isObjectId(userId)) return fail(res, 400, "Invalid userId.");
    const role = req.query.role;
    const query = role === "RENTER" ? { renterId: userId } : role === "LENDER" ? { lenderId: userId } : { $or: [{ renterId: userId }, { lenderId: userId }] };
    const rentals = await Rental.find(query)
      .populate("renterId", "name email phone role").populate("lenderId", "name email phone role")
      .populate("itemId", "title description category rentalPricePerDay securityDeposit images").sort({ createdAt: -1 });
    res.json({ success: true, rentals });
  } catch (e) { fail(res, 500, "Server error while retrieving user rentals."); }
};

module.exports = {
  submitRentRequest, updateRentalStatus, getRentalStatusHistory, setPickupLocation,
  proposeHandoverSpot, confirmHandoverSpot, generateHandoverOTP, verifyHandoverOTP,
  reportDamage, getDamageIncidents, updateDamageIncident, getRentalById, getUserRentals
};
