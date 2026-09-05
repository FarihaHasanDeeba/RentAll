const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/geocode", async (req, res) => {
  const address = String(req.query.address || "").trim();
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!address) return res.status(400).json({ success: false, message: "address is required." });
  if (!key) return res.status(503).json({ success: false, message: "GOOGLE_MAPS_API_KEY is not configured." });

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: { address, key }
    });
    if (response.data.status !== "OK" || !response.data.results?.length)
      return res.status(404).json({ success: false, message: "Address could not be geocoded.", providerStatus: response.data.status });
    const result = response.data.results[0];
    res.json({
      success: true,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${result.geometry.location.lat},${result.geometry.location.lng}&query_place_id=${result.place_id}`
    });
  } catch (e) {
    console.error("Google Maps geocoding error:", e.response?.data || e.message);
    res.status(502).json({ success: false, message: "Google Maps geocoding failed." });
  }
});

module.exports = router;
