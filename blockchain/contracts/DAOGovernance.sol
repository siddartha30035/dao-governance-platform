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

    uint256 public proposalCounter;

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

    event ProposalClosed(uint256 indexed proposalId);

    // Create a new proposal
    function createProposal(
        string memory title,
        string memory description
    ) public {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");

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
            proposalId > 0 && proposalId <= proposalCounter,
            "Proposal does not exist"
        );

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
            proposalId > 0 && proposalId <= proposalCounter,
            "Proposal does not exist"
        );

        require(
            proposals[proposalId].active,
            "Proposal already closed"
        );

        proposals[proposalId].active = false;

        emit ProposalClosed(proposalId);
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
        require(
            proposalId > 0 && proposalId <= proposalCounter,
            "Proposal does not exist"
        );

        Proposal memory proposal = proposals[proposalId];

        return (
            proposal.yesVotes,
            proposal.noVotes,
            proposal.totalVotingWeight,
            proposal.active
        );
    }
}