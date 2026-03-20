require("dotenv").config();
const executeRoute = require("./routes/execute.route");

const express = require("express");
const app = express();
const PORT = Number(process.env.MCP_PORT || 4000);

app.use(express.json({ limit: "2mb" }));
app.use("/", executeRoute);

if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`MCP server running on http://0.0.0.0:${PORT}`);
    });
}

module.exports = app;
