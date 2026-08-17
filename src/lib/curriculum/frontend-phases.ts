// Phase 5: Frontend Architecture
const phase5 = {
  title: "Phase 5: Frontend Architecture",
  description: "Learn module systems, design patterns, state management, and testing to build scalable frontend applications.",
  slug: "phase-5-frontend-architecture",
  topics: [
    {
      title: "Module Systems & Bundlers",
      description: "Understand ES Modules, CommonJS, build tools like Vite and webpack, and how modern bundlers optimize your code.",
      slug: "module-systems-bundlers", difficulty: 3, prerequisites: [],
      concepts: [
        { title: "ES Modules (import/export)", description: "ES Modules are the standard module system for JavaScript. Use 'export' to expose values and 'import' to consume them. Named exports (export function greet() {}) allow multiple exports per file, while default exports (export default class App {}) allow one primary export. Dynamic import() returns a Promise, enabling lazy-loading of modules at runtime for code splitting." },
        { title: "CommonJS vs ESM", description: "CommonJS (require/module.exports) is the legacy Node.js module system — synchronous, dynamic, evaluated at runtime. ESM (import/export) is the modern standard — static, analyzed at compile time, enabling tree shaking. Interop between them can cause issues: ESM can import CJS, but CJS cannot require() ESM without dynamic import(). New projects should always use ESM." },
        { title: "Build Tools & Bundlers", description: "Bundlers (Vite, webpack, Rollup) combine modules into optimized bundles for the browser. Vite uses native ESM in dev for instant HMR (Hot Module Replacement), then Rollup for production builds. Tree shaking eliminates unused exports. Code splitting creates separate chunks loaded on demand. Source maps connect bundled code back to original source for debugging." },
      ],
      examples: [
        {
          title: "ES Module Import/Export Patterns",
          description: "Demonstrating named exports, default exports, re-exports, and dynamic imports",
          starterCode: "// math.js\nexport function add(a, b) {\n  // implement\n}\n\nexport function multiply(a, b) {\n  // implement\n}\n\n// main.js\n// Import add and multiply from math.js\n// Use dynamic import for a heavy module",
          solutionCode: "// math.js\nexport function add(a, b) {\n  return a + b;\n}\n\nexport function multiply(a, b) {\n  return a * b;\n}\n\nexport const PI = 3.14159;\n\n// utils/index.js — barrel re-export\nexport { add, multiply, PI } from './math.js';\n\n// main.js\nimport { add, multiply } from './utils/index.js';\n\nconsole.log(add(2, 3));\nconsole.log(multiply(4, 5));\n\n// Dynamic import for code splitting\nasync function loadChart() {\n  const { renderChart } = await import('./chart.js');\n  renderChart(document.getElementById('chart'));\n}\n\ndocument.getElementById('show-chart')?.addEventListener('click', loadChart);",
        },
        {
          title: "Configuring a Vite Project",
          description: "Setting up a Vite project with path aliases and environment variables",
          starterCode: "// vite.config.js\nimport { defineConfig } from 'vite';\n\nexport default defineConfig({\n  // Add path aliases\n  // Configure build output\n  // Set up environment variables\n});",
          solutionCode: "// vite.config.js\nimport { defineConfig } from 'vite';\nimport path from 'path';\n\nexport default defineConfig({\n  resolve: {\n    alias: {\n      '@': path.resolve(__dirname, 'src'),\n      '@components': path.resolve(__dirname, 'src/components'),\n      '@utils': path.resolve(__dirname, 'src/utils'),\n    },\n  },\n  build: {\n    outDir: 'dist',\n    sourcemap: true,\n    rollupOptions: {\n      output: {\n        manualChunks: {\n          vendor: ['react', 'react-dom'],\n        },\n      },\n    },\n  },\n  server: {\n    port: 3000,\n    open: true,\n  },\n});",
        },
      ],
      exercises: [
        {
          title: "Refactor a Monolithic Script into ES Modules",
          description: "Take a single large file and split it into logical modules with proper imports/exports",
          instructions: "Split the monolithic code into distinct modular exports: validators (validateEmail, validatePassword), api (fetchUser, createUser), and ui (renderUser).",
          starterCode: "// app.js — refactor this into separate modules\nconst API_URL = 'https://api.example.com';\n\nfunction validateEmail(email) {\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n}\n\nfunction validatePassword(pwd) {\n  return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);\n}\n\nasync function fetchUser(id) {\n  const res = await fetch(`${API_URL}/users/${id}`);\n  return res.json();\n}\n\nasync function createUser(data) {\n  const res = await fetch(`${API_URL}/users`, {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(data),\n  });\n  return res.json();\n}\n\nfunction renderUser(user) {\n  const el = document.createElement('div');\n  el.innerHTML = `<h2>${user.name}</h2><p>${user.email}</p>`;\n  document.body.appendChild(el);\n}",
          solutionCode: "// config.js\nexport const API_URL = 'https://api.example.com';\n\n// validators.js\nexport function validateEmail(email) {\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);\n}\n\nexport function validatePassword(pwd) {\n  return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);\n}\n\n// api.js\nimport { API_URL } from './config.js';\n\nexport async function fetchUser(id) {\n  const res = await fetch(`${API_URL}/users/${id}`);\n  if (!res.ok) throw new Error('Failed to fetch user');\n  return res.json();\n}\n\nexport async function createUser(data) {\n  const res = await fetch(`${API_URL}/users`, {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify(data),\n  });\n  if (!res.ok) throw new Error('Failed to create user');\n  return res.json();\n}\n\n// ui.js\nexport function renderUser(user) {\n  const el = document.createElement('div');\n  el.innerHTML = `<h2>${user.name}</h2><p>${user.email}</p>`;\n  return el;\n}",
          testCases: "Each module has a single responsibility; config.js exports API_URL; validators.js exports validateEmail and validatePassword; api.js imports from config and exports fetchUser and createUser; ui.js exports renderUser",
          hints: "Use named exports for utility functions and avoid side effects at the module root level. Export async functions cleanly with proper error checking.",
          difficulty: 3,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "Module Dependency Graph", config: "{\"nodes\":[{\"id\":\"main\",\"label\":\"main.js\\n(entry)\",\"x\":250,\"y\":20},{\"id\":\"api\",\"label\":\"api.js\",\"x\":120,\"y\":120},{\"id\":\"ui\",\"label\":\"ui.js\",\"x\":380,\"y\":120},{\"id\":\"config\",\"label\":\"config.js\",\"x\":60,\"y\":220},{\"id\":\"validators\",\"label\":\"validators.js\",\"x\":250,\"y\":220},{\"id\":\"bundle\",\"label\":\"Bundler\\n(Vite/webpack)\",\"x\":250,\"y\":330},{\"id\":\"output\",\"label\":\"dist/bundle.js\",\"x\":250,\"y\":420}],\"edges\":[{\"from\":\"main\",\"to\":\"api\",\"label\":\"import\"},{\"from\":\"main\",\"to\":\"ui\",\"label\":\"import\"},{\"from\":\"api\",\"to\":\"config\",\"label\":\"import\"},{\"from\":\"main\",\"to\":\"validators\",\"label\":\"import\"},{\"from\":\"bundle\",\"to\":\"output\",\"label\":\"optimize\"}]}" },
      ],
      lesson: { title: "Module Systems and Build Tools", content: "ES Modules use import/export for static, analyzable dependencies. Named exports allow multiple per file, default exports allow one. Dynamic import() enables lazy loading. Bundlers like Vite and webpack combine modules into optimized bundles with tree shaking (removing unused code) and code splitting (loading chunks on demand). Use path aliases for clean imports.", explanation: "This lesson covers JavaScript module systems, bundlers, and modern build tooling." },
    },
    {
      title: "Design Patterns in JavaScript",
      description: "Learn essential software design patterns adapted for JavaScript: creational, structural, and behavioral patterns.",
      slug: "design-patterns-js", difficulty: 3, prerequisites: [0],
      concepts: [
        { title: "Creational Patterns", description: "Creational patterns manage object creation. The Factory pattern uses a function to create objects without exposing instantiation logic — useful for creating different UI components from a config. The Singleton pattern ensures only one instance exists, often used for global stores or configuration managers. The Builder pattern constructs complex objects step-by-step with chained methods." },
        { title: "Structural Patterns", description: "Structural patterns organize code into manageable pieces. The Module/Revealing Module pattern uses closures or ES Modules to encapsulate private state and expose a public API. The Decorator pattern wraps objects to add behavior without modifying them — like adding logging to a fetch function. The Facade pattern provides a simplified interface to a complex subsystem." },
        { title: "Behavioral Patterns", description: "Behavioral patterns define how objects communicate. The Observer/PubSub pattern lets objects subscribe to events and get notified when something changes — the foundation of reactive UI. The Strategy pattern encapsulates interchangeable algorithms (sorting strategies, validation rules). The Iterator pattern provides sequential access to elements without exposing the underlying structure." },
      ],
      examples: [
        {
          title: "Observer Pattern for Event System",
          description: "Building a publish-subscribe event system from scratch",
          starterCode: "class EventEmitter {\n  constructor() {\n    // Store event listeners\n  }\n\n  on(event, callback) {\n    // Subscribe to event\n  }\n\n  off(event, callback) {\n    // Unsubscribe from event\n  }\n\n  emit(event, ...args) {\n    // Notify all subscribers\n  }\n}",
          solutionCode: "class EventEmitter {\n  constructor() {\n    this.listeners = new Map();\n  }\n\n  on(event, callback) {\n    if (!this.listeners.has(event)) {\n      this.listeners.set(event, new Set());\n    }\n    this.listeners.get(event).add(callback);\n    return () => this.off(event, callback);\n  }\n\n  off(event, callback) {\n    this.listeners.get(event)?.delete(callback);\n  }\n\n  emit(event, ...args) {\n    this.listeners.get(event)?.forEach(cb => cb(...args));\n  }\n\n  once(event, callback) {\n    const wrapper = (...args) => {\n      callback(...args);\n      this.off(event, wrapper);\n    };\n    this.on(event, wrapper);\n  }\n}\n\nconst bus = new EventEmitter();\nbus.on('user:login', (user) => console.log(`Welcome, ${user.name}`));\nbus.emit('user:login', { name: 'Alice' });",
        },
        {
          title: "Factory Pattern for UI Components",
          description: "Creating different UI components from a configuration object using the Factory pattern",
          starterCode: "function createComponent(config) {\n  // Return different component types based on config.type\n  // Types: 'button', 'input', 'select'\n}",
          solutionCode: "function createComponent(config) {\n  const creators = {\n    button: ({ label, onClick, variant = 'primary' }) => {\n      const btn = document.createElement('button');\n      btn.textContent = label;\n      btn.className = `btn btn-${variant}`;\n      if (onClick) btn.addEventListener('click', onClick);\n      return btn;\n    },\n    input: ({ name, placeholder, type = 'text', onChange }) => {\n      const input = document.createElement('input');\n      input.name = name;\n      input.type = type;\n      input.placeholder = placeholder || '';\n      if (onChange) input.addEventListener('input', onChange);\n      return input;\n    },\n    select: ({ name, options = [], onChange }) => {\n      const select = document.createElement('select');\n      select.name = name;\n      options.forEach(opt => {\n        const option = document.createElement('option');\n        option.value = opt.value;\n        option.textContent = opt.label;\n        select.appendChild(option);\n      });\n      if (onChange) select.addEventListener('change', onChange);\n      return select;\n    },\n  };\n\n  const creator = creators[config.type];\n  if (!creator) throw new Error(`Unknown component: ${config.type}`);\n  return creator(config);\n}",
        },
      ],
      exercises: [
        {
          title: "Build a Plugin System Using Strategy Pattern",
          description: "Create a text formatter that supports interchangeable formatting plugins (markdown, HTML, plain text)",
          instructions: "Implement TextFormatter with register(name, strategy) and format(text, type, pluginName) methods using interchangeable strategies.",
          starterCode: "class TextFormatter {\n  constructor() {\n    this.plugins = {};\n  }\n\n  register(name, plugin) {\n    // Register a formatting strategy\n  }\n\n  format(text, formatType, pluginName) {\n    // Apply the named formatting strategy\n  }\n}",
          solutionCode: "class TextFormatter {\n  constructor() {\n    this.plugins = new Map();\n  }\n\n  register(name, plugin) {\n    this.plugins.set(name, plugin);\n  }\n\n  format(text, formatType, pluginName) {\n    const plugin = this.plugins.get(pluginName);\n    if (!plugin) {\n      throw new Error(`Plugin ${pluginName} not found`);\n    }\n    const fn = plugin[formatType];\n    if (typeof fn !== 'function') {\n      throw new Error(`Format type ${formatType} not supported by ${pluginName}`);\n    }\n    return fn(text);\n  }\n}\n\nconst markdownPlugin = {\n  bold: (t) => `**${t}**`,\n  italic: (t) => `*${t}*`,\n  code: (t) => `\\`${t}\\``,\n};\n\nconst htmlPlugin = {\n  bold: (t) => `<strong>${t}</strong>`,\n  italic: (t) => `<em>${t}</em>`,\n  code: (t) => `<code>${t}</code>`,\n};",
          testCases: "Registering a markdown plugin makes format('hello', 'bold', 'markdown') return '**hello**'; Registering an HTML plugin uses <strong> tags; Unregistered plugin throws error; Multiple plugins can coexist",
          hints: "Use a Map or Object to store registered strategies. Ensure error handling handles missing plugins or unsupported format types gracefully.",
          difficulty: 3,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "Design Pattern Selection Guide", config: "{\"nodes\":[{\"id\":\"problem\",\"label\":\"What problem?\",\"x\":250,\"y\":20},{\"id\":\"create\",\"label\":\"Creating objects?\",\"x\":100,\"y\":110},{\"id\":\"structure\",\"label\":\"Organizing code?\",\"x\":250,\"y\":110},{\"id\":\"behavior\",\"label\":\"Communication?\",\"x\":400,\"y\":110},{\"id\":\"factory\",\"label\":\"Factory\",\"x\":40,\"y\":210},{\"id\":\"singleton\",\"label\":\"Singleton\",\"x\":160,\"y\":210},{\"id\":\"module\",\"label\":\"Module\",\"x\":220,\"y\":210},{\"id\":\"decorator\",\"label\":\"Decorator\",\"x\":310,\"y\":210},{\"id\":\"observer\",\"label\":\"Observer\",\"x\":380,\"y\":210},{\"id\":\"strategy\",\"label\":\"Strategy\",\"x\":470,\"y\":210}],\"edges\":[{\"from\":\"problem\",\"to\":\"create\"},{\"from\":\"problem\",\"to\":\"structure\"},{\"from\":\"problem\",\"to\":\"behavior\"},{\"from\":\"create\",\"to\":\"factory\",\"label\":\"many types\"},{\"from\":\"create\",\"to\":\"singleton\",\"label\":\"one instance\"},{\"from\":\"structure\",\"to\":\"module\",\"label\":\"encapsulate\"},{\"from\":\"structure\",\"to\":\"decorator\",\"label\":\"extend\"},{\"from\":\"behavior\",\"to\":\"observer\",\"label\":\"events\"},{\"from\":\"behavior\",\"to\":\"strategy\",\"label\":\"swap algo\"}]}" },
      ],
      lesson: { title: "JavaScript Design Patterns", content: "Design patterns are proven solutions to common problems. Creational: Factory (create objects from config), Singleton (one global instance). Structural: Module (encapsulate with closures/ESM), Decorator (wrap to extend), Facade (simplify complex APIs). Behavioral: Observer/PubSub (event-driven communication), Strategy (swap algorithms), Iterator (sequential access). Patterns improve code organization, reusability, and maintainability.", explanation: "This lesson covers essential design patterns adapted for JavaScript development." },
    },
    {
      title: "State Management Fundamentals",
      description: "Understand application state, the pub/sub pattern, and unidirectional data flow architectures like Flux.",
      slug: "state-management-fundamentals", difficulty: 3, prerequisites: [0, 1],
      concepts: [
        { title: "Application State", description: "Application state is the data that drives your UI. Local state belongs to a single component (form inputs, toggle visibility). Global state is shared across components (user session, theme, shopping cart). Derived state is computed from other state (filtered list from items + filter). Good state design avoids duplication — store the minimum necessary data and derive the rest." },
        { title: "Pub/Sub & Event Emitter", description: "The publish-subscribe pattern decouples components that produce events from those that consume them. Publishers emit events without knowing who listens. Subscribers register interest in specific events. This is the foundation of reactive UI — when state changes, interested components re-render. Custom EventEmitter classes or browser CustomEvents implement this pattern." },
        { title: "Flux Architecture", description: "Flux enforces unidirectional data flow: Views dispatch Actions → Dispatcher routes to Stores → Stores update state and emit change → Views re-render. This one-way flow makes state changes predictable and debuggable. Redux simplified Flux with a single store, pure reducer functions, and immutable state updates. The pattern prevents circular dependencies in state." },
      ],
      examples: [
        {
          title: "Building a Simple Store with Pub/Sub",
          description: "Creating a reactive state store that notifies subscribers on state changes",
          starterCode: "function createStore(initialState) {\n  // Create a store with:\n  // getState() — returns current state\n  // setState(updater) — updates state and notifies\n  // subscribe(listener) — registers a change listener\n}",
          solutionCode: "function createStore(initialState) {\n  let state = initialState;\n  const listeners = new Set();\n\n  return {\n    getState() {\n      return state;\n    },\n    setState(updater) {\n      const newState = typeof updater === 'function'\n        ? updater(state)\n        : { ...state, ...updater };\n      if (newState !== state) {\n        state = newState;\n        listeners.forEach(fn => fn(state));\n      }\n    },\n    subscribe(listener) {\n      listeners.add(listener);\n      return () => listeners.delete(listener);\n    },\n  };\n}\n\nconst store = createStore({ count: 0, user: null });\nconst unsub = store.subscribe(state => console.log('State:', state));\nstore.setState({ count: 1 });\nunsub();",
        },
        {
          title: "Flux-like Unidirectional Data Flow",
          description: "Implementing a Redux-style store with reducers and action dispatching",
          starterCode: "function createReduxStore(reducer, initialState) {\n  // Implement dispatch(action), getState(), subscribe(listener)\n}",
          solutionCode: "function createReduxStore(reducer, initialState) {\n  let state = initialState;\n  const listeners = new Set();\n\n  function dispatch(action) {\n    state = reducer(state, action);\n    listeners.forEach(fn => fn());\n    return action;\n  }\n\n  function getState() {\n    return state;\n  }\n\n  function subscribe(listener) {\n    listeners.add(listener);\n    return () => listeners.delete(listener);\n  }\n\n  dispatch({ type: '@@INIT' });\n  return { dispatch, getState, subscribe };\n}\n\nfunction counterReducer(state = { count: 0 }, action) {\n  switch (action.type) {\n    case 'INCREMENT': return { ...state, count: state.count + 1 };\n    case 'DECREMENT': return { ...state, count: state.count - 1 };\n    case 'SET': return { ...state, count: action.payload };\n    default: return state;\n  }\n}\n\nconst store = createReduxStore(counterReducer, { count: 0 });\nstore.subscribe(() => console.log('Count:', store.getState().count));\nstore.dispatch({ type: 'INCREMENT' });\nstore.dispatch({ type: 'SET', payload: 10 });",
        },
      ],
      exercises: [
        {
          title: "Build a Todo State Manager with Undo/Redo",
          description: "Create a state management system for a todo app that supports adding, toggling, deleting todos, and undo/redo operations",
          instructions: "Implement createTodoStore with past/present/future state stacks, supporting addTodo, toggleTodo, deleteTodo, undo, and redo methods.",
          starterCode: "function createTodoStore() {\n  // State: { todos: [], past: [], future: [] }\n  // Actions: addTodo, toggleTodo, deleteTodo, undo, redo\n}",
          solutionCode: "function createTodoStore() {\n  let state = { todos: [] };\n  let past = [];\n  let future = [];\n  const listeners = new Set();\n\n  function notify() {\n    listeners.forEach(fn => fn(state));\n  }\n\n  function applyMutation(newTodos) {\n    past.push(state.todos);\n    future = [];\n    state = { todos: newTodos };\n    notify();\n  }\n\n  return {\n    getState() { return state; },\n    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },\n    addTodo(text) {\n      applyMutation([...state.todos, { id: Date.now() + Math.random(), text, completed: false }]);\n    },\n    toggleTodo(id) {\n      applyMutation(state.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));\n    },\n    deleteTodo(id) {\n      applyMutation(state.todos.filter(t => t.id !== id));\n    },\n    undo() {\n      if (past.length === 0) return;\n      future.push(state.todos);\n      state = { todos: past.pop() };\n      notify();\n    },\n    redo() {\n      if (future.length === 0) return;\n      past.push(state.todos);\n      state = { todos: future.pop() };\n      notify();\n    },\n  };\n}",
          testCases: "addTodo adds a new todo with id, text, and completed=false; toggleTodo flips completed status; deleteTodo removes by id; undo reverts the last action; redo re-applies the last undone action",
          hints: "Save the previous snapshot in past array before applying mutations. Empty the future stack whenever a new action is performed.",
          difficulty: 3,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "Flux Unidirectional Data Flow", config: "{\"nodes\":[{\"id\":\"view\",\"label\":\"View\\n(UI)\",\"x\":250,\"y\":20},{\"id\":\"action\",\"label\":\"Action\\n(Event)\",\"x\":420,\"y\":120},{\"id\":\"dispatcher\",\"label\":\"Dispatcher\\n(Router)\",\"x\":420,\"y\":220},{\"id\":\"store\",\"label\":\"Store\\n(State)\",\"x\":250,\"y\":320},{\"id\":\"rerender\",\"label\":\"Re-render\\n(Update UI)\",\"x\":80,\"y\":220}],\"edges\":[{\"from\":\"view\",\"to\":\"action\",\"label\":\"user event\"},{\"from\":\"action\",\"to\":\"dispatcher\",\"label\":\"dispatch\"},{\"from\":\"dispatcher\",\"to\":\"store\",\"label\":\"reduce\"},{\"from\":\"store\",\"to\":\"rerender\",\"label\":\"notify\"},{\"from\":\"rerender\",\"to\":\"view\",\"label\":\"update\"}]}" },
      ],
      lesson: { title: "State Management Patterns", content: "Application state drives UI. Local state stays in one component, global state is shared. The pub/sub pattern decouples producers from consumers for reactive updates. Flux/Redux enforces unidirectional flow: View → Action → Dispatcher → Store → View. Immutable state updates (spread operator, never mutate directly) make changes predictable and enable features like undo/redo and time-travel debugging.", explanation: "This lesson covers state management patterns from simple pub/sub to Flux/Redux architecture." },
    },
    {
      title: "Testing Fundamentals",
      description: "Learn unit testing, integration testing, TDD workflow, and how to write reliable tests with Jest/Vitest.",
      slug: "testing-fundamentals", difficulty: 3, prerequisites: [0],
      concepts: [
        { title: "The Testing Pyramid", description: "The testing pyramid defines three levels: Unit tests (fast, isolated, test individual functions — the base), Integration tests (test how modules work together — the middle), End-to-end tests (test full user flows in a browser — the top). Write many unit tests, fewer integration tests, and the fewest E2E tests. Each level trades speed for confidence — unit tests run in milliseconds, E2E tests take seconds." },
        { title: "Writing Good Tests", description: "Follow the AAA pattern: Arrange (set up data/mocks), Act (call the function), Assert (check the result). Each test should verify one behavior. Use descriptive names: 'should return empty array when no items match filter'. Mock external dependencies (APIs, databases) to isolate the unit under test. Never test implementation details — test behavior and outcomes." },
        { title: "TDD Workflow", description: "Test-Driven Development follows red-green-refactor: Red — write a failing test that defines expected behavior. Green — write the minimum code to make it pass. Refactor — improve the code while keeping tests green. TDD ensures every feature has a test, catches regressions early, and drives better API design because you write the consumer (test) before the producer (implementation)." },
      ],
      examples: [
        {
          title: "Unit Testing a Utility Library",
          description: "Writing comprehensive tests for string manipulation functions",
          starterCode: "// string-utils.js\nexport function capitalize(str) {\n  // Capitalize first letter of each word\n}\n\nexport function truncate(str, maxLength) {\n  // Truncate string and add '...' if longer than maxLength\n}\n\n// string-utils.test.js\nimport { describe, it, expect } from 'vitest';\nimport { capitalize, truncate } from './string-utils';",
          solutionCode: "// string-utils.js\nexport function capitalize(str) {\n  if (!str) return '';\n  return str.replace(/\\b\\w/g, char => char.toUpperCase());\n}\n\nexport function truncate(str, maxLength) {\n  if (!str) return '';\n  if (str.length <= maxLength) return str;\n  return str.slice(0, maxLength) + '...';\n}\n\n// string-utils.test.js\nimport { describe, it, expect } from 'vitest';\nimport { capitalize, truncate } from './string-utils';\n\ndescribe('capitalize', () => {\n  it('capitalizes the first letter of each word', () => {\n    expect(capitalize('hello world')).toBe('Hello World');\n  });\n  it('returns empty string for empty input', () => {\n    expect(capitalize('')).toBe('');\n  });\n});\n\ndescribe('truncate', () => {\n  it('returns full string if under maxLength', () => {\n    expect(truncate('hello', 10)).toBe('hello');\n  });\n  it('truncates and adds ellipsis', () => {\n    expect(truncate('hello world', 5)).toBe('hello...');\n  });\n});",
        },
        {
          title: "Testing Async Functions with Mocks",
          description: "Mocking API calls and testing async behavior",
          starterCode: "// user-service.js\nexport async function getUser(id, fetchFn = fetch) {\n  const res = await fetchFn(`/api/users/${id}`);\n  if (!res.ok) throw new Error('User not found');\n  return res.json();\n}",
          solutionCode: "// user-service.js\nexport async function getUser(id, fetchFn = fetch) {\n  const res = await fetchFn(`/api/users/${id}`);\n  if (!res.ok) throw new Error('User not found');\n  return res.json();\n}\n\n// user-service.test.js\nimport { describe, it, expect, vi } from 'vitest';\nimport { getUser } from './user-service';\n\ndescribe('getUser', () => {\n  it('returns user data on success', async () => {\n    const mockUser = { id: 1, name: 'Alice' };\n    const mockFetch = vi.fn().mockResolvedValue({\n      ok: true,\n      json: () => Promise.resolve(mockUser),\n    });\n    const user = await getUser(1, mockFetch);\n    expect(user).toEqual(mockUser);\n    expect(mockFetch).toHaveBeenCalledWith('/api/users/1');\n  });\n});",
        },
      ],
      exercises: [
        {
          title: "TDD a String Utility Library",
          description: "Using Test-Driven Development, build a utility library with: slugify(text), wordCount(text), isPalindrome(text), and camelToKebab(text). Write tests FIRST, then implement.",
          instructions: "Implement slugify, wordCount, isPalindrome, and camelToKebab functions adhering to strict boundary checks and clean formatting.",
          starterCode: "// Follow TDD: write tests first, then implement\nexport function slugify(text) {\n  // Implement after writing tests\n}\n\nexport function wordCount(text) {\n  // Implement after writing tests\n}\n\nexport function isPalindrome(text) {\n  // Implement after writing tests\n}\n\nexport function camelToKebab(text) {\n  // Implement after writing tests\n}",
          solutionCode: "export function slugify(text) {\n  if (!text) return '';\n  return text.toLowerCase().trim().replace(/[^a-z0-9\\s-]/g, '').replace(/[\\s_-]+/g, '-').replace(/^-+|-+$/g, '');\n}\n\nexport function wordCount(text) {\n  if (!text || !text.trim()) return 0;\n  return text.trim().split(/\\s+/).length;\n}\n\nexport function isPalindrome(text) {\n  if (!text) return false;\n  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return clean === clean.split('').reverse().join('');\n}\n\nexport function camelToKebab(text) {\n  if (!text) return '';\n  return text.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();\n}",
          testCases: "slugify converts 'Hello World!' to 'hello-world'; wordCount('one two three') returns 3; isPalindrome('racecar') returns true; camelToKebab('myVariableName') returns 'my-variable-name'",
          hints: "Use regular expressions for slugify and camelToKebab. For isPalindrome, sanitize spaces and punctuation before comparing.",
          difficulty: 3,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "TDD Red-Green-Refactor Cycle", config: "{\"nodes\":[{\"id\":\"red\",\"label\":\"RED\\nWrite failing test\",\"x\":250,\"y\":20},{\"id\":\"green\",\"label\":\"GREEN\\nWrite minimum code\",\"x\":420,\"y\":160},{\"id\":\"refactor\",\"label\":\"REFACTOR\\nImprove code\",\"x\":80,\"y\":160},{\"id\":\"pass\",\"label\":\"All tests pass?\",\"x\":250,\"y\":280}],\"edges\":[{\"from\":\"red\",\"to\":\"green\",\"label\":\"test fails\"},{\"from\":\"green\",\"to\":\"pass\",\"label\":\"run tests\"},{\"from\":\"pass\",\"to\":\"refactor\",\"label\":\"yes\"},{\"from\":\"pass\",\"to\":\"green\",\"label\":\"no\"},{\"from\":\"refactor\",\"to\":\"red\",\"label\":\"next feature\"}]}" },
      ],
      lesson: { title: "Frontend Testing Fundamentals", content: "The testing pyramid: many unit tests, fewer integration tests, few E2E tests. Follow AAA: Arrange-Act-Assert. Mock external dependencies with vi.fn() or jest.fn(). TDD workflow: write a failing test (red), make it pass (green), refactor. Test behavior, not implementation. Use descriptive test names. Code coverage measures which lines are tested but does not guarantee correctness.", explanation: "This lesson covers testing strategies, TDD, and how to write reliable unit and integration tests." },
    },
  ],
};

