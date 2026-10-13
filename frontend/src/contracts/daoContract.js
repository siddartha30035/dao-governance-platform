export const DAO_CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const DAO_CONTRACT_ABI = [
  "function createProposal(string title, string description)",
  "function proposalCounter() view returns (uint256)",
  "function castVote(uint256 proposalId, bool support, uint256 votingWeight)",
  "function closeProposal(uint256 proposalId)",
  "function getProposalResult(uint256 proposalId) view returns (uint256 yesVotes, uint256 noVotes, uint256 totalVotingWeight, bool active)",
  "function proposals(uint256) view returns (uint256 id, string title, string description, address proposer, uint256 yesVotes, uint256 noVotes, uint256 totalVotingWeight, bool active)"
];