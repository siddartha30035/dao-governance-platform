const calculateVotingWeight = (user) => {
    const tokenWeight = user.tokenBalance || 0;
    const reputationWeight = user.reputation || 0;
    const participationWeight = user.participation || 0;
    const contributionWeight = user.contribution || 0;

    const totalVotingWeight =
        tokenWeight +
        reputationWeight +
        participationWeight +
        contributionWeight;

    return {
        tokenWeight,
        reputationWeight,
        participationWeight,
        contributionWeight,
        totalVotingWeight
    };
};

module.exports = {
    calculateVotingWeight
};