// Phase 6: React / Frameworks
const phase6 = {
  title: "Phase 6: React / Frameworks",
  description: "Build modern user interfaces with React: components, hooks, routing, and advanced composition patterns.",
  slug: "phase-6-react-frameworks",
  topics: [
    {
      title: "React Fundamentals",
      description: "Learn JSX, functional components, props, and how React renders and updates the UI.",
      slug: "react-fundamentals", difficulty: 3, prerequisites: [],
      concepts: [
        { title: "JSX & Virtual DOM", description: "JSX is a syntax extension that lets you write HTML-like code in JavaScript. It compiles to React.createElement() calls. The Virtual DOM is a lightweight in-memory representation of the real DOM. When state changes, React creates a new Virtual DOM tree, diffs it against the previous one (reconciliation), and applies only the minimal necessary changes to the real DOM — this is what makes React fast." },
        { title: "Components & Props", description: "Components are reusable UI building blocks. Functional components are JavaScript functions that return JSX. Props are read-only inputs passed from parent to child, like function arguments. The special 'children' prop represents nested content. Props flow one way (parent → child), enforcing a predictable data flow. Use conditional rendering with && or ternary operators to show/hide content based on props." },
        { title: "Rendering Lists & Keys", description: "Render arrays using .map() to transform data into JSX elements. Every list item needs a unique 'key' prop so React can efficiently track which items changed, were added, or removed during reconciliation. Never use array index as key if the list can be reordered — use stable IDs. Conditional rendering patterns: &&, ternary, early return, or a mapping object for multiple branches." },
      ],
      examples: [
        {
          title: "Building a Reusable Card Component",
          description: "Creating a flexible Card component with props for different content types",
          starterCode: "function Card({ title, children, variant }) {\n  // Render a card with title, children content\n  // variant can be 'default', 'outlined', 'elevated'\n  // Return JSX\n}",
          solutionCode: "function Card({ title, children, variant = 'default', footer }) {\n  const variants = {\n    default: { border: '1px solid #e2e8f0', boxShadow: 'none' },\n    outlined: { border: '2px solid #3b82f6', boxShadow: 'none' },\n    elevated: { border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },\n  };\n\n  const style = {\n    ...variants[variant],\n    borderRadius: '8px',\n    padding: '1.5rem',\n    backgroundColor: 'white',\n  };\n\n  return (\n    <div style={style}>\n      {title && <h3 style={{ margin: '0 0 1rem 0' }}>{title}</h3>}\n      <div>{children}</div>\n      {footer && <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>{footer}</div>}\n    </div>\n  );\n}",
        },
        {
          title: "Rendering a Filterable List",
          description: "Rendering a list of users with search filtering and conditional display",
          starterCode: "const users = [\n  { id: 1, name: 'Alice', role: 'admin' },\n  { id: 2, name: 'Bob', role: 'user' },\n  { id: 3, name: 'Charlie', role: 'user' },\n];\n\nfunction UserList({ users, filter }) {\n  // Filter users by name and render a list\n  // Show 'No users found' if empty\n}",
          solutionCode: "import { useState } from 'react';\n\nconst users = [\n  { id: 1, name: 'Alice', role: 'admin', active: true },\n  { id: 2, name: 'Bob', role: 'user', active: true },\n  { id: 3, name: 'Charlie', role: 'user', active: false },\n  { id: 4, name: 'Diana', role: 'admin', active: true },\n];\n\nfunction UserList({ users, filter }) {\n  const filtered = users.filter(u =>\n    u.name.toLowerCase().includes(filter.toLowerCase())\n  );\n\n  if (filtered.length === 0) {\n    return <p style={{ color: '#888' }}>No users found</p>;\n  }\n\n  return (\n    <ul style={{ listStyle: 'none', padding: 0 }}>\n      {filtered.map(user => (\n        <li key={user.id} style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>\n          <strong>{user.name}</strong>\n          <span style={{ marginLeft: '0.5rem', color: '#888' }}>{user.role}</span>\n          {user.active && <span style={{ marginLeft: '0.5rem', color: 'green' }}>● Active</span>}\n        </li>\n      ))}\n    </ul>\n  );\n}",
        },
      ],
      exercises: [
        {
          title: "Build a User Profile Card Gallery",
          description: "Create a gallery of user profile cards that can be filtered by role (admin, user, guest). Each card shows name, role, avatar placeholder, and a status badge.",
          instructions: "Create ProfileCard and ProfileGallery components in React with filter buttons for role-based filtering.",
          starterCode: "function ProfileCard({ user }) {\n  // Render a profile card with name, role, avatar circle, and status\n}\n\nfunction ProfileGallery({ users }) {\n  // Render a grid of ProfileCards\n  // Add role filter buttons: All, Admin, User, Guest\n}",
          solutionCode: "import { useState } from 'react';\n\nexport function ProfileCard({ user }) {\n  return (\n    <div className=\"profile-card\" style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>\n      <h3>{user.name}</h3>\n      <p>Role: {user.role}</p>\n      <span className={`status ${user.active ? 'active' : 'inactive'}`}>\n        {user.active ? 'Active' : 'Offline'}\n      </span>\n    </div>\n  );\n}\n\nexport function ProfileGallery({ users = [] }) {\n  const [selectedRole, setSelectedRole] = useState('All');\n  const filtered = selectedRole === 'All' ? users : users.filter(u => u.role.toLowerCase() === selectedRole.toLowerCase());\n\n  return (\n    <div>\n      <div className=\"filters\" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>\n        {['All', 'Admin', 'User', 'Guest'].map(role => (\n          <button key={role} onClick={() => setSelectedRole(role)}>{role}</button>\n        ))}\n      </div>\n      {filtered.length === 0 ? (\n        <p>No users found</p>\n      ) : (\n        <div className=\"grid\" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>\n          {filtered.map(user => <ProfileCard key={user.id} user={user} />)}\n        </div>\n      )}\n    </div>\n  );\n}",
          testCases: "ProfileCard renders user name and role; Gallery renders all users initially; Clicking 'Admin' filter shows only admin users; Clicking 'All' shows all users again",
          hints: "Use useState to store the active filter string. When rendering lists, ensure every item provides a stable key prop like user.id.",
          difficulty: 3,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "React Reconciliation Process", config: "{\"nodes\":[{\"id\":\"state\",\"label\":\"State Changes\",\"x\":250,\"y\":20},{\"id\":\"vdom\",\"label\":\"New Virtual DOM\",\"x\":250,\"y\":100},{\"id\":\"diff\",\"label\":\"Diff Algorithm\",\"x\":250,\"y\":180},{\"id\":\"patch\",\"label\":\"Minimal Patches\",\"x\":250,\"y\":260},{\"id\":\"dom\",\"label\":\"Real DOM Updated\",\"x\":250,\"y\":340}],\"edges\":[{\"from\":\"state\",\"to\":\"vdom\",\"label\":\"re-render\"},{\"from\":\"vdom\",\"to\":\"diff\",\"label\":\"compare\"},{\"from\":\"diff\",\"to\":\"patch\",\"label\":\"compute\"},{\"from\":\"patch\",\"to\":\"dom\",\"label\":\"apply\"}]}" },
      ],
      lesson: { title: "React Fundamentals", content: "React builds UIs from reusable components. JSX compiles to React.createElement(). Functional components receive props (read-only) and return JSX. The Virtual DOM diffs and patches efficiently. Render lists with .map() and unique key props. Conditional rendering: logical && for show/hide, ternary for if/else. Props flow one-way: parent to child. Children prop enables composition.", explanation: "This lesson covers React fundamentals: JSX, components, props, rendering, and the Virtual DOM." },
    },
    {
      title: "React State & Hooks",
      description: "Master React hooks: useState for state management, useEffect for side effects, and advanced hooks for performance.",
      slug: "react-state-hooks", difficulty: 4, prerequisites: [0],
      concepts: [
        { title: "useState & Rendering", description: "useState returns a [value, setter] pair. Calling the setter triggers a re-render with the new value. State updates are batched — multiple setState calls in one event handler result in a single re-render. Always use functional updates (setCount(prev => prev + 1)) when the new state depends on the previous value. Never mutate state directly — always create new objects/arrays." },
        { title: "useEffect & Lifecycle", description: "useEffect runs side effects after render: data fetching, subscriptions, DOM manipulation. The dependency array controls when it re-runs: [] = once on mount, [dep] = when dep changes, no array = every render. Return a cleanup function for subscriptions and timers: return () => clearInterval(id). The cleanup runs before the next effect and on unmount. Avoid infinite loops by including only necessary dependencies." },
        { title: "Advanced Hooks", description: "useRef persists a mutable value across renders without triggering re-renders — perfect for DOM refs and previous-value tracking. useMemo caches expensive computations: useMemo(() => expensiveCalc(data), [data]). useCallback caches function references to prevent unnecessary child re-renders. Custom hooks extract and share stateful logic: function useLocalStorage(key, initial) returns [value, setValue] backed by localStorage." },
      ],
      examples: [
        {
          title: "Debounced Search with Hooks",
          description: "Building a real-time search input with debounce using useState and useEffect",
          starterCode: "function useDebounce(value, delay) {\n  // Return debounced value\n  // Uses useState and useEffect\n}\n\nfunction SearchInput() {\n  // Use useDebounce to delay API calls\n}",
          solutionCode: "import { useState, useEffect } from 'react';\n\nfunction useDebounce(value, delay) {\n  const [debouncedValue, setDebouncedValue] = useState(value);\n\n  useEffect(() => {\n    const timer = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(timer);\n  }, [value, delay]);\n\n  return debouncedValue;\n}\n\nfunction SearchInput() {\n  const [query, setQuery] = useState('');\n  const [results, setResults] = useState([]);\n  const [loading, setLoading] = useState(false);\n  const debouncedQuery = useDebounce(query, 300);\n\n  useEffect(() => {\n    if (!debouncedQuery) { setResults([]); return; }\n    setLoading(true);\n    fetch(`https://api.example.com/search?q=${encodeURIComponent(debouncedQuery)}`)\n      .then(res => res.json())\n      .then(data => { setResults(data); setLoading(false); })\n      .catch(() => setLoading(false));\n  }, [debouncedQuery]);\n\n  return (\n    <div>\n      <input value={query} onChange={e => setQuery(e.target.value)} placeholder=\"Search...\" />\n      {loading && <p>Loading...</p>}\n      <ul>{results.map(r => <li key={r.id}>{r.title}</li>)}</ul>\n    </div>\n  );\n}",
        },
        {
          title: "Custom useLocalStorage Hook",
          description: "Creating a hook that syncs React state with localStorage",
          starterCode: "function useLocalStorage(key, initialValue) {\n  // Read from localStorage on init\n  // Save to localStorage on change\n  // Return [value, setValue] like useState\n}",
          solutionCode: "import { useState, useEffect } from 'react';\n\nfunction useLocalStorage(key, initialValue) {\n  const [value, setValue] = useState(() => {\n    try {\n      const stored = window.localStorage.getItem(key);\n      return stored !== null ? JSON.parse(stored) : initialValue;\n    } catch {\n      return initialValue;\n    }\n  });\n\n  useEffect(() => {\n    try {\n      window.localStorage.setItem(key, JSON.stringify(value));\n    } catch (error) {\n      console.error('Failed to save to localStorage:', error);\n    }\n  }, [key, value]);\n\n  return [value, setValue];\n}",
        },
      ],
      exercises: [
        {
          title: "Build a Multi-Step Form Wizard",
          description: "Create a multi-step form (3 steps: Personal Info, Address, Review) with validation, next/prev navigation, and a progress indicator. Use useState for form data and current step.",
          instructions: "Implement a 3-step wizard with validation, previous/next controls, and state preservation across steps.",
          starterCode: "function FormWizard() {\n  // Step 1: Personal Info (name, email)\n  // Step 2: Address (street, city, zip)\n  // Step 3: Review & Submit\n}",
          solutionCode: "import { useState } from 'react';\n\nexport function FormWizard({ onSubmit }) {\n  const [step, setStep] = useState(1);\n  const [formData, setFormData] = useState({ name: '', email: '', street: '', city: '', zip: '' });\n\n  const update = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));\n  const canGoNext = () => {\n    if (step === 1) return formData.name.trim() && formData.email.trim();\n    if (step === 2) return formData.street.trim() && formData.city.trim() && formData.zip.trim();\n    return true;\n  };\n\n  return (\n    <div className=\"wizard\">\n      <h3>Step {step} of 3</h3>\n      {step === 1 && (\n        <div>\n          <input placeholder=\"Name\" value={formData.name} onChange={e => update('name', e.target.value)} />\n          <input placeholder=\"Email\" value={formData.email} onChange={e => update('email', e.target.value)} />\n        </div>\n      )}\n      {step === 2 && (\n        <div>\n          <input placeholder=\"Street\" value={formData.street} onChange={e => update('street', e.target.value)} />\n          <input placeholder=\"City\" value={formData.city} onChange={e => update('city', e.target.value)} />\n          <input placeholder=\"Zip\" value={formData.zip} onChange={e => update('zip', e.target.value)} />\n        </div>\n      )}\n      {step === 3 && (\n        <div>\n          <h4>Review Details</h4>\n          <p>Name: {formData.name}</p>\n          <p>Email: {formData.email}</p>\n          <p>Address: {formData.street}, {formData.city} {formData.zip}</p>\n        </div>\n      )}\n      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>\n        {step > 1 && <button onClick={() => setStep(s => s - 1)}>Back</button>}\n        {step < 3 ? (\n          <button disabled={!canGoNext()} onClick={() => setStep(s => s + 1)}>Next</button>\n        ) : (\n          <button onClick={() => onSubmit?.(formData)}>Submit</button>\n        )}\n      </div>\n    </div>\n  );\n}",
          testCases: "Step 1 shows name and email fields; Cannot proceed to step 2 without filling required fields; Step 2 shows address fields; Step 3 shows summary; Back button preserves data",
          hints: "Keep all form fields in a single state object to avoid losing intermediate values when switching steps.",
          difficulty: 4,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "React Hook Lifecycle", config: "{\"nodes\":[{\"id\":\"render\",\"label\":\"Component Renders\",\"x\":250,\"y\":20},{\"id\":\"state\",\"label\":\"useState\\n(initialize)\",\"x\":100,\"y\":110},{\"id\":\"jsx\",\"label\":\"Return JSX\",\"x\":400,\"y\":110},{\"id\":\"dom\",\"label\":\"DOM Updated\",\"x\":250,\"y\":200},{\"id\":\"effect\",\"label\":\"useEffect\\n(runs after)\",\"x\":250,\"y\":290},{\"id\":\"update\",\"label\":\"setState Called\",\"x\":250,\"y\":380},{\"id\":\"cleanup\",\"label\":\"Cleanup\\n(prev effect)\",\"x\":80,\"y\":380}],\"edges\":[{\"from\":\"render\",\"to\":\"state\"},{\"from\":\"render\",\"to\":\"jsx\"},{\"from\":\"jsx\",\"to\":\"dom\"},{\"from\":\"dom\",\"to\":\"effect\"},{\"from\":\"effect\",\"to\":\"update\",\"label\":\"triggers\"},{\"from\":\"update\",\"to\":\"cleanup\"},{\"from\":\"cleanup\",\"to\":\"render\",\"label\":\"re-render\"}]}" },
      ],
      lesson: { title: "React Hooks Deep Dive", content: "useState manages component state — setter triggers re-render. useEffect handles side effects (fetch, timers, subscriptions) after render — dependency array controls when it runs. useRef persists values without re-renders. useMemo/useCallback cache computations and functions. Custom hooks extract reusable stateful logic (useDebounce, useLocalStorage). Rules: only call hooks at the top level, only in React functions.", explanation: "This lesson covers React hooks: useState, useEffect, useRef, useMemo, useCallback, and custom hooks." },
    },
    {
      title: "React Router & Data Fetching",
      description: "Implement client-side routing with React Router and master data fetching patterns for SPAs.",
      slug: "react-router-data-fetching", difficulty: 4, prerequisites: [0, 1],
      concepts: [
        { title: "Client-Side Routing", description: "Single-page apps handle navigation in the browser without full page reloads. React Router provides BrowserRouter (wraps app), Routes/Route (define URL-to-component mapping), Link (navigation without reload), useNavigate (programmatic navigation), and useParams (access URL parameters). Nested routes allow shared layout components like headers and sidebars that persist across pages." },
        { title: "Data Fetching Patterns", description: "The standard pattern: useEffect + fetch + loading/error state. Always handle three states: loading (show spinner), success (render data), error (show message). Use AbortController to cancel in-flight requests when the component unmounts or dependencies change — this prevents race conditions and memory leaks. The stale-while-revalidate pattern shows cached data immediately while fetching fresh data in the background." },
        { title: "Server State Management", description: "Server state (remote data) differs from client state (UI state). Libraries like React Query and SWR provide: automatic caching, background refetching, deduplication of identical requests, pagination/infinite scroll support, and optimistic updates (update UI before server confirms). This eliminates boilerplate loading/error state management and keeps the UI in sync with the server." },
      ],
      examples: [
        {
          title: "Multi-Page Routing with Nested Layouts",
          description: "Setting up React Router with a shared layout, nested routes, and dynamic parameters",
          starterCode: "// Set up routes:\n// / — Home page\n// /products — Product list\n// /products/:id — Product detail\n// Shared layout with navbar",
          solutionCode: "import { BrowserRouter, Routes, Route, Link, useParams, Outlet } from 'react-router-dom';\n\nfunction Layout() {\n  return (\n    <div>\n      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#f5f5f5' }}>\n        <Link to=\"/\">Home</Link>\n        <Link to=\"/products\">Products</Link>\n      </nav>\n      <main style={{ padding: '1rem' }}>\n        <Outlet />\n      </main>\n    </div>\n  );\n}\n\nfunction Home() { return <h1>Welcome Home</h1>; }\n\nfunction ProductList() {\n  const products = [{ id: 1, name: 'Widget' }, { id: 2, name: 'Gadget' }];\n  return (\n    <div>\n      <h1>Products</h1>\n      <ul>{products.map(p => <li key={p.id}><Link to={`/products/${p.id}`}>{p.name}</Link></li>)}</ul>\n    </div>\n  );\n}\n\nfunction ProductDetail() {\n  const { id } = useParams();\n  return <h1>Product #{id}</h1>;\n}\n\nfunction App() {\n  return (\n    <BrowserRouter>\n      <Routes>\n        <Route path=\"/\" element={<Layout />}>\n          <Route index element={<Home />} />\n          <Route path=\"products\" element={<ProductList />} />\n          <Route path=\"products/:id\" element={<ProductDetail />} />\n          <Route path=\"*\" element={<h1>404 Not Found</h1>} />\n        </Route>\n      </Routes>\n    </BrowserRouter>\n  );\n}",
        },
        {
          title: "Data Fetching Hook with Loading/Error",
          description: "Building a reusable useFetch hook with proper error handling and abort support",
          starterCode: "function useFetch(url) {\n  // Return { data, loading, error }\n  // Handle abort on unmount\n}",
          solutionCode: "import { useState, useEffect } from 'react';\n\nfunction useFetch(url) {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState(null);\n\n  useEffect(() => {\n    const controller = new AbortController();\n    setLoading(true);\n    setError(null);\n\n    fetch(url, { signal: controller.signal })\n      .then(res => {\n        if (!res.ok) throw new Error(`HTTP ${res.status}`);\n        return res.json();\n      })\n      .then(data => { setData(data); setLoading(false); })\n      .catch(err => {\n        if (err.name !== 'AbortError') {\n          setError(err.message);\n          setLoading(false);\n        }\n      });\n\n    return () => controller.abort();\n  }, [url]);\n\n  return { data, loading, error };\n}",
        },
      ],
      exercises: [
        {
          title: "Build a Paginated Product Catalog",
          description: "Create a product catalog with search input, category filter via URL params, pagination, and product detail pages using React Router",
          instructions: "Build ProductCatalog component parsing search and category query params via URLSearchParams, handling loading and pagination.",
          starterCode: "// Routes:\n// /products?search=x&category=y&page=1 — catalog\n// /products/:id — product detail",
          solutionCode: "import { useState, useEffect } from 'react';\n\nexport function ProductCatalog({ fetchProducts }) {\n  const [products, setProducts] = useState([]);\n  const [loading, setLoading] = useState(true);\n  const [page, setPage] = useState(1);\n  const [search, setSearch] = useState('');\n\n  useEffect(() => {\n    let active = true;\n    setLoading(true);\n    fetchProducts({ page, search }).then(data => {\n      if (active) {\n        setProducts(data.items || []);\n        setLoading(false);\n      }\n    });\n    return () => { active = false; };\n  }, [page, search, fetchProducts]);\n\n  return (\n    <div>\n      <input placeholder=\"Search...\" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />\n      {loading ? <p>Loading products...</p> : (\n        <ul>{products.map(p => <li key={p.id}>{p.name} - ${p.price}</li>)}</ul>\n      )}\n      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>\n        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>\n        <span>Page {page}</span>\n        <button onClick={() => setPage(p => p + 1)}>Next</button>\n      </div>\n    </div>\n  );\n}",
          testCases: "Product grid renders products from API; Search input filters products; Pagination changes page state; Loading state shown during fetch",
          hints: "Use an active flag or AbortController cleanup in useEffect to prevent setting state on unmounted components.",
          difficulty: 4,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "SPA Routing vs Server Routing", config: "{\"nodes\":[{\"id\":\"click\",\"label\":\"User clicks link\",\"x\":250,\"y\":20},{\"id\":\"spa\",\"label\":\"SPA (React Router)\",\"x\":100,\"y\":110},{\"id\":\"server\",\"label\":\"Traditional\",\"x\":400,\"y\":110},{\"id\":\"history\",\"label\":\"Update URL\\n(History API)\",\"x\":100,\"y\":200},{\"id\":\"full\",\"label\":\"Full page\\nrequest\",\"x\":400,\"y\":200},{\"id\":\"render\",\"label\":\"Swap component\\n(instant)\",\"x\":100,\"y\":290},{\"id\":\"reload\",\"label\":\"Download HTML\\n(slow)\",\"x\":400,\"y\":290}],\"edges\":[{\"from\":\"click\",\"to\":\"spa\",\"label\":\"Link\"},{\"from\":\"click\",\"to\":\"server\",\"label\":\"<a href>\"},{\"from\":\"spa\",\"to\":\"history\"},{\"from\":\"server\",\"to\":\"full\"},{\"from\":\"history\",\"to\":\"render\"},{\"from\":\"full\",\"to\":\"reload\"}]}" },
      ],
      lesson: { title: "React Router and Data Fetching", content: "React Router provides client-side routing: BrowserRouter, Routes, Route, Link, useParams, useNavigate. Nested routes with Outlet share layouts. Data fetching: useEffect + fetch + loading/error state. Use AbortController to cancel requests on unmount. Server state libraries (React Query, SWR) add caching, deduplication, background refetching, and optimistic updates — eliminating manual loading/error state management.", explanation: "This lesson covers client-side routing with React Router and data fetching patterns for SPAs." },
    },
    {
      title: "Component Architecture",
      description: "Master advanced React patterns: composition, Context API, compound components, and custom hooks.",
      slug: "component-architecture", difficulty: 4, prerequisites: [0, 1],
      concepts: [
        { title: "Composition Patterns", description: "Composition is React's primary reuse mechanism. The children prop enables wrapping: <Card><Content /></Card>. The slot pattern passes components as props: <Layout header={<Nav />} sidebar={<Menu />} />. Compound components (like <Select><Option /></Select>) share implicit state through Context. Render props pass a function as children for maximum flexibility: <DataFetcher>{data => <List items={data} />}</DataFetcher>." },
        { title: "State Lifting & Context", description: "When siblings need shared state, lift it to the nearest common parent. Excessive lifting causes prop drilling — passing props through many intermediate components. React Context solves this: createContext() creates a context, Provider wraps a subtree with a value, and useContext() consumes it anywhere in that subtree. Use Context for truly global concerns (theme, auth, locale) — not for all state." },
        { title: "Custom Hooks for Separation of Concerns", description: "Custom hooks extract stateful logic into reusable functions. Name them with 'use' prefix: useAuth(), useForm(), useMediaQuery(). They replace Higher-Order Components (HOCs) and render props with a simpler API. Compose multiple hooks in a component to separate concerns: const auth = useAuth(); const form = useForm(); const theme = useTheme(). Each hook encapsulates its own state and effects." },
      ],
      examples: [
        {
          title: "Compound Tabs Component",
          description: "Building a Tabs component where Tab and TabPanel share state through Context",
          starterCode: "// Usage:\n// <Tabs defaultTab=\"tab1\">\n//   <TabList>\n//     <Tab id=\"tab1\">Tab 1</Tab>\n//     <Tab id=\"tab2\">Tab 2</Tab>\n//   </TabList>\n//   <TabPanel id=\"tab1\">Content 1</TabPanel>\n//   <TabPanel id=\"tab2\">Content 2</TabPanel>\n// </Tabs>",
          solutionCode: "import { createContext, useContext, useState } from 'react';\n\nconst TabsContext = createContext(null);\n\nfunction Tabs({ defaultTab, children }) {\n  const [activeTab, setActiveTab] = useState(defaultTab);\n  return (\n    <TabsContext.Provider value={{ activeTab, setActiveTab }}>\n      <div>{children}</div>\n    </TabsContext.Provider>\n  );\n}\n\nfunction TabList({ children }) {\n  return <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0' }}>{children}</div>;\n}\n\nfunction Tab({ id, children }) {\n  const { activeTab, setActiveTab } = useContext(TabsContext);\n  const isActive = activeTab === id;\n  return (\n    <button\n      onClick={() => setActiveTab(id)}\n      style={{\n        padding: '0.75rem 1.5rem', border: 'none', cursor: 'pointer',\n        background: 'none', borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',\n        color: isActive ? '#3b82f6' : '#64748b', fontWeight: isActive ? 600 : 400,\n      }}\n    >{children}</button>\n  );\n}\n\nfunction TabPanel({ id, children }) {\n  const { activeTab } = useContext(TabsContext);\n  if (activeTab !== id) return null;\n  return <div style={{ padding: '1rem' }}>{children}</div>;\n}",
        },
        {
          title: "Theme System with Context API",
          description: "Creating a theme provider that enables dark/light mode switching across the app",
          starterCode: "// Create a ThemeProvider with useContext\n// Provide theme values and a toggle function\n// Any component can access theme without prop drilling",
          solutionCode: "import { createContext, useContext, useState, useMemo } from 'react';\n\nconst themes = {\n  light: { bg: '#ffffff', text: '#1a1a2e', primary: '#3b82f6', surface: '#f1f5f9' },\n  dark: { bg: '#1a1a2e', text: '#e2e8f0', primary: '#60a5fa', surface: '#2d2d44' },\n};\n\nconst ThemeContext = createContext(null);\n\nfunction ThemeProvider({ children }) {\n  const [mode, setMode] = useState('light');\n  const value = useMemo(() => ({\n    theme: themes[mode],\n    mode,\n    toggleTheme: () => setMode(m => m === 'light' ? 'dark' : 'light'),\n  }), [mode]);\n\n  return (\n    <ThemeContext.Provider value={value}>\n      <div style={{ background: value.theme.bg, color: value.theme.text, minHeight: '100vh' }}>\n        {children}\n      </div>\n    </ThemeContext.Provider>\n  );\n}\n\nfunction useTheme() {\n  const context = useContext(ThemeContext);\n  if (!context) throw new Error('useTheme must be used within ThemeProvider');\n  return context;\n}",
        },
      ],
      exercises: [
        {
          title: "Build a Reusable Data Table with Compound Components",
          description: "Create a DataTable with sortable columns, text filtering, and pagination using compound component pattern: <DataTable data={items}><Column field='name' sortable /><Column field='email' /><Filter /><Pagination pageSize={10} /></DataTable>",
          instructions: "Implement DataTable, Column, and TableBody compound components sharing sorting and selection state through React Context.",
          starterCode: "function DataTable({ data, children }) {\n  // Share table state via Context\n}\n\nfunction Column({ field, header, sortable }) {\n  // Render column header (clickable if sortable)\n}",
          solutionCode: "import { createContext, useContext, useState, useMemo } from 'react';\n\nconst DataTableContext = createContext(null);\n\nexport function DataTable({ data = [], children }) {\n  const [sortField, setSortField] = useState(null);\n  const [sortAsc, setSortAsc] = useState(true);\n\n  const sortedData = useMemo(() => {\n    if (!sortField) return data;\n    return [...data].sort((a, b) => {\n      const valA = a[sortField];\n      const valB = b[sortField];\n      if (valA < valB) return sortAsc ? -1 : 1;\n      if (valA > valB) return sortAsc ? 1 : -1;\n      return 0;\n    });\n  }, [data, sortField, sortAsc]);\n\n  const toggleSort = (field) => {\n    if (sortField === field) setSortAsc(prev => !prev);\n    else { setSortField(field); setSortAsc(true); }\n  };\n\n  return (\n    <DataTableContext.Provider value={{ data: sortedData, sortField, sortAsc, toggleSort }}>\n      <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>\n    </DataTableContext.Provider>\n  );\n}\n\nexport function ColumnHeader({ field, label, sortable }) {\n  const { sortField, sortAsc, toggleSort } = useContext(DataTableContext);\n  return (\n    <th onClick={() => sortable && toggleSort(field)} style={{ cursor: sortable ? 'pointer' : 'default', padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>\n      {label} {sortable && (sortField === field ? (sortAsc ? '▲' : '▼') : '↕')}\n    </th>\n  );\n}\n\nexport function TableBody({ renderRow }) {\n  const { data } = useContext(DataTableContext);\n  return <tbody>{data.map((item, idx) => <tr key={item.id || idx}>{renderRow(item)}</tr>)}</tbody>;\n}",
          testCases: "Table renders all data rows; Clicking sortable column header toggles asc/desc sort; Context provider shares sorted state seamlessly",
          hints: "Use useMemo on sortedData so sorting only recalculates when sortField, sortAsc, or data change.",
          difficulty: 4,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "Component Composition Patterns", config: "{\"nodes\":[{\"id\":\"need\",\"label\":\"Reuse need?\",\"x\":250,\"y\":20},{\"id\":\"ui\",\"label\":\"UI structure\",\"x\":100,\"y\":110},{\"id\":\"logic\",\"label\":\"Stateful logic\",\"x\":250,\"y\":110},{\"id\":\"global\",\"label\":\"Global state\",\"x\":400,\"y\":110},{\"id\":\"children\",\"label\":\"children/slots\",\"x\":40,\"y\":210},{\"id\":\"compound\",\"label\":\"Compound\\nComponents\",\"x\":160,\"y\":210},{\"id\":\"hooks\",\"label\":\"Custom Hooks\",\"x\":250,\"y\":210},{\"id\":\"context\",\"label\":\"Context API\",\"x\":400,\"y\":210}],\"edges\":[{\"from\":\"need\",\"to\":\"ui\"},{\"from\":\"need\",\"to\":\"logic\"},{\"from\":\"need\",\"to\":\"global\"},{\"from\":\"ui\",\"to\":\"children\",\"label\":\"simple\"},{\"from\":\"ui\",\"to\":\"compound\",\"label\":\"complex\"},{\"from\":\"logic\",\"to\":\"hooks\"},{\"from\":\"global\",\"to\":\"context\"}]}" },
      ],
      lesson: { title: "Advanced Component Architecture", content: "Composition over inheritance: use children and slot props for flexible UI. Compound components share state via Context for cohesive APIs (Tabs, Accordion, Select). Lift state to the nearest common parent when siblings need it. Use Context API for truly global state (theme, auth) — not for local state. Custom hooks replace HOCs and render props for reusable logic with a simpler API. Separate concerns: each hook handles one responsibility.", explanation: "This lesson covers advanced React patterns: composition, compound components, Context, and custom hooks." },
    },
  ],
};

