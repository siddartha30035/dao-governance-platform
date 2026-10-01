const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        proposerWallet: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        // AI proposal validation
        aiValidation: {
            status: {
                type: String,
                enum: ["pending", "approved", "rejected"],
                default: "pending"
            },

            similarityScore: {
                type: Number,
                default: 0
            },

            reason: {
                type: String,
                default: ""
            }
        },

        // Voting information
        status: {
            type: String,
            enum: ["pending", "active", "passed", "rejected", "expired"],
            default: "pending"
        },

        yesVotes: {
            type: Number,
            default: 0
        },

        noVotes: {
            type: Number,
            default: 0
        },

        totalVotingWeight: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Proposal", proposalSchema);