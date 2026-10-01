import { useEffect, useState } from "react";
import axios from "axios";

function App() {
    const [proposals, setProposals] = useState([]);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [proposerWallet, setProposerWallet] = useState(
        "0x1234567890abcdef1234567890abcdef12345678"
    );

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const fetchProposals = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/proposals"
            );

            setProposals(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, []);

    const handleCreateProposal = async (event) => {
        event.preventDefault();

        if (!title || !description || !proposerWallet) {
            setMessage("Please fill all fields.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const response = await axios.post(
                "http://localhost:5000/api/proposals",
                {
                    title,
                    description,
                    proposerWallet
                }
            );

            const validation = response.data.proposal.aiValidation;

            if (validation.status === "approved") {
                setMessage(
                    `Proposal approved. Similarity score: ${validation.similarityScore}`
                );
            } else {
                setMessage(
                    `Proposal rejected. ${validation.reason}`
                );
            }

            setTitle("");
            setDescription("");

            await fetchProposals();

        } catch (error) {
            console.error(error);

            setMessage(
                error.response?.data?.message ||
                "Failed to create proposal."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "30px", maxWidth: "1000px", margin: "auto" }}>

            <h1>DAO Governance Platform</h1>

            <p>
                Blockchain-Based DAO Governance with
                Reputation-Driven Voting
            </p>

            <hr />

            <h2>Create Proposal</h2>

            <form onSubmit={handleCreateProposal}>

                <div style={{ marginBottom: "15px" }}>
                    <label>
                        <strong>Proposal Title</strong>
                    </label>

                    <br />

                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter proposal title"
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px"
                        }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label>
                        <strong>Description</strong>
                    </label>

                    <br />

                    <textarea
                        value={description}
                        onChange={(e) =>
                            setDescription(e.target.value)
                        }
                        placeholder="Enter proposal description"
                        rows="5"
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px"
                        }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label>
                        <strong>Proposer Wallet</strong>
                    </label>

                    <br />

                    <input
                        type="text"
                        value={proposerWallet}
                        onChange={(e) =>
                            setProposerWallet(e.target.value)
                        }
                        style={{
                            width: "100%",
                            padding: "10px",
                            marginTop: "5px"
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "10px 20px",
                        cursor: "pointer"
                    }}
                >
                    {loading
                        ? "Validating..."
                        : "Validate & Create Proposal"}
                </button>

            </form>

            {message && (
                <div
                    style={{
                        marginTop: "20px",
                        padding: "15px",
                        border: "1px solid #ccc"
                    }}
                >
                    <strong>Validation Result:</strong>
                    <p>{message}</p>
                </div>
            )}

            <hr style={{ marginTop: "30px" }} />

            <h2>Proposals</h2>

            {proposals.length === 0 && (
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