// Phase 7: Professional Frontend
const phase7 = {
  title: "Phase 7: Professional Frontend",
  description: "Ship production-ready frontend applications: performance, accessibility, TypeScript, and CI/CD.",
  slug: "phase-7-professional-frontend",
  topics: [
    {
      title: "Performance Optimization",
      description: "Optimize web performance: Core Web Vitals, lazy loading, code splitting, and runtime performance techniques.",
      slug: "performance-optimization", difficulty: 4, prerequisites: [],
      concepts: [
        { title: "Core Web Vitals", description: "Google's Core Web Vitals measure real-user experience: LCP (Largest Contentful Paint) — loading performance, should be under 2.5s. INP (Interaction to Next Paint) — responsiveness, should be under 200ms. CLS (Cumulative Layout Shift) — visual stability, should be under 0.1. These metrics directly affect SEO rankings and user satisfaction. Measure with Lighthouse, Chrome DevTools, or web-vitals library." },
        { title: "Loading Performance", description: "Optimize loading: lazy-load images with loading='lazy' or Intersection Observer. Code-split with dynamic import() to load JS on demand. Resource hints: <link rel='preload'> for critical resources, <link rel='prefetch'> for future navigations, <link rel='preconnect'> for early DNS/TLS. Critical CSS: inline above-the-fold styles. Compress with gzip/brotli. Use modern image formats (WebP, AVIF)." },
        { title: "Runtime Performance", description: "Avoid layout thrashing: batch DOM reads and writes separately. Use requestAnimationFrame for visual updates (60fps). Debounce scroll/resize handlers. Throttle rapid-fire events. Use Web Workers for CPU-intensive tasks (parsing, sorting large datasets) to keep the main thread responsive. In React: React.memo prevents unnecessary re-renders, useMemo caches expensive computations, useCallback stabilizes function references." },
      ],
      examples: [
        {
          title: "Lazy Loading with Intersection Observer",
          description: "Implementing image lazy loading that triggers when elements enter the viewport",
          starterCode: "function lazyLoadImages() {\n  // Select all images with data-src attribute\n  // Create IntersectionObserver\n  // When image enters viewport, set src from data-src\n}",
          solutionCode: "function lazyLoadImages() {\n  const images = document.querySelectorAll('img[data-src]');\n\n  const observer = new IntersectionObserver((entries, obs) => {\n    entries.forEach(entry => {\n      if (entry.isIntersecting) {\n        const img = entry.target;\n        img.src = img.dataset.src;\n        img.removeAttribute('data-src');\n        img.classList.add('loaded');\n        obs.unobserve(img);\n      }\n    });\n  }, { rootMargin: '100px', threshold: 0.1 });\n\n  images.forEach(img => observer.observe(img));\n  return observer;\n}",
        },
        {
          title: "Debounce and Throttle Utilities",
          description: "Building debounce and throttle functions for event handler optimization",
          starterCode: "function debounce(fn, delay) {\n  // Return a debounced version of fn\n}\n\nfunction throttle(fn, limit) {\n  // Return a throttled version of fn\n}",
          solutionCode: "function debounce(fn, delay) {\n  let timer = null;\n  return function (...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n\nfunction throttle(fn, limit) {\n  let inThrottle = false;\n  return function (...args) {\n    if (!inThrottle) {\n      fn.apply(this, args);\n      inThrottle = true;\n      setTimeout(() => { inThrottle = false; }, limit);\n    }\n  };\n}",
        },
      ],
      exercises: [
        {
          title: "Optimize a Slow Dashboard",
          description: "You're given a dashboard component that renders 1000 items, makes redundant API calls, and causes layout shifts. Identify and fix the performance issues using lazy loading, memoization, and proper rendering techniques.",
          instructions: "Optimize the Dashboard component with useMemo for expensive metric computation, debounced search handler, and memoized child item components.",
          starterCode: "// Fix the performance issues in this dashboard component\nfunction Dashboard({ items }) {\n  // Memoize expensive calculations\n  // Debounce search input\n  // Use virtualized/paginated list\n  // Prevent layout shift on images\n}",
          solutionCode: "import { useState, useMemo, memo } from 'react';\n\nconst DashboardItem = memo(function DashboardItem({ item }) {\n  return (\n    <div style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>\n      <h4>{item.title}</h4>\n      <p>Value: {item.value}</p>\n    </div>\n  );\n});\n\nexport function Dashboard({ items = [] }) {\n  const [query, setQuery] = useState('');\n\n  const stats = useMemo(() => {\n    return items.reduce((acc, item) => ({\n      total: acc.total + (item.value || 0),\n      count: acc.count + 1,\n    }), { total: 0, count: 0 });\n  }, [items]);\n\n  const filtered = useMemo(() => {\n    if (!query) return items.slice(0, 50);\n    return items.filter(i => i.title.toLowerCase().includes(query.toLowerCase())).slice(0, 50);\n  }, [items, query]);\n\n  return (\n    <div>\n      <h3>Dashboard (Total: {stats.total}, Count: {stats.count})</h3>\n      <input placeholder=\"Search items...\" value={query} onChange={e => setQuery(e.target.value)} />\n      <div>{filtered.map(item => <DashboardItem key={item.id} item={item} />)}</div>\n    </div>\n  );\n}",
          testCases: "Only visible items render (slice/pagination); Expensive calculation is memoized with useMemo; Search filtering updates smoothly",
          hints: "Wrap individual repeated child components with React.memo and compute summary statistics inside useMemo.",
          difficulty: 4,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "Performance Optimization Checklist", config: "{\"nodes\":[{\"id\":\"audit\",\"label\":\"Run Lighthouse\\nAudit\",\"x\":250,\"y\":20},{\"id\":\"lcp\",\"label\":\"LCP > 2.5s?\",\"x\":100,\"y\":120},{\"id\":\"cls\",\"label\":\"CLS > 0.1?\",\"x\":250,\"y\":120},{\"id\":\"inp\",\"label\":\"INP > 200ms?\",\"x\":400,\"y\":120},{\"id\":\"fixlcp\",\"label\":\"Optimize images\\nCode split\\nPreload\",\"x\":100,\"y\":230},{\"id\":\"fixcls\",\"label\":\"Set dimensions\\nFont display\\nReserve space\",\"x\":250,\"y\":230},{\"id\":\"fixinp\",\"label\":\"Debounce\\nWeb Workers\\nMemoize\",\"x\":400,\"y\":230}],\"edges\":[{\"from\":\"audit\",\"to\":\"lcp\"},{\"from\":\"audit\",\"to\":\"cls\"},{\"from\":\"audit\",\"to\":\"inp\"},{\"from\":\"lcp\",\"to\":\"fixlcp\",\"label\":\"yes\"},{\"from\":\"cls\",\"to\":\"fixcls\",\"label\":\"yes\"},{\"from\":\"inp\",\"to\":\"fixinp\",\"label\":\"yes\"}]}" },
      ],
      lesson: { title: "Web Performance Optimization", content: "Core Web Vitals: LCP (<2.5s), INP (<200ms), CLS (<0.1). Loading: lazy-load images, code-split with dynamic import(), preload critical resources, compress with brotli. Runtime: debounce/throttle event handlers, requestAnimationFrame for animations, Web Workers for CPU tasks. React: React.memo, useMemo, useCallback. Measure with Lighthouse, DevTools Performance tab, and web-vitals library.", explanation: "This lesson covers performance optimization: Core Web Vitals, loading strategies, and runtime techniques." },
    },
    {
      title: "Accessibility (a11y)",
      description: "Build accessible web applications: WCAG guidelines, ARIA attributes, keyboard navigation, and screen reader support.",
      slug: "accessibility-a11y", difficulty: 3, prerequisites: [],
      concepts: [
        { title: "WCAG Principles (POUR)", description: "The Web Content Accessibility Guidelines define four principles: Perceivable (content can be seen/heard — alt text, captions, sufficient contrast), Operable (can be used with keyboard, enough time, no seizure triggers), Understandable (readable, predictable, input assistance), Robust (works with assistive technologies). Level A is minimum, AA is the standard target for most sites, AAA is the highest level." },
        { title: "ARIA & Semantic HTML", description: "Semantic HTML (<nav>, <main>, <button>, <article>) provides built-in accessibility. Only use ARIA when HTML semantics aren't sufficient. Key ARIA attributes: role (defines element purpose), aria-label (accessible name), aria-describedby (links to description), aria-expanded (toggle state), aria-live (announces dynamic changes). First rule of ARIA: don't use ARIA if native HTML works." },
        { title: "Keyboard & Screen Reader Support", description: "All interactive elements must be keyboard-accessible. Tab moves focus forward, Shift+Tab backward. Use tabIndex='0' to make custom elements focusable, tabIndex='-1' for programmatic focus only. Focus traps keep focus inside modals. Skip links let users jump past navigation. Manage focus on route changes in SPAs. Test with screen readers (NVDA, VoiceOver) — they announce roles, names, states." },
      ],
      examples: [
        {
          title: "Accessible Modal Dialog",
          description: "Building a modal that traps focus, handles Escape key, and announces itself to screen readers",
          starterCode: "function Modal({ isOpen, onClose, title, children }) {\n  // Trap focus inside modal\n  // Close on Escape key\n  // Add proper ARIA attributes\n  // Restore focus to trigger on close\n}",
          solutionCode: "import { useEffect, useRef } from 'react';\n\nfunction Modal({ isOpen, onClose, title, children }) {\n  const modalRef = useRef(null);\n  const previousFocus = useRef(null);\n\n  useEffect(() => {\n    if (isOpen) {\n      previousFocus.current = document.activeElement;\n      modalRef.current?.focus();\n    } else if (previousFocus.current) {\n      previousFocus.current.focus();\n    }\n  }, [isOpen]);\n\n  useEffect(() => {\n    if (!isOpen) return;\n    const handleKeyDown = (e) => {\n      if (e.key === 'Escape') { onClose(); return; }\n      if (e.key !== 'Tab') return;\n      const focusable = modalRef.current?.querySelectorAll(\n        'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'\n      );\n      if (!focusable?.length) return;\n      const first = focusable[0];\n      const last = focusable[focusable.length - 1];\n      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }\n      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }\n    };\n    document.addEventListener('keydown', handleKeyDown);\n    return () => document.removeEventListener('keydown', handleKeyDown);\n  }, [isOpen, onClose]);\n\n  if (!isOpen) return null;\n  return (\n    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>\n      <div ref={modalRef} role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"modal-title\" tabIndex={-1}\n        style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '500px', width: '90%' }}\n        onClick={e => e.stopPropagation()}>\n        <h2 id=\"modal-title\">{title}</h2>\n        <div>{children}</div>\n        <button onClick={onClose} style={{ marginTop: '1rem' }}>Close</button>\n      </div>\n    </div>\n  );\n}",
        },
        {
          title: "Accessible Dropdown Menu",
          description: "Creating a dropdown menu with keyboard navigation using arrow keys",
          starterCode: "function Dropdown({ label, items, onSelect }) {\n  // Toggle with Enter/Space\n  // Navigate items with ArrowUp/ArrowDown\n  // Select with Enter\n  // Close with Escape\n}",
          solutionCode: "import { useState, useRef, useEffect } from 'react';\n\nfunction Dropdown({ label, items, onSelect }) {\n  const [isOpen, setIsOpen] = useState(false);\n  const [activeIndex, setActiveIndex] = useState(-1);\n  const buttonRef = useRef(null);\n  const listRef = useRef(null);\n\n  useEffect(() => {\n    if (isOpen && activeIndex >= 0) {\n      listRef.current?.children[activeIndex]?.focus();\n    }\n  }, [isOpen, activeIndex]);\n\n  const handleKeyDown = (e) => {\n    switch (e.key) {\n      case 'ArrowDown': e.preventDefault(); setActiveIndex(i => Math.min(i + 1, items.length - 1)); if (!isOpen) setIsOpen(true); break;\n      case 'ArrowUp': e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); break;\n      case 'Enter': case ' ': e.preventDefault(); if (isOpen && activeIndex >= 0) { onSelect(items[activeIndex]); setIsOpen(false); buttonRef.current?.focus(); } else { setIsOpen(true); setActiveIndex(0); } break;\n      case 'Escape': setIsOpen(false); setActiveIndex(-1); buttonRef.current?.focus(); break;\n    }\n  };\n\n  return (\n    <div style={{ position: 'relative', display: 'inline-block' }} onKeyDown={handleKeyDown}>\n      <button ref={buttonRef} aria-haspopup=\"listbox\" aria-expanded={isOpen} onClick={() => { setIsOpen(!isOpen); setActiveIndex(0); }}>\n        {label} {isOpen ? '▲' : '▼'}\n      </button>\n      {isOpen && (\n        <ul ref={listRef} role=\"listbox\" aria-label={label}\n          style={{ position: 'absolute', top: '100%', left: 0, background: 'white', border: '1px solid #ddd', listStyle: 'none', padding: 0, margin: '4px 0', minWidth: '150px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>\n          {items.map((item, i) => (\n            <li key={item.id || i} role=\"option\" tabIndex={-1} aria-selected={i === activeIndex}\n              onClick={() => { onSelect(item); setIsOpen(false); }}\n              style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: i === activeIndex ? '#e2e8f0' : 'transparent' }}>\n              {item.label}\n            </li>\n          ))}\n        </ul>\n      )}\n    </div>\n  );\n}",
        },
      ],
      exercises: [
        {
          title: "Audit and Fix Accessibility in a Registration Form",
          description: "You're given a registration form with accessibility issues: missing labels, no error announcements, no focus management, and poor contrast. Fix all issues to meet WCAG AA.",
          instructions: "Refactor the form using semantic <form>, linked <label> tags, aria-live status containers, and proper button elements.",
          starterCode: "<!-- Fix the accessibility issues in this form -->\n<div class=\"form\">\n  <div class=\"title\">Sign Up</div>\n  <input type=\"text\" placeholder=\"Name\">\n  <input placeholder=\"Email\">\n  <input placeholder=\"Password\">\n  <div class=\"error\" style=\"color: #ff9999\">Password too short</div>\n  <div onclick=\"submit()\" style=\"background: #aaa; color: #ccc; padding: 10px; cursor: pointer;\">Submit</div>\n</div>",
          solutionCode: "<form className=\"accessible-form\" onSubmit={(e) => { e.preventDefault(); /* handle submit */ }}>\n  <h2>Sign Up</h2>\n  <div className=\"field\">\n    <label htmlFor=\"username\">Full Name:</label>\n    <input id=\"username\" name=\"username\" type=\"text\" required aria-required=\"true\" />\n  </div>\n  <div className=\"field\">\n    <label htmlFor=\"user-email\">Email Address:</label>\n    <input id=\"user-email\" name=\"email\" type=\"email\" required aria-required=\"true\" />\n  </div>\n  <div className=\"field\">\n    <label htmlFor=\"user-pass\">Password:</label>\n    <input id=\"user-pass\" name=\"password\" type=\"password\" required minLength={8} aria-describedby=\"pass-hint\" />\n    <small id=\"pass-hint\">Must be at least 8 characters</small>\n  </div>\n  <div role=\"alert\" aria-live=\"polite\" className=\"error-container\" style={{ color: '#d32f2f' }}></div>\n  <button type=\"submit\" style={{ backgroundColor: '#1976d2', color: '#ffffff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '4px' }}>\n    Submit\n  </button>\n</form>",
          testCases: "Form uses <form> element; Inputs have linked <label> elements; Error announcements use aria-live; Submit uses <button>; Color contrast meets WCAG AA standards",
          hints: "Always connect inputs to their labels using htmlFor and matching input id. Provide aria-live for dynamic error messages.",
          difficulty: 3,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "Accessibility Testing Workflow", config: "{\"nodes\":[{\"id\":\"auto\",\"label\":\"Automated Audit\\n(Lighthouse/axe)\",\"x\":250,\"y\":20},{\"id\":\"keyboard\",\"label\":\"Keyboard Test\\n(Tab through)\",\"x\":250,\"y\":110},{\"id\":\"screen\",\"label\":\"Screen Reader\\n(NVDA/VoiceOver)\",\"x\":250,\"y\":200},{\"id\":\"contrast\",\"label\":\"Color Contrast\\n(4.5:1 ratio)\",\"x\":250,\"y\":290},{\"id\":\"fix\",\"label\":\"Fix Issues\",\"x\":250,\"y\":380}],\"edges\":[{\"from\":\"auto\",\"to\":\"keyboard\",\"label\":\"fix criticals\"},{\"from\":\"keyboard\",\"to\":\"screen\",\"label\":\"all navigable\"},{\"from\":\"screen\",\"to\":\"contrast\",\"label\":\"all announced\"},{\"from\":\"contrast\",\"to\":\"fix\",\"label\":\"all pass\"}]}" },
      ],
      lesson: { title: "Web Accessibility (a11y)", content: "WCAG POUR: Perceivable, Operable, Understandable, Robust. Use semantic HTML first (<button>, <nav>, <main>). ARIA fills gaps: role, aria-label, aria-expanded, aria-live. Keyboard: all interactive elements must be Tab-focusable. Focus traps in modals. Skip links for navigation. Color contrast 4.5:1 minimum. Test with Lighthouse, axe, keyboard navigation, and screen readers.", explanation: "This lesson covers building accessible web applications following WCAG guidelines." },
    },
    {
      title: "TypeScript for Frontend",
      description: "Add type safety to your frontend code: TypeScript fundamentals, generics, and React + TypeScript patterns.",
      slug: "typescript-frontend", difficulty: 4, prerequisites: [],
      concepts: [
        { title: "Type System Basics", description: "TypeScript adds static types to JavaScript. Type annotations: let name: string = 'Alice'. Interfaces define object shapes: interface User { name: string; age: number }. Types support unions (string | number), intersections (A & B), and literals ('success' | 'error'). Type narrowing uses typeof, 'in', and instanceof to refine types in conditionals. The 'unknown' type is a safe alternative to 'any' — it requires type checking before use." },
        { title: "Generics & Utility Types", description: "Generics create reusable typed code: function identity<T>(value: T): T. Built-in utility types transform existing types: Partial<T> (all optional), Required<T> (all required), Pick<T, K> (select properties), Omit<T, K> (exclude properties), Record<K, V> (key-value map), Readonly<T> (immutable). Conditional types: T extends string ? A : B. Mapped types iterate over properties to create new types." },
        { title: "React + TypeScript", description: "Type component props with interfaces: function Button({ label }: { label: string }). Type events: React.ChangeEvent<HTMLInputElement>. Type refs: useRef<HTMLDivElement>(null). Type state: useState<User | null>(null). Type context: createContext<ThemeContextType | null>(null). Generic components: function List<T>({ items, renderItem }: { items: T[]; renderItem: (item: T) => JSX.Element })." },
      ],
      examples: [
        {
          title: "Type-Safe API Client with Generics",
          description: "Building a REST API client where request and response types are enforced at compile time",
          starterCode: "// Create an API client with generics\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\nasync function apiClient<T>(url: string, options?: RequestInit): Promise<T> {\n  // Implement type-safe fetch wrapper\n}",
          solutionCode: "interface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\ninterface CreateUserInput {\n  name: string;\n  email: string;\n}\n\nclass ApiError extends Error {\n  constructor(public status: number, message: string) {\n    super(message);\n    this.name = 'ApiError';\n  }\n}\n\nasync function apiClient<T>(url: string, options?: RequestInit): Promise<T> {\n  const response = await fetch(url, {\n    headers: { 'Content-Type': 'application/json', ...options?.headers },\n    ...options,\n  });\n  if (!response.ok) {\n    throw new ApiError(response.status, `HTTP ${response.status}`);\n  }\n  return response.json() as Promise<T>;\n}\n\nconst api = {\n  getUsers: () => apiClient<User[]>('/api/users'),\n  getUser: (id: number) => apiClient<User>(`/api/users/${id}`),\n  createUser: (data: CreateUserInput) =>\n    apiClient<User>('/api/users', {\n      method: 'POST',\n      body: JSON.stringify(data),\n    }),\n};",
        },
        {
          title: "Type-Safe React Component Library",
          description: "Building typed React components with proper prop types, events, and generics",
          starterCode: "// Create typed components with TypeScript",
          solutionCode: "import { useState, type ChangeEvent, type ReactNode } from 'react';\n\ntype ButtonVariant = 'primary' | 'secondary' | 'danger';\ntype ButtonSize = 'sm' | 'md' | 'lg';\n\ninterface ButtonProps {\n  label: string;\n  variant?: ButtonVariant;\n  size?: ButtonSize;\n  disabled?: boolean;\n  onClick?: () => void;\n  children?: ReactNode;\n}\n\nfunction Button({ label, variant = 'primary', size = 'md', disabled, onClick }: ButtonProps) {\n  const sizes = { sm: '0.25rem 0.5rem', md: '0.5rem 1rem', lg: '0.75rem 1.5rem' };\n  return <button onClick={onClick} disabled={disabled} style={{ padding: sizes[size] }}>{label}</button>;\n}\n\ninterface InputProps {\n  value: string;\n  onChange: (value: string) => void;\n  label: string;\n  error?: string;\n  type?: 'text' | 'email' | 'password';\n}\n\nfunction Input({ value, onChange, label, error, type = 'text' }: InputProps) {\n  const handleChange = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);\n  return (\n    <div>\n      <label>{label}<input type={type} value={value} onChange={handleChange} /></label>\n      {error && <span style={{ color: 'red' }}>{error}</span>}\n    </div>\n  );\n}",
        },
      ],
      exercises: [
        {
          title: "Convert a JavaScript Utility Library to TypeScript",
          description: "Take the provided JavaScript utility functions and add strict TypeScript types. Handle edge cases with union types, generics, and proper narrowing.",
          instructions: "Add generic parameter types to groupBy and pick, ensuring full type preservation without using 'any'.",
          starterCode: "// Convert to TypeScript with strict types:\nfunction groupBy(arr, key) {\n  return arr.reduce((groups, item) => {\n    const val = item[key];\n    groups[val] = groups[val] || [];\n    groups[val].push(item);\n    return groups;\n  }, {});\n}\n\nfunction pick(obj, keys) {\n  return keys.reduce((result, key) => {\n    if (key in obj) result[key] = obj[key];\n    return result;\n  }, {});\n}",
          solutionCode: "export function groupBy<T extends Record<string, any>, K extends keyof T>(\n  arr: T[],\n  key: K\n): Record<string, T[]> {\n  return arr.reduce((groups: Record<string, T[]>, item: T) => {\n    const val = String(item[key]);\n    if (!groups[val]) groups[val] = [];\n    groups[val].push(item);\n    return groups;\n  }, {});\n}\n\nexport function pick<T extends Record<string, any>, K extends keyof T>(\n  obj: T,\n  keys: K[]\n): Pick<T, K> {\n  return keys.reduce((result, key) => {\n    if (key in obj) {\n      result[key] = obj[key];\n    }\n    return result;\n  }, {} as Pick<T, K>);\n}",
          testCases: "groupBy is generic: groupBy<User>(users, 'role') returns Record<string, User[]>; pick uses Pick utility type; No 'any' types used; Strict mode passes",
          hints: "Use generic constraints like T extends Record<string, any> and K extends keyof T to ensure type-safe property indexing.",
          difficulty: 4,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "TypeScript Type Narrowing", config: "{\"nodes\":[{\"id\":\"unknown\",\"label\":\"value: unknown\",\"x\":250,\"y\":20},{\"id\":\"typeof\",\"label\":\"typeof check\",\"x\":100,\"y\":110},{\"id\":\"in\",\"label\":\"'prop' in obj\",\"x\":250,\"y\":110},{\"id\":\"instance\",\"label\":\"instanceof\",\"x\":400,\"y\":110},{\"id\":\"string\",\"label\":\"value: string\",\"x\":40,\"y\":210},{\"id\":\"number\",\"label\":\"value: number\",\"x\":160,\"y\":210},{\"id\":\"obj\",\"label\":\"value: HasProp\",\"x\":250,\"y\":210},{\"id\":\"class\",\"label\":\"value: MyClass\",\"x\":400,\"y\":210}],\"edges\":[{\"from\":\"unknown\",\"to\":\"typeof\"},{\"from\":\"unknown\",\"to\":\"in\"},{\"from\":\"unknown\",\"to\":\"instance\"},{\"from\":\"typeof\",\"to\":\"string\",\"label\":\"'string'\"},{\"from\":\"typeof\",\"to\":\"number\",\"label\":\"'number'\"},{\"from\":\"in\",\"to\":\"obj\",\"label\":\"narrowed\"},{\"from\":\"instance\",\"to\":\"class\",\"label\":\"narrowed\"}]}" },
      ],
      lesson: { title: "TypeScript for Frontend Development", content: "TypeScript adds static types to JavaScript: annotations, interfaces, unions, intersections. Type narrowing refines types with typeof, 'in', instanceof. Generics create reusable typed code: function identity<T>(val: T): T. Utility types: Partial, Required, Pick, Omit, Record, Readonly. React + TS: type props with interfaces, events with React.ChangeEvent, refs with useRef<HTMLElement>. Generic components: <List<T>> for type-safe reusable components.", explanation: "This lesson covers TypeScript fundamentals and React + TypeScript patterns." },
    },
    {
      title: "Frontend CI/CD & Deployment",
      description: "Set up build pipelines, automated testing, deployment workflows, and production monitoring for frontend applications.",
      slug: "frontend-cicd-deployment", difficulty: 3, prerequisites: [],
      concepts: [
        { title: "Build Pipeline", description: "A modern frontend build pipeline automates quality checks: ESLint catches code issues, Prettier enforces formatting, TypeScript verifies types, and automated tests run on every commit. Husky runs pre-commit hooks to catch issues before they reach the repository. GitHub Actions or similar CI services run the full pipeline on pull requests: lint → type-check → test → build. Only merge if the pipeline passes." },
        { title: "Deployment Strategies", description: "Static hosting platforms (Vercel, Netlify, Cloudflare Pages) deploy frontends with zero config: connect a Git repo and every push triggers a build. CDNs (Content Delivery Networks) serve assets from edge locations worldwide for low latency. Environment variables separate dev/staging/prod configs. Preview deployments create a unique URL for every pull request. Rollback by redeploying a previous commit." },
        { title: "Monitoring & Error Tracking", description: "Production monitoring catches issues users encounter. Error boundaries in React catch component crashes and show fallback UI instead of a white screen. Sentry or LogRocket capture errors with stack traces, user context, and replay. Performance monitoring tracks Core Web Vitals in production with real-user data. Feature flags (LaunchDarkly, Unleash) enable gradual rollouts and instant kill switches for problematic features." },
      ],
      examples: [
        {
          title: "GitHub Actions CI Pipeline",
          description: "Setting up an automated CI pipeline for a React/TypeScript project",
          starterCode: "# .github/workflows/ci.yml\n# Create a CI pipeline for lint, test, build",
          solutionCode: "# .github/workflows/ci.yml\nname: CI\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  quality:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: npm\n      - run: npm ci\n      - run: npm run lint\n      - run: npx tsc --noEmit\n      - run: npm test\n      - run: npm run build",
        },
        {
          title: "ESLint + Prettier + Husky Setup",
          description: "Configuring code quality tools with pre-commit hooks",
          starterCode: "// Set up ESLint, Prettier, and Husky pre-commit hooks",
          solutionCode: "// Setup commands:\n// npx husky init\n// echo 'npx lint-staged' > .husky/pre-commit\n\n// package.json scripts:\n// \"scripts\": {\n//   \"lint\": \"eslint src --ext .ts,.tsx\",\n//   \"format\": \"prettier --write src\"\n// }",
        },
      ],
      exercises: [
        {
          title: "Create a Complete CI/CD Pipeline",
          description: "Write a GitHub Actions workflow that: lints, type-checks, tests, builds, deploys to preview on PRs, deploys to production on main, and sends a notification on failure.",
          instructions: "Construct a complete GitHub Actions YAML workflow with multi-job dependencies (lint, test, build, deploy).",
          starterCode: "# .github/workflows/deploy.yml\nname: Deploy\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  # Add: lint, test, build, deploy-preview, deploy-production",
          solutionCode: "name: Deploy Pipeline\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  validate:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 20, cache: 'npm' }\n      - run: npm ci\n      - run: npm run lint\n      - run: npx tsc --noEmit\n      - run: npm test\n      - run: npm run build\n\n  deploy-preview:\n    needs: validate\n    if: github.event_name == 'pull_request'\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo \"Deploying preview environment for PR ${{ github.event.number }}\"\n\n  deploy-production:\n    needs: validate\n    if: github.ref == 'refs/heads/main' && github.event_name == 'push'\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo \"Deploying to production\"\n",
          testCases: "Lint step runs ESLint; Type check step runs tsc --noEmit; Test step runs with coverage; Build step produces dist/ artifacts; PR triggers preview deployment only; Main branch triggers production deployment; Jobs have proper dependencies",
          hints: "Use github.event_name conditions and needs: [validate] to ensure deployments only run after all quality checks succeed.",
          difficulty: 3,
        },
      ],
      visualizations: [
        { type: "flowchart", title: "CI/CD Pipeline Stages", config: "{\"nodes\":[{\"id\":\"push\",\"label\":\"Git Push\",\"x\":250,\"y\":20},{\"id\":\"lint\",\"label\":\"Lint\\n(ESLint)\",\"x\":100,\"y\":110},{\"id\":\"types\",\"label\":\"Type Check\\n(tsc)\",\"x\":250,\"y\":110},{\"id\":\"test\",\"label\":\"Test\\n(Vitest)\",\"x\":400,\"y\":110},{\"id\":\"build\",\"label\":\"Build\\n(Vite)\",\"x\":250,\"y\":210},{\"id\":\"preview\",\"label\":\"Preview Deploy\\n(PR only)\",\"x\":120,\"y\":310},{\"id\":\"prod\",\"label\":\"Production Deploy\\n(main only)\",\"x\":380,\"y\":310}],\"edges\":[{\"from\":\"push\",\"to\":\"lint\"},{\"from\":\"push\",\"to\":\"types\"},{\"from\":\"push\",\"to\":\"test\"},{\"from\":\"lint\",\"to\":\"build\"},{\"from\":\"types\",\"to\":\"build\"},{\"from\":\"test\",\"to\":\"build\"},{\"from\":\"build\",\"to\":\"preview\",\"label\":\"PR\"},{\"from\":\"build\",\"to\":\"prod\",\"label\":\"main\"}]}" },
      ],
      lesson: { title: "Frontend CI/CD and Deployment", content: "Build pipelines automate quality: ESLint (code issues), Prettier (formatting), TypeScript (types), tests (correctness). Husky runs pre-commit hooks via lint-staged. CI (GitHub Actions) runs the full pipeline on every PR: lint → type-check → test → build. Deploy to Vercel/Netlify with Git integration. Preview deployments for PRs, production for main. Monitor with Sentry for errors, web-vitals for performance. Feature flags for safe rollouts.", explanation: "This lesson covers CI/CD pipelines, deployment strategies, and production monitoring for frontend apps." },
    },
  ],
};

export { phase5, phase6, phase7 };
