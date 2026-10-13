import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import Proposals from "./pages/Proposals";
import { BrowserProvider, Contract } from "ethers";
import {
  DAO_CONTRACT_ADDRESS,
  DAO_CONTRACT_ABI,
} from "./contracts/daoContract";
import "./App.css";

const API = "http://localhost:5000/api";

function App() {
  const [proposals, setProposals] = useState([]);
  const [page, setPage] = useState("dashboard");
  const [onChainResults, setOnChainResults] = useState({});
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

  // Get a read-only contract for blockchain queries.
  const getReadOnlyContract = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed.");
    }

    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    if (Number(network.chainId) !== 31337) {
      throw new Error(
        "Please switch MetaMask to Hardhat Local (chain ID 31337)."
      );
    }

    return new Contract(
      DAO_CONTRACT_ADDRESS,
      DAO_CONTRACT_ABI,
      provider
    );
  }, []);

  // Find a proposal on-chain by title and description.
  const findOnChainProposal = async (proposal, contract) => {
    const count = Number(await contract.proposalCounter());

    for (let id = 1; id <= count; id++) {
      const data = await contract.proposals(id);

      if (
        data.title.trim().toLowerCase() ===
          proposal.title.trim().toLowerCase() &&
        data.description.trim() === proposal.description.trim()
      ) {
        return { id, data };
      }
    }

    return null;
  };

  // Fetch live blockchain voting totals.
  const fetchOnChainResults = useCallback(
    async (proposalList) => {
      if (!window.ethereum || proposalList.length === 0) {
        setOnChainResults({});
        return;
      }

      try {
        const contract = await getReadOnlyContract();
        const count = Number(await contract.proposalCounter());
        const chainProposals = [];

        for (let id = 1; id <= count; id++) {
          const data = await contract.proposals(id);

          chainProposals.push({
            id,
            title: data.title.trim().toLowerCase(),
            description: data.description.trim(),
            yesVotes: data.yesVotes.toString(),
            noVotes: data.noVotes.toString(),
            totalVotingWeight: data.totalVotingWeight.toString(),
            active: data.active,
          });
        }

        const results = {};

        for (const proposal of proposalList) {
          const match = chainProposals.find(
            (item) =>
              item.title === proposal.title.trim().toLowerCase() &&
              item.description === proposal.description.trim()
          );

          results[proposal._id] = match
            ? {
                found: true,
                id: match.id,
                yesVotes: match.yesVotes,
                noVotes: match.noVotes,
                totalVotingWeight: match.totalVotingWeight,
                active: match.active,
              }
            : { found: false };
        }

        setOnChainResults(results);
      } catch (error) {
        console.error("Failed to load blockchain results:", error);
        setMessage(
          "Could not load blockchain results. Check that Hardhat is running and MetaMask is on chain 31337."
        );
      }
    },
    [getReadOnlyContract]
  );

  // Fetch MongoDB proposals and then blockchain results.
  const fetchProposals = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/proposals`);
      const list = response.data;

      setProposals(list);
      await fetchOnChainResults(list);
    } catch (error) {
      console.error("Failed to load proposals:", error);
      setMessage(
        "Could not load proposals. Check whether the backend is running."
      );
    }
  }, [fetchOnChainResults]);

  // Load the selected wallet profile.
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

  // Apply the selected MetaMask account.
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

  // Connect MetaMask.
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
        error.shortMessage || error.message || "Wallet connection failed."
      );
    }
  };

  // Open MetaMask account selection.
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

      if (accounts.length > 0) {
        await applyWalletAccount(accounts[0]);
      } else {
        setMessage("No account is connected.");
      }
    } catch (error) {
      console.error("Wallet selection:", error);

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          await applyWalletAccount(accounts[0]);
        } else {
          setMessage("Select an account in MetaMask.");
        }
      } catch (syncError) {
        console.error(syncError);
        setMessage("Could not update the selected wallet.");
      }
    }
  };

  // Disconnect this app's wallet state.
  const disconnectWallet = () => {
    setWalletAddress("");
    setWalletConnected(false);
    setProfile(null);
    setMessage(
      "Disconnected from this app. Reconnect to continue."
    );
  };

  // Load proposals and listen for wallet changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        console.error(error);
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

  // Get a contract connected to the selected wallet.
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
        "Wallet changed. Your profile was updated. Please try again."
      );
    }

    return new Contract(
      DAO_CONTRACT_ADDRESS,
      DAO_CONTRACT_ABI,
      signer
    );
  };

  // Create a proposal in MongoDB and on-chain.
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

      const response = await axios.post(`${API}/proposals`, {
        title: title.trim(),
        description: description.trim(),
        proposerWallet: walletAddress,
      });

      const proposal = response.data.proposal;

      if (proposal?.aiValidation?.status !== "approved") {
        setMessage(
          `Proposal rejected by validation. ${
            proposal?.aiValidation?.reason ||
            "Similar proposal detected."
          }`
        );
        await fetchProposals();
        return;
      }

      // Prevent creating a duplicate on-chain proposal.
      const existing = await findOnChainProposal(proposal, contract);

      if (existing) {
        setMessage(
          `This proposal already exists on-chain as proposal #${existing.id}.`
        );
        setTitle("");
        setDescription("");
        await fetchProposals();
        return;
      }

      setMessage(
        "Proposal approved. Confirm the blockchain transaction in MetaMask."
      );

      const transaction = await contract.createProposal(
        proposal.title.trim(),
        proposal.description.trim()
      );

      setMessage("Transaction submitted. Waiting for confirmation...");
      await transaction.wait();

      setMessage(
        `Proposal created on blockchain successfully! Transaction: ${transaction.hash}`
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

  // Create an already-approved MongoDB proposal on-chain.
  const handleCreateOnBlockchain = async (proposal) => {
    if (!walletConnected) {
      setMessage("Connect MetaMask before creating a blockchain proposal.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const contract = await getContract();

      const existing = await findOnChainProposal(proposal, contract);

      if (existing) {
        setMessage(
          `This proposal already exists on-chain as proposal #${existing.id}.`
        );
        await fetchProposals();
        return;
      }

      setMessage(
        "Confirm the create-proposal transaction in MetaMask."
      );

      const transaction = await contract.createProposal(
        proposal.title.trim(),
        proposal.description.trim()
      );

      setMessage("Transaction submitted. Waiting for confirmation...");
      await transaction.wait();

      setMessage(
        `Proposal created on blockchain successfully as a new proposal. Transaction: ${transaction.hash}`
      );

      await fetchProposals();
    } catch (error) {
      console.error("Create on blockchain failed:", error);

      setMessage(
        error.code === "ACTION_REJECTED"
          ? "Transaction rejected in MetaMask."
          : error.reason ||
              error.shortMessage ||
              error.message ||
              "Could not create the proposal on blockchain."
      );
    } finally {
      setLoading(false);
    }
  };

  // Cast a YES or NO vote.
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
          "This proposal is not on the current blockchain. Create it on-chain first."
        );
        await fetchProposals();
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

      setMessage("Vote submitted. Waiting for blockchain confirmation...");
      await transaction.wait();

      const result = await contract.getProposalResult(match.id);

      setMessage(
        `Vote recorded successfully! ${
          support ? "YES" : "NO"
        } vote. On-chain totals â€” YES: ${result[0].toString()}, NO: ${result[1].toString()}, Total voting weight: ${result[2].toString()}.`
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


  const shortWallet = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected";

  
return (
  <Layout
    page={page}
    setPage={setPage}
    walletConnected={walletConnected}
    walletAddress={walletAddress}
    connectWallet={connectWallet}
    changeWallet={changeWallet}
    disconnectWallet={disconnectWallet}
  >
    {message && (
      <div className="notice notice-info" role="status">
        <p>{message}</p>
        <button onClick={() => setMessage("")}>Dismiss</button>
      </div>
    )}

    {page === "dashboard" && (
  <Dashboard
    walletConnected={walletConnected}
    walletAddress={walletAddress}
    votingWeight={votingWeight}
    proposals={proposals}
    setPage={setPage}
  />
)}

    {page === "proposals" && (
      <Proposals
        proposals={proposals}
        onChainResults={onChainResults}
        walletConnected={walletConnected}
        loading={loading}
        votingId={votingId}
        fetchProposals={fetchProposals}
        handleCreateOnBlockchain={handleCreateOnBlockchain}
        handleVote={handleVote}
      />
    )}

    {page === "create" && (
      <section className="section-block create-section">
        <h2>Create a Proposal</h2>
        <p>Submit your idea for validation before creating it on-chain.</p>

        <form className="proposal-form" onSubmit={handleCreateProposal}>
          <div className="form-field">
            <label htmlFor="proposal-title">Proposal Title</label>
            <input
              id="proposal-title"
              type="text"
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter proposal title"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="proposal-description">Description</label>
            <textarea
              id="proposal-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              placeholder="Describe your proposal"
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading || !walletConnected}>
            {loading ? "Processing..." : "Validate & Create"}
          </button>
        </form>
      </section>
    )}

    {page === "profile" && (
      <section className="section-block">
        <h2>My Governance Profile</h2>

        {!walletConnected ? (
          <p>Connect MetaMask to view your profile.</p>
        ) : profile ? (
          <div className="profile-panel">
            <p>Wallet: {shortWallet(profile.walletAddress || walletAddress)}</p>
            <p>Token balance: {profile.tokenBalance ?? 0}</p>
            <p>Reputation: {profile.reputation ?? 0}</p>
            <p>Participation: {profile.participation ?? 0}</p>
            <p>Contribution: {profile.contribution ?? 0}</p>
            <h3>Voting weight: {votingWeight}</h3>
          </div>
        ) : (
          <p>Loading your profile, or no profile is available.</p>
        )}
      </section>
    )}
  </Layout>
);

}

export default App;
