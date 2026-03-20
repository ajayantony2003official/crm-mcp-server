const path = require("path");

function loadToolHandler(toolName) {
    const handlerPath = path.join(__dirname, "..", "tools", `${toolName}.js`);

    try {
        const handler = require(handlerPath);

        if (typeof handler !== "function") {
            throw new Error(`Tool handler must export a function: ${toolName}`);
        }

        return handler;
    } catch (error) {
        if (error.code === "MODULE_NOT_FOUND" && error.message.includes(handlerPath)) {
            const unknownToolError = new Error(`Unknown tool: ${toolName}`);
            unknownToolError.statusCode = 400;
            throw unknownToolError;
        }

        throw error;
    }
}

async function dispatchToolExecution(toolName, args = {}, context = {}) {
    console.log("Executing tool:", toolName);

    const handler = loadToolHandler(toolName);
    const handlerArgs = {
        ...(args || {})
    };

    if (context.accessToken) {
        handlerArgs.accessToken = context.accessToken;
    }

    return handler(handlerArgs);
}

module.exports = {
    dispatchToolExecution
};
