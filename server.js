require("dotenv").config();
const executeRoute = require("./routes/execute.route");
const { connectDB } = require("./utils/db");
const { startReminderWorker } = require("./services/reminderWorker");

const express = require("express");
const app = express();
const PORT = Number(process.env.MCP_PORT || 4000);

app.use(express.json({ limit: "2mb" }));
app.use("/", executeRoute);

async function startServer() {
    await connectDB();
    startReminderWorker();

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`MCP server running on http://0.0.0.0:${PORT}`);
    });
}

if (require.main === module) {
    startServer().catch((error) => {
        console.error("Failed to start MCP server:", error.message);
        process.exit(1);
    });
}

module.exports = app;
