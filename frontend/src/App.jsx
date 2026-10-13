
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { BrowserProvider, Contract } from "ethers";
import {
  DAO_CONTRACT_ADDRESS,
  DAO_CONTRACT_ABI,
} from "./contracts/daoContract";

const API = "http://localhost:5000/api";

function App() {
  const [proposals, setProposals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [votingId, setVotingId] = useState(null);
  const [message, setMessage] = useState("");

  const votingWeight = profile
    ? Number(profile.tokenBalance || 0) +
      Number(profile.reputation || 0) +
      Number(profile.participation || 0) +
      Number(profile.contribution || 0)
    : 0;

  // Load proposals from the backend
  const fetchProposals = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/proposals`);
      setProposals(response.data);
    } catch (error) {
      console.error("Failed to load proposals:", error);
      setMessage(
        "Could not load proposals. Check whether the backend is running."
      );
    }
  }, []);

  // Load the profile for the selected wallet
  const fetchProfile = useCallback(async (address) => {
    if (!address) {
      setProfile(null);
      return;
    }

    try {
      const response = await axios.get(`${API}/profile/${address}`);
      setProfile(response.data);
    } catch (error) {
      console.error("Failed to load profile:", error);
      setProfile(null);
    }
  }, []);

  // Update the app whenever a wallet is selected
  const applyWalletAccount = useCallback(
    async (address) => {
      if (!address) {
        setWalletAddress("");
        setWalletConnected(false);
        setProfile(null);
        setMessage("No wallet account is connected.");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== 31337) {
        setWalletAddress("");
        setWalletConnected(false);
        setProfile(null);
        setMessage(
          "Please switch MetaMask to Hardhat Local (chain ID 31337)."
        );
        return;
      }

      setWalletAddress(address);
      setWalletConnected(true);
      setProfile(null);

      try {
        await axios.post(`${API}/users`, {
          walletAddress: address,
        });

        await fetchProfile(address);

        setMessage(
          `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`
        );
      } catch (error) {
        console.error("Failed to load wallet profile:", error);
        setMessage(
          "Wallet connected, but its backend profile could not be loaded."
        );
      }
    },
    [fetchProfile]
  );

  // Connect the currently selected MetaMask account
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setMessage("MetaMask is not installed.");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        setMessage("No account was selected in MetaMask.");
        return;
      }

      await applyWalletAccount(accounts[0]);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setMessage(
        error.response?.data?.message ||
          error.shortMessage ||
          error.message ||
          "Wallet connection failed."
      );
    }
  };

  // Ask MetaMask to show its account permission selector
  const changeWallet = async () => {
    try {
      if (!window.ethereum) {
        setMessage("MetaMask is not installed.");
        return;
      }

      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts && accounts.length > 0) {
        await applyWalletAccount(accounts[0]);
      } else {
        setMessage("No account is connected.");
      }
    } catch (error) {
      console.error("Wallet selection:", error);

      // Sync the account even if the permission popup was closed
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts && accounts.length > 0) {
          await applyWalletAccount(accounts[0]);
        } else {
          setMessage(
            "Wallet selection cancelled. Select an account in MetaMask."
          );
        }
      } catch (syncError) {
        console.error("Could not sync wallet:", syncError);
        setMessage("Could not update the selected wallet.");
      }
    }
  };

  // Disconnect this app's wallet state
  const disconnectWallet = () => {
    setWalletAddress("");
    setWalletConnected(false);
    setProfile(null);
    setMessage(
      "Disconnected from this app. Select another MetaMask account and reconnect."
    );
  };

  // Load proposals and listen for MetaMask account/network changes
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      try {
        if (!accounts || accounts.length === 0) {
          setWalletAddress("");
          setWalletConnected(false);
          setProfile(null);
          setMessage("Wallet disconnected. Click Connect MetaMask.");
        } else {
          await applyWalletAccount(accounts[0]);
        }
      } catch (error) {
        console.error("Account change failed:", error);
        setMessage(error.message || "Could not update the wallet.");
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [applyWalletAccount]);

  // Create a contract connected to the currently selected wallet
  const getContract = async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }

    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (Number(network.chainId) !== 31337) {
      throw new Error("Switch MetaMask to Hardhat Local.");
    }

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    if (
      !walletAddress ||
      signerAddress.toLowerCase() !== walletAddress.toLowerCase()
    ) {
      await applyWalletAccount(signerAddress);

      throw new Error(
        "Wallet changed. Your profile was updated. Please click the action again."
      );
    }

    return new Contract(
      DAO_CONTRACT_ADDRESS,
      DAO_CONTRACT_ABI,
      signer
    );
  };

  // Create a proposal
  const handleCreateProposal = async (event) => {
    event.preventDefault();

    if (!title.trim() || !description.trim()) {
      setMessage("Please enter both title and description.");
      return;
    }

    if (!walletConnected) {
      setMessage("Please connect MetaMask first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const contract = await getContract();

      // Validate and save through the backend first
      const response = await axios.post(`${API}/proposals`, {
        title: title.trim(),
        description: description.trim(),
        proposerWallet: walletAddress,
      });

      const proposal = response.data.proposal;
      const validation = proposal?.aiValidation;

      if (validation?.status !== "approved") {
        setMessage(
          `Proposal rejected by AI validation. ${
            validation?.reason || "Similar proposal detected."
          }`
        );

        await fetchProposals();
        return;
      }

      setMessage(
        "Proposal approved. Confirm the transaction in MetaMask."
      );

      const transaction = await contract.createProposal(
        title.trim(),
        description.trim()
      );

      setMessage("Transaction submitted. Waiting for confirmation...");

      await transaction.wait();

      setMessage(
        `Proposal created successfully on blockchain! Transaction: ${transaction.hash}`
      );

      setTitle("");
      setDescription("");

      await fetchProposals();
    } catch (error) {
      console.error("Proposal creation failed:", error);

      setMessage(
        error.code === "ACTION_REJECTED"
          ? "Transaction rejected in MetaMask."
          : error.response?.data?.message ||
              error.reason ||
              error.shortMessage ||
              error.message ||
              "Failed to create proposal."
      );

      await fetchProposals();
    } finally {
      setLoading(false);
    }
  };

  // Find the matching proposal on the blockchain
  const findOnChainProposal = async (proposal, contract) => {
    const count = Number(await contract.proposalCounter());

    for (let id = 1; id <= count; id++) {
      const onChain = await contract.proposals(id);

      if (
        onChain.title.toLowerCase() === proposal.title.toLowerCase() &&
        onChain.description.trim() === proposal.description.trim()
      ) {
        return { id, data: onChain };
      }
    }

    return null;
  };

  // Cast a YES or NO vote
  const handleVote = async (proposal, support) => {
    if (!walletConnected || !walletAddress) {
      setMessage("Please connect MetaMask before voting.");
      return;
    }

    if (votingWeight <= 0) {
      setMessage("Your voting weight must be greater than zero.");
      return;
    }

    setVotingId(proposal._id);
    setMessage("");

    try {
      const contract = await getContract();
      const match = await findOnChainProposal(proposal, contract);

      if (!match) {
        setMessage(
          "This proposal was not found on the current blockchain deployment."
        );
        return;
      }

      if (!match.data.active) {
        setMessage("This proposal is no longer active.");
        return;
      }

      setMessage("Please confirm your vote in MetaMask.");

      const transaction = await contract.castVote(
        match.id,
        support,
        votingWeight
      );

      setMessage(
        "Vote submitted. Waiting for blockchain confirmation..."
      );

      await transaction.wait();

      const result = await contract.getProposalResult(match.id);

      setMessage(
        `Vote recorded successfully! ${
          support ? "YES" : "NO"
        } vote. On-chain totals — YES: ${result[0].toString()}, NO: ${result[1].toString()}, Total voting weight: ${result[2].toString()}.`
      );

      await fetchProfile(walletAddress);
      await fetchProposals();
    } catch (error) {
      console.error("Voting failed:", error);

      setMessage(
        error.code === "ACTION_REJECTED"
          ? "Vote cancelled in MetaMask."
          : error.reason ||
              error.shortMessage ||
              error.message ||
              "Voting failed."
      );
    } finally {
      setVotingId(null);
    }
  };

  const styles = {
    card: {
      border: "1px solid #888",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "15px",
      overflowWrap: "anywhere",
    },
    button: {
      padding: "10px 18px",
      margin: "5px",
      cursor: "pointer",
      borderRadius: "5px",
    },
    input: {
      width: "100%",
      boxSizing: "border-box",
      padding: "10px",
      marginTop: "5px",
      marginBottom: "15px",
    },
  };

  return (
    <div
      style={{
        padding: "30px",
        maxWidth: "1000px",
        margin: "auto",
      }}
    >
      <h1>DAO Governance Platform</h1>

      <button style={styles.button} onClick={connectWallet}>
        {walletConnected
          ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
          : "Connect MetaMask"}
      </button>

      <button style={styles.button} onClick={changeWallet}>
        Change Wallet
      </button>

      {walletConnected && (
        <button style={styles.button} onClick={disconnectWallet}>
          Disconnect App
        </button>
      )}

      <p>
        Blockchain-Based DAO Governance with Reputation-Driven Voting
      </p>

      <hr />

      <h2>My Governance Profile</h2>

      {profile ? (
        <div style={styles.card}>
          <p>
            <strong>Wallet:</strong> {profile.walletAddress}
          </p>
          <p>
            <strong>Token Balance:</strong> {profile.tokenBalance}
          </p>
          <p>
            <strong>Reputation:</strong> {profile.reputation}
          </p>
          <p>
            <strong>Participation:</strong> {profile.participation}
          </p>
          <p>
            <strong>Contribution:</strong> {profile.contribution}
          </p>
          <hr />
          <h3>Voting Weight: {votingWeight}</h3>
        </div>
      ) : (
        <p>Connect MetaMask to load your governance profile.</p>
      )}

      <h2>Create Proposal</h2>

      <form onSubmit={handleCreateProposal}>
        <label>
          <strong>Proposal Title</strong>
        </label>

        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter proposal title"
          style={styles.input}
        />

        <label>
          <strong>Description</strong>
        </label>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Enter proposal description"
          rows={5}
          style={styles.input}
        />

        <button
          type="submit"
          disabled={loading || !walletConnected}
          style={styles.button}
        >
          {loading ? "Processing..." : "Validate & Create Proposal"}
        </button>
      </form>

      {message && (
        <div style={styles.card}>
          <strong>Result:</strong>
          <p>{message}</p>
        </div>
      )}

      <hr style={{ marginTop: "30px" }} />

      <h2>Proposals</h2>

      {proposals.length === 0 && <p>No proposals found.</p>}

      {proposals.map((proposal) => (
        <div key={proposal._id} style={styles.card}>
          <h3>{proposal.title}</h3>

          <p>{proposal.description}</p>

          <p>
            <strong>Proposer:</strong> {proposal.proposerWallet}
          </p>

          <p>
            <strong>AI Validation:</strong>{" "}
            {proposal.aiValidation?.status || "unknown"}
          </p>

          <p>
            <strong>Similarity Score:</strong>{" "}
            {proposal.aiValidation?.similarityScore ?? "N/A"}
          </p>

          <p>
            <strong>Status:</strong> {proposal.status}
          </p>

          <p>
            <strong>YES:</strong> {proposal.yesVotes ?? 0}
          </p>

          <p>
            <strong>NO:</strong> {proposal.noVotes ?? 0}
          </p>

          {proposal.aiValidation?.status === "approved" &&
            proposal.status === "active" && (
              <div>
                <button
                  style={styles.button}
                  disabled={!walletConnected || votingId !== null}
                  onClick={() => handleVote(proposal, true)}
                >
                  {votingId === proposal._id
                    ? "Processing..."
                    : "Vote Yes"}
                </button>

                <button
                  style={styles.button}
                  disabled={!walletConnected || votingId !== null}
                  onClick={() => handleVote(proposal, false)}
                >
                  {votingId === proposal._id
                    ? "Processing..."
                    : "Vote No"}
                </button>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}

export default App;
