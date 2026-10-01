import { useEffect, useState } from "react";
import axios from "axios";

function App() {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProposals = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/proposals"
            );

            setProposals(response.data);
        } catch (err) {
            console.error(err);
            setError("Failed to load proposals");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, []);

    return (
        <div style={{ padding: "30px" }}>
            <h1>DAO Governance Platform</h1>

            <p>
                Blockchain-Based DAO Governance with
                Reputation-Driven Voting
            </p>

            <hr />

            <h2>Proposals</h2>

            {loading && <p>Loading proposals...</p>}

            {error && <p>{error}</p>}

            {!loading && !error && proposals.length === 0 && (
                <p>No proposals found.</p>
            )}

            {proposals.map((proposal) => (
                <div
                    key={proposal._id}
                    style={{
                        border: "1px solid #ccc",
                        padding: "20px",
                        marginBottom: "15px",
                        borderRadius: "8px"
                    }}
                >
                    <h3>{proposal.title}</h3>

                    <p>{proposal.description}</p>

                    <p>
                        <strong>Proposer:</strong>{" "}
                        {proposal.proposerWallet}
                    </p>

                    <p>
                        <strong>AI Validation:</strong>{" "}
                        {proposal.aiValidation?.status}
                    </p>

                    <p>
                        <strong>Similarity Score:</strong>{" "}
                        {proposal.aiValidation?.similarityScore}
                    </p>

                    <p>
                        <strong>Status:</strong>{" "}
                        {proposal.status}
                    </p>

                    <p>
                        <strong>YES:</strong>{" "}
                        {proposal.yesVotes}
                    </p>

                    <p>
                        <strong>NO:</strong>{" "}
                        {proposal.noVotes}
                    </p>
                </div>
            ))}
        </div>
    );
}

export default App;