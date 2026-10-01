const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
    {
        proposalId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Proposal",
            required: true
        },

        voterWallet: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        vote: {
            type: String,
            enum: ["yes", "no"],
            required: true
        },

        // Voting factors at the time of voting
        tokenWeight: {
            type: Number,
            default: 0
        },

        reputationWeight: {
            type: Number,
            default: 0
        },

        participationWeight: {
            type: Number,
            default: 0
        },

        contributionWeight: {
            type: Number,
            default: 0
        },

        // Final adaptive voting weight
        totalVotingWeight: {
            type: Number,
            required: true,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Vote", voteSchema);