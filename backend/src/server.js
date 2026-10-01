const express = require("express");
const userRoutes = require("./routes/userRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const voteRoutes = require("./routes/voteRoutes");
const profileRoutes = require("./routes/profileRoutes");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/profile", profileRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "DAO Governance Platform Backend is running"
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Backend server running on http://localhost:${PORT}`);
    });
};

startServer();