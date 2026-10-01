const express = require("express");

const Vote = require("../models/Vote");
const User = require("../models/User");
const Proposal = require("../models/Proposal");
const { calculateVotingWeight } = require("../services/votingWeightService");

const router = express.Router();

// Cast a vote
router.post("/", async (req, res) => {
    try {
        const {
            proposalId,
            voterWallet,
            vote
        } = req.body;

        // Validate input
        if (!proposalId || !voterWallet || !vote) {
            return res.status(400).json({
                message: "Proposal ID, voter wallet and vote are required"
            });
        }

        // Validate vote value
        if (!["yes", "no"].includes(vote.toLowerCase())) {
            return res.status(400).json({
                message: "Vote must be either yes or no"
            });
        }

        // Check proposal
        const proposal = await Proposal.findById(proposalId);

        if (!proposal) {
            return res.status(404).json({
                message: "Proposal not found"
            });
        }

        // Check user
        const user = await User.findOne({
            walletAddress: voterWallet.toLowerCase()
        });

        if (!user) {
            return res.status(404).json({
                message: "Voter is not registered"
            });
        }

        // Prevent duplicate voting
        const existingVote = await Vote.findOne({
            proposalId,
            voterWallet: voterWallet.toLowerCase()
        });

        if (existingVote) {
            return res.status(400).json({
                message: "This wallet has already voted on this proposal"
            });
        }

        // Calculate adaptive voting weight
        const {
            tokenWeight,
            reputationWeight,
            participationWeight,
            contributionWeight,
            totalVotingWeight
        } = calculateVotingWeight(user);

        // Create vote
        const newVote = await Vote.create({
            proposalId,
            voterWallet: voterWallet.toLowerCase(),
            vote: vote.toLowerCase(),
            tokenWeight,
            reputationWeight,
            participationWeight,
            contributionWeight,
            totalVotingWeight
        });

        // Update proposal vote counts
        if (vote.toLowerCase() === "yes") {
            proposal.yesVotes += totalVotingWeight;
        } else {
            proposal.noVotes += totalVotingWeight;
        }

        proposal.totalVotingWeight =
            proposal.yesVotes + proposal.noVotes;

        await proposal.save();

        res.status(201).json({
            message: "Vote recorded successfully",
            vote: newVote,
            votingWeight: totalVotingWeight
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to record vote",
            error: error.message
        });
    }
});

module.exports = router;