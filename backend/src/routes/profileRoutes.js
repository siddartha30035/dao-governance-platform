const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Get DAO member governance profile
router.get("/:walletAddress", async (req, res) => {
    try {
        const { walletAddress } = req.params;

        const user = await User.findOne({
            walletAddress: walletAddress.toLowerCase()
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            walletAddress: user.walletAddress,
            tokenBalance: user.tokenBalance,
            reputation: user.reputation,
            participation: user.participation,
            contribution: user.contribution
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch user profile",
            error: error.message
        });
    }
});
// Update DAO member governance data
router.put("/:walletAddress", async (req, res) => {
    try {
        const { walletAddress } = req.params;

        const {
            tokenBalance,
            reputation,
            participation,
            contribution
        } = req.body;

        const user = await User.findOne({
            walletAddress: walletAddress.toLowerCase()
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (tokenBalance !== undefined) {
            user.tokenBalance = tokenBalance;
        }

        if (reputation !== undefined) {
            user.reputation = reputation;
        }

        if (participation !== undefined) {
            user.participation = participation;
        }

        if (contribution !== undefined) {
            user.contribution = contribution;
        }

        await user.save();

        res.status(200).json({
            message: "User governance data updated successfully",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update user",
            error: error.message
        });
    }
});

module.exports = router;