
const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Get DAO member governance profile
router.get("/:walletAddress", async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();

    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      walletAddress: user.walletAddress,
      tokenBalance: user.tokenBalance,
      reputation: user.reputation,
      participation: user.participation,
      contribution: user.contribution,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
});

// Update DAO member governance data
router.put("/:walletAddress", async (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();

    const fields = [
      "tokenBalance",
      "reputation",
      "participation",
      "contribution",
    ];

    // Accept only supplied, valid, non-negative numbers
    const updates = {};

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        const value = Number(req.body[field]);

        if (!Number.isFinite(value) || value < 0) {
          return res.status(400).json({
            message: `${field} must be a non-negative number`,
          });
        }

        updates[field] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide at least one governance field to update",
      });
    }

    const user = await User.findOne({ walletAddress });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    Object.assign(user, updates);
    await user.save();

    res.status(200).json({
      message: "User governance data updated successfully",
      user: {
        walletAddress: user.walletAddress,
        tokenBalance: user.tokenBalance,
        reputation: user.reputation,
        participation: user.participation,
        contribution: user.contribution,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
});

module.exports = router;
