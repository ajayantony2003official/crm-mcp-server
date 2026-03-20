# MCP Server

This folder is the real MCP tool execution layer.

It does not contain Gemini chat logic.
It only:
- exposes the `/execute` API
- receives `toolName` and `args`
- dispatches the correct MCP tool
- runs CRM API / business logic

Structure:
- `routes/`
  MCP HTTP routes
- `services/`
  execution dispatcher and MCP helper services
- `tools/`
  real executable MCP tools

Important files:
- `server.js`
  starts the MCP server on port `4000`
- `routes/execute.route.js`
  POST `/execute`
- `services/toolDispatcher.js`
  loads and runs the correct tool file
- `tools/*.js`
  actual tool handlers
# crm-mcp-server
