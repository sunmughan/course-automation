// Phase 5: Autonomous AI Agents, Tool Use & Multi-Agent Systems
export const aiPhase5 = {
  title: "Phase 5: Autonomous AI Agents, Tool Use & Multi-Agent Systems",
  description: "Build autonomous decision-making agents: Function Calling, the ReAct (Reason + Act) loop, Plan-and-Solve, Short/Long-Term Memory, Multi-Agent Supervisors, and Sandboxed Code Interpreters.",
  slug: "phase-5-ai-agents-multi-agent-systems",
  topics: [
    {
      title: "Function Calling & Tool Execution Mechanics",
      description: "Master tool schema definitions, tool choice constraints, parallel tool execution, and error-handling in agentic loops.",
      slug: "function-calling-tool-execution",
      difficulty: 3,
      prerequisites: [0, 1, 2, 3],
      concepts: [
        {
          title: "The Function Calling Lifecycle",
          description: "1. Developer registers tools with JSON schemas. 2. User sends query. 3. Model decides to call tool and outputs JSON arguments. 4. Application executes actual function (e.g. database query, API call). 5. Application returns tool response with matching tool_call_id. 6. Model reads result and synthesizes final response.",
        },
        {
          title: "Tool Choice Constraints (auto, required, none, specific)",
          description: "tool_choice='auto' allows the model to decide whether to call a tool or chat. tool_choice='required' forces the model to call at least one tool. tool_choice={'type': 'function', 'function': {'name': 'foo'}} forces calling a specific function.",
        },
        {
          title: "Parallel & Batch Tool Calling",
          description: "Modern models can output multiple tool calls in a single completion (e.g., fetching weather for 3 cities at once). The agent runtime should execute them concurrently using asyncio.gather() or Promise.all() to minimize latency.",
        },
      ],
      examples: [
        {
          title: "Full Agent Tool Execution Loop in Python",
          description: "Autonomous loop that executes tool calls, captures outputs, and returns final answer",
          starterCode: `class AgentRuntime:
    def __init__(self, tools_registry):
        self.tools = tools_registry
        
    def run(self, user_query, max_steps=5):
        # Execute tool calls until model returns final text
        pass`,
          solutionCode: `import json

class AgentRuntime:
    def __init__(self, tool_registry):
        self.tools = tool_registry
        self.messages = []
        
    def execute_tool(self, name, args_json):
        fn = self.tools.get(name)
        if not fn:
            return f"Error: Tool '{name}' not found."
        try:
            args = json.loads(args_json) if isinstance(args_json, str) else args_json
            return str(fn(**args))
        except Exception as e:
            return f"Tool Execution Error: {str(e)}"
            
    def run(self, user_query, mock_llm_step, max_steps=5):
        self.messages.append({"role": "user", "content": user_query})
        
        for step in range(max_steps):
            # Model responds with either text or tool_calls
            response = mock_llm_step(self.messages)
            
            if "tool_calls" not in response or not response["tool_calls"]:
                # Final response reached
                return response["content"]
                
            # Process tool calls
            for tool_call in response["tool_calls"]:
                fn_name = tool_call["name"]
                fn_args = tool_call["arguments"]
                call_id = tool_call["id"]
                
                print(f"Step {step+1}: Calling tool '{fn_name}' with args {fn_args}")
                result = self.execute_tool(fn_name, fn_args)
                
                self.messages.append({
                    "role": "tool",
                    "tool_call_id": call_id,
                    "content": result
                })
                
        return "Agent halted: max execution steps reached."

# Demo tools
registry = {
    "get_stock_price": lambda symbol: f"\${symbol.upper()} is currently trading at \$182.50.",
}

# Mock LLM calling tool on step 1, responding on step 2
step_count = 0
def mock_llm(history):
    global step_count
    step_count += 1
    if step_count == 1:
        return {"tool_calls": [{"id": "call_1", "name": "get_stock_price", "arguments": json.dumps({"symbol": "AAPL"})}]}
    return {"content": "Apple (AAPL) is currently priced at \$182.50."}

agent = AgentRuntime(registry)
final_text = agent.run("What is Apple's stock price?", mock_llm)
print("Final Agent Response:", final_text)`,
        },
      ],
      exercises: [
        {
          title: "Build a Tool Error Recovery Handler",
          description: "Write an agent wrapper that catches tool exceptions and feeds error feedback back to the LLM to let it self-correct",
          instructions: "Wrap tool execution so that any TypeError or ValueError returns 'Invalid arguments: {error}. Please correct parameters.' back to the conversation history.",
          starterCode: `def safe_execute_tool(tool_fn, raw_args):
    # Safely parse args and execute; return structured error on failure
    pass`,
          solutionCode: `import json

def safe_execute_tool(tool_fn, raw_args):
    try:
        if isinstance(raw_args, str):
            kwargs = json.loads(raw_args)
        else:
            kwargs = raw_args
        result = tool_fn(**kwargs)
        return {"success": True, "output": str(result)}
    except (TypeError, ValueError, json.JSONDecodeError) as e:
        return {
            "success": False,
            "output": f"Tool Execution Failed: {type(e).__name__} - {str(e)}. Please correct your arguments."
        }

sample_fn = lambda a, b: a / b
print("Success:", safe_execute_tool(sample_fn, '{"a": 10, "b": 2}'))
print("Error feedback:", safe_execute_tool(sample_fn, '{"a": 10, "b": 0}'))`,
          testCases: "Returns success dict on valid execution; Catches zero division and type errors; Returns actionable feedback",
          hints: "Use try/except block around json.loads and tool_fn execution, returning success status and output string.",
          difficulty: 3,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Function Calling & Tool Execution Loop",
          config: JSON.stringify({
            nodes: [
              { id: "user", label: "User Question", x: 80, y: 120 },
              { id: "llm", label: "LLM Reasoning Core\nSelects Tool & Generates JSON", x: 260, y: 120 },
              { id: "exec", label: "Application Tool Runtime\nExecutes API / Database", x: 450, y: 120 },
              { id: "res", label: "Final Synthesized Answer", x: 630, y: 120 },
            ],
            edges: [
              { from: "user", to: "llm", label: "user query + tool schemas" },
              { from: "llm", to: "exec", label: "tool_calls: {name, args}" },
              { from: "exec", to: "llm", label: "role='tool' result" },
              { from: "llm", to: "res", label: "natural language response" },
            ],
            steps: [
              { id: "1", activeNodes: ["user", "llm"], description: "User query submitted alongside tool definition schemas" },
              { id: "2", activeNodes: ["llm", "exec"], description: "LLM produces structured tool invocation arguments, executed by runtime environment" },
              { id: "3", activeNodes: ["exec", "llm", "res"], description: "Tool output returned to model; final response synthesized for user" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Function Calling & Tool Execution Mechanics",
        content: `## Function Calling & Tool Execution

Function Calling bridges LLMs with the real world — granting them the ability to query live databases, call external APIs, and run arbitrary computations.

### 1. The Interaction Protocol
\`\`\`json
// 1. Model Request
{
  "role": "assistant",
  "tool_calls": [{
    "id": "call_9821",
    "type": "function",
    "function": { "name": "query_users_by_role", "arguments": "{\\"role\\": \\"admin\\"}" }
  }]
}

// 2. Application Response
{
  "role": "tool",
  "tool_call_id": "call_9821",
  "content": "[{\\"id\\": 1, \\"name\\": \\"Alice\\"}, {\\"id\\": 2, \\"name\\": \\"Bob\\"}]"
}
\`\`\`

### 2. Best Practices
- **Descriptions are Prompts**: Write verbose, precise docstrings in tool schemas.
- **Fail Gracefully**: Return formatted error strings rather than crashing the loop, allowing the agent to self-correct.`,
        explanation: "Master the protocol and runtime loop for connecting LLMs to external APIs and databases via function calling.",
      },
    },
    {
      title: "Agent Cognitive Architectures: ReAct, Plan-and-Solve & Reflection",
      description: "Implement ReAct (Thought → Action → Observation), Plan-and-Solve, Reflexion, and Self-Correction architectures.",
      slug: "react-plan-and-solve-reflection",
      difficulty: 4,
      prerequisites: [0, 1, 2, 3, 4],
      concepts: [
        {
          title: "The ReAct (Reason + Act) Paradigm",
          description: "Yao et al. introduced ReAct to combine verbal reasoning ('Thought') with tool actions ('Action'). The model outputs a Thought explaining its rationale, calls an Action, receives the Observation, and loops until the problem is solved.",
        },
        {
          title: "Plan-and-Solve Architecture",
          description: "For complex multi-step workflows, ReAct can lose direction. Plan-and-Solve first generates an explicit step-by-step plan (Step 1..K), then executes each sub-task sequentially, updating remaining steps as new information emerges.",
        },
        {
          title: "Reflexion & Self-Correction Loops",
          description: "When an agent fails a task (e.g., test fails or tool errors), Reflexion prompts the agent to analyze its own previous transcript, write a self-critique, and store the lesson in memory before attempting the task again.",
        },
      ],
      examples: [
        {
          title: "ReAct Agent Parser & Step Controller in Python",
          description: "Parsing structured Thought/Action/Observation streams in a ReAct loop",
          starterCode: `import re

class ReActParser:
    def parse_step(self, text):
        # Extract Thought, Action name, and Action Input
        pass`,
          solutionCode: `import re

class ReActParser:
    def parse_step(self, text):
        thought_match = re.search(r"Thought:\\s*(.*?)(?=Action:|$)", text, re.DOTALL | re.IGNORECASE)
        action_match = re.search(r"Action:\\s*([a-zA-Z0-9_]+)", text, re.IGNORECASE)
        action_input_match = re.search(r"Action Input:\\s*(.*?)(?=Observation:|$)", text, re.DOTALL | re.IGNORECASE)
        final_answer_match = re.search(r"Final Answer:\\s*(.*)", text, re.DOTALL | re.IGNORECASE)
        
        if final_answer_match:
            return {"type": "final", "content": final_answer_match.group(1).strip()}
            
        thought = thought_match.group(1).strip() if thought_match else ""
        action = action_match.group(1).strip() if action_match else None
        action_input = action_input_match.group(1).strip() if action_input_match else ""
        
        return {
            "type": "action",
            "thought": thought,
            "action": action,
            "action_input": action_input,
        }

parser = ReActParser()
step_text = """Thought: I need to find the population of Tokyo first before comparing it.
Action: search_web
Action Input: "Tokyo population 2024"
"""
parsed = parser.parse_step(step_text)
print("Parsed ReAct Step:", parsed)`,
        },
      ],
      exercises: [
        {
          title: "Implement Plan-and-Solve Task Decomposition",
          description: "Write a planner that breaks a high-level goal into dependency-ordered sub-tasks",
          instructions: "Create decompose_goal(goal_prompt) returning a structured list of subtasks with unique IDs and dependencies.",
          starterCode: `def decompose_goal(goal_text):
    # Return list of subtask objects
    pass`,
          solutionCode: `def decompose_goal(goal_text):
    # Simulated heuristic plan generator
    if "deploy" in goal_text.lower():
        return [
            {"id": "t1", "task": "Run automated test suite", "depends_on": []},
            {"id": "t2", "task": "Build production Docker container", "depends_on": ["t1"]},
            {"id": "t3", "task": "Deploy container to Kubernetes cluster", "depends_on": ["t2"]},
            {"id": "t4", "task": "Verify health check endpoint", "depends_on": ["t3"]},
        ]
    return [{"id": "t1", "task": f"Analyze and execute {goal_text}", "depends_on": []}]

plan = decompose_goal("Deploy new v2 backend release to production")
print("Generated Execution Plan:")
for task in plan:
    print(f"  [{task['id']}] {task['task']} (Deps: {task['depends_on']})")`,
          testCases: "Tasks have sequential dependencies; Generates subtasks for complex goals; Handles simple tasks gracefully",
          hints: "Return an array of task dictionaries with id, task description, and depends_on array.",
          difficulty: 3,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "ReAct (Reason + Act) Cognitive Cycle",
          config: JSON.stringify({
            nodes: [
              { id: "start", label: "Goal Input", x: 80, y: 120 },
              { id: "thought", label: "Thought\nReason about current state", x: 260, y: 60 },
              { id: "action", label: "Action\nCall tool with arguments", x: 440, y: 60 },
              { id: "obs", label: "Observation\nReceive real tool result", x: 440, y: 180 },
              { id: "final", label: "Final Answer\nGoal Achieved", x: 620, y: 120 },
            ],
            edges: [
              { from: "start", to: "thought", label: "init" },
              { from: "thought", to: "action", label: "select tool" },
              { from: "action", to: "obs", label: "execute" },
              { from: "obs", to: "thought", label: "next reasoning step" },
              { from: "thought", to: "final", label: "conclude" },
            ],
            steps: [
              { id: "1", activeNodes: ["start", "thought"], description: "Agent analyzes goal and generates reasoning step (Thought)" },
              { id: "2", activeNodes: ["thought", "action", "obs"], description: "Action dispatched to external tool; real-world Observation returned" },
              { id: "3", activeNodes: ["obs", "thought", "final"], description: "Observations synthesized until final goal conditions are met" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Agent Cognitive Architectures: ReAct, Plan-and-Solve & Reflection",
        content: `## Agent Cognitive Architectures

### 1. ReAct: Synergizing Reasoning and Acting
\`\`\`
Thought 1: I need to search for the population of France.
Action 1: search("population of France 2024")
Observation 1: France population is approximately 68 million.

Thought 2: Now I need the population of Germany.
Action 2: search("population of Germany 2024")
Observation 2: Germany population is approximately 84 million.

Thought 3: Now I can calculate the difference: 84 - 68 = 16 million.
Final Answer: Germany has 16 million more people than France.
\`\`\`

### 2. Reflexion: Learning from Failure
When an agent fails an assertion, it writes a short critique to its episodic memory (e.g. *"I failed because I assumed the API key was passed in query params instead of headers"*), preventing identical mistakes on the next iteration.`,
        explanation: "Understand the theoretical and practical foundations of ReAct, Plan-and-Solve, and self-reflective agent architectures.",
      },
    },
    {
      title: "Multi-Agent Orchestration: Supervisors, Hierarchies & Swarms",
      description: "Design multi-agent systems: Supervisor-Worker patterns, Hierarchical teams, Swarm handoffs, and CrewAI/AutoGen concepts.",
      slug: "multi-agent-orchestration-supervisors-swarms",
      difficulty: 4,
      prerequisites: [0, 1, 2, 3, 4, 5],
      concepts: [
        {
          title: "Single Agent Limitations vs Multi-Agent Teams",
          description: "Single agents suffer from context clutter, tool confusion when presented with 30+ tools, and conflicting personas. Multi-agent systems assign narrow, specialized roles (e.g., Researcher, Coder, Reviewer, Tester) with clean interfaces.",
        },
        {
          title: "The Supervisor / Router Pattern",
          description: "A centralized Supervisor agent evaluates the user prompt and routes sub-tasks to specialized subagents. Once workers complete their sub-tasks, the supervisor aggregates results and decides the next step.",
        },
        {
          title: "Agent Handoffs & Swarm Networks",
          description: "In decentralized Swarms (like OpenAI Swarm), agents hand off control directly to peer agents (e.g. Triage Agent transfers conversation to Billing Agent) without needing a central coordinator.",
        },
      ],
      examples: [
        {
          title: "Multi-Agent Supervisor Routing System in Python",
          description: "A supervisor agent that dynamically routes user requests to specialized worker agents",
          starterCode: `class MultiAgentSupervisor:
    def __init__(self, agents):
        self.agents = agents
        
    def route_and_execute(self, user_request):
        # Determine best agent and delegate execution
        pass`,
          solutionCode: `class SpecialistAgent:
    def __init__(self, name, specialty):
        self.name = name
        self.specialty = specialty
        
    def execute(self, task):
        return f"[{self.name}] Completed: {task}"

class MultiAgentSupervisor:
    def __init__(self):
        self.workers = {
            "researcher": SpecialistAgent("WebResearcher", "Gathers facts and data"),
            "coder": SpecialistAgent("SoftwareEngineer", "Writes Python & JS code"),
            "reviewer": SpecialistAgent("CodeReviewer", "Audits code for bugs and security"),
        }
        
    def classify_task(self, query):
        q = query.lower()
        if "code" in q or "function" in q or "build" in q:
            return "coder"
        elif "review" in q or "security" in q or "audit" in q:
            return "reviewer"
        return "researcher"
        
    def dispatch(self, user_request):
        agent_key = self.classify_task(user_request)
        worker = self.workers[agent_key]
        print(f"Supervisor routing request to: {worker.name} (specialty: {worker.specialty})")
        return worker.execute(user_request)

supervisor = MultiAgentSupervisor()
print(supervisor.dispatch("Write a Python function for binary search"))
print(supervisor.dispatch("Find the latest quarterly earnings of Nvidia"))`,
        },
      ],
      exercises: [
        {
          title: "Build an Agent Handoff Controller",
          description: "Write an agent handoff function that transfers conversation state between specialized agents",
          instructions: "Create transfer_context(from_agent, to_agent, shared_state, handoff_reason) returning updated active agent state.",
          starterCode: `def transfer_context(current_agent, target_agent, state, reason):
    # Log handoff and update active agent in state
    pass`,
          solutionCode: `def transfer_context(current_agent, target_agent, state, reason):
    history = state.get("handoff_log", [])
    history.append({
        "from": current_agent,
        "to": target_agent,
        "reason": reason,
    })
    state["active_agent"] = target_agent
    state["handoff_log"] = history
    return state

state = {"user_id": "u123", "active_agent": "triage"}
state = transfer_context("triage", "billing_specialist", state, "User inquired about invoice refund")
print("Handoff State:", state)`,
          testCases: "Updates active_agent in state; Appends audit entry to handoff_log; Preserves existing state properties",
          hints: "Set state['active_agent'] = target_agent and append a handoff log entry with from, to, and reason.",
          difficulty: 3,
        },
      ],
      visualizations: [
        {
          type: "flow-animation",
          title: "Multi-Agent Supervisor & Worker Hierarchy",
          config: JSON.stringify({
            nodes: [
              { id: "user", label: "User Task Request", x: 80, y: 120 },
              { id: "sup", label: "Supervisor Agent\nOrchestrator & Router", x: 260, y: 120 },
              { id: "w1", label: "Research Agent\nWeb & Doc Search", x: 460, y: 40 },
              { id: "w2", label: "Coding Agent\nCode Generation", x: 460, y: 120 },
              { id: "w3", label: "Review Agent\nSecurity & Testing", x: 460, y: 200 },
              { id: "out", label: "Synthesized Deliverable", x: 650, y: 120 },
            ],
            edges: [
              { from: "user", to: "sup", label: "input" },
              { from: "sup", to: "w1", label: "delegate research" },
              { from: "sup", to: "w2", label: "delegate coding" },
              { from: "sup", to: "w3", label: "delegate review" },
              { from: "w1", to: "sup", label: "findings" },
              { from: "w2", to: "sup", label: "code" },
              { from: "w3", to: "sup", label: "audit" },
              { from: "sup", to: "out", label: "final response" },
            ],
            steps: [
              { id: "1", activeNodes: ["user", "sup"], description: "Supervisor decomposes complex prompt and plans specialized sub-tasks" },
              { id: "2", activeNodes: ["sup", "w1", "w2", "w3"], description: "Sub-tasks distributed to specialized domain agents in parallel" },
              { id: "3", activeNodes: ["w1", "w2", "w3", "sup", "out"], description: "Specialist outputs aggregated by supervisor into unified high-quality deliverable" },
            ],
          }),
        },
      ],
      lesson: {
        title: "Multi-Agent Orchestration: Supervisors, Hierarchies & Swarms",
        content: `## Multi-Agent Systems Architecture

### 1. Why Multi-Agent Systems?
- **Separation of Concerns**: Each agent has a focused prompt and a minimal set of tools.
- **Context Isolation**: Tool outputs from one agent don't pollute the prompt window of another.
- **Parallel Execution**: Multiple specialists can work on independent sub-tasks simultaneously.

### 2. Major Multi-Agent Topologies
1. **Supervisor Pattern**: Central coordinator manages state and delegates to specialized workers.
2. **Sequential Pipeline**: Output of Agent A becomes input to Agent B (e.g. Writer → Editor → Publisher).
3. **Swarm / Peer-to-Peer**: Agents directly invoke handoff functions to transfer session ownership.`,
        explanation: "Master the architectures and routing protocols for orchestrating collaborative multi-agent teams.",
      },
    },
  ],
};
