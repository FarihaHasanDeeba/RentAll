const Equipment = require("../models/Equipment");

// Get all equipment
const getAllEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.find();

        res.status(200).json(equipment);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch equipment",
            error: error.message
        });
    }
};

// Get single equipment
const getEquipmentById = async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({
                message: "Equipment not found"
            });
        }

        res.status(200).json(equipment);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch equipment",
            error: error.message
        });
    }
};

// Create equipment
const createEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.create(req.body);

        res.status(201).json(equipment);
    } catch (error) {
        res.status(400).json({
            message: "Failed to create equipment",
            error: error.message
        });
    }
};

module.exports = {
    getAllEquipment,
    getEquipmentById,
    createEquipment
};