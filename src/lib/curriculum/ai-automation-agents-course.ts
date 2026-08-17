export const aiAutomationAgentsCourse = {
  "title": "AI in Automation, MCP Protocol & Autonomous Agents",
  "description": "Mastering n8n workflow automation, Model Context Protocol (MCP), Autonomous Agent architectures (Hermes Agent, OpenClaw), LangChain/LangGraph, and LLM Tool Calling.",
  "slug": "ai-automation-mcp-autonomous-agents",
  "stream": "datascience",
  "imageUrl": "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1200&q=80",
  "order": 2,
  "modules": [
    {
      "title": "Phase 1: n8n Workflow Automation & AI Pipelines",
      "description": "Building low-code and code-driven AI automation workflows with n8n, Webhooks, API triggers, and Vector memory.",
      "slug": "phase-1-n8n-workflow-automation",
      "topics": [
        {
          "title": "n8n Workflow Automation Engine",
          "description": "Setting up self-hosted n8n, connecting Webhooks, HTTP Request nodes, LLM AI Agents, and automating business processes.",
          "slug": "n8n-workflow-automation-engine",
          "difficulty": 3,
          "prerequisites": [],
          "concepts": [
            {
              "title": "n8n Node & Flow Architecture",
              "description": "Trigger nodes, Transform nodes, Branching logic, and Error workflows."
            },
            {
              "title": "AI Agent Node & Memory in n8n",
              "description": "Connecting OpenAI/Claude models with Redis memory and external tool nodes in n8n."
            }
          ],
          "examples": [
            {
              "title": "n8n Custom Webhook Handler",
              "description": "Processing incoming webhook payload",
              "starterCode": "// n8n Code Node (JavaScript)\nconst items = $input.all();\nreturn items.map(item => ({\n  json: {\n    processed: true,\n    user: item.json.email,\n    timestamp: new Date().toISOString()\n  }\n}));",
              "solutionCode": "// n8n Code Node (JavaScript)\nconst items = $input.all();\nreturn items.map(item => ({\n  json: {\n    processed: true,\n    user: item.json.email,\n    timestamp: new Date().toISOString()\n  }\n}));"
            }
          ],
          "exercises": [
            {
              "title": "Write n8n Transform Node",
              "description": "Transform data",
              "starterCode": "return $input.all();",
              "solutionCode": "return $input.all();",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "n8n Flow",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "n8n Workflow Automation Engine",
            "content": "n8n allows automated data movement and AI reasoning across hundreds of apps.",
            "explanation": "n8n is the leading open-source automation platform."
          }
        }
      ]
    },
    {
      "title": "Phase 2: Model Context Protocol (MCP) & Agentic Standards",
      "description": "Understanding Anthropic Model Context Protocol (MCP), MCP Servers, Resources, Prompts, Tools, and Client integration.",
      "slug": "phase-2-mcp-model-context-protocol",
      "topics": [
        {
          "title": "Model Context Protocol (MCP) Architecture",
          "description": "Building custom MCP servers in TypeScript/Python, registering tools, reading resources, and connecting LLMs to local system tools.",
          "slug": "model-context-protocol-mcp-architecture",
          "difficulty": 4,
          "prerequisites": [],
          "concepts": [
            {
              "title": "MCP Client-Server Protocol",
              "description": "JSON-RPC 2.0 transport over stdio and SSE (Server-Sent Events)."
            },
            {
              "title": "MCP Tools vs REST APIs",
              "description": "How MCP provides standardized type-safe schema discovery for LLM agent execution."
            }
          ],
          "examples": [
            {
              "title": "TypeScript MCP Server Tool Registration",
              "description": "Creating an MCP Server with Tool definitions",
              "starterCode": "import { Server } from '@modelcontextprotocol/sdk/server/index.js';\nimport { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';\n\nconst server = new Server({ name: 'my-mcp-server', version: '1.0.0' }, { capabilities: { tools: {} } });\n\nserver.setRequestHandler('tools/list', async () => ({\n  tools: [{\n    name: 'fetch_user',\n    description: 'Fetches user details by ID',\n    inputSchema: { type: 'object', properties: { id: { type: 'string' } } }\n  }]\n}));\n\nconst transport = new StdioServerTransport();\nawait server.connect(transport);",
              "solutionCode": "import { Server } from '@modelcontextprotocol/sdk/server/index.js';\nimport { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';\n\nconst server = new Server({ name: 'my-mcp-server', version: '1.0.0' }, { capabilities: { tools: {} } });\n\nserver.setRequestHandler('tools/list', async () => ({\n  tools: [{\n    name: 'fetch_user',\n    description: 'Fetches user details by ID',\n    inputSchema: { type: 'object', properties: { id: { type: 'string' } } }\n  }]\n}));\n\nconst transport = new StdioServerTransport();\nawait server.connect(transport);"
            }
          ],
          "exercises": [
            {
              "title": "Create MCP Tool",
              "description": "Define MCP tool",
              "starterCode": "server.setRequestHandler('tools/list')",
              "solutionCode": "server.setRequestHandler('tools/list')",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "MCP Architecture",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "Model Context Protocol (MCP) Architecture",
            "content": "MCP is the universal open standard for connecting AI models to external tools.",
            "explanation": "MCP standardizes tool calling across all major AI frameworks."
          }
        }
      ]
    },
    {
      "title": "Phase 3: Hermes Agent, OpenClaw & Autonomous Multi-Agent Systems",
      "description": "Designing autonomous agents that reason, plan, self-correct, use tools, and collaborate in swarms.",
      "slug": "phase-3-autonomous-agent-architectures",
      "topics": [
        {
          "title": "Hermes Agent & Autonomous Task Execution",
          "description": "Architecting autonomous agents with ReAct (Reason + Act), LangGraph state machines, memory reflection, and tool execution loops.",
          "slug": "hermes-agent-autonomous-execution",
          "difficulty": 4,
          "prerequisites": [],
          "concepts": [
            {
              "title": "ReAct Reasoning Loop",
              "description": "Thought \u2794 Action \u2794 Observation \u2794 Reflection cycle for multi-step goals."
            },
            {
              "title": "Human-in-the-Loop & Error Recovery",
              "description": "Asking user clarification when confidence is low and gracefully recovering from tool failures."
            }
          ],
          "examples": [
            {
              "title": "ReAct Agent Loop Implementation",
              "description": "Agent loop in TypeScript",
              "starterCode": "async function runAgentLoop(goal, tools) {\n  let state = { goal, steps: [], completed: false };\n  while (!state.completed && state.steps.length < 10) {\n    const nextAction = await planNextStep(state);\n    if (nextAction.type === 'finish') {\n      state.completed = true;\n      break;\n    }\n    const result = await executeTool(nextAction.tool, nextAction.args);\n    state.steps.push({ action: nextAction, observation: result });\n  }\n  return state;\n}",
              "solutionCode": "async function runAgentLoop(goal, tools) {\n  let state = { goal, steps: [], completed: false };\n  while (!state.completed && state.steps.length < 10) {\n    const nextAction = await planNextStep(state);\n    if (nextAction.type === 'finish') {\n      state.completed = true;\n      break;\n    }\n    const result = await executeTool(nextAction.tool, nextAction.args);\n    state.steps.push({ action: nextAction, observation: result });\n  }\n  return state;\n}"
            }
          ],
          "exercises": [
            {
              "title": "Build ReAct Loop",
              "description": "Agent loop",
              "starterCode": "function runAgent() {}",
              "solutionCode": "function runAgent() {}",
              "testCases": "true"
            }
          ],
          "visualizations": [
            {
              "type": "flow-animation",
              "title": "Agent Loop",
              "config": "{}"
            }
          ],
          "lesson": {
            "title": "Hermes Agent & Autonomous Task Execution",
            "content": "Autonomous agents execute multi-step plans without human hand-holding.",
            "explanation": "Agentic systems represent the future of software engineering."
          }
        }
      ]
    }
  ]
};
