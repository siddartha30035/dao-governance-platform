// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DAOGovernance {

    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 totalVotingWeight;
        bool active;
    }

    struct Vote {
        bool hasVoted;
        bool support;
        uint256 votingWeight;
    }

    uint256 private proposalCounter;

    mapping(uint256 => Proposal) public proposals;

    mapping(uint256 => mapping(address => Vote)) public votes;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votingWeight
    );

    constructor() {
        proposalCounter = 0;
    }

    // Create a new proposal
    function createProposal(
        string memory title,
        string memory description
    ) public {

        proposalCounter++;

        proposals[proposalCounter] = Proposal({
            id: proposalCounter,
            title: title,
            description: description,
            proposer: msg.sender,
            yesVotes: 0,
            noVotes: 0,
            totalVotingWeight: 0,
            active: true
        });

        emit ProposalCreated(
            proposalCounter,
            msg.sender,
            title
        );
    }

    // Cast a weighted vote
    function castVote(
        uint256 proposalId,
        bool support,
        uint256 votingWeight
    ) public {

        require(
            proposals[proposalId].active,
            "Proposal is not active"
        );

        require(
            !votes[proposalId][msg.sender].hasVoted,
            "Already voted"
        );

        require(
            votingWeight > 0,
            "Voting weight must be greater than zero"
        );

        votes[proposalId][msg.sender] = Vote({
            hasVoted: true,
            support: support,
            votingWeight: votingWeight
        });

        if (support) {
            proposals[proposalId].yesVotes += votingWeight;
        } else {
            proposals[proposalId].noVotes += votingWeight;
        }

        proposals[proposalId].totalVotingWeight =
            proposals[proposalId].yesVotes +
            proposals[proposalId].noVotes;

        emit VoteCast(
            proposalId,
            msg.sender,
            support,
            votingWeight
        );
    }

    // Close voting for a proposal
    function closeProposal(uint256 proposalId) public {

        require(
            proposals[proposalId].active,
            "Proposal already closed"
        );

        proposals[proposalId].active = false;
    }

    // Get the current result
    function getProposalResult(
        uint256 proposalId
    )
        public
        view
        returns (
            uint256 yesVotes,
            uint256 noVotes,
            uint256 totalVotingWeight,
            bool active
        )
    {
        Proposal memory proposal = proposals[proposalId];

        return (
            proposal.yesVotes,
            proposal.noVotes,
            proposal.totalVotingWeight,
            proposal.active
        );
    }
}