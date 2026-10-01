const express = require("express");
const Proposal = require("../models/Proposal");
const { validateProposal } = require("../services/proposalValidationService");

const router = express.Router();

// Create a new proposal
router.post("/", async (req, res) => {
    try {
        const {
            title,
            description,
            proposerWallet
        } = req.body;

        if (!title || !description || !proposerWallet) {
            return res.status(400).json({
                message: "Title, description and proposer wallet are required"
            });
        }

        // Get existing proposals for duplicate detection
        const existingProposals = await Proposal.find();

        // Validate proposal using similarity detection
        const validationResult = await validateProposal(
            {
                title,
                description
            },
            existingProposals
        );

        // Create proposal with validation result
        const proposal = await Proposal.create({
            title,
            description,
            proposerWallet,

            aiValidation: {
                status: validationResult.status,
                similarityScore: validationResult.similarityScore,
                reason: validationResult.reason
            },

            // Only approved proposals become active
            status:
                validationResult.status === "approved"
                    ? "active"
                    : "rejected"
        });

        res.status(201).json({
            message: "Proposal processed successfully",
            proposal
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to process proposal",
            error: error.message
        });
    }
});

// Get all proposals
router.get("/", async (req, res) => {
    try {
        const proposals = await Proposal.find().sort({
            createdAt: -1
        });

        res.status(200).json(proposals);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch proposals",
            error: error.message
        });
    }
});

module.exports = router;