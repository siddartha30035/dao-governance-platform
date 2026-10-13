
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DAOGovernance {

    bytes32 public constant FOUNDER_ROLE = keccak256("FOUNDER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MEMBER_ROLE = keccak256("MEMBER_ROLE");

    address public founder;

    mapping(address => mapping(bytes32 => bool)) private roles;

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

    event RoleGranted(address indexed account, bytes32 indexed role);
    event RoleRevoked(address indexed account, bytes32 indexed role);

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

    modifier onlyFounder() {
        require(roles[msg.sender][FOUNDER_ROLE], "Founder only");
        _;
    }

    modifier onlyAdmin() {
        require(roles[msg.sender][ADMIN_ROLE], "Admin only");
        _;
    }

    constructor() {
        founder = msg.sender;

        _grantRole(msg.sender, FOUNDER_ROLE);
        _grantRole(msg.sender, ADMIN_ROLE);
        _grantRole(msg.sender, MEMBER_ROLE);
    }

    function _grantRole(address account, bytes32 role) internal {
        require(account != address(0), "Invalid address");

        if (!roles[account][role]) {
            roles[account][role] = true;
            emit RoleGranted(account, role);
        }
    }

    function grantAdminRole(address account) external onlyFounder {
        _grantRole(account, ADMIN_ROLE);
    }

    function revokeAdminRole(address account) external onlyFounder {
        require(account != founder, "Cannot revoke founder");

        require(roles[account][ADMIN_ROLE], "Not an admin");

        roles[account][ADMIN_ROLE] = false;
        emit RoleRevoked(account, ADMIN_ROLE);
    }

    function registerMember() external {
        _grantRole(msg.sender, MEMBER_ROLE);
    }

    function hasRole(
        address account,
        bytes32 role
    ) external view returns (bool) {
        return roles[account][role];
    }

    function createProposal(
        string memory title,
        string memory description
    ) public {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");

        _grantRole(msg.sender, MEMBER_ROLE);

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

        emit ProposalCreated(proposalCounter, msg.sender, title);
    }

    function castVote(
        uint256 proposalId,
        bool support,
        uint256 votingWeight
    ) public {
        require(
            proposalId > 0 && proposalId <= proposalCounter,
            "Proposal does not exist"
        );

        require(proposals[proposalId].active, "Proposal is not active");

        require(
            !votes[proposalId][msg.sender].hasVoted,
            "Already voted"
        );

        require(votingWeight > 0, "Voting weight must be greater than zero");

        _grantRole(msg.sender, MEMBER_ROLE);

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

        emit VoteCast(proposalId, msg.sender, support, votingWeight);
    }

    function closeProposal(uint256 proposalId) public onlyAdmin {
        require(
            proposalId > 0 && proposalId <= proposalCounter,
            "Proposal does not exist"
        );

        require(proposals[proposalId].active, "Proposal already closed");

        proposals[proposalId].active = false;

        emit ProposalClosed(proposalId);
    }

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
