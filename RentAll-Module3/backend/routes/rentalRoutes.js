const express = require("express");

const router = express.Router();

const {
    submitRentRequest,
    updateRentalStatus,
    getRentalStatusHistory,
    setPickupLocation,
    proposeHandoverSpot,
    confirmHandoverSpot,
    generateHandoverOTP,
    verifyHandoverOTP,
    reportDamage,
    getDamageIncidents,
    updateDamageIncident,
    getRentalById,
    getUserRentals
} = require("../controllers/rentalController");


// =====================================================
// FEATURE 11: SUBMIT RENT REQUEST
// =====================================================

router.post("/", submitRentRequest);


// =====================================================
// FEATURE 12: ASSET STATUS WORKFLOW ENGINE
// =====================================================

router.put("/:rentalId/status", updateRentalStatus);
router.get("/:rentalId/status-history", getRentalStatusHistory);


// =====================================================
// FEATURE 13: GEOGRAPHIC EXCHANGE MAPPER
// =====================================================

router.put("/:rentalId/pickup-location", setPickupLocation);
router.post("/:rentalId/handover-spot", proposeHandoverSpot);
router.put("/:rentalId/handover-spot/confirm", confirmHandoverSpot);


// =====================================================
// FEATURE 14: HANDOVER VERIFICATION HANDSHAKE
// =====================================================

router.post("/:rentalId/handover-otp", generateHandoverOTP);
router.post("/:rentalId/handover-verify", verifyHandoverOTP);


// =====================================================
// FEATURE 15: DAMAGE INCIDENT LOGGER
// =====================================================

router.post("/:rentalId/damage", reportDamage);
router.get("/:rentalId/damage", getDamageIncidents);
router.put("/damage/:incidentId", updateDamageIncident);


// =====================================================
// GENERAL RENTAL ENDPOINTS
// =====================================================

router.get("/user/:userId", getUserRentals);
router.get("/:rentalId", getRentalById);


module.exports = router;