const { expect } = require("chai");

describe("DAOGovernance", function () {
    let dao;
    let owner;
    let voter;

    beforeEach(async function () {
        [owner, voter] = await ethers.getSigners();

        const DAOGovernance =
            await ethers.getContractFactory("DAOGovernance");

        dao = await DAOGovernance.deploy();
    });

    it("should create a proposal", async function () {
        await dao.createProposal(
            "Improve DAO Participation",
            "Increase rewards for active DAO members."
        );

        const proposal = await dao.proposals(1);

        expect(proposal.id).to.equal(1);
        expect(proposal.title).to.equal(
            "Improve DAO Participation"
        );
        expect(proposal.proposer).to.equal(owner.address);
        expect(proposal.active).to.equal(true);
    });

    it("should allow a voter to cast a weighted vote", async function () {
        await dao.createProposal(
            "Improve DAO Participation",
            "Increase rewards for active DAO members."
        );

        await dao.connect(voter).castVote(
            1,
            true,
            100
        );

        const result = await dao.getProposalResult(1);

        expect(result.yesVotes).to.equal(100);
        expect(result.noVotes).to.equal(0);
        expect(result.totalVotingWeight).to.equal(100);
    });

    it("should prevent the same wallet from voting twice", async function () {
        await dao.createProposal(
            "Improve DAO Participation",
            "Increase rewards for active DAO members."
        );

        await dao.connect(voter).castVote(
            1,
            true,
            100
        );

        await expect(
            dao.connect(voter).castVote(
                1,
                false,
                50
            )
        ).to.be.revertedWith("Already voted");
    });
});