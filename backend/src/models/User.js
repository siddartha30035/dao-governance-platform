const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        walletAddress: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        tokenBalance: {
            type: Number,
            default: 0
        },

        reputation: {
            type: Number,
            default: 0
        },

        participation: {
            type: Number,
            default: 0
        },

        contribution: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);