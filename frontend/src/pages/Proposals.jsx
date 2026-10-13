
export default function Proposals({
  proposals,
  onChainResults,
  walletConnected,
  loading,
  votingId,
  fetchProposals,
  handleCreateOnBlockchain,
  handleVote,
}) {
  return (
    <section className="section-block">
      <h2>Community Proposals</h2>
      <p>Review proposals and their live blockchain results.</p>

      <button
        className="btn btn-secondary"
        onClick={fetchProposals}
        disabled={loading}
      >
        Refresh Proposals
      </button>

      {proposals.length === 0 ? (
        <p>No proposals found.</p>
      ) : (
        <div className="proposal-grid">
          {proposals.map((proposal) => {
            const result = onChainResults[proposal._id];

            const approved =
              proposal.aiValidation?.status === "approved" &&
              proposal.status === "active";

            return (
              <article className="proposal-card" key={proposal._id}>
                <h3>{proposal.title}</h3>
                <p>{proposal.description}</p>
                <p>
                  Validation: {proposal.aiValidation?.status || "unknown"}
                </p>
                <p>
                  Blockchain:{" "}
                  {result?.found ? `Proposal #${result.id}` : "Not deployed"}
                </p>

                {result?.found && (
                  <>
                    <p>YES weight: {result.yesVotes}</p>
                    <p>NO weight: {result.noVotes}</p>
                    <p>Total weight: {result.totalVotingWeight}</p>
                    <p>Status: {result.active ? "Active" : "Closed"}</p>
                  </>
                )}

                {approved && !result?.found && (
                  <button
                    className="btn btn-secondary"
                    disabled={!walletConnected || loading}
                    onClick={() => handleCreateOnBlockchain(proposal)}
                  >
                    Create on Blockchain
                  </button>
                )}

                {approved && result?.found && result.active && (
                  <div className="vote-actions">
                    <button
                      className="btn btn-vote-yes"
                      disabled={!walletConnected || votingId !== null || loading}
                      onClick={() => handleVote(proposal, true)}
                    >
                      {votingId === proposal._id ? "Processing..." : "Vote Yes"}
                    </button>

                    <button
                      className="btn btn-vote-no"
                      disabled={!walletConnected || votingId !== null || loading}
                      onClick={() => handleVote(proposal, false)}
                    >
                      {votingId === proposal._id ? "Processing..." : "Vote No"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
