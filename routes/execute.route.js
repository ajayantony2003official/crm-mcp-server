const express = require("express");
const { dispatchToolExecution } = require("../services/toolDispatcher");

const router = express.Router();

router.post("/execute", async (req, res) => {
    const { toolName, args = {} } = req.body || {};

    if (!toolName) {
        return res.status(400).json({
            error: "toolName is required"
        });
    }

    try {
        const result = await dispatchToolExecution(toolName, args, {
            accessToken: req.get("x-access-token") || process.env.ACCESS_TOKEN || null
        });

        return res.json(result);
    } catch (error) {
        console.error("MCP execution failed:", error);

        return res.status(error.statusCode || 500).json({
            error: error.message || "Tool execution failed"
        });
    }
});

module.exports = router;
