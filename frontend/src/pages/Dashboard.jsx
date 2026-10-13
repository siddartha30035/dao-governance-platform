
export default function Dashboard({
  walletConnected,
  walletAddress,
  votingWeight,
  proposals,
  setPage,
}) {
  const shortWallet = (address) =>
    address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : "Not connected";

  return (
    <section className="section-block">
      <h2>Welcome to GovernanceDAO</h2>
      <p>
        Manage proposals, participate in voting, and track
        transparent blockchain decisions.
      </p>

      <div className="profile-panel">
        <h3>Governance Overview</h3>
        <p>
          Wallet:{" "}
          {walletConnected
            ? shortWallet(walletAddress)
            : "Not connected"}
        </p>
        <p>Voting weight: {votingWeight}</p>
        <p>Total proposals: {proposals.length}</p>
      </div>

      <button
        className="btn btn-primary"
        onClick={() => setPage("proposals")}
      >
        View Proposals
      </button>{" "}

      <button
        className="btn btn-secondary"
        onClick={() => setPage("create")}
      >
        Create Proposal
      </button>
    </section>
  );
}
