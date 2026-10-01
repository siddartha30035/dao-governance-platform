const normalizeText = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
};

const getWords = (text) => {
    return new Set(normalizeText(text).split(" "));
};

const calculateSimilarity = (text1, text2) => {
    const words1 = getWords(text1);
    const words2 = getWords(text2);

    if (words1.size === 0 || words2.size === 0) {
        return 0;
    }

    const intersection = new Set(
        [...words1].filter((word) => words2.has(word))
    );

    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
};

const validateProposal = async (newProposal, existingProposals) => {
    let highestSimilarity = 0;
    let similarProposal = null;

    const newText =
        `${newProposal.title} ${newProposal.description}`;

    for (const proposal of existingProposals) {
        const existingText =
            `${proposal.title} ${proposal.description}`;

        const similarity = calculateSimilarity(
            newText,
            existingText
        );

        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            similarProposal = proposal;
        }
    }

    const duplicateThreshold = 0.5;

    if (highestSimilarity >= duplicateThreshold) {
        return {
            status: "rejected",
            similarityScore: Number(highestSimilarity.toFixed(2)),
            reason: `Similar to existing proposal: ${similarProposal.title}`
        };
    }

    return {
        status: "approved",
        similarityScore: Number(highestSimilarity.toFixed(2)),
        reason: "No significant duplicate detected"
    };
};

module.exports = {
    validateProposal,
    calculateSimilarity
};