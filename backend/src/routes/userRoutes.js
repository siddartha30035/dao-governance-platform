const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Create a new DAO user
router.post("/", async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            return res.status(400).json({
                message: "Wallet address is required"
            });
        }

        const existingUser = await User.findOne({ walletAddress });

        if (existingUser) {
            return res.status(200).json({
                message: "User already exists",
                user: existingUser
            });
        }

        const user = await User.create({
            walletAddress
        });

        res.status(201).json({
            message: "User created successfully",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create user",
            error: error.message
        });
    }
});

module.exports = router;