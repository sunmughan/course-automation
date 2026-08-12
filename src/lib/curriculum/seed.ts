import { prisma } from "@/lib/db";

interface CourseSeed {
  title: string;
  description: string;
  slug: string;
  stream: string;
  modules: {
    title: string;
    description: string;
    slug: string;
    topics: {
      title: string;
      description: string;
      slug: string;
      difficulty: number;
      prerequisites: number[];
      concepts: { title: string; description: string }[];
      examples: { title: string; description: string; starterCode: string; solutionCode: string }[];
      exercises: { title: string; description: string; starterCode: string; testCases: string }[];
      visualizations: { type: string; title: string; config: string }[];
      lesson: {
        title: string;
        content: string;
        explanation: string;
      };
    }[];
  }[];
}

const courses: CourseSeed[] = [
  {
    title: "Frontend Development & Engineering",
    description: "A comprehensive curriculum covering computing fundamentals, HTML, CSS, JavaScript, and browser APIs. Build real-world frontend engineering skills from the ground up.",
    slug: "frontend-engineering",
    stream: "frontend",
    modules: [
      {
        title: "Phase 0: Computing Fundamentals",
        description: "Understand the foundational concepts of how computers and the internet work before diving into web development.",
        slug: "phase-0-computing-fundamentals",
        topics: [
          {
            title: "How Computers Work",
            description: "Learn the basic architecture of a computer: CPU, memory, storage, and how programs execute.",
            slug: "how-computers-work", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "CPU (Central Processing Unit)", description: "The CPU is the brain of the computer. It executes instructions through a fetch-decode-execute cycle: it fetches an instruction from memory, decodes what operation to perform, then executes it. Modern CPUs have multiple cores allowing parallel execution of instructions." },
              { title: "RAM (Random Access Memory)", description: "RAM is volatile, fast-access memory that stores data and instructions for programs currently running. When a program is launched, its code and data are loaded from storage into RAM. When the computer powers off, RAM is cleared. More RAM allows more programs to run simultaneously." },
              { title: "Storage (HDD/SSD)", description: "Storage provides permanent, non-volatile data retention. HDDs use spinning magnetic platters, while SSDs use flash memory chips for much faster read/write speeds. The operating system, applications, and user files are stored here and loaded into RAM when needed." },
            ],
            examples: [
              {
                title: "Understanding the Fetch-Execute Cycle",
                description: "A JavaScript simulation showing how a CPU processes instructions one at a time",
                starterCode: "const instructions = ['LOAD A, 5', 'LOAD B, 3', 'ADD A, B', 'STORE A, RESULT', 'HALT'];\nlet pc = 0;\nlet registers = { A: 0, B: 0, RESULT: 0 };\n\nfunction execute() {\n  // Your code here: loop through instructions and simulate CPU\n}",
                solutionCode: "const instructions = ['LOAD A, 5', 'LOAD B, 3', 'ADD A, B', 'STORE A, RESULT', 'HALT'];\nlet pc = 0;\nlet registers = { A: 0, B: 0, RESULT: 0 };\n\nfunction execute() {\n  while (pc < instructions.length) {\n    const [op, ...args] = instructions[pc].split(' ');\n    console.log(`PC=${pc}: ${instructions[pc]}`);\n    if (op === 'LOAD') {\n      const [reg, val] = args[0].split(',');\n      registers[reg] = parseInt(val);\n    } else if (op === 'ADD') {\n      const [r1, r2] = args[0].split(',');\n      registers[r1] = registers[r1] + registers[r2];\n    } else if (op === 'STORE') {\n      const [src, dest] = args[0].split(',');\n      registers[dest] = registers[src];\n    } else if (op === 'HALT') break;\n    pc++;\n  }\n  console.log('Result:', registers.RESULT);\n}\nexecute();",
              },
            ],
            exercises: [
              {
                title: "Simulate Memory Hierarchy",
                description: "Write a program that simulates cache hits and misses to understand memory latency",
                starterCode: "const cache = new Map();\nconst RAM = new Array(100).fill(0).map((_, i) => i * 10);\nconst CACHE_SIZE = 5;\n\nfunction accessMemory(address) {\n  // Check if address is in cache (cache hit)\n  // If not, load from RAM (cache miss) and store in cache\n  // Return the value\n}",
                testCases: "Test cache hit returns value without accessing RAM counter; Test cache miss increments RAM access counter; Test LRU eviction when cache is full",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Computer Architecture Data Flow", config: "{\"nodes\":[{\"id\":\"cpu\",\"label\":\"CPU\n(Processor)\",\"x\":250,\"y\":20},{\"id\":\"ram\",\"label\":\"RAM\n(Memory)\",\"x\":100,\"y\":150},{\"id\":\"storage\",\"label\":\"Storage\n(HDD/SSD)\",\"x\":400,\"y\":150},{\"id\":\"input\",\"label\":\"Input Devices\n(Keyboard, Mouse)\",\"x\":50,\"y\":280},{\"id\":\"output\",\"label\":\"Output Devices\n(Screen, Speakers)\",\"x\":450,\"y\":280}],\"edges\":[{\"from\":\"cpu\",\"to\":\"ram\",\"label\":\"data bus\"},{\"from\":\"ram\",\"to\":\"cpu\",\"label\":\"instructions\"},{\"from\":\"storage\",\"to\":\"ram\",\"label\":\"load\"},{\"from\":\"ram\",\"to\":\"storage\",\"label\":\"save\"},{\"from\":\"input\",\"to\":\"cpu\",\"label\":\"signals\"},{\"from\":\"cpu\",\"to\":\"output\",\"label\":\"display\"}]}" },
            ],
            lesson: { title: "Computer Architecture Basics", content: "A computer is an electronic device that processes data via instructions. Every modern computer follows the von Neumann architecture: CPU (processes instructions in a fetch-decode-execute cycle), RAM (temporary storage for running programs), Storage (permanent file storage), and I/O devices (keyboard, screen, network). Understanding this helps you write efficient code that respects memory and CPU limits.", explanation: "This lesson introduces the fundamental architecture of computers and the fetch-decode-execute cycle." },
          },
          {
            title: "How the Internet Works",
            description: "Understand protocols and infrastructure: HTTP, DNS, TCP/IP, and the client-server model.",
            slug: "how-the-internet-works", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "Client-Server Model", description: "The client (browser) sends requests to a server, which processes them and returns responses. The server listens on a port (e.g., 80 for HTTP, 443 for HTTPS) for incoming connections. This model separates concerns: the client handles the UI while the server manages data and business logic." },
              { title: "DNS (Domain Name System)", description: "DNS translates human-readable domain names (like google.com) into machine-readable IP addresses (like 142.250.80.46). It works like a phone book for the internet. When you type a URL, your browser first queries a DNS resolver to find the server's IP address before making a connection." },
              { title: "HTTP/HTTPS Protocol", description: "HTTP (Hypertext Transfer Protocol) defines how messages are formatted and transmitted between client and server. HTTPS adds encryption via TLS (Transport Layer Security). HTTP methods (GET, POST, PUT, DELETE) define the action, while status codes (200 OK, 404 Not Found, 500 Server Error) indicate the result." },
            ],
            examples: [
              {
                title: "Simulating an HTTP Request-Response Cycle",
                description: "A JavaScript simulation of how a browser sends a request and receives a response",
                starterCode: "class Server {\n  constructor() {\n    this.routes = {};\n  }\n  get(path, handler) {\n    this.routes[`GET:${path}`] = handler;\n  }\n  handleRequest(request) {\n    // Your code: match request to route, call handler, return response\n  }\n}",
                solutionCode: "class Server {\n  constructor() {\n    this.routes = {};\n  }\n  get(path, handler) {\n    this.routes[`GET:${path}`] = handler;\n  }\n  handleRequest(request) {\n    const key = `${request.method}:${request.path}`;\n    const handler = this.routes[key];\n    if (handler) {\n      return handler(request);\n    }\n    return { status: 404, body: 'Not Found' };\n  }\n}\n\nconst app = new Server();\napp.get('/hello', (req) => ({ status: 200, body: 'Hello World!' }));\n\nconst response = app.handleRequest({ method: 'GET', path: '/hello' });\nconsole.log(`Status: ${response.status}, Body: ${response.body}`);",
              },
            ],
            exercises: [
              {
                title: "Build a DNS Resolver Simulator",
                description: "Create a simple DNS lookup table that resolves domain names to IP addresses",
                starterCode: "const dnsTable = {\n  'google.com': '142.250.80.46',\n  'github.com': '140.82.121.3',\n};\n\nfunction resolveDNS(domain) {\n  // Your code: return IP if found, throw error if not\n}",
                testCases: "Test resolveDNS('google.com') returns correct IP; Test resolveDNS('unknown.com') throws an error; Test case sensitivity is handled",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "HTTP Request Lifecycle", config: "{\"nodes\":[{\"id\":\"user\",\"label\":\"User enters URL\",\"x\":250,\"y\":20},{\"id\":\"dns\",\"label\":\"DNS Lookup\",\"x\":250,\"y\":90},{\"id\":\"tcp\",\"label\":\"TCP Connection\",\"x\":250,\"y\":160},{\"id\":\"tls\",\"label\":\"TLS Handshake\",\"x\":250,\"y\":230},{\"id\":\"req\",\"label\":\"HTTP Request\",\"x\":250,\"y\":300},{\"id\":\"process\",\"label\":\"Server Processes\",\"x\":250,\"y\":370},{\"id\":\"res\",\"label\":\"HTTP Response\",\"x\":250,\"y\":440},{\"id\":\"render\",\"label\":\"Browser Renders\",\"x\":250,\"y\":510}],\"edges\":[{\"from\":\"user\",\"to\":\"dns\"},{\"from\":\"dns\",\"to\":\"tcp\"},{\"from\":\"tcp\",\"to\":\"tls\"},{\"from\":\"tls\",\"to\":\"req\"},{\"from\":\"req\",\"to\":\"process\"},{\"from\":\"process\",\"to\":\"res\"},{\"from\":\"res\",\"to\":\"render\"}]}" },
            ],
            lesson: { title: "Internet Protocols & the Client-Server Model", content: "The internet is a global network of computers communicating via standardized protocols. In the client-server model, your browser (client) makes requests to web servers. HTTP defines message format (methods like GET/POST, status codes like 200/404). DNS translates domain names to IP addresses. TCP/IP handles reliable data transmission. When you visit a website: DNS lookup, TCP connection, TLS encryption (HTTPS), HTTP request, server returns HTML/CSS/JS, browser renders the page.", explanation: "This lesson explains the fundamental protocols of the internet and the client-server model." },
          },
        ],
      },
      {
        title: "Phase 1: Web Fundamentals",
        description: "Master the building blocks of the web: HTML for structure and developer tools for debugging.",
        slug: "phase-1-web-fundamentals",
        topics: [
          {
            title: "HTML Basics",
            description: "Learn the structure of HTML documents, common elements, and how to create well-formed web pages.",
            slug: "html-basics", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "HTML Elements", description: "An HTML element is defined by a start tag, some content, and an end tag. Elements are the building blocks of HTML pages. Block-level elements (like <div>, <p>, <h1>) take the full width available, while inline elements (like <span>, <a>, <strong>) only take as much width as necessary." },
              { title: "HTML Attributes", description: "Attributes provide additional information about HTML elements. They are always specified in the start tag and come in name/value pairs like name=\"value\". Common attributes include id (unique identifier), class (for CSS styling), src (source for images), and href (hyperlink reference)." },
              { title: "Document Structure", description: "Every HTML document follows a standard structure: <!DOCTYPE html> declaration, <html> root element, <head> for metadata (title, charset, stylesheets), and <body> for visible content. This semantic structure helps browsers render pages correctly and improves SEO." },
            ],
            examples: [
              {
                title: "Basic HTML Page Structure",
                description: "A complete HTML5 document with headings, paragraphs, lists, and links",
                starterCode: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <!-- Add your content here -->\n</body>\n</html>",
                solutionCode: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>My First Page</title>\n</head>\n<body>\n  <h1>Welcome to My Website</h1>\n  <p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>\n  <h2>My Favorite Things</h2>\n  <ul>\n    <li>Reading books</li>\n    <li>Writing code</li>\n    <li>Playing guitar</li>\n  </ul>\n  <p>Visit <a href=\"https://github.com\">GitHub</a> to see my projects.</p>\n  <img src=\"photo.jpg\" alt=\"A beautiful landscape\" width=\"300\">\n</body>\n</html>",
              },
            ],
            exercises: [
              {
                title: "Create Your Personal Profile Page",
                description: "Build an HTML page with a heading, a paragraph about yourself, a list of skills, and a link to your social media",
                starterCode: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>My Profile</title>\n</head>\n<body>\n  <!-- Add a heading with your name -->\n  <!-- Add a paragraph about yourself -->\n  <!-- Add a list of your skills -->\n  <!-- Add a link to your LinkedIn or GitHub -->\n</body>\n</html>",
                testCases: "Page has an h1 with a name; Page has at least one p element; Page has a ul or ol with at least 3 li items; Page has an a element with href attribute; img tag has alt attribute",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "HTML Document Tree Structure", config: "{\"nodes\":[{\"id\":\"doctype\",\"label\":\"<!DOCTYPE html>\",\"x\":250,\"y\":20},{\"id\":\"html\",\"label\":\"<html>\",\"x\":250,\"y\":80},{\"id\":\"head\",\"label\":\"<head>\",\"x\":120,\"y\":150},{\"id\":\"body\",\"label\":\"<body>\",\"x\":380,\"y\":150},{\"id\":\"title\",\"label\":\"<title>\",\"x\":40,\"y\":230},{\"id\":\"meta\",\"label\":\"<meta>\",\"x\":200,\"y\":230},{\"id\":\"h1\",\"label\":\"<h1>\",\"x\":300,\"y\":230},{\"id\":\"p\",\"label\":\"<p>\",\"x\":380,\"y\":230},{\"id\":\"ul\",\"label\":\"<ul>\",\"x\":460,\"y\":230}],\"edges\":[{\"from\":\"doctype\",\"to\":\"html\"},{\"from\":\"html\",\"to\":\"head\"},{\"from\":\"html\",\"to\":\"body\"},{\"from\":\"head\",\"to\":\"title\"},{\"from\":\"head\",\"to\":\"meta\"},{\"from\":\"body\",\"to\":\"h1\"},{\"from\":\"body\",\"to\":\"p\"},{\"from\":\"body\",\"to\":\"ul\"}]}" },
            ],
            lesson: { title: "HTML Document Structure", content: "HTML (HyperText Markup Language) describes web page structure using tags. Every document has <!DOCTYPE html>, <html> (root), <head> (metadata: title, charset, styles), and <body> (visible content). Key elements: headings <h1>-<h6>, paragraphs <p>, links <a href=\"\">, images <img src=\"\" alt=\"\">, lists <ul>/<ol> with <li>. Block elements (div, p, h1) take full width; inline elements (span, a, strong) stay in text flow.", explanation: "This lesson covers HTML document structure and the most commonly used elements." },
          },
          {
            title: "HTML Forms & Semantic HTML",
            description: "Learn to create forms for user input and use semantic HTML elements for better accessibility and SEO.",
            slug: "html-forms-semantic", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "Semantic HTML", description: "Semantic elements clearly describe their meaning to both the browser and the developer. Elements like <header>, <nav>, <main>, <article>, <section>, <aside>, and <footer> convey the purpose of the content. This improves accessibility for screen readers, SEO for search engines, and code readability." },
              { title: "HTML Forms", description: "Forms collect user input through various input controls. The <form> element wraps input fields and defines how data is submitted. Input types include text, email, password, number, checkbox, radio, date, file, and more. The <label> element associates text with inputs for accessibility." },
              { title: "Form Validation", description: "HTML5 provides built-in form validation attributes: required (field must be filled), minlength/maxlength (text length limits), min/max (numeric bounds), pattern (regex validation), and type=\"email\" (email format). These provide instant user feedback without JavaScript, though custom JS validation can be added for complex rules." },
            ],
            examples: [
              {
                title: "Semantic HTML Page Layout",
                description: "A properly structured page using semantic HTML5 elements",
                starterCode: "<div class=\"header\">\n  <div class=\"nav\">Home | About | Contact</div>\n</div>\n<div class=\"main\">\n  <div class=\"article\">Content here</div>\n</div>\n<div class=\"footer\">Copyright 2024</div>",
                solutionCode: "<header>\n  <nav>\n    <a href=\"/\">Home</a> |\n    <a href=\"/about\">About</a> |\n    <a href=\"/contact\">Contact</a>\n  </nav>\n</header>\n<main>\n  <article>\n    <h2>Article Title</h2>\n    <p>Article content goes here with meaningful structure.</p>\n  </article>\n  <aside>\n    <h3>Related Links</h3>\n    <ul>\n      <li><a href=\"#\">Related Article 1</a></li>\n    </ul>\n  </aside>\n</main>\n<footer>\n  <p>&copy; 2024 My Website. All rights reserved.</p>\n</footer>",
              },
              {
                title: "Registration Form with Validation",
                description: "A complete registration form with HTML5 validation",
                starterCode: "<form>\n  <input type=\"text\" name=\"name\">\n  <input type=\"email\" name=\"email\">\n  <input type=\"password\" name=\"password\">\n  <button type=\"submit\">Register</button>\n</form>",
                solutionCode: "<form action=\"/register\" method=\"POST\">\n  <fieldset>\n    <legend>Create Account</legend>\n    <label for=\"name\">Full Name:</label>\n    <input type=\"text\" id=\"name\" name=\"name\" required minlength=\"2\" maxlength=\"50\">\n\n    <label for=\"email\">Email:</label>\n    <input type=\"email\" id=\"email\" name=\"email\" required placeholder=\"you@example.com\">\n\n    <label for=\"password\">Password:</label>\n    <input type=\"password\" id=\"password\" name=\"password\" required minlength=\"8\" pattern=\"(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}\">\n\n    <label for=\"age\">Age:</label>\n    <input type=\"number\" id=\"age\" name=\"age\" min=\"13\" max=\"120\">\n\n    <label>Gender:</label>\n    <input type=\"radio\" id=\"male\" name=\"gender\" value=\"male\">\n    <label for=\"male\">Male</label>\n    <input type=\"radio\" id=\"female\" name=\"gender\" value=\"female\">\n    <label for=\"female\">Female</label>\n\n    <label>\n      <input type=\"checkbox\" name=\"terms\" required> I agree to the terms\n    </label>\n\n    <button type=\"submit\">Register</button>\n  </fieldset>\n</form>",
              },
            ],
            exercises: [
              {
                title: "Build a Contact Form",
                description: "Create a semantic contact form with name, email, subject dropdown, message textarea, and a submit button",
                starterCode: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Contact Us</title>\n</head>\n<body>\n  <!-- Build a contact form with semantic HTML -->\n</body>\n</html>",
                testCases: "Form uses semantic elements (header, main, footer); Form has name, email, subject (select), and message (textarea) fields; All input fields have associated labels; Email field uses type=\"email\" with required attribute; Submit button is present",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Form Submission Flow", config: "{\"nodes\":[{\"id\":\"fill\",\"label\":\"User fills form\",\"x\":250,\"y\":20},{\"id\":\"validate\",\"label\":\"HTML5 Validation\",\"x\":250,\"y\":100},{\"id\":\"valid\",\"label\":\"Valid?\",\"x\":250,\"y\":180},{\"id\":\"submit\",\"label\":\"Send to Server\",\"x\":420,\"y\":180},{\"id\":\"errors\",\"label\":\"Show Errors\",\"x\":80,\"y\":180},{\"id\":\"process\",\"label\":\"Server Processes\",\"x\":420,\"y\":260},{\"id\":\"response\",\"label\":\"Show Result\",\"x\":420,\"y\":340}],\"edges\":[{\"from\":\"fill\",\"to\":\"validate\"},{\"from\":\"validate\",\"to\":\"valid\"},{\"from\":\"valid\",\"to\":\"submit\",\"label\":\"yes\"},{\"from\":\"valid\",\"to\":\"errors\",\"label\":\"no\"},{\"from\":\"errors\",\"to\":\"fill\"},{\"from\":\"submit\",\"to\":\"process\"},{\"from\":\"process\",\"to\":\"response\"}]}" },
            ],
            lesson: { title: "Forms and Semantic Elements", content: "Semantic HTML uses meaningful elements: <header>, <nav>, <main>, <article>, <section>, <aside>, <footer> instead of generic <div>s. HTML Forms collect user input via <form> with <input>, <label>, <button>. Input types: text, email, password, number, checkbox, radio, textarea, select. HTML5 validation: required, minlength, maxlength, min, max, pattern attributes.", explanation: "This lesson covers semantic HTML elements and HTML forms for collecting user input." },
          },
          {
            title: "Introduction to Developer Tools",
            description: "Learn to use browser DevTools for debugging HTML, CSS, and JavaScript in real-time.",
            slug: "devtools-intro", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "Elements Panel", description: "The Elements panel shows the live DOM tree and allows you to inspect and modify HTML and CSS in real time. You can add, edit, or delete elements, toggle CSS properties on/off, and see computed styles. Changes are temporary and lost on refresh, making it safe for experimentation." },
              { title: "Console Panel", description: "The Console is a JavaScript REPL (Read-Eval-Print Loop) where you can execute JavaScript code, view error messages, and inspect log output from console.log(), console.error(), console.table(), and console.dir(). It's the primary tool for debugging JavaScript runtime behavior." },
              { title: "Network Panel", description: "The Network panel shows all HTTP requests made by the page, including their status codes, headers, payloads, and timing information. You can filter by request type (XHR, JS, CSS, Img), view response bodies, and analyze waterfall charts to identify performance bottlenecks." },
            ],
            examples: [
              {
                title: "Using Console for Debugging",
                description: "How to use console methods to debug JavaScript code effectively",
                starterCode: "const users = [\n  { name: 'Alice', age: 25 },\n  { name: 'Bob', age: 30 },\n  { name: 'Charlie', age: 35 }\n];\n\nfunction processUsers(userList) {\n  // Debug this function using console\n  const adults = userList.filter(user => user.age >= 18);\n  return adults;\n}",
                solutionCode: "const users = [\n  { name: 'Alice', age: 25 },\n  { name: 'Bob', age: 30 },\n  { name: 'Charlie', age: 35 }\n];\n\nfunction processUsers(userList) {\n  console.log('Input:', userList);\n  console.table(userList);\n  const adults = userList.filter(user => {\n    console.log(`Checking ${user.name}, age ${user.age}`);\n    return user.age >= 18;\n  });\n  console.log('Filtered adults:', adults);\n  console.log('Count:', adults.length);\n  return adults;\n}\n\nconst result = processUsers(users);\nconsole.assert(result.length === 3, 'Expected 3 adults');",
              },
            ],
            exercises: [
              {
                title: "Debug a Broken Page",
                description: "Use DevTools to identify and fix issues in a page: find a missing image, fix a broken CSS rule, and debug a JavaScript error",
                starterCode: "<!-- Open in browser DevTools and find:\n1. Why the image doesn't show\n2. Why the button color is wrong\n3. Why the click handler doesn't work -->\n<img src=\"missing.jpg\">\n<button class=\"btn-pimary\">Click me</button>\n<script>\n  document.querySelector('button').addEventListner('click', () => {\n    console.log('clicked');\n  });\n</script>",
                testCases: "Identify that misspelled class 'btn-pimary' should be 'btn-primary'; Find that 'addEventListner' is misspelled (should be 'addEventListener'); Determine that 'missing.jpg' file doesn't exist or path is wrong",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "DevTools Debugging Workflow", config: "{\"nodes\":[{\"id\":\"issue\",\"label\":\"Find Issue\",\"x\":250,\"y\":20},{\"id\":\"inspect\",\"label\":\"Inspect Element\",\"x\":100,\"y\":100},{\"id\":\"checkConsole\",\"label\":\"Check Console\",\"x\":400,\"y\":100},{\"id\":\"checkNetwork\",\"label\":\"Check Network\",\"x\":250,\"y\":180},{\"id\":\"fix\",\"label\":\"Apply Fix\",\"x\":250,\"y\":260},{\"id\":\"verify\",\"label\":\"Verify Fix\",\"x\":250,\"y\":340}],\"edges\":[{\"from\":\"issue\",\"to\":\"inspect\"},{\"from\":\"issue\",\"to\":\"checkConsole\"},{\"from\":\"inspect\",\"to\":\"checkNetwork\"},{\"from\":\"checkConsole\",\"to\":\"checkNetwork\"},{\"from\":\"checkNetwork\",\"to\":\"fix\"},{\"from\":\"fix\",\"to\":\"verify\"}]}" },
            ],
            lesson: { title: "Browser DevTools Essentials", content: "Browser DevTools (F12 or Ctrl+Shift+I) are your most important frontend tool. Elements panel: inspect/modify HTML/CSS live. Console panel: view errors, run JavaScript, log with console.log/error/table. Network panel: see all HTTP requests, headers, timing. Sources panel: set breakpoints, step through code. Application panel: inspect localStorage, cookies, IndexedDB. Always test changes in DevTools before editing source files.", explanation: "This lesson introduces browser DevTools for debugging and inspecting web pages." },
          },
        ],
      },
      {
        title: "Phase 2: CSS",
        description: "Style your web pages with CSS: from selectors and the box model to modern layout techniques.",
        slug: "phase-2-css",
        topics: [
          {
            title: "CSS Selectors & Properties",
            description: "Master CSS selectors, specificity, and common properties for styling text, colors, and backgrounds.",
            slug: "css-selectors-properties", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "CSS Selectors", description: "Selectors target HTML elements for styling. Type selectors (p, h1) target all elements of that type. Class selectors (.highlight) target elements with a specific class. ID selectors (#header) target a unique element. Attribute selectors ([type=\"text\"]) target elements by attribute values. Pseudo-classes (:hover, :first-child) target elements in specific states." },
              { title: "Specificity", description: "When multiple rules target the same element, the browser uses specificity to determine which rule wins. The hierarchy: inline styles (1000) > ID selectors (100) > class/attribute/pseudo-class selectors (10) > type/pseudo-element selectors (1). The !important flag overrides everything but should be used sparingly." },
              { title: "CSS Properties", description: "CSS properties control visual presentation. Common categories: text (font-family, font-size, color, text-align, line-height), background (background-color, background-image), spacing (margin, padding, border), and sizing (width, height, max-width). Properties can take various value types: keywords, lengths (px, em, rem), colors (hex, rgb, hsl), and functions." },
            ],
            examples: [
              {
                title: "CSS Selector Combinations",
                description: "Using different selector types to style a navigation menu",
                starterCode: "/* Style the navigation */\n/* Target all links */\n/* Target links on hover */\n/* Target the active link */\n/* Target the first list item */",
                solutionCode: "nav {\n  background-color: #2c3e50;\n  padding: 1rem;\n}\n\nnav ul {\n  list-style: none;\n  display: flex;\n  gap: 1.5rem;\n  margin: 0;\n  padding: 0;\n}\n\nnav a {\n  color: #ecf0f1;\n  text-decoration: none;\n  font-family: 'Segoe UI', sans-serif;\n  font-size: 1rem;\n  transition: color 0.3s;\n}\n\nnav a:hover {\n  color: #3498db;\n}\n\nnav a.active {\n  color: #e74c3c;\n  font-weight: bold;\n}\n\nnav li:first-child a {\n  font-size: 1.2rem;\n  font-weight: bold;\n  color: #f39c12;\n}",
              },
            ],
            exercises: [
              {
                title: "Style a Blog Card Component",
                description: "Create CSS styles for a blog card with a title, date, excerpt, and read more link. Use class selectors, pseudo-classes, and proper typography.",
                starterCode: ".blog-card {\n  /* Add card styling */\n}\n\n.blog-card__title {\n  /* Style the title */\n}\n\n.blog-card__date {\n  /* Style the date */\n}\n\n.blog-card__excerpt {\n  /* Style the excerpt */\n}\n\n.blog-card__link {\n  /* Style the link */\n}\n\n.blog-card__link:hover {\n  /* Style link on hover */\n}",
                testCases: "Card has border, padding, and border-radius; Title uses a larger font-size and bold weight; Date is styled differently (smaller, gray color); Link changes color on hover; Card has a max-width and is centered",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "CSS Specificity Calculation", config: "{\"nodes\":[{\"id\":\"conflict\",\"label\":\"Multiple rules match\",\"x\":250,\"y\":20},{\"id\":\"inline\",\"label\":\"Inline style?\",\"x\":250,\"y\":100},{\"id\":\"id\",\"label\":\"Compare IDs\",\"x\":250,\"y\":180},{\"id\":\"class\",\"label\":\"Compare classes\",\"x\":250,\"y\":260},{\"id\":\"element\",\"label\":\"Compare elements\",\"x\":250,\"y\":340},{\"id\":\"order\",\"label\":\"Last declared wins\",\"x\":250,\"y\":420},{\"id\":\"apply\",\"label\":\"Apply winning rule\",\"x\":250,\"y\":500}],\"edges\":[{\"from\":\"conflict\",\"to\":\"inline\"},{\"from\":\"inline\",\"to\":\"id\",\"label\":\"no\"},{\"from\":\"id\",\"to\":\"class\",\"label\":\"tie\"},{\"from\":\"class\",\"to\":\"element\",\"label\":\"tie\"},{\"from\":\"element\",\"to\":\"order\",\"label\":\"tie\"},{\"from\":\"inline\",\"to\":\"apply\",\"label\":\"yes\"},{\"from\":\"order\",\"to\":\"apply\"}]}" },
            ],
            lesson: { title: "CSS Fundamentals", content: "CSS controls visual presentation of HTML. Add CSS via inline, internal (<style>), or external (<link>). Selectors: element (p), class (.highlight), ID (#header), universal (*). Combinators: descendant (ul li), child (ul > li). Pseudo-classes: :hover, :first-child, :nth-child(). Specificity: inline (1000) > ID (100) > class (10) > element (1). Common properties: color, font-size, font-family, background-color, text-align, line-height.", explanation: "This lesson covers CSS selectors, specificity, and common styling properties." },
          },
          {
            title: "Box Model & Layout",
            description: "Understand the CSS box model, positioning, and traditional layout techniques.",
            slug: "box-model-layout", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "The Box Model", description: "Every HTML element is a rectangular box with four layers from inside out: Content (the actual text/image), Padding (transparent space between content and border), Border (the edge of the element), and Margin (transparent space outside the border). The total width of an element = content + padding + border + margin." },
              { title: "box-sizing Property", description: "The box-sizing property controls how the browser calculates element dimensions. With content-box (default), width only applies to content. With border-box, width includes content, padding, and border. Using border-box universally (*, *::before, *::after { box-sizing: border-box; }) is a common best practice that makes layout math predictable." },
              { title: "CSS Positioning", description: "CSS positioning schemes control how elements are placed: static (default, normal flow), relative (offset from normal position), absolute (positioned relative to nearest positioned ancestor), fixed (positioned relative to viewport), and sticky (toggles between relative and fixed based on scroll). Each scheme uses top, right, bottom, left properties for offsets." },
            ],
            examples: [
              {
                title: "Box Model in Practice",
                description: "Demonstrating how padding, border, and margin affect element sizing",
                starterCode: ".box {\n  width: 200px;\n  /* Add padding, border, and margin */\n  /* Calculate total width */\n}",
                solutionCode: ".box {\n  width: 200px;\n  padding: 20px;\n  border: 5px solid #333;\n  margin: 30px;\n  box-sizing: content-box;\n  background-color: #e8f4f8;\n}\n\n.box-border-box {\n  width: 200px;\n  padding: 20px;\n  border: 5px solid #333;\n  margin: 30px;\n  box-sizing: border-box;\n  background-color: #f0e8f8;\n}\n\n/* content-box total width: 200 + 40 + 10 = 250px */\n/* border-box total width: 200px (content is 150px) */",
              },
            ],
            exercises: [
              {
                title: "Create a Card Layout",
                description: "Build a card component with proper box model usage: image, content area with padding, border, and consistent spacing",
                starterCode: ".card {\n  /* Style the card container */\n}\n\n.card__image {\n  /* Style the image */\n}\n\n.card__content {\n  /* Add padding and style the content area */\n}\n\n.card__title {\n  /* Style the title with margin */\n}",
                testCases: "Card uses border-box sizing; Content area has appropriate padding; Title has margin-bottom to separate from body text; Card has border-radius for rounded corners; Card has a max-width and is responsive",
              },
            ],
            visualizations: [
              { type: "memory", title: "CSS Box Model Layers", config: "{\"layers\":[{\"name\":\"Margin\",\"color\":\"#f9a825\",\"offset\":0,\"size\":30},{\"name\":\"Border\",\"color\":\"#4caf50\",\"offset\":30,\"size\":5},{\"name\":\"Padding\",\"color\":\"#2196f3\",\"offset\":35,\"size\":20},{\"name\":\"Content\",\"color\":\"#ff7043\",\"offset\":55,\"size\":200}]}" },
              { type: "flowchart", title: "CSS Box Model Step-by-Step Flow", config: "{\"nodes\":[{\"id\":\"content\",\"label\":\"Content\\n(Text/Image)\",\"x\":250,\"y\":20},{\"id\":\"padding\",\"label\":\"Padding\\n(Inner Spacing)\",\"x\":250,\"y\":100},{\"id\":\"border\",\"label\":\"Border\\n(Edge)\",\"x\":250,\"y\":180},{\"id\":\"margin\",\"label\":\"Margin\\n(Outer Spacing)\",\"x\":250,\"y\":260},{\"id\":\"element\",\"label\":\"Element Box\\n(Total Width)\",\"x\":250,\"y\":340}],\"edges\":[{\"from\":\"content\",\"to\":\"padding\",\"label\":\"wraps\"},{\"from\":\"padding\",\"to\":\"border\",\"label\":\"wraps\"},{\"from\":\"border\",\"to\":\"margin\",\"label\":\"wraps\"},{\"from\":\"margin\",\"to\":\"element\",\"label\":\"defines\"}]},{\"id\":\"step-2\",\"title\":\"Step 2: Padding Creates Inner Space\",\"description\":\"Padding is the transparent space between the content and the border. It creates breathing room inside the element. Background colors extend through the padding area, making the element visually larger without affecting content dimensions.\",\"highlightNodes\":[\"content\",\"padding\"],\"highlightEdges\":[\"content->padding\"]},{\"id\":\"step-3\",\"title\":\"Step 3: Border Marks the Edge\",\"description\":\"The border is the visible edge of the element, sitting between padding and margin. You can style borders with width, color, and pattern like solid, dashed, or dotted. The border marks the boundary of the element visual area.\",\"highlightNodes\":[\"padding\",\"border\"],\"highlightEdges\":[\"padding->border\"]},{\"id\":\"step-4\",\"title\":\"Step 4: Margin Separates Elements\",\"description\":\"Margin is the transparent space outside the border that separates the element from its neighbors. Unlike padding, vertical margins can collapse when two adjacent elements have margins that touch, the larger margin wins.\",\"highlightNodes\":[\"border\",\"margin\"],\"highlightEdges\":[\"border->margin\"]},{\"id\":\"step-5\",\"title\":\"Step 5: Total Box Dimensions\",\"description\":\"The total width of an element equals content plus padding plus border plus margin. With box-sizing: border-box, width includes content, padding, and border, making layout math predictable and intuitive for developers.\",\"highlightNodes\":[\"margin\",\"element\"],\"highlightEdges\":[\"margin->element\"]}]}" },
            ],
            lesson: { title: "The CSS Box Model", content: "Every HTML element is a rectangular box with four layers: Content (text/image), Padding (space inside border), Border (the edge), Margin (space outside). Always use box-sizing: border-box so width includes padding and border. Display types: block (full width, new line), inline (text flow), inline-block (inline with width/height), none (hidden). Position: static (default), relative (offset), absolute (relative to ancestor), fixed (viewport), sticky (hybrid).", explanation: "This lesson explains the CSS box model, display types, and positioning." },
          },
          {
            title: "Flexbox & Grid",
            description: "Master modern CSS layout with Flexbox and CSS Grid.",
            slug: "flexbox-grid", difficulty: 3, prerequisites: [0],
            concepts: [
              { title: "Flexbox", description: "Flexbox is a one-dimensional layout system designed for distributing space along a single axis (row or column). The container (display: flex) controls the flow direction, wrapping, and alignment. Flex items can grow, shrink, and have specific sizes. Key properties: justify-content (main axis), align-items (cross axis), gap (spacing)." },
              { title: "CSS Grid", description: "CSS Grid is a two-dimensional layout system that handles both rows and columns simultaneously. Define the grid with grid-template-columns and grid-template-rows using flexible units like fr (fraction). Place items using grid-column and grid-row spans, or name areas with grid-template-areas for a visual layout declaration." },
              { title: "Layout Strategy", description: "Use Flexbox for component-level layouts (navigation bars, card rows, centering items) and Grid for page-level layouts (overall page structure, complex galleries). They work together: Grid defines the page skeleton, while Flexbox handles the internal alignment of components within grid cells." },
            ],
            examples: [
              {
                title: "Responsive Grid Gallery",
                description: "A responsive image gallery using CSS Grid with auto-fill and minmax",
                starterCode: ".gallery {\n  /* Create a grid layout */\n  /* Use auto-fill for responsiveness */\n}\n\n.gallery img {\n  /* Make images fill their cells */\n}",
                solutionCode: ".gallery {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));\n  gap: 1rem;\n  padding: 1rem;\n}\n\n.gallery img {\n  width: 100%;\n  height: 200px;\n  object-fit: cover;\n  border-radius: 8px;\n  transition: transform 0.3s;\n}\n\n.gallery img:hover {\n  transform: scale(1.05);\n}",
              },
              {
                title: "Flexbox Navigation Bar",
                description: "A responsive navigation bar using Flexbox",
                starterCode: "nav {\n  /* Use flexbox for layout */\n}\n\n.nav-links {\n  /* Display links horizontally */\n}\n\n.logo {\n  /* Push logo to the left */\n}",
                solutionCode: "nav {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 1rem 2rem;\n  background-color: #1a1a2e;\n  color: white;\n}\n\n.logo {\n  font-size: 1.5rem;\n  font-weight: bold;\n}\n\n.nav-links {\n  display: flex;\n  gap: 2rem;\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n.nav-links a {\n  color: #e0e0e0;\n  text-decoration: none;\n  transition: color 0.3s;\n}\n\n.nav-links a:hover {\n  color: #e94560;\n}",
              },
            ],
            exercises: [
              {
                title: "Build a Dashboard Layout",
                description: "Create a dashboard layout with a sidebar, header, main content area, and stats cards using CSS Grid for the page and Flexbox for the cards",
                starterCode: ".dashboard {\n  /* Create grid layout with sidebar and main area */\n}\n\n.sidebar {\n  /* Style the sidebar */\n}\n\n.stats-cards {\n  /* Use flexbox for card row */\n}\n\n.stat-card {\n  /* Style individual cards */\n}",
                testCases: "Dashboard uses CSS Grid with at least 2 columns; Sidebar has fixed width of 250px; Main area fills remaining space; Stats cards use flexbox with equal sizing; Layout is responsive with media queries",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Flexbox vs Grid Decision Tree", config: "{\"nodes\":[{\"id\":\"start\",\"label\":\"Need layout?\",\"x\":250,\"y\":20},{\"id\":\"dim\",\"label\":\"1D or 2D?\",\"x\":250,\"y\":100},{\"id\":\"flex\",\"label\":\"Use Flexbox\",\"x\":100,\"y\":180},{\"id\":\"grid\",\"label\":\"Use Grid\",\"x\":400,\"y\":180},{\"id\":\"component\",\"label\":\"Component layout\",\"x\":100,\"y\":260},{\"id\":\"page\",\"label\":\"Page layout\",\"x\":400,\"y\":260}],\"edges\":[{\"from\":\"start\",\"to\":\"dim\"},{\"from\":\"dim\",\"to\":\"flex\",\"label\":\"1D\"},{\"from\":\"dim\",\"to\":\"grid\",\"label\":\"2D\"},{\"from\":\"flex\",\"to\":\"component\"},{\"from\":\"grid\",\"to\":\"page\"}]}" },
            ],
            lesson: { title: "Flexbox & Grid Layouts", content: "Flexbox is a one-dimensional layout system. Container: display: flex, flex-direction, justify-content, align-items, flex-wrap, gap. Items: flex (grow shrink basis), align-self, order. CSS Grid is two-dimensional. Container: display: grid, grid-template-columns/rows, grid-template-areas, gap. Use Flexbox for nav bars, centering, card rows. Use Grid for page layouts, galleries. Combine them: Grid for page structure, Flexbox for component internals.", explanation: "This lesson covers Flexbox and CSS Grid, the two modern CSS layout systems." },
          },
          {
            title: "Responsive Design",
            description: "Learn responsive design principles: media queries, mobile-first approach, and responsive units.",
            slug: "responsive-design", difficulty: 3, prerequisites: [0],
            concepts: [
              { title: "Mobile-First Design", description: "Mobile-first means writing base CSS styles for the smallest screen (mobile) and then adding complexity for larger screens using min-width media queries. This approach ensures the core experience works on all devices, and it's more performant because mobile devices don't need to process desktop styles." },
              { title: "Media Queries", description: "Media queries apply CSS rules conditionally based on device characteristics. The most common use is viewport width: @media (min-width: 768px) applies styles at tablet size and above. Other media features include orientation, prefers-color-scheme (dark mode), and prefers-reduced-motion (accessibility)." },
              { title: "Responsive Units", description: "Instead of fixed px values, use relative units for responsive design: rem (relative to root font-size, typically 16px), em (relative to parent's font-size), vw/vh (percentage of viewport width/height), % (percentage of parent), and ch (width of the '0' character). The clamp() function sets a value with min and max bounds." },
            ],
            examples: [
              {
                title: "Responsive Typography",
                description: "Using clamp() and rem units for fluid typography that scales with the viewport",
                starterCode: "h1 {\n  font-size: 24px;\n}\n\np {\n  font-size: 16px;\n}",
                solutionCode: "html {\n  font-size: 16px;\n}\n\nh1 {\n  font-size: clamp(1.5rem, 4vw, 3rem);\n  line-height: 1.2;\n}\n\nh2 {\n  font-size: clamp(1.25rem, 3vw, 2rem);\n}\n\np {\n  font-size: clamp(1rem, 2vw, 1.125rem);\n  line-height: 1.6;\n  max-width: 65ch;\n}\n\n@media (min-width: 768px) {\n  html {\n    font-size: 18px;\n  }\n}",
              },
            ],
            exercises: [
              {
                title: "Build a Responsive Page Layout",
                description: "Create a page layout that changes from a single column on mobile to two columns on tablet to three columns on desktop",
                starterCode: ".container {\n  /* Single column on mobile */\n}\n\n/* Tablet: 768px+ */\n\n/* Desktop: 1024px+ */",
                testCases: "Mobile: single column layout with full-width content; Tablet (768px): two-column layout; Desktop (1024px): three-column layout; Images use max-width: 100% to stay within containers; Uses relative units (rem, %, vw) instead of fixed px",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Mobile-First Responsive Strategy", config: "{\"nodes\":[{\"id\":\"base\",\"label\":\"Base Styles\n(Mobile)\",\"x\":250,\"y\":20},{\"id\":\"tablet\",\"label\":\"@media (min-width: 768px)\n(Tablet)\",\"x\":250,\"y\":120},{\"id\":\"desktop\",\"label\":\"@media (min-width: 1024px)\n(Desktop)\",\"x\":250,\"y\":220},{\"id\":\"wide\",\"label\":\"@media (min-width: 1440px)\n(Wide)\",\"x\":250,\"y\":320}],\"edges\":[{\"from\":\"base\",\"to\":\"tablet\"},{\"from\":\"tablet\",\"to\":\"desktop\"},{\"from\":\"desktop\",\"to\":\"wide\"}]}" },
            ],
            lesson: { title: "Responsive Design Principles", content: "Responsive design ensures sites work on all devices. Use mobile-first: base styles for mobile, add @media (min-width: 768px) for tablet, @media (min-width: 1024px) for desktop. Responsive units: % (parent), vw/vh (viewport), rem (root font, 1rem=16px), em (parent font). Always include <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">. Images should use max-width: 100%; height: auto.", explanation: "This lesson covers responsive design principles and media queries." },
          },
        ],
      },
      {
        title: "Phase 3: JavaScript",
        description: "Master JavaScript programming: from variables and functions to async programming and DOM manipulation.",
        slug: "phase-3-javascript",
        topics: [
          {
            title: "Variables & Data Types",
            description: "Learn JavaScript variables, primitive types, type coercion, and basic operators.",
            slug: "variables-data-types", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "Variable Declarations", description: "JavaScript has three keywords for declaring variables: const (immutable binding, preferred default), let (mutable, block-scoped), and var (function-scoped, hoisted, legacy — avoid). Use const by default and only use let when you need to reassign the value. This makes code more predictable and easier to reason about." },
              { title: "Primitive Data Types", description: "JavaScript has 7 primitive types: String (text), Number (integers and floats, including Infinity and NaN), Boolean (true/false), Undefined (declared but not assigned), Null (intentional absence), Symbol (unique identifiers), and BigInt (very large integers). All primitives are immutable — methods return new values rather than modifying the original." },
              { title: "Type Coercion", description: "JavaScript automatically converts types in certain operations. Implicit coercion: '5' + 3 = '53' (number coerced to string), '5' - 3 = 2 (string coerced to number). Explicit coercion: Number('5'), String(42), Boolean(0). Always use === (strict equality, no coercion) instead of == (loose equality, with coercion) to avoid subtle bugs." },
            ],
            examples: [
              {
                title: "Type Checking and Conversion",
                description: "Demonstrating JavaScript type system and safe type conversion patterns",
                starterCode: "function safeAdd(a, b) {\n  // Convert inputs to numbers safely\n  // Return the sum, or NaN message if invalid\n}\n\nconsole.log(safeAdd('5', '3'));\nconsole.log(safeAdd('hello', 3));",
                solutionCode: "function safeAdd(a, b) {\n  const numA = Number(a);\n  const numB = Number(b);\n  if (isNaN(numA) || isNaN(numB)) {\n    return 'Error: Both arguments must be convertible to numbers';\n  }\n  return numA + numB;\n}\n\nconsole.log(safeAdd('5', '3'));\nconsole.log(safeAdd('hello', 3));\nconsole.log(safeAdd(10, 20));\nconsole.log(safeAdd('3.14', '2.86'));",
              },
            ],
            exercises: [
              {
                title: "Type Detective",
                description: "Write a function that takes any value and returns an object describing its type, whether it's truthy/falsy, and its converted number value",
                starterCode: "function analyzeValue(value) {\n  // Return an object with:\n  // type: the typeof result\n  // truthy: boolean\n  // asNumber: Number(value) result\n  // asString: String(value) result\n  // asBoolean: Boolean(value) result\n}",
                testCases: "analyzeValue(42) returns correct type info; analyzeValue('') returns type 'string', truthy: false; analyzeValue(null) returns type 'object', truthy: false; analyzeValue('3.14') returns asNumber: 3.14",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "JavaScript Type Coercion Rules", config: "{\"nodes\":[{\"id\":\"op\",\"label\":\"Operator?\",\"x\":250,\"y\":20},{\"id\":\"plus\",\"label\":\"+ operator\",\"x\":100,\"y\":100},{\"id\":\"other\",\"label\":\"- * / %\",\"x\":400,\"y\":100},{\"id\":\"str\",\"label\":\"String concat\",\"x\":100,\"y\":180},{\"id\":\"num\",\"label\":\"Numeric op\",\"x\":400,\"y\":180},{\"id\":\"eq\",\"label\":\"== comparison\",\"x\":250,\"y\":260},{\"id\":\"strict\",\"label\":\"=== comparison\n(no coercion)\",\"x\":250,\"y\":340}],\"edges\":[{\"from\":\"op\",\"to\":\"plus\",\"label\":\"+\"},{\"from\":\"op\",\"to\":\"other\",\"label\":\"others\"},{\"from\":\"plus\",\"to\":\"str\",\"label\":\"has string\"},{\"from\":\"plus\",\"to\":\"num\",\"label\":\"no string\"},{\"from\":\"other\",\"to\":\"num\"},{\"from\":\"str\",\"to\":\"eq\"},{\"from\":\"num\",\"to\":\"eq\"},{\"from\":\"eq\",\"to\":\"strict\"}]}" },
            ],
            lesson: { title: "JavaScript Variables & Types", content: "Use const by default, let when you need to reassign. Never use var. Primitive types: String (\"hello\", 'hello', template literals), Number (42, 3.14, Infinity, NaN), Boolean (true/false), Undefined, Null, Symbol, BigInt. typeof checks types. Type coercion: \"5\" + 3 = \"53\" (string wins), \"5\" - 3 = 2 (number wins). Always use === (strict equality) instead of == (loose equality).", explanation: "This lesson covers JavaScript variables, data types, and type coercion." },
          },
          {
            title: "Functions & Scope",
            description: "Master JavaScript functions: declarations, expressions, arrow functions, parameters, and scope rules.",
            slug: "functions-scope", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "Function Declarations vs Expressions", description: "Function declarations (function foo() {}) are hoisted — they can be called before their definition in the code. Function expressions (const foo = function() {}) are not hoisted — the variable is hoisted but the assignment happens at runtime. Arrow functions (const foo = () => {}) are always expressions, have no own `this`, and are more concise." },
              { title: "Parameters and Arguments", description: "Functions can have default parameters (function greet(name = 'Guest')), rest parameters (function sum(...nums) collects all arguments into an array), and can use destructuring in parameters (function print({ name, age })). The arguments object is available in non-arrow functions but rest parameters are preferred." },
              { title: "Scope and Closures", description: "Scope determines where variables are accessible. Global scope (accessible everywhere), Function scope (var), Block scope (let, const). Lexical scoping means inner functions can access variables from outer functions. A closure is created when a function retains access to its outer scope even after the outer function has returned — this is the foundation of many JS patterns." },
            ],
            examples: [
              {
                title: "Closure Counter Factory",
                description: "Creating a counter function using closures to maintain private state",
                starterCode: "function createCounter() {\n  // Use closure to maintain private count\n  // Return an object with increment, decrement, and getCount methods\n}",
                solutionCode: "function createCounter(initialValue = 0) {\n  let count = initialValue;\n\n  return {\n    increment() {\n      count++;\n      return count;\n    },\n    decrement() {\n      count--;\n      return count;\n    },\n    getCount() {\n      return count;\n    },\n    reset() {\n      count = initialValue;\n      return count;\n    },\n  };\n}\n\nconst counter = createCounter(10);\nconsole.log(counter.increment());\nconsole.log(counter.increment());\nconsole.log(counter.decrement());\nconsole.log(counter.getCount());\nconsole.log(counter.reset());",
              },
            ],
            exercises: [
              {
                title: "Build a Memoization Function",
                description: "Create a higher-order function `memoize(fn)` that caches the results of expensive function calls based on their arguments",
                starterCode: "function memoize(fn) {\n  // Return a new function that caches results\n  // Use a Map or object to store previous results\n  // If the same arguments are passed again, return cached result\n}\n\n// Test with a slow function\nfunction slowAdd(a, b) {\n  // Simulate slow operation\n  for (let i = 0; i < 1e7; i++) {}\n  return a + b;\n}",
                testCases: "First call with (1,2) computes and returns 3; Second call with (1,2) returns cached 3 without recomputing; Different arguments produce correct results; Cache stores multiple argument combinations",
              },
            ],
            visualizations: [
              { type: "callstack", title: "Function Call Stack with Closures", config: "{\"frames\":[{\"name\":\"Global Scope\",\"variables\":[\"createCounter\",\"counter\"]},{\"name\":\"createCounter(10)\",\"variables\":[\"count: 10\",\"initialValue: 10\"]},{\"name\":\"Closure over createCounter\",\"variables\":[\"count: 10 (private)\"],\"returned\":\"increment, decrement, getCount, reset\"}]}" },
              { type: "flowchart", title: "Function Execution Step-by-Step Flow", config: "{\"nodes\":[{\"id\":\"global\",\"label\":\"Global Scope\\n(Window/Global)\",\"x\":250,\"y\":20},{\"id\":\"call\",\"label\":\"Function Call\\n(invoke)\",\"x\":250,\"y\":100},{\"id\":\"local\",\"label\":\"Local Scope\\n(New Context)\",\"x\":250,\"y\":180},{\"id\":\"execute\",\"label\":\"Execute Body\\n(Run Code)\",\"x\":250,\"y\":260},{\"id\":\"return\",\"label\":\"Return Value\\n(Result)\",\"x\":250,\"y\":340},{\"id\":\"closure\",\"label\":\"Closure\\n(Captured Scope)\",\"x\":250,\"y\":420}],\"edges\":[{\"from\":\"global\",\"to\":\"call\",\"label\":\"invokes\"},{\"from\":\"call\",\"to\":\"local\",\"label\":\"creates\"},{\"from\":\"local\",\"to\":\"execute\",\"label\":\"runs\"},{\"from\":\"execute\",\"to\":\"return\",\"label\":\"produces\"},{\"from\":\"return\",\"to\":\"closure\",\"label\":\"preserves\"}]},{\"id\":\"step-2\",\"title\":\"Step 2: Function is Called\",\"description\":\"When a function is invoked with parentheses, the JavaScript engine prepares to execute it. Arguments are evaluated and passed to the function parameters. A new execution context is about to be pushed onto the call stack.\",\"highlightNodes\":[\"global\",\"call\"],\"highlightEdges\":[\"global->call\"]},{\"id\":\"step-3\",\"title\":\"Step 3: New Local Scope Created\",\"description\":\"Each function call creates a brand new local scope. Variables declared with let or const inside the function are block-scoped to this function. Parameters and local variables live in this scope and are not accessible from outside the function.\",\"highlightNodes\":[\"call\",\"local\"],\"highlightEdges\":[\"call->local\"]},{\"id\":\"step-4\",\"title\":\"Step 4: Function Body Executes\",\"description\":\"The JavaScript engine executes the code inside the function body line by line. It has access to both local variables and variables from outer scopes through lexical scoping. If the function references outer variables, those references are resolved through the scope chain.\",\"highlightNodes\":[\"local\",\"execute\"],\"highlightEdges\":[\"local->execute\"]},{\"id\":\"step-5\",\"title\":\"Step 5: Value is Returned\",\"description\":\"When the function reaches a return statement or the end of its body, it produces a return value. If no return statement is present, the function returns undefined. The local scope is then cleaned up by garbage collection unless a closure is formed.\",\"highlightNodes\":[\"execute\",\"return\"],\"highlightEdges\":[\"execute->return\"]},{\"id\":\"step-6\",\"title\":\"Step 6: Closure Preserves Scope\",\"description\":\"If the function returns another function that references variables from the outer scope, a closure is formed. The closure keeps the outer variables alive even after the outer function has finished executing. This enables powerful patterns like data encapsulation and factory functions.\",\"highlightNodes\":[\"return\",\"closure\"],\"highlightEdges\":[\"return->closure\"]}]}" },
            ],
            lesson: { title: "Functions and Scope in JavaScript", content: "Functions are reusable blocks of code. Declaration (function greet() {} - hoisted), Expression (const greet = function() {} - not hoisted), Arrow (const greet = () => {} - concise, no own this). Parameters can have defaults: function greet(name = \"Guest\"). Rest parameters: function sum(...nums). Scope: Global, Function (var), Block (let/const). Lexical scope means inner functions can access outer variables (closures).", explanation: "This lesson covers function declarations, arrow functions, parameters, and scope rules." },
          },
          {
            title: "Control Flow & Loops",
            description: "Learn conditional statements, loops, and control flow patterns in JavaScript.",
            slug: "control-flow-loops", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "Conditional Statements", description: "Conditionals control which code executes based on boolean expressions. if/else handles binary decisions. else if chains handle multiple conditions. switch statements match a value against multiple cases (use break to prevent fall-through). The ternary operator (condition ? trueValue : falseValue) provides a concise inline conditional." },
              { title: "Loop Types", description: "JavaScript provides several loop constructs: for (init; condition; update) for counted iteration, while for condition-based iteration, do...while ensures at least one execution, for...of for iterating arrays and other iterables, and for...in for iterating object keys (though Object.keys() is often preferred)." },
              { title: "Loop Control", description: "break immediately exits the current loop. continue skips the rest of the current iteration and moves to the next. Labeled statements allow breaking out of nested loops. The return statement exits the entire function. Array methods (map, filter, forEach, reduce) are often more readable than traditional loops for data transformation." },
            ],
            examples: [
              {
                title: "FizzBuzz with Multiple Approaches",
                description: "Solving FizzBuzz using different loop and conditional patterns",
                starterCode: "function fizzBuzz(n) {\n  // Return array of results for numbers 1 to n\n  // Multiples of 3: 'Fizz'\n  // Multiples of 5: 'Buzz'\n  // Multiples of both: 'FizzBuzz'\n}",
                solutionCode: "function fizzBuzz(n) {\n  const results = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) {\n      results.push('FizzBuzz');\n    } else if (i % 3 === 0) {\n      results.push('Fizz');\n    } else if (i % 5 === 0) {\n      results.push('Buzz');\n    } else {\n      results.push(String(i));\n    }\n  }\n  return results;\n}\n\nfunction fizzBuzzSwitch(n) {\n  const results = [];\n  for (let i = 1; i <= n; i++) {\n    switch (true) {\n      case i % 15 === 0: results.push('FizzBuzz'); break;\n      case i % 3 === 0: results.push('Fizz'); break;\n      case i % 5 === 0: results.push('Buzz'); break;\n      default: results.push(String(i));\n    }\n  }\n  return results;\n}\n\nconsole.log(fizzBuzz(15));",
              },
            ],
            exercises: [
              {
                title: "Validate Password Strength",
                description: "Write a function that checks password strength: must be 8+ chars, have uppercase, lowercase, digit, and special character. Return an object with isValid and an array of failed requirements.",
                starterCode: "function validatePassword(password) {\n  const requirements = [\n    { name: 'length', test: (p) => p.length >= 8 },\n    { name: 'uppercase', test: (p) => /[A-Z]/.test(p) },\n    { name: 'lowercase', test: (p) => /[a-z]/.test(p) },\n    { name: 'digit', test: (p) => /[0-9]/.test(p) },\n    { name: 'special', test: (p) => /[!@#$%^&*]/.test(p) },\n  ];\n  // Loop through requirements and build result\n}",
                testCases: "'Abc123!@' passes all requirements; 'abc' fails length, uppercase, digit, special; '' fails all requirements; 'ABCDEF123!@' fails lowercase",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Loop Decision Flow", config: "{\"nodes\":[{\"id\":\"start\",\"label\":\"Start loop\",\"x\":250,\"y\":20},{\"id\":\"condition\",\"label\":\"Condition true?\",\"x\":250,\"y\":100},{\"id\":\"body\",\"label\":\"Execute body\",\"x\":250,\"y\":180},{\"id\":\"update\",\"label\":\"Update iterator\",\"x\":250,\"y\":260},{\"id\":\"end\",\"label\":\"Exit loop\",\"x\":420,\"y\":100}],\"edges\":[{\"from\":\"start\",\"to\":\"condition\"},{\"from\":\"condition\",\"to\":\"body\",\"label\":\"yes\"},{\"from\":\"condition\",\"to\":\"end\",\"label\":\"no\"},{\"from\":\"body\",\"to\":\"update\"},{\"from\":\"update\",\"to\":\"condition\"}]}" },
            ],
            lesson: { title: "Control Flow and Iteration", content: "Conditionals: if/else, else if chains, switch, ternary (condition ? trueVal : falseVal). Loops: for (init; condition; increment), while, do...while (runs at least once), for...of (iterables), for...in (object keys). break exits loop; continue skips to next. Falsy values: false, 0, \"\", null, undefined, NaN. Everything else is truthy.", explanation: "This lesson covers conditional statements, loops, and control flow patterns." },
          },
          {
            title: "Arrays & Objects",
            description: "Master JavaScript arrays and objects: creation, manipulation, iteration, and common methods.",
            slug: "arrays-objects", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "Array Methods", description: "Arrays have a rich set of methods: mutation methods (push, pop, unshift, shift, splice, sort, reverse) modify the original array, while non-mutation methods (map, filter, reduce, slice, concat, find, includes, join) return a new value. Prefer non-mutation methods for predictable code, especially in React state management." },
              { title: "Object Manipulation", description: "Objects store key-value pairs. Property access uses dot notation (obj.prop) or bracket notation (obj['prop']). Object.keys(), Object.values(), and Object.entries() convert objects to arrays for iteration. The spread operator ({...obj, newProp: 'value'}) creates shallow copies with modifications. Object.freeze() and Object.seal() control mutability." },
              { title: "Destructuring", description: "Destructuring extracts values from arrays and objects into individual variables. Array destructuring: const [first, second, ...rest] = arr. Object destructuring: const { name, age, ...other } = person. You can rename variables (const { name: fullName } = person), set defaults (const { x = 0 } = point), and destructure nested structures." },
            ],
            examples: [
              {
                title: "Data Transformation Pipeline",
                description: "Using array methods to transform and analyze data",
                starterCode: "const orders = [\n  { id: 1, product: 'Widget', price: 9.99, quantity: 3 },\n  { id: 2, product: 'Gadget', price: 14.99, quantity: 1 },\n  { id: 3, product: 'Widget', price: 9.99, quantity: 5 },\n  { id: 4, product: 'Doohickey', price: 4.99, quantity: 10 },\n];\n\nfunction analyzeOrders(orderList) {\n  // Your code: calculate total revenue, find most popular product\n}",
                solutionCode: "const orders = [\n  { id: 1, product: 'Widget', price: 9.99, quantity: 3 },\n  { id: 2, product: 'Gadget', price: 14.99, quantity: 1 },\n  { id: 3, product: 'Widget', price: 9.99, quantity: 5 },\n  { id: 4, product: 'Doohickey', price: 4.99, quantity: 10 },\n];\n\nfunction analyzeOrders(orderList) {\n  const totalRevenue = orderList.reduce((sum, order) => {\n    return sum + order.price * order.quantity;\n  }, 0);\n\n  const productSales = orderList.reduce((acc, order) => {\n    acc[order.product] = (acc[order.product] || 0) + order.quantity;\n    return acc;\n  }, {});\n\n  const popularProduct = Object.entries(productSales)\n    .sort(([, a], [, b]) => b - a)[0];\n\n  const highValue = orderList\n    .filter(o => o.price * o.quantity > 30)\n    .map(o => ({ id: o.id, product: o.product, total: o.price * o.quantity }));\n\n  return { totalRevenue, popularProduct, highValue };\n}\n\nconsole.log(analyzeOrders(orders));",
              },
            ],
            exercises: [
              {
                title: "Build a Shopping Cart",
                description: "Create a shopping cart system that can add items, remove items, update quantities, and calculate totals",
                starterCode: "const cart = {\n  items: [],\n  addItem(product, price, quantity = 1) {\n    // Add item or update quantity if already exists\n  },\n  removeItem(product) {\n    // Remove item from cart\n  },\n  getTotal() {\n    // Calculate total price\n  },\n  getSummary() {\n    // Return { itemCount, totalItems, total }\n  },\n};",
                testCases: "Adding same product twice increments quantity; Removing product removes it from items array; getTotal returns correct sum of price * quantity; getSummary returns correct itemCount, totalItems, and total; Empty cart has total of 0",
              },
            ],
            visualizations: [
              { type: "memory", title: "Array vs Object Memory Layout", config: "{\"arrays\":[{\"name\":\"fruits\",\"elements\":[\"apple\",\"banana\",\"cherry\"],\"indices\":[0,1,2]}],\"objects\":[{\"name\":\"person\",\"properties\":[{\"key\":\"name\",\"value\":\"'Alice'\"},{\"key\":\"age\",\"value\":\"25\"},{\"key\":\"city\",\"value\":\"'NYC'\"}]}]}" },
              { type: "flowchart", title: "Data Structure Operations Step-by-Step Flow", config: "{\"nodes\":[{\"id\":\"create\",\"label\":\"Create\\nData Structure\",\"x\":250,\"y\":20},{\"id\":\"array\",\"label\":\"Array\\n[Ordered List]\",\"x\":100,\"y\":120},{\"id\":\"object\",\"label\":\"Object\\n{Key-Value Pairs}\",\"x\":400,\"y\":120},{\"id\":\"iterate\",\"label\":\"Iterate\\n(Loop Through)\",\"x\":250,\"y\":220},{\"id\":\"transform\",\"label\":\"Transform\\n(map/filter/reduce)\",\"x\":250,\"y\":320},{\"id\":\"result\",\"label\":\"Result\\n(New Data)\",\"x\":250,\"y\":420}],\"edges\":[{\"from\":\"create\",\"to\":\"array\",\"label\":\"ordered\"},{\"from\":\"create\",\"to\":\"object\",\"label\":\"key-value\"},{\"from\":\"array\",\"to\":\"iterate\",\"label\":\"for...of\"},{\"from\":\"object\",\"to\":\"iterate\",\"label\":\"Object.entries()\"},{\"from\":\"iterate\",\"to\":\"transform\",\"label\":\"process\"},{\"from\":\"transform\",\"to\":\"result\",\"label\":\"output\"}]},{\"id\":\"step-2\",\"title\":\"Step 2: Create an Array\",\"description\":\"Arrays store ordered lists of values accessed by numeric index starting from 0. Use square bracket notation like [1, 2, 3] or the Array constructor. Arrays come with powerful methods like push, pop, map, filter, and reduce for data manipulation.\",\"highlightNodes\":[\"create\",\"array\"],\"highlightEdges\":[\"create->array\"]},{\"id\":\"step-3\",\"title\":\"Step 3: Create an Object\",\"description\":\"Objects store data as key-value pairs where each key maps to a specific value. Use curly brace notation. Properties are accessed via dot notation (obj.name) or bracket notation (obj[\\\"name\\\"]). Use Object.keys(), values(), and entries() to inspect object contents.\",\"highlightNodes\":[\"create\",\"object\"],\"highlightEdges\":[\"create->object\"]},{\"id\":\"step-4\",\"title\":\"Step 4: Iterate Over Elements\",\"description\":\"Loop through your data structure to access each element. For arrays, use for...of, forEach, or a traditional for loop. For objects, use Object.keys(), Object.values(), or Object.entries() to convert to iterable arrays before looping.\",\"highlightNodes\":[\"array\",\"object\",\"iterate\"],\"highlightEdges\":[\"array->iterate\",\"object->iterate\"]},{\"id\":\"step-5\",\"title\":\"Step 5: Transform the Data\",\"description\":\"Apply transformation methods to process your data. Use map to convert each element, filter to keep only matching elements, and reduce to compute a single value from all elements. These methods return new data without modifying the original data structure.\",\"highlightNodes\":[\"iterate\",\"transform\"],\"highlightEdges\":[\"iterate->transform\"]},{\"id\":\"step-6\",\"title\":\"Step 6: Obtain the Result\",\"description\":\"The transformation produces a new array or value. This result can be stored in a variable, passed to another function, or rendered in the UI. The original data structure remains unchanged following functional programming principles.\",\"highlightNodes\":[\"transform\",\"result\"],\"highlightEdges\":[\"transform->result\"]}]}" },
            ],
            lesson: { title: "Arrays and Objects Deep Dive", content: "Arrays are ordered lists. Methods: push/pop (end), unshift/shift (start), map (transform), filter (keep matching), reduce (accumulate), find (first match), includes (contains), slice (extract), splice (modify). Objects are key-value pairs. Access with dot or bracket notation. Object.keys/values/entries for iteration. Spread operator {...obj} for shallow copies. Destructuring: const { name, age } = person; const [first, second] = arr;", explanation: "This lesson covers arrays and objects — the two most important data structures in JavaScript." },
          },
          {
            title: "DOM Manipulation",
            description: "Learn to interact with the Document Object Model: selecting, modifying, and creating elements.",
            slug: "dom-manipulation", difficulty: 3, prerequisites: [0],
            concepts: [
              { title: "DOM Selection", description: "The DOM provides methods to select elements: document.getElementById('id') for single element by ID, document.querySelector('.class') for first CSS selector match, document.querySelectorAll('div') for all matches (returns NodeList). querySelectorAll results are static (won't update if DOM changes), while getElementsByClassName returns a live HTMLCollection." },
              { title: "DOM Manipulation", description: "You can modify elements through their properties: element.textContent (text only, safe), element.innerHTML (HTML string, XSS risk), element.setAttribute('attr', 'value'), element.classList.add/remove/toggle('class'), element.style.property = 'value'. Creating elements: document.createElement('div'), then parent.appendChild(child) or parent.insertBefore(new, reference)." },
              { title: "DOM Traversal", description: "Navigate the DOM tree using: parentNode (parent element), children (HTMLCollection of child elements), firstElementChild/lastElementChild, nextElementSibling/previousElementSibling. These allow you to move around the DOM without needing selectors. Be careful: text nodes and comment nodes are also children when using childNodes." },
            ],
            examples: [
              {
                title: "Dynamic Todo List",
                description: "Building a todo list that adds, removes, and toggles items using DOM manipulation",
                starterCode: "<ul id=\"todo-list\"></ul>\n<input id=\"todo-input\" type=\"text\" placeholder=\"Add todo...\">\n<button id=\"add-btn\">Add</button>\n\n<script>\n  const list = document.getElementById('todo-list');\n  const input = document.getElementById('todo-input');\n  const btn = document.getElementById('add-btn');\n\n  btn.addEventListener('click', () => {\n    // Create and add new todo item\n  });\n</script>",
                solutionCode: "<ul id=\"todo-list\"></ul>\n<input id=\"todo-input\" type=\"text\" placeholder=\"Add todo...\">\n<button id=\"add-btn\">Add</button>\n\n<script>\n  const list = document.getElementById('todo-list');\n  const input = document.getElementById('todo-input');\n  const btn = document.getElementById('add-btn');\n\n  btn.addEventListener('click', () => {\n    const text = input.value.trim();\n    if (!text) return;\n\n    const li = document.createElement('li');\n    li.className = 'todo-item';\n\n    const span = document.createElement('span');\n    span.textContent = text;\n    span.addEventListener('click', () => {\n      span.classList.toggle('completed');\n    });\n\n    const deleteBtn = document.createElement('button');\n    deleteBtn.textContent = '✕';\n    deleteBtn.addEventListener('click', () => {\n      li.remove();\n    });\n\n    li.appendChild(span);\n    li.appendChild(deleteBtn);\n    list.appendChild(li);\n    input.value = '';\n    input.focus();\n  });\n</script>",
              },
            ],
            exercises: [
              {
                title: "Build a Dynamic Table",
                description: "Create a table that renders data from an array of objects. Add functionality to sort by clicking column headers and filter rows with a search input.",
                starterCode: "<input id=\"search\" type=\"text\" placeholder=\"Filter...\">\n<table id=\"data-table\">\n  <thead></thead>\n  <tbody></tbody>\n</table>\n\n<script>\n  const data = [\n    { name: 'Alice', age: 25, city: 'New York' },\n    { name: 'Bob', age: 30, city: 'London' },\n    { name: 'Charlie', age: 35, city: 'Tokyo' },\n  ];\n\n  function renderTable(rows) {\n    // Render thead and tbody\n  }\n</script>",
                testCases: "Table renders all data rows; Clicking a column header sorts by that column (ascending/descending toggle); Typing in search filters rows by name (case-insensitive); Table handles empty data gracefully",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "DOM Tree Structure", config: "{\"nodes\":[{\"id\":\"doc\",\"label\":\"document\",\"x\":250,\"y\":20},{\"id\":\"html\",\"label\":\"<html>\",\"x\":250,\"y\":90},{\"id\":\"head\",\"label\":\"<head>\",\"x\":120,\"y\":170},{\"id\":\"body\",\"label\":\"<body>\",\"x\":380,\"y\":170},{\"id\":\"title\",\"label\":\"<title>\",\"x\":40,\"y\":260},{\"id\":\"div1\",\"label\":\"<div#app>\",\"x\":300,\"y\":260},{\"id\":\"div2\",\"label\":\"<div.footer>\",\"x\":460,\"y\":260},{\"id\":\"h1\",\"label\":\"<h1>\",\"x\":250,\"y\":340},{\"id\":\"p\",\"label\":\"<p>\",\"x\":350,\"y\":340}],\"edges\":[{\"from\":\"doc\",\"to\":\"html\"},{\"from\":\"html\",\"to\":\"head\"},{\"from\":\"html\",\"to\":\"body\"},{\"from\":\"head\",\"to\":\"title\"},{\"from\":\"body\",\"to\":\"div1\"},{\"from\":\"body\",\"to\":\"div2\"},{\"from\":\"div1\",\"to\":\"h1\"},{\"from\":\"div1\",\"to\":\"p\"}]}" },
            ],
            lesson: { title: "DOM Manipulation Fundamentals", content: "The DOM is a tree representation of HTML. Select elements: document.getElementById(), querySelector(), querySelectorAll(). Modify: textContent, innerHTML, setAttribute(), classList.add/remove/toggle(), style.property. Create: document.createElement(), parent.appendChild(), element.remove(). Events: element.addEventListener('click', handler). Event object has target, preventDefault(). Event delegation handles events on parent for dynamic children.", explanation: "This lesson covers DOM manipulation — selecting, modifying, and creating HTML elements with JavaScript." },
          },
          {
            title: "Events & Event Handling",
            description: "Master JavaScript events: event types, listeners, delegation, and the event object.",
            slug: "events-event-handling", difficulty: 3, prerequisites: [0, 1],
            concepts: [
              { title: "Event Types", description: "Browser events cover user interactions: Mouse events (click, dblclick, mousedown, mouseup, mousemove, mouseover, mouseout), Keyboard events (keydown, keyup, keypress), Form events (submit, change, focus, blur, input), Document events (DOMContentLoaded, load, scroll, resize), and Touch events (touchstart, touchmove, touchend)." },
              { title: "Event Bubbling & Capturing", description: "Events propagate in three phases: Capturing phase (document → target), Target phase (at the element), Bubbling phase (target → document). By default, listeners use the bubbling phase. Use addEventListener(type, handler, { capture: true }) for capturing. event.stopPropagation() stops propagation. event.stopImmediatePropagation() also stops other listeners on the same element." },
              { title: "Event Delegation", description: "Event delegation attaches a single listener to a parent element instead of individual listeners to each child. When an event bubbles up, use event.target to identify which child was interacted with. This pattern is more efficient for dynamic lists (items added/removed) and reduces memory usage. Use event.target.closest('selector') to find the nearest matching ancestor." },
            ],
            examples: [
              {
                title: "Event Delegation Pattern",
                description: "Using event delegation to handle clicks on dynamically added list items",
                starterCode: "<ul id=\"list\">\n  <li>Item 1 <button class=\"delete\">x</button></li>\n  <li>Item 2 <button class=\"delete\">x</button></li>\n</ul>\n<button id=\"add\">Add Item</button>\n\n<script>\n  const list = document.getElementById('list');\n  // Add event delegation for delete buttons\n  // Add handler for 'Add Item' button\n</script>",
                solutionCode: "<ul id=\"list\">\n  <li>Item 1 <button class=\"delete\">x</button></li>\n  <li>Item 2 <button class=\"delete\">x</button></li>\n</ul>\n<button id=\"add\">Add Item</button>\n\n<script>\n  const list = document.getElementById('list');\n  const addBtn = document.getElementById('add');\n  let count = 2;\n\n  list.addEventListener('click', (event) => {\n    if (event.target.classList.contains('delete')) {\n      event.target.parentElement.remove();\n    } else if (event.target.tagName === 'LI') {\n      event.target.classList.toggle('selected');\n    }\n  });\n\n  addBtn.addEventListener('click', () => {\n    count++;\n    const li = document.createElement('li');\n    li.innerHTML = `Item ${count} <button class=\"delete\">x</button>`;\n    list.appendChild(li);\n  });\n</script>",
              },
            ],
            exercises: [
              {
                title: "Build a Form with Live Validation",
                description: "Create a form that validates fields in real-time as the user types. Show error messages next to each field and disable the submit button until all fields are valid.",
                starterCode: "<form id=\"signup\">\n  <div class=\"field\">\n    <input id=\"username\" type=\"text\" placeholder=\"Username (3-20 chars)\">\n    <span class=\"error\"></span>\n  </div>\n  <div class=\"field\">\n    <input id=\"email\" type=\"email\" placeholder=\"Email\">\n    <span class=\"error\"></span>\n  </div>\n  <button id=\"submit-btn\" disabled>Submit</button>\n</form>\n\n<script>\n  // Add input event listeners for live validation\n  // Show/hide error messages\n  // Enable submit button only when all fields valid\n</script>",
                testCases: "Username shows error if less than 3 characters; Email shows error if not valid format; Submit button is disabled when any field is invalid; Submit button becomes enabled when all fields are valid; Error messages update in real-time as user types",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Event Propagation Phases", config: "{\"nodes\":[{\"id\":\"target\",\"label\":\"Click on button\",\"x\":250,\"y\":20},{\"id\":\"capture1\",\"label\":\"Capture: document\",\"x\":250,\"y\":90},{\"id\":\"capture2\",\"label\":\"Capture: body\",\"x\":250,\"y\":150},{\"id\":\"capture3\",\"label\":\"Capture: div\",\"x\":250,\"y\":210},{\"id\":\"targetPhase\",\"label\":\"Target: button\",\"x\":250,\"y\":270},{\"id\":\"bubble3\",\"label\":\"Bubble: div\",\"x\":250,\"y\":330},{\"id\":\"bubble2\",\"label\":\"Bubble: body\",\"x\":250,\"y\":390},{\"id\":\"bubble1\",\"label\":\"Bubble: document\",\"x\":250,\"y\":450}],\"edges\":[{\"from\":\"target\",\"to\":\"capture1\"},{\"from\":\"capture1\",\"to\":\"capture2\"},{\"from\":\"capture2\",\"to\":\"capture3\"},{\"from\":\"capture3\",\"to\":\"targetPhase\"},{\"from\":\"targetPhase\",\"to\":\"bubble3\"},{\"from\":\"bubble3\",\"to\":\"bubble2\"},{\"from\":\"bubble2\",\"to\":\"bubble1\"}]}" },
            ],
            lesson: { title: "Event Handling Deep Dive", content: "Events are user interactions: click, submit, keydown, mouseover, scroll. Add listeners with addEventListener(type, handler, options). Event object provides target, type, preventDefault(), stopPropagation(). Event bubbling: events bubble up from target to ancestors. Event delegation: attach listener to parent, use event.target to identify which child was clicked. Remove listeners with removeEventListener. Custom events: new CustomEvent('name', { detail: data }).", explanation: "This lesson covers JavaScript event handling, event delegation, and the event object." },
          },
          {
            title: "Async JavaScript",
            description: "Master asynchronous programming: callbacks, promises, async/await, and the event loop.",
            slug: "async-javascript", difficulty: 4, prerequisites: [0, 1],
            concepts: [
              { title: "The Event Loop", description: "JavaScript is single-threaded but handles async operations via the event loop. Synchronous code runs on the call stack. Async operations (setTimeout, fetch, event listeners) are offloaded to Web APIs. When complete, their callbacks go to the callback queue (macrotasks) or microtask queue (Promise callbacks). The event loop checks: is the call stack empty? Then process all microtasks, then one macrotask, repeat." },
              { title: "Promises", description: "A Promise represents a future value. States: pending → fulfilled (resolved) or rejected. Create with new Promise((resolve, reject) => {}). Chain with .then(onFulfilled, onRejected) and .catch(onRejected). .finally() runs regardless. Static methods: Promise.all() (all succeed or one fails), Promise.allSettled() (wait for all, regardless), Promise.race() (first to settle), Promise.any() (first to fulfill)." },
              { title: "async/await", description: "async/await is syntactic sugar over Promises. An async function always returns a Promise. await pauses execution until the Promise resolves, making async code read like synchronous code. Use try/catch for error handling with await. You can await any thenable. Top-level await is available in ES modules. Avoid sequential awaits when operations are independent — use Promise.all() instead." },
            ],
            examples: [
              {
                title: "Promise Chaining vs async/await",
                description: "Comparing the same operation using Promise chains and async/await",
                starterCode: "function fetchUser(id) {\n  return new Promise(resolve => setTimeout(() => resolve({ id, name: 'User ' + id }), 500));\n}\n\nfunction fetchPosts(userId) {\n  return new Promise(resolve => setTimeout(() => resolve([{ id: 1, title: 'Post 1' }]), 500));\n}\n\n// Implement using Promise chains\nfunction getUserWithPosts(id) {\n  // Your code here\n}",
                solutionCode: "function fetchUser(id) {\n  return new Promise(resolve => setTimeout(() => resolve({ id, name: 'User ' + id }), 500));\n}\n\nfunction fetchPosts(userId) {\n  return new Promise(resolve => setTimeout(() => resolve([{ id: 1, title: 'Post 1' }, { id: 2, title: 'Post 2' }]), 500));\n}\n\nfunction getUserWithPosts(id) {\n  return fetchUser(id).then(user => {\n    return fetchPosts(user.id).then(posts => {\n      return { ...user, posts };\n    });\n  });\n}\n\nasync function getUserWithPostsAsync(id) {\n  try {\n    const user = await fetchUser(id);\n    const posts = await fetchPosts(user.id);\n    return { ...user, posts };\n  } catch (error) {\n    console.error('Failed to fetch:', error);\n    throw error;\n  }\n}\n\ngetUserWithPostsAsync(1).then(console.log);",
              },
            ],
            exercises: [
              {
                title: "Build a Promise-based Retry Function",
                description: "Create a function `retry(fn, maxAttempts, delay)` that calls an async function and retries on failure up to maxAttempts times, waiting delay ms between attempts",
                starterCode: "async function retry(fn, maxAttempts = 3, delay = 1000) {\n  // Your code: try calling fn, if it fails, wait and retry\n  // Return the result if successful\n  // Throw the last error if all attempts fail\n}\n\n// Test with an unreliable function\nlet attempt = 0;\nasync function unreliableFetch() {\n  attempt++;\n  if (attempt < 3) throw new Error('Network error');\n  return 'Data received!';\n}",
                testCases: "Succeeds on first attempt if fn resolves immediately; Retries on failure and succeeds on 3rd attempt; Throws error after all maxAttempts are exhausted; Waits the specified delay between retries; Returns the correct resolved value",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Event Loop Microtasks vs Macrotasks", config: "{\"nodes\":[{\"id\":\"sync\",\"label\":\"Execute sync code\",\"x\":250,\"y\":20},{\"id\":\"stack\",\"label\":\"Call stack empty?\",\"x\":250,\"y\":100},{\"id\":\"micro\",\"label\":\"Process all\nmicrotasks\",\"x\":250,\"y\":180},{\"id\":\"macro\",\"label\":\"Process one\nmacrotask\",\"x\":250,\"y\":260},{\"id\":\"render\",\"label\":\"Render if needed\",\"x\":250,\"y\":340},{\"id\":\"repeat\",\"label\":\"Repeat\",\"x\":250,\"y\":420}],\"edges\":[{\"from\":\"sync\",\"to\":\"stack\"},{\"from\":\"stack\",\"to\":\"micro\",\"label\":\"yes\"},{\"from\":\"stack\",\"to\":\"sync\",\"label\":\"no\"},{\"from\":\"micro\",\"to\":\"macro\"},{\"from\":\"macro\",\"to\":\"render\"},{\"from\":\"render\",\"to\":\"repeat\"},{\"from\":\"repeat\",\"to\":\"stack\"}]}" },
            ],
            lesson: { title: "Async JavaScript Fundamentals", content: "JavaScript is single-threaded but handles async operations via the event loop. Callbacks were the original pattern but lead to callback hell. Promises represent a future value with .then()/.catch() chaining. async/await (syntactic sugar over promises) makes async code look synchronous. The event loop processes microtasks (Promise callbacks) before macrotasks (setTimeout). Use try/catch with await for error handling. Promise.all() runs multiple promises concurrently.", explanation: "This lesson covers asynchronous JavaScript: callbacks, promises, async/await, and the event loop." },
          },
          {
            title: "Fetch API & HTTP",
            description: "Learn to make HTTP requests, handle responses, and work with REST APIs using the Fetch API.",
            slug: "fetch-api-http", difficulty: 3, prerequisites: [0, 3],
            concepts: [
              { title: "Fetch API", description: "fetch(url, options) returns a Promise that resolves to a Response object. Default method is GET. Options include: method (GET, POST, PUT, DELETE), headers (Content-Type, Authorization), body (JSON.stringify(data) for POST/PUT), mode (cors, no-cors, same-origin), and credentials (include, same-origin). Always check response.ok before processing the response body." },
              { title: "Response Handling", description: "The Response object provides methods to parse the body: .json() for JSON, .text() for plain text, .blob() for binary data, .formData() for form data, .arrayBuffer() for raw bytes. Properties: .ok (status 200-299), .status (HTTP status code), .statusText, .headers (Headers object). Each body method can only be called once per response." },
              { title: "REST API Patterns", description: "REST (Representational State Transfer) uses HTTP methods for CRUD: GET (read), POST (create), PUT/PATCH (update), DELETE (remove). Resources are identified by URLs (/users, /users/:id). Use query parameters for filtering (?page=1&limit=10). Always handle errors: network failures, non-2xx status codes, and malformed responses. Use AbortController for request cancellation." },
            ],
            examples: [
              {
                title: "API Client with Error Handling",
                description: "Building a reusable API client with proper error handling and request/response interceptors",
                starterCode: "async function apiClient(url, options = {}) {\n  // Add default headers\n  // Handle response\n  // Parse JSON\n  // Throw on error\n}",
                solutionCode: "async function apiClient(url, options = {}) {\n  const defaultHeaders = {\n    'Content-Type': 'application/json',\n  };\n\n  const config = {\n    ...options,\n    headers: {\n      ...defaultHeaders,\n      ...options.headers,\n    },\n  };\n\n  try {\n    const response = await fetch(url, config);\n\n    if (!response.ok) {\n      const errorBody = await response.json().catch(() => ({}));\n      throw new Error(\n        `HTTP ${response.status}: ${errorBody.message || response.statusText}`\n      );\n    }\n\n    if (response.status === 204) return null;\n    return await response.json();\n  } catch (error) {\n    if (error.name === 'TypeError') {\n      throw new Error('Network error: Unable to connect to server');\n    }\n    throw error;\n  }\n}\n\nasync function getUsers() {\n  const users = await apiClient('https://jsonplaceholder.typicode.com/users');\n  console.log('Users:', users);\n}\n\nasync function createPost(title, body, userId) {\n  const post = await apiClient('https://jsonplaceholder.typicode.com/posts', {\n    method: 'POST',\n    body: JSON.stringify({ title, body, userId }),\n  });\n  console.log('Created:', post);\n}",
              },
            ],
            exercises: [
              {
                title: "Build a Paginated Data Fetcher",
                description: "Create a function that fetches all pages of a paginated API, handles loading states, and supports cancellation",
                starterCode: "async function fetchAllPages(baseUrl, pageSize = 10) {\n  const controller = new AbortController();\n  let allData = [];\n  let page = 1;\n  let hasMore = true;\n\n  // Fetch pages until no more data\n  // Support cancellation via controller\n  // Return { data, totalPages, totalItems }\n\n  return { data: allData, cancel: () => controller.abort() };\n}",
                testCases: "Fetches all pages until no more data; Returns correct total count; Cancel function aborts ongoing requests; Handles HTTP errors gracefully; Works with empty response",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Fetch Request Lifecycle", config: "{\"nodes\":[{\"id\":\"call\",\"label\":\"fetch(url, options)\",\"x\":250,\"y\":20},{\"id\":\"dns\",\"label\":\"DNS Resolution\",\"x\":250,\"y\":90},{\"id\":\"connect\",\"label\":\"TCP/TLS Connect\",\"x\":250,\"y\":160},{\"id\":\"send\",\"label\":\"Send Request\",\"x\":250,\"y\":230},{\"id\":\"wait\",\"label\":\"Wait for Response\",\"x\":250,\"y\":300},{\"id\":\"status\",\"label\":\"response.ok?\",\"x\":250,\"y\":370},{\"id\":\"parse\",\"label\":\"Parse JSON\",\"x\":120,\"y\":440},{\"id\":\"error\",\"label\":\"Handle Error\",\"x\":380,\"y\":440},{\"id\":\"done\",\"label\":\"Return Data\",\"x\":120,\"y\":510},{\"id\":\"throw\",\"label\":\"Throw Error\",\"x\":380,\"y\":510}],\"edges\":[{\"from\":\"call\",\"to\":\"dns\"},{\"from\":\"dns\",\"to\":\"connect\"},{\"from\":\"connect\",\"to\":\"send\"},{\"from\":\"send\",\"to\":\"wait\"},{\"from\":\"wait\",\"to\":\"status\"},{\"from\":\"status\",\"to\":\"parse\",\"label\":\"yes\"},{\"from\":\"status\",\"to\":\"error\",\"label\":\"no\"},{\"from\":\"parse\",\"to\":\"done\"},{\"from\":\"error\",\"to\":\"throw\"}]}" },
            ],
            lesson: { title: "Fetch API and HTTP Requests", content: "fetch(url, options) returns a Promise. Default method is GET; use method: 'POST' with body for sending data. Response provides .json(), .text(), .status, .ok, .headers. Always check response.ok before processing. Common patterns: GET for reading, POST for creating, PUT/PATCH for updating, DELETE for removing. Set Content-Type header for JSON: headers: { 'Content-Type': 'application/json' }. Use JSON.stringify() for request body. Handle errors with .catch() or try/catch with async/await.", explanation: "This lesson covers making HTTP requests with the Fetch API and working with REST APIs." },
          },
        ],
      },
      {
        title: "Phase 4: Browser",
        description: "Learn browser APIs, web storage, and performance optimization techniques.",
        slug: "phase-4-browser",
        topics: [
          {
            title: "Browser APIs",
            description: "Explore browser APIs: Geolocation, Notifications, History, and more.",
            slug: "browser-apis", difficulty: 3, prerequisites: [0],
            concepts: [
              { title: "Geolocation API", description: "The Geolocation API allows web applications to access the user's physical location (with permission). navigator.geolocation.getCurrentPosition(success, error, options) gets a one-time position. navigator.geolocation.watchPosition() tracks position continuously. The position object includes latitude, longitude, accuracy, altitude, speed, and timestamp." },
              { title: "Notification API", description: "The Notification API displays system notifications to the user. Request permission first: Notification.requestPermission() returns 'granted', 'denied', or 'default'. Create notification: new Notification('Title', { body: 'Message', icon: 'icon.png' }). Service workers can show notifications even when the page is closed. Be respectful — only send notifications the user has opted into." },
              { title: "History API", description: "The History API enables SPA (Single Page Application) routing without page reloads. history.pushState(state, title, url) adds a new history entry. history.replaceState() modifies the current entry. The popstate event fires when the user navigates back/forward. The state object is stored with each entry and can be accessed via history.state or event.state." },
            ],
            examples: [
              {
                title: "Geolocation with Error Handling",
                description: "Getting user location with proper error handling and fallback",
                starterCode: "function getUserLocation() {\n  // Get user position\n  // Handle errors (permission denied, timeout, unavailable)\n  // Return promise with coordinates\n}",
                solutionCode: "function getUserLocation() {\n  return new Promise((resolve, reject) => {\n    if (!navigator.geolocation) {\n      reject(new Error('Geolocation is not supported by your browser'));\n      return;\n    }\n\n    navigator.geolocation.getCurrentPosition(\n      (position) => {\n        resolve({\n          latitude: position.coords.latitude,\n          longitude: position.coords.longitude,\n          accuracy: position.coords.accuracy,\n        });\n      },\n      (error) => {\n        switch (error.code) {\n          case error.PERMISSION_DENIED:\n            reject(new Error('User denied location permission'));\n            break;\n          case error.POSITION_UNAVAILABLE:\n            reject(new Error('Location information is unavailable'));\n            break;\n          case error.TIMEOUT:\n            reject(new Error('Location request timed out'));\n            break;\n          default:\n            reject(new Error('Unknown error occurred'));\n        }\n      },\n      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }\n    );\n  });\n}\n\ngetUserLocation()\n  .then(loc => console.log(`You are at ${loc.latitude}, ${loc.longitude}`))\n  .catch(err => console.error(err.message));",
              },
            ],
            exercises: [
              {
                title: "Build a Simple SPA Router",
                description: "Create a basic client-side router using the History API that handles navigation between pages without reloading",
                starterCode: "const routes = {\n  '/': () => '<h1>Home</h1><p>Welcome!</p>',\n  '/about': () => '<h1>About</h1><p>About us page</p>',\n  '/contact': () => '<h1>Contact</h1><p>Contact form here</p>',\n};\n\nfunction navigate(path) {\n  // Use history.pushState and render the route\n}\n\n// Handle back/forward buttons\n// Handle initial page load\n// Render content into #app div",
                testCases: "Clicking navigation links updates URL without page reload; Back/forward browser buttons work correctly; Direct URL access renders the correct page; Unknown routes show a 404 page; Navigation state is properly managed",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Browser API Permission Flow", config: "{\"nodes\":[{\"id\":\"call\",\"label\":\"API call made\",\"x\":250,\"y\":20},{\"id\":\"support\",\"label\":\"API supported?\",\"x\":250,\"y\":100},{\"id\":\"perm\",\"label\":\"Permission granted?\",\"x\":250,\"y\":180},{\"id\":\"prompt\",\"label\":\"Show permission prompt\",\"x\":100,\"y\":260},{\"id\":\"execute\",\"label\":\"Execute API\",\"x\":400,\"y\":260},{\"id\":\"error\",\"label\":\"Handle error\",\"x\":100,\"y\":340},{\"id\":\"result\",\"label\":\"Return result\",\"x\":400,\"y\":340}],\"edges\":[{\"from\":\"call\",\"to\":\"support\"},{\"from\":\"support\",\"to\":\"perm\",\"label\":\"yes\"},{\"from\":\"support\",\"to\":\"error\",\"label\":\"no\"},{\"from\":\"perm\",\"to\":\"execute\",\"label\":\"yes\"},{\"from\":\"perm\",\"to\":\"prompt\",\"label\":\"no\"},{\"from\":\"prompt\",\"to\":\"execute\"},{\"from\":\"execute\",\"to\":\"result\"}]}" },
            ],
            lesson: { title: "Browser APIs Overview", content: "Modern browsers provide powerful APIs beyond the DOM. Geolocation API: navigator.geolocation.getCurrentPosition() for location. Notification API: new Notification() for desktop alerts (requires permission). History API: history.pushState() for SPA routing. Clipboard API: navigator.clipboard.writeText() for copy/paste. Intersection Observer: observe elements entering viewport. requestAnimationFrame: smooth animations. Web Workers: background threads for heavy computation.", explanation: "This lesson explores browser APIs: Geolocation, Notifications, History, and more." },
          },
          {
            title: "Web Storage",
            description: "Learn client-side storage: localStorage, sessionStorage, and IndexedDB.",
            slug: "web-storage", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "localStorage", description: "localStorage provides persistent key-value storage that survives browser restarts. Data is stored as strings (use JSON.stringify/parse for objects). Storage limit is ~5-10MB per origin. API: localStorage.setItem(key, value), getItem(key), removeItem(key), clear(). The storage event fires when localStorage changes from another tab/window. Synchronous API — avoid storing large data." },
              { title: "sessionStorage", description: "sessionStorage is identical to localStorage in API but data is cleared when the tab/window closes. Each tab has its own sessionStorage. Useful for temporary state like form data, wizard steps, or filters. Data is not shared between tabs. Like localStorage, it's synchronous and limited to ~5MB." },
              { title: "IndexedDB", description: "IndexedDB is a transactional, asynchronous NoSQL database for large structured data. It supports indexes, cursors, and transactions. Use the idb library for a Promise-based wrapper. Create object stores, put/get/delete records, and query with indexes. Ideal for offline data, cached API responses, and large datasets that exceed localStorage limits." },
            ],
            examples: [
              {
                title: "localStorage with Expiry",
                description: "Implementing localStorage with TTL (time-to-live) support",
                starterCode: "const storage = {\n  set(key, value, ttlMs) {\n    // Store value with expiry timestamp\n  },\n  get(key) {\n    // Retrieve value, return null if expired\n  },\n};",
                solutionCode: "const storage = {\n  set(key, value, ttlMs = null) {\n    const item = {\n      value,\n      expiry: ttlMs ? Date.now() + ttlMs : null,\n    };\n    localStorage.setItem(key, JSON.stringify(item));\n  },\n\n  get(key) {\n    const raw = localStorage.getItem(key);\n    if (!raw) return null;\n\n    const item = JSON.parse(raw);\n    if (item.expiry && Date.now() > item.expiry) {\n      localStorage.removeItem(key);\n      return null;\n    }\n    return item.value;\n  },\n\n  remove(key) {\n    localStorage.removeItem(key);\n  },\n\n  clear() {\n    localStorage.clear();\n  },\n};\n\nstorage.set('token', 'abc123', 60000);\nconsole.log(storage.get('token'));\nsetTimeout(() => console.log(storage.get('token')), 61000);",
              },
            ],
            exercises: [
              {
                title: "Build a Cached API Client",
                description: "Create an API client that caches responses in localStorage with a configurable TTL. Cache hits return immediately, cache misses fetch from the network.",
                starterCode: "class CachedApiClient {\n  constructor(defaultTTL = 300000) {\n    this.defaultTTL = defaultTTL;\n  }\n\n  async fetch(url, options = {}) {\n    // Check cache first\n    // If cached and not expired, return cached data\n    // If not cached or expired, fetch from network\n    // Store in cache and return\n  }\n\n  clearCache() {\n    // Clear all cached entries\n  }\n}",
                testCases: "First call fetches from network and caches; Second call with same URL returns cached data; Expired cache triggers new network request; Different URLs are cached independently; clearCache removes all cached entries",
              },
            ],
            visualizations: [
              { type: "memory", title: "Web Storage Comparison", config: "{\"comparison\":[{\"name\":\"localStorage\",\"capacity\":\"5-10MB\",\"persistence\":\"Permanent\",\"scope\":\"Per origin\",\"api\":\"Synchronous\",\"dataType\":\"Strings only\"},{\"name\":\"sessionStorage\",\"capacity\":\"5-10MB\",\"persistence\":\"Tab session\",\"scope\":\"Per tab\",\"api\":\"Synchronous\",\"dataType\":\"Strings only\"},{\"name\":\"IndexedDB\",\"capacity\":\"50MB+ (varies)\",\"persistence\":\"Permanent\",\"scope\":\"Per origin\",\"api\":\"Asynchronous\",\"dataType\":\"Objects, files, blobs\"},{\"name\":\"Cookies\",\"capacity\":\"4KB\",\"persistence\":\"Configurable\",\"scope\":\"Per domain\",\"api\":\"Synchronous\",\"dataType\":\"Strings only\"}]}" },
              { type: "flowchart", title: "Web Storage Decision Step-by-Step Flow", config: "{\"nodes\":[{\"id\":\"app\",\"label\":\"App Needs\\nData Storage\",\"x\":250,\"y\":20},{\"id\":\"choose\",\"label\":\"Choose\\nStorage Type\",\"x\":250,\"y\":100},{\"id\":\"local\",\"label\":\"localStorage\\n(Permanent)\",\"x\":50,\"y\":200},{\"id\":\"session\",\"label\":\"sessionStorage\\n(Tab Session)\",\"x\":180,\"y\":200},{\"id\":\"cookie\",\"label\":\"Cookies\\n(4KB, Server)\",\"x\":320,\"y\":200},{\"id\":\"indexed\",\"label\":\"IndexedDB\\n(Large, Async)\",\"x\":460,\"y\":200},{\"id\":\"store\",\"label\":\"Store Data\\n(Write)\",\"x\":250,\"y\":300},{\"id\":\"retrieve\",\"label\":\"Retrieve Data\\n(Read)\",\"x\":250,\"y\":380}],\"edges\":[{\"from\":\"app\",\"to\":\"choose\",\"label\":\"selects\"},{\"from\":\"choose\",\"to\":\"local\",\"label\":\"persistent\"},{\"from\":\"choose\",\"to\":\"session\",\"label\":\"temporary\"},{\"from\":\"choose\",\"to\":\"cookie\",\"label\":\"server\"},{\"from\":\"choose\",\"to\":\"indexed\",\"label\":\"complex\"},{\"from\":\"local\",\"to\":\"store\",\"label\":\"setItem()\"},{\"from\":\"session\",\"to\":\"store\",\"label\":\"setItem()\"},{\"from\":\"cookie\",\"to\":\"store\",\"label\":\"document.cookie\"},{\"from\":\"indexed\",\"to\":\"store\",\"label\":\"add()/put()\"},{\"from\":\"store\",\"to\":\"retrieve\",\"label\":\"read back\"}]},{\"id\":\"step-2\",\"title\":\"Step 2: Choose the Right Storage\",\"description\":\"Select the appropriate storage mechanism based on your data requirements. Consider factors like data size, persistence needs, whether the data needs to be sent to the server, and whether you need synchronous or asynchronous access.\",\"highlightNodes\":[\"app\",\"choose\"],\"highlightEdges\":[\"app->choose\"]},{\"id\":\"step-3\",\"title\":\"Step 3: localStorage for Persistent Data\",\"description\":\"localStorage provides 5-10MB of permanent storage per origin. Data survives browser restarts and is never sent to the server. Use JSON.stringify() and JSON.parse() for storing objects. Ideal for user preferences and application settings.\",\"highlightNodes\":[\"choose\",\"local\"],\"highlightEdges\":[\"choose->local\"]},{\"id\":\"step-4\",\"title\":\"Step 4: sessionStorage for Temporary Data\",\"description\":\"sessionStorage works like localStorage but is cleared when the browser tab is closed. Each tab gets its own isolated storage. Useful for multi-step form data, temporary session state, and wizard-style user interfaces.\",\"highlightNodes\":[\"choose\",\"session\"],\"highlightEdges\":[\"choose->session\"]},{\"id\":\"step-5\",\"title\":\"Step 5: Cookies for Server Communication\",\"description\":\"Cookies are limited to 4KB and are automatically sent to the server with every HTTP request. They support expiration dates and can be restricted to secure (HTTPS) connections. Best for authentication tokens and server-side session identifiers.\",\"highlightNodes\":[\"choose\",\"cookie\"],\"highlightEdges\":[\"choose->cookie\"]},{\"id\":\"step-6\",\"title\":\"Step 6: IndexedDB for Large Data\",\"description\":\"IndexedDB is a full transactional database in the browser supporting 50MB+ of storage. It supports indexes, object stores, and complex queries. The API is asynchronous and event-driven. Ideal for offline applications, large datasets, and file storage.\",\"highlightNodes\":[\"choose\",\"indexed\"],\"highlightEdges\":[\"choose->indexed\"]},{\"id\":\"step-7\",\"title\":\"Step 7: Store Data to Storage\",\"description\":\"Write data to the chosen storage mechanism. For localStorage and sessionStorage, use setItem(key, value). For cookies, assign to document.cookie. For IndexedDB, use objectStore.add() or put() within a transaction for atomic writes.\",\"highlightNodes\":[\"local\",\"session\",\"cookie\",\"indexed\",\"store\"],\"highlightEdges\":[\"local->store\",\"session->store\",\"cookie->store\",\"indexed->store\"]},{\"id\":\"step-8\",\"title\":\"Step 8: Retrieve Data from Storage\",\"description\":\"Read data back from storage when needed. For localStorage and sessionStorage, use getItem(key). For cookies, parse document.cookie. For IndexedDB, use objectStore.get() within a transaction. Always handle the case where data might not exist or be expired.\",\"highlightNodes\":[\"store\",\"retrieve\"],\"highlightEdges\":[\"store->retrieve\"]}]}" },
            ],
            lesson: { title: "Web Storage APIs", content: "localStorage: persists across sessions, ~5MB limit, stores strings only (use JSON.stringify/parse). sessionStorage: same API but cleared when tab closes. Cookies: small data (4KB), sent with every request, can set expiration. IndexedDB: large structured data, async API, supports indexes and transactions. Use localStorage for simple preferences, sessionStorage for temporary state, IndexedDB for offline data and large datasets.", explanation: "This lesson covers client-side storage: localStorage, sessionStorage, and IndexedDB." },
          },
          {
            title: "Performance & Optimization",
            description: "Learn techniques for optimizing web performance: lazy loading, code splitting, and caching.",
            slug: "performance-optimization", difficulty: 4, prerequisites: [0, 1],
            concepts: [
              { title: "Core Web Vitals", description: "Google's Core Web Vitals measure real-world user experience: LCP (Largest Contentful Paint, <2.5s) measures loading performance, INP (Interaction to Next Paint, <200ms) measures responsiveness, CLS (Cumulative Layout Shift, <0.1) measures visual stability. These metrics directly impact SEO rankings and user satisfaction." },
              { title: "Image Optimization", description: "Images are often the largest assets on a page. Use modern formats (WebP, AVIF). Serve responsive images with srcset and sizes attributes. Use lazy loading (loading=\"lazy\") for below-fold images. Specify explicit width and height to prevent layout shift. Use CDN for image delivery. Compress images appropriately (quality 80-85% is often sufficient)." },
              { title: "Code Splitting & Bundling", description: "Code splitting breaks your JavaScript bundle into smaller chunks loaded on demand. Use dynamic imports: import('./module.js').then(module => {}). Route-based splitting splits code by page. Tree shaking removes unused code (requires ES modules). Use Webpack, Vite, or Rollup. Lazy load non-critical components with React.lazy() and Suspense." },
            ],
            examples: [
              {
                title: "Lazy Loading Images with Intersection Observer",
                description: "Implementing lazy loading for images using the Intersection Observer API",
                starterCode: "const images = document.querySelectorAll('img[data-src]');\n\nfunction lazyLoad() {\n  // Use Intersection Observer to load images when visible\n}",
                solutionCode: "const images = document.querySelectorAll('img[data-src]');\n\nconst imageObserver = new IntersectionObserver((entries, observer) => {\n  entries.forEach(entry => {\n    if (entry.isIntersecting) {\n      const img = entry.target;\n      img.src = img.dataset.src;\n      img.onload = () => img.classList.add('loaded');\n      observer.unobserve(img);\n    }\n  });\n}, {\n  rootMargin: '100px 0px',\n  threshold: 0.01,\n});\n\nimages.forEach(img => imageObserver.observe(img));\n\nconst lazyVideoObserver = new IntersectionObserver((entries, observer) => {\n  entries.forEach(entry => {\n    if (entry.isIntersecting) {\n      entry.target.play();\n    } else {\n      entry.target.pause();\n    }\n  });\n});\n\ndocument.querySelectorAll('video[autoplay]').forEach(v => lazyVideoObserver.observe(v));",
              },
            ],
            exercises: [
              {
                title: "Build a Performance Budget Tracker",
                description: "Create a function that measures page load performance metrics (First Paint, DOMContentLoaded, Load) and logs warnings if they exceed defined budgets",
                starterCode: "const performanceBudget = {\n  firstPaint: 1000,\n  domContentLoaded: 2000,\n  load: 3000,\n  totalSize: 1024 * 1024,\n};\n\nfunction checkPerformance() {\n  // Use Performance API to measure timings\n  // Use PerformanceObserver for resource timing\n  // Log warnings for any budget violations\n}",
                testCases: "Measures First Paint time; Measures DOMContentLoaded time; Tracks total page size from resource timing; Logs warnings when budgets are exceeded; Works with Navigation Timing API level 2",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Page Load Performance Timeline", config: "{\"nodes\":[{\"id\":\"start\",\"label\":\"Navigation Start\",\"x\":250,\"y\":20},{\"id\":\"dns\",\"label\":\"DNS Lookup\",\"x\":250,\"y\":80},{\"id\":\"tcp\",\"label\":\"TCP Connection\",\"x\":250,\"y\":140},{\"id\":\"ttfb\",\"label\":\"TTFB\n(Time to First Byte)\",\"x\":250,\"y\":200},{\"id\":\"fcp\",\"label\":\"FCP\n(First Contentful Paint)\",\"x\":250,\"y\":270},{\"id\":\"lcp\",\"label\":\"LCP\n(Largest Contentful Paint)\",\"x\":250,\"y\":340},{\"id\":\"tti\",\"label\":\"TTI\n(Time to Interactive)\",\"x\":250,\"y\":410},{\"id\":\"load\",\"label\":\"Load Event\",\"x\":250,\"y\":480}],\"edges\":[{\"from\":\"start\",\"to\":\"dns\"},{\"from\":\"dns\",\"to\":\"tcp\"},{\"from\":\"tcp\",\"to\":\"ttfb\"},{\"from\":\"ttfb\",\"to\":\"fcp\"},{\"from\":\"fcp\",\"to\":\"lcp\"},{\"from\":\"lcp\",\"to\":\"tti\"},{\"from\":\"tti\",\"to\":\"load\"}]}" },
            ],
            lesson: { title: "Web Performance Optimization", content: "Performance directly impacts user experience and SEO. Key metrics: LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift). Optimize images: use WebP/AVIF, srcset for responsive images, lazy loading (loading=\"lazy\"). Code splitting: dynamic imports, route-based splitting. Resource hints: <link rel=\"preload\">, <link rel=\"prefetch\">. Caching: Cache-Control headers, Service Workers for offline. Minify and compress: gzip/brotli. Reduce render-blocking resources: defer non-critical JS/CSS. Use DevTools Lighthouse for audits.", explanation: "This lesson covers techniques for optimizing web performance." },
          },
        ],
      },
    ],
  },
  {
    title: "Backend Development (Laravel + Node.js)",
    description: "Master backend development with PHP/Laravel and Node.js/Express. Build REST APIs, handle databases, authentication, and deploy production-ready servers.",
    slug: "backend-development",
    stream: "backend",
    modules: [
      {
        title: "Phase 1: Node.js & Express Fundamentals",
        description: "Learn server-side JavaScript with Node.js, build REST APIs with Express, and understand the Node.js ecosystem.",
        slug: "nodejs-express-fundamentals",
        topics: [
          {
            title: "Node.js Runtime & Core Modules",
            description: "Understand the Node.js runtime, event loop, and core modules like fs, path, http, and events.",
            slug: "nodejs-runtime-core", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "Node.js Event Loop", description: "Node.js uses an event-driven, non-blocking I/O model. The event loop has phases: timers (setTimeout/setInterval), pending callbacks, idle/prepare, poll (I/O), check (setImmediate), close callbacks. Between each phase, process.nextTick() and microtasks (Promise callbacks) are processed. Understanding this is crucial for writing performant Node.js applications." },
              { title: "CommonJS vs ES Modules", description: "Node.js supports two module systems: CommonJS (require/module.exports, default) and ES Modules (import/export, .mjs or \"type\": \"module\" in package.json). CommonJS is synchronous and dynamically loaded; ES Modules are statically analyzable (enabling tree shaking). Key differences: __dirname is available in CJS, import.meta.url in ESM." },
              { title: "Core Modules", description: "Node.js ships with essential modules: fs (file system: readFile, writeFile, readdir), path (join, resolve, dirname, extname), http/https (createServer), events (EventEmitter), stream (Readable, Writable, Transform, pipeline), crypto (hash, randomBytes), os (cpus, freemem), child_process (exec, spawn, fork)." },
            ],
            examples: [
              {
                title: "File System Operations with Streams",
                description: "Reading and writing files efficiently using Node.js streams",
                starterCode: "const fs = require('fs');\nconst path = require('path');\n\nfunction copyFile(src, dest) {\n  // Copy file using streams for memory efficiency\n}",
                solutionCode: "const fs = require('fs');\nconst path = require('path');\nconst { pipeline } = require('stream');\nconst { promisify } = require('util');\nconst pipelineAsync = promisify(pipeline);\n\nasync function copyFile(src, dest) {\n  const readStream = fs.createReadStream(src);\n  const writeStream = fs.createWriteStream(dest);\n\n  await pipelineAsync(readStream, writeStream);\n  console.log(`Copied ${src} to ${dest}`);\n}\n\nasync function readFileLines(filePath) {\n  const readline = require('readline');\n  const fileStream = fs.createReadStream(filePath);\n  const rl = readline.createInterface({\n    input: fileStream,\n    crlfDelay: Infinity,\n  });\n\n  const lines = [];\n  for await (const line of rl) {\n    lines.push(line);\n  }\n  return lines;\n}",
              },
            ],
            exercises: [
              {
                title: "Build a File Watcher",
                description: "Create a script that watches a directory for file changes (create, modify, delete) and logs the changes with timestamps",
                starterCode: "const fs = require('fs');\nconst path = require('path');\n\nfunction watchDirectory(dirPath) {\n  // Use fs.watch or fs.watchFile\n  // Log file changes with type and timestamp\n  // Handle errors gracefully\n}",
                testCases: "Detects new file creation; Detects file modifications; Detects file deletions; Logs timestamp with each change; Handles non-existent directory gracefully",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Node.js Event Loop Phases", config: "{\"nodes\":[{\"id\":\"start\",\"label\":\"Event Loop Start\",\"x\":250,\"y\":20},{\"id\":\"timers\",\"label\":\"Timers\n(setTimeout)\",\"x\":250,\"y\":90},{\"id\":\"pending\",\"label\":\"Pending Callbacks\",\"x\":250,\"y\":160},{\"id\":\"idle\",\"label\":\"Idle, Prepare\",\"x\":250,\"y\":230},{\"id\":\"poll\",\"label\":\"Poll (I/O)\",\"x\":250,\"y\":300},{\"id\":\"check\",\"label\":\"Check\n(setImmediate)\",\"x\":250,\"y\":370},{\"id\":\"close\",\"label\":\"Close Callbacks\",\"x\":250,\"y\":440},{\"id\":\"mic\",\"label\":\"Microtasks\n(nextTick, Promises)\",\"x\":500,\"y\":260}],\"edges\":[{\"from\":\"start\",\"to\":\"timers\"},{\"from\":\"timers\",\"to\":\"pending\"},{\"from\":\"pending\",\"to\":\"idle\"},{\"from\":\"idle\",\"to\":\"poll\"},{\"from\":\"poll\",\"to\":\"check\"},{\"from\":\"check\",\"to\":\"close\"},{\"from\":\"close\",\"to\":\"timers\"},{\"from\":\"timers\",\"to\":\"mic\",\"label\":\"after each\"},{\"from\":\"pending\",\"to\":\"mic\"},{\"from\":\"check\",\"to\":\"mic\"},{\"from\":\"close\",\"to\":\"mic\"},{\"from\":\"mic\",\"to\":\"mic\",\"label\":\"loop\"}]}" },
            ],
            lesson: { title: "Node.js Runtime and Core Modules", content: "Node.js is a JavaScript runtime built on Chrome's V8 engine. It uses an event-driven, non-blocking I/O model. Core modules: fs (file system operations), path (file path utilities), http (create servers), events (EventEmitter), stream (streaming data), crypto (cryptography), os (system info). The event loop handles async callbacks: timers → pending callbacks → idle/prepare → poll → check → close callbacks. Use require() (CommonJS) or import (ESM) for modules.", explanation: "This lesson introduces the Node.js runtime, event loop architecture, and core modules." },
          },
          {
            title: "NPM & Package Management",
            description: "Master npm, package.json, semantic versioning, and dependency management in Node.js projects.",
            slug: "npm-package-management", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "package.json", description: "package.json is the manifest file for Node.js projects. Key fields: name, version (semver), description, main (entry point), scripts (automation commands), dependencies (production packages), devDependencies (development-only packages), peerDependencies (host packages). The engines field specifies compatible Node.js versions." },
              { title: "Semantic Versioning (SemVer)", description: "SemVer format: MAJOR.MINOR.PATCH (e.g., 2.3.1). MAJOR: breaking changes, MINOR: new features (backward compatible), PATCH: bug fixes. Version ranges: ^1.2.3 (>=1.2.3 <2.0.0), ~1.2.3 (>=1.2.3 <1.3.0), exact (1.2.3). package-lock.json pins exact versions for reproducible builds. Use npm ci in CI for deterministic installs." },
              { title: "npm Scripts & npx", description: "npm scripts in package.json automate tasks: npm start, npm test, npm run build, npm run dev. Pre/post hooks: prepublish, postinstall. Environment variables: process.env.npm_package_version. npx executes packages without installing: npx create-react-app, npx eslint. npx automatically uses the local node_modules/.bin if available." },
            ],
            examples: [
              {
                title: "Creating a Package with npm Scripts",
                description: "Setting up a Node.js project with proper package.json and npm scripts",
                starterCode: "// package.json\n{\n  \"name\": \"my-project\",\n  \"version\": \"1.0.0\"\n}",
                solutionCode: "{\n  \"name\": \"my-project\",\n  \"version\": \"1.0.0\",\n  \"description\": \"A sample Node.js project\",\n  \"main\": \"src/index.js\",\n  \"scripts\": {\n    \"start\": \"node src/index.js\",\n    \"dev\": \"nodemon src/index.js\",\n    \"test\": \"jest --coverage\",\n    \"lint\": \"eslint src/\",\n    \"lint:fix\": \"eslint src/ --fix\",\n    \"build\": \"webpack --mode production\",\n    \"prebuild\": \"npm run lint\",\n    \"postbuild\": \"echo 'Build complete!'\"\n  },\n  \"dependencies\": {\n    \"express\": \"^4.18.2\",\n    \"dotenv\": \"^16.3.1\"\n  },\n  \"devDependencies\": {\n    \"jest\": \"^29.7.0\",\n    \"eslint\": \"^8.50.0\",\n    \"nodemon\": \"^3.0.1\"\n  },\n  \"engines\": {\n    \"node\": \">=18.0.0\"\n  }\n}",
              },
            ],
            exercises: [
              {
                title: "Audit and Update Dependencies",
                description: "Write a script that analyzes a project's package.json, identifies outdated dependencies, checks for security vulnerabilities, and generates an update report",
                starterCode: "const { execSync } = require('child_process');\n\nfunction auditProject(projectPath) {\n  // Run npm outdated\n  // Run npm audit\n  // Parse results and generate report\n  // Return { outdated: [...], vulnerabilities: [...] }\n}",
                testCases: "Identifies outdated packages with current/latest versions; Detects security vulnerabilities with severity levels; Generates a structured report object; Handles projects with no issues gracefully; Works with both npm and yarn lock files",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "npm Install Resolution Flow", config: "{\"nodes\":[{\"id\":\"install\",\"label\":\"npm install\",\"x\":250,\"y\":20},{\"id\":\"checkLock\",\"label\":\"package-lock.json\nexists?\",\"x\":250,\"y\":100},{\"id\":\"useLock\",\"label\":\"Install from lock\n(ci: exact)\",\"x\":100,\"y\":180},{\"id\":\"resolve\",\"label\":\"Resolve from\npackage.json\",\"x\":400,\"y\":180},{\"id\":\"download\",\"label\":\"Download packages\",\"x\":250,\"y\":260},{\"id\":\"build\",\"label\":\"Run install scripts\",\"x\":250,\"y\":340},{\"id\":\"updateLock\",\"label\":\"Update lock file\",\"x\":250,\"y\":420},{\"id\":\"done\",\"label\":\"Done\",\"x\":250,\"y\":500}],\"edges\":[{\"from\":\"install\",\"to\":\"checkLock\"},{\"from\":\"checkLock\",\"to\":\"useLock\",\"label\":\"yes\"},{\"from\":\"checkLock\",\"to\":\"resolve\",\"label\":\"no\"},{\"from\":\"useLock\",\"to\":\"download\"},{\"from\":\"resolve\",\"to\":\"download\"},{\"from\":\"download\",\"to\":\"build\"},{\"from\":\"build\",\"to\":\"updateLock\"},{\"from\":\"updateLock\",\"to\":\"done\"}]}" },
            ],
            lesson: { title: "NPM and Package Management", content: "npm is the Node.js package manager. package.json defines project metadata, scripts, and dependencies. Semantic versioning: MAJOR.MINOR.PATCH (^1.2.3 allows 1.x.x, ~1.2.3 allows 1.2.x). Dependencies: dependencies (production), devDependencies (development only), peerDependencies (host package). npm install, npm update, npm audit for security. npm scripts: \"start\", \"build\", \"test\", \"dev\" automate tasks. npx runs packages without installing. package-lock.json locks exact versions for reproducible builds.", explanation: "This lesson covers npm, package.json, semantic versioning, and dependency management." },
          },
          {
            title: "Express.js REST API",
            description: "Build RESTful APIs with Express.js: routing, middleware, request handling, and error management.",
            slug: "express-rest-api", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "Express Middleware", description: "Middleware functions have access to req, res, and next. They execute in order: app.use(logger), app.use(express.json()). Types: application-level (app.use), router-level (router.use), error-handling ((err, req, res, next)), built-in (express.static, express.json), third-party (cors, helmet, morgan). next() passes control; next(err) triggers error handler." },
              { title: "RESTful Routing", description: "REST routes map HTTP methods to CRUD operations: GET /users (list), GET /users/:id (read), POST /users (create), PUT /users/:id (full update), PATCH /users/:id (partial update), DELETE /users/:id (remove). Use express.Router() for modular route files. Route parameters (req.params), query strings (req.query), and request body (req.body) provide input data." },
              { title: "Error Handling", description: "Express error handling middleware has four parameters: (err, req, res, next). Create custom error classes (class AppError extends Error). Catch async errors with express-async-errors or wrapper functions. Centralized error handler returns consistent JSON: { status, message, errors }. Use HTTP status codes correctly: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 422 (validation), 500 (server error)." },
            ],
            examples: [
              {
                title: "Express API with CRUD Routes",
                description: "A complete Express REST API with users CRUD, middleware, and error handling",
                starterCode: "const express = require('express');\nconst app = express();\n\napp.use(express.json());\n\n// TODO: Add CRUD routes for users\n// TODO: Add error handling middleware\n\napp.listen(3000, () => console.log('Server running on port 3000'));",
                solutionCode: "const express = require('express');\nconst app = express();\n\napp.use(express.json());\n\nconst users = [\n  { id: 1, name: 'Alice', email: 'alice@example.com' },\n  { id: 2, name: 'Bob', email: 'bob@example.com' },\n];\n\napp.get('/api/users', (req, res) => {\n  const { name } = req.query;\n  const filtered = name ? users.filter(u => u.name.toLowerCase().includes(name.toLowerCase())) : users;\n  res.json({ data: filtered, count: filtered.length });\n});\n\napp.get('/api/users/:id', (req, res) => {\n  const user = users.find(u => u.id === parseInt(req.params.id));\n  if (!user) return res.status(404).json({ error: 'User not found' });\n  res.json({ data: user });\n});\n\napp.post('/api/users', (req, res) => {\n  const { name, email } = req.body;\n  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });\n  const user = { id: users.length + 1, name, email };\n  users.push(user);\n  res.status(201).json({ data: user });\n});\n\napp.put('/api/users/:id', (req, res) => {\n  const user = users.find(u => u.id === parseInt(req.params.id));\n  if (!user) return res.status(404).json({ error: 'User not found' });\n  user.name = req.body.name || user.name;\n  user.email = req.body.email || user.email;\n  res.json({ data: user });\n});\n\napp.delete('/api/users/:id', (req, res) => {\n  const index = users.findIndex(u => u.id === parseInt(req.params.id));\n  if (index === -1) return res.status(404).json({ error: 'User not found' });\n  users.splice(index, 1);\n  res.status(204).send();\n});\n\napp.use((err, req, res, next) => {\n  console.error(err.stack);\n  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });\n});\n\napp.listen(3000, () => console.log('Server running on port 3000'));",
              },
            ],
            exercises: [
              {
                title: "Build a Task Management API",
                description: "Create a REST API for managing tasks with fields: id, title, description, status (todo/in-progress/done), createdAt. Implement filtering by status and sorting by creation date.",
                starterCode: "const express = require('express');\nconst router = express.Router();\n\nconst tasks = [];\nlet nextId = 1;\n\n// GET /api/tasks - list with optional ?status filter and ?sort=createdAt\n// GET /api/tasks/:id - get single task\n// POST /api/tasks - create task\n// PATCH /api/tasks/:id - update task status\n// DELETE /api/tasks/:id - delete task\n\nmodule.exports = router;",
                testCases: "POST creates task with auto-generated id and createdAt; GET /api/tasks returns all tasks; GET /api/tasks?status=todo filters correctly; PATCH updates only the status field; DELETE removes task and returns 204; 404 returned for non-existent task",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Express Middleware Pipeline", config: "{\"nodes\":[{\"id\":\"req\",\"label\":\"Request\",\"x\":250,\"y\":20},{\"id\":\"mw1\",\"label\":\"Logger MW\",\"x\":250,\"y\":90},{\"id\":\"mw2\",\"label\":\"JSON Parser MW\",\"x\":250,\"y\":160},{\"id\":\"mw3\",\"label\":\"CORS MW\",\"x\":250,\"y\":230},{\"id\":\"route\",\"label\":\"Route Handler\",\"x\":250,\"y\":300},{\"id\":\"err\",\"label\":\"Error Handler MW\",\"x\":420,\"y\":300},{\"id\":\"res\",\"label\":\"Response\",\"x\":250,\"y\":370}],\"edges\":[{\"from\":\"req\",\"to\":\"mw1\"},{\"from\":\"mw1\",\"to\":\"mw2\"},{\"from\":\"mw2\",\"to\":\"mw3\"},{\"from\":\"mw3\",\"to\":\"route\"},{\"from\":\"route\",\"to\":\"res\",\"label\":\"success\"},{\"from\":\"route\",\"to\":\"err\",\"label\":\"error\"},{\"from\":\"err\",\"to\":\"res\"}]}" },
            ],
            lesson: { title: "Building REST APIs with Express.js", content: "Express.js is a minimal web framework for Node.js. Setup: const app = express(); app.use(express.json()). Routes: app.get('/api/users', handler), app.post(), app.put(), app.delete(). Route parameters: /api/users/:id accessed via req.params. Query strings: req.query. Middleware: functions with (req, res, next) signature. Common middleware: cors(), helmet(), morgan(logging), express-rate-limit. Error handling: app.use((err, req, res, next) => {}). Always return proper HTTP status codes: 200, 201, 204, 400, 401, 403, 404, 500.", explanation: "This lesson covers building RESTful APIs with Express.js, middleware, and error handling." },
          },
          {
            title: "Database Integration (MongoDB & PostgreSQL)",
            description: "Connect Node.js to MongoDB with Mongoose and PostgreSQL with Prisma ORM.",
            slug: "database-integration-node", difficulty: 3, prerequisites: [0, 2],
            concepts: [
              { title: "MongoDB with Mongoose", description: "Mongoose provides schema-based modeling for MongoDB. Define schemas with types, validation, and defaults. Models provide CRUD: Model.create(), find(), findById(), findOneAndUpdate(), deleteOne(). Use lean() for plain JS objects (faster reads). Queries support filtering, sorting, pagination (skip/limit), and population (joining documents across collections)." },
              { title: "PostgreSQL with Prisma", description: "Prisma ORM provides type-safe database access. Define models in schema.prisma with fields, types, relations, and attributes (@id, @unique, @default). Prisma Client generates type-safe queries: findMany, findUnique, create, update, delete, upsert. Relations use include or nested writes. Migrations: prisma migrate dev. Prisma Studio for visual data browsing." },
              { title: "SQL vs NoSQL", description: "SQL databases (PostgreSQL, MySQL) use structured schemas, tables, and relationships. They excel at complex queries with JOINs and ensure data integrity with ACID transactions. NoSQL databases (MongoDB) use flexible schemas with documents. They excel at horizontal scaling and handling unstructured data. Choose based on data model complexity, query patterns, and scalability requirements." },
            ],
            examples: [
              {
                title: "Prisma Schema and Queries",
                description: "Defining a Prisma schema and performing type-safe queries",
                starterCode: "// schema.prisma\nmodel User {\n  id    Int    @id @default(autoincrement())\n  email String @unique\n  name  String\n  posts Post[]\n}\n\nmodel Post {\n  id      Int    @id @default(autoincrement())\n  title   String\n  content String?\n  userId  Int\n  user    User   @relation(fields: [userId], references: [id])\n}\n\n// Query: find all users with their posts\n// Your code here",
                solutionCode: "// schema.prisma (as above)\n\n// TypeScript/JavaScript queries\nimport { PrismaClient } from '@prisma/client';\nconst prisma = new PrismaClient();\n\nasync function getUsersWithPosts() {\n  const users = await prisma.user.findMany({\n    include: { posts: true },\n    orderBy: { name: 'asc' },\n  });\n  return users;\n}\n\nasync function createUserWithPost(name: string, email: string, title: string) {\n  const user = await prisma.user.create({\n    data: {\n      name,\n      email,\n      posts: {\n        create: { title },\n      },\n    },\n    include: { posts: true },\n  });\n  return user;\n}\n\nasync function getPostsByUser(userId: number, page: number = 1, pageSize: number = 10) {\n  const posts = await prisma.post.findMany({\n    where: { userId },\n    skip: (page - 1) * pageSize,\n    take: pageSize,\n    orderBy: { id: 'desc' },\n  });\n  const total = await prisma.post.count({ where: { userId } });\n  return { data: posts, total, page, pageSize };\n}",
              },
            ],
            exercises: [
              {
                title: "Design a Blog Database Schema",
                description: "Design a Prisma schema for a blog with Users, Posts, Comments, and Tags. Include proper relations and implement queries for getting posts with their comments and tags.",
                starterCode: "// schema.prisma - Design the schema\nmodel User {\n  // id, name, email, posts relation\n}\n\nmodel Post {\n  // id, title, content, published, createdAt, author relation, comments relation, tags relation\n}\n\nmodel Comment {\n  // id, content, createdAt, post relation, author relation\n}\n\nmodel Tag {\n  // id, name, posts relation (many-to-many)\n}",
                testCases: "Schema defines all four models with proper fields; User has one-to-many with Posts and Comments; Post has one-to-many with Comments; Post and Tag have many-to-many relationship; Relations use proper cascade delete rules; Timestamps use @default(now())",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Prisma ORM Query Flow", config: "{\"nodes\":[{\"id\":\"app\",\"label\":\"Application Code\",\"x\":250,\"y\":20},{\"id\":\"client\",\"label\":\"Prisma Client\",\"x\":250,\"y\":100},{\"id\":\"engine\",\"label\":\"Query Engine\",\"x\":250,\"y\":180},{\"id\":\"sql\",\"label\":\"SQL Query\",\"x\":250,\"y\":260},{\"id\":\"db\",\"label\":\"PostgreSQL\",\"x\":250,\"y\":340},{\"id\":\"result\",\"label\":\"Typed Result\",\"x\":250,\"y\":420}],\"edges\":[{\"from\":\"app\",\"to\":\"client\"},{\"from\":\"client\",\"to\":\"engine\"},{\"from\":\"engine\",\"to\":\"sql\"},{\"from\":\"sql\",\"to\":\"db\"},{\"from\":\"db\",\"to\":\"engine\",\"label\":\"rows\"},{\"from\":\"engine\",\"to\":\"client\",\"label\":\"objects\"},{\"from\":\"client\",\"to\":\"result\"}]}" },
            ],
            lesson: { title: "Database Integration with Node.js", content: "MongoDB (NoSQL) with Mongoose: Define schemas and models, perform CRUD operations. Schema: new mongoose.Schema({ name: String, email: { type: String, unique: true } }). Queries: Model.find(), findById(), create(), findByIdAndUpdate(), deleteOne(). PostgreSQL (SQL) with Prisma: Define schema in schema.prisma. npx prisma migrate dev creates tables. Queries: prisma.user.findMany(), findUnique(), create(), update(), delete(). Relations: include clause for eager loading. Always use parameterized queries / ORM to prevent SQL injection. Use transactions for atomic operations: prisma.$transaction([...]).", explanation: "This lesson covers database integration with MongoDB (Mongoose) and PostgreSQL (Prisma) in Node.js." },
          },
          {
            title: "Authentication & Authorization",
            description: "Implement JWT-based authentication, role-based access control, and secure password handling.",
            slug: "auth-authorization-node", difficulty: 3, prerequisites: [0, 2],
            concepts: [
              { title: "JWT (JSON Web Tokens)", description: "JWT is a compact, URL-safe token for transmitting claims between parties. Structure: Header (algorithm) + Payload (claims) + Signature (HMAC or RSA). Access tokens are short-lived (15-60 min), refresh tokens are long-lived (7-30 days). Store access tokens in memory, refresh tokens in httpOnly cookies. The server verifies the signature on each request — no database lookup needed for stateless auth." },
              { title: "Password Hashing with bcrypt", description: "bcrypt is a slow, adaptive hashing algorithm designed for passwords. It includes a salt (random data) to prevent rainbow table attacks, and a cost factor that doubles the work with each increment. Use bcrypt.hash(password, 12) (12 salt rounds, good balance). Compare with bcrypt.compare(password, hash). Never store plain-text passwords. Never implement your own crypto." },
              { title: "Role-Based Access Control (RBAC)", description: "RBAC assigns permissions to roles, and roles to users. Common roles: admin, moderator, user. Implement as middleware that checks req.user.role against allowed roles. Use a permission matrix for complex authorization. Protect routes with middleware chains: authenticate → authorize('admin'). Check resource ownership for user-specific data (user can edit own posts but not others')." },
            ],
            examples: [
              {
                title: "JWT Authentication Middleware",
                description: "Implementing JWT sign and verify in Express middleware",
                starterCode: "const jwt = require('jsonwebtoken');\nconst bcrypt = require('bcrypt');\n\nfunction generateToken(user) {\n  // Create access token (15 min)\n  // Create refresh token (7 days)\n}\n\nfunction authenticate(req, res, next) {\n  // Extract token from Authorization header\n  // Verify and attach user to req\n}\n\nfunction authorize(...roles) {\n  // Check if req.user.role is in allowed roles\n}",
                solutionCode: "const jwt = require('jsonwebtoken');\nconst bcrypt = require('bcrypt');\nconst SECRET = process.env.JWT_SECRET;\n\nfunction generateToken(user) {\n  const accessToken = jwt.sign(\n    { userId: user.id, role: user.role },\n    SECRET,\n    { expiresIn: '15m' }\n  );\n  const refreshToken = jwt.sign(\n    { userId: user.id },\n    SECRET,\n    { expiresIn: '7d' }\n  );\n  return { accessToken, refreshToken };\n}\n\nfunction authenticate(req, res, next) {\n  const authHeader = req.headers.authorization;\n  if (!authHeader?.startsWith('Bearer ')) {\n    return res.status(401).json({ error: 'No token provided' });\n  }\n  try {\n    const token = authHeader.split(' ')[1];\n    const decoded = jwt.verify(token, SECRET);\n    req.user = decoded;\n    next();\n  } catch (err) {\n    if (err.name === 'TokenExpiredError') {\n      return res.status(401).json({ error: 'Token expired' });\n    }\n    return res.status(401).json({ error: 'Invalid token' });\n  }\n}\n\nfunction authorize(...roles) {\n  return (req, res, next) => {\n    if (!req.user || !roles.includes(req.user.role)) {\n      return res.status(403).json({ error: 'Insufficient permissions' });\n    }\n    next();\n  };\n}\n\nasync function hashPassword(password) {\n  return bcrypt.hash(password, 12);\n}\n\nasync function verifyPassword(password, hash) {\n  return bcrypt.compare(password, hash);\n}",
              },
            ],
            exercises: [
              {
                title: "Implement Login and Registration",
                description: "Create Express routes for user registration (hash password, store user) and login (verify password, return JWT tokens). Include input validation.",
                starterCode: "const express = require('express');\nconst router = express.Router();\n\nrouter.post('/register', async (req, res) => {\n  // Validate email, password (min 8 chars)\n  // Check if email already exists\n  // Hash password, create user\n  // Return tokens\n});\n\nrouter.post('/login', async (req, res) => {\n  // Find user by email\n  // Verify password\n  // Return tokens\n});\n\nrouter.post('/refresh', async (req, res) => {\n  // Verify refresh token\n  // Issue new access token\n});\n\nmodule.exports = router;",
                testCases: "Registration validates email format and password length; Registration returns 409 if email already exists; Login returns 401 for invalid credentials; Login returns access and refresh tokens on success; Refresh endpoint issues new access token; Passwords are hashed with bcrypt (not stored in plain text)",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "JWT Authentication Flow", config: "{\"nodes\":[{\"id\":\"login\",\"label\":\"User Login\",\"x\":250,\"y\":20},{\"id\":\"verify\",\"label\":\"Verify Credentials\",\"x\":250,\"y\":90},{\"id\":\"gen\",\"label\":\"Generate JWT\",\"x\":250,\"y\":160},{\"id\":\"store\",\"label\":\"Store Refresh Token\",\"x\":250,\"y\":230},{\"id\":\"send\",\"label\":\"Send Tokens\",\"x\":250,\"y\":300},{\"id\":\"req\",\"label\":\"API Request\",\"x\":250,\"y\":370},{\"id\":\"check\",\"label\":\"Verify JWT\",\"x\":250,\"y\":440},{\"id\":\"allow\",\"label\":\"Allow Access\",\"x\":120,\"y\":510},{\"id\":\"deny\",\"label\":\"Deny (401)\",\"x\":380,\"y\":510}],\"edges\":[{\"from\":\"login\",\"to\":\"verify\"},{\"from\":\"verify\",\"to\":\"gen\"},{\"from\":\"gen\",\"to\":\"store\"},{\"from\":\"store\",\"to\":\"send\"},{\"from\":\"send\",\"to\":\"req\"},{\"from\":\"req\",\"to\":\"check\"},{\"from\":\"check\",\"to\":\"allow\",\"label\":\"valid\"},{\"from\":\"check\",\"to\":\"deny\",\"label\":\"invalid\"}]}" },
            ],
            lesson: { title: "Authentication and Authorization in Node.js", content: "JWT Authentication: User logs in → server creates JWT with jsonwebtoken → client stores in httpOnly cookie or Authorization header. bcrypt for password hashing: const hash = await bcrypt.hash(password, 12). Middleware verifies JWT on protected routes: jwt.verify(token, secret). Role-Based Access Control (RBAC): assign roles (admin, user, editor), check in middleware. Refresh tokens: short-lived access token (15min) + long-lived refresh token (7d). OAuth 2.0 for social login. Always validate input, rate-limit auth endpoints, use HTTPS.", explanation: "This lesson covers JWT authentication, bcrypt password hashing, and role-based access control in Node.js." },
          },
          {
            title: "Testing & Deployment",
            description: "Write unit and integration tests with Jest, and deploy Node.js apps to production.",
            slug: "testing-deployment-node", difficulty: 3, prerequisites: [0, 2, 3],
            concepts: [
              { title: "Testing with Jest", description: "Jest is a JavaScript testing framework. describe() groups tests, test() or it() defines individual tests. expect(value).toBe(expected) for exact equality, .toEqual() for deep equality, .toContain() for array membership. Mock functions with jest.fn() and jest.spyOn(). Mock modules with jest.mock(). Test async code with async/await or return expect(promise).resolves/rejects." },
              { title: "Integration Testing with Supertest", description: "Supertest tests HTTP servers without starting a network listener. Import your Express app and use request(app).get('/path').expect(200). Chain assertions: .expect('Content-Type', /json/). Use .send(data) for POST/PUT bodies. Test error cases: .expect(404). Combine with Jest for comprehensive API testing. Use beforeAll/afterAll for setup/teardown." },
              { title: "Production Deployment", description: "Deploy with PM2 (process manager that keeps apps alive, restarts on crash, and provides load balancing). Docker containerization for consistent environments. Environment variables (.env) for configuration — never hardcode secrets. Set NODE_ENV=production for performance optimizations. Use structured logging (winston, pino), health check endpoints, and monitoring (Sentry, New Relic)." },
            ],
            examples: [
              {
                title: "Testing Express Routes with Jest and Supertest",
                description: "Writing unit and integration tests for an Express API",
                starterCode: "const request = require('supertest');\nconst app = require('./app');\n\ndescribe('GET /api/users', () => {\n  it('should return list of users', async () => {\n    // Write test\n  });\n});\n\ndescribe('POST /api/users', () => {\n  it('should create a new user', async () => {\n    // Write test\n  });\n});",
                solutionCode: "const request = require('supertest');\nconst app = require('./app');\n\ndescribe('Users API', () => {\n  describe('GET /api/users', () => {\n    it('should return list of users', async () => {\n      const res = await request(app)\n        .get('/api/users')\n        .expect('Content-Type', /json/)\n        .expect(200);\n      expect(res.body).toHaveProperty('data');\n      expect(Array.isArray(res.body.data)).toBe(true);\n      expect(res.body).toHaveProperty('count');\n    });\n\n    it('should filter users by name', async () => {\n      const res = await request(app)\n        .get('/api/users?name=Alice')\n        .expect(200);\n      expect(res.body.data.every(u => u.name.includes('Alice'))).toBe(true);\n    });\n  });\n\n  describe('POST /api/users', () => {\n    it('should create a new user', async () => {\n      const res = await request(app)\n        .post('/api/users')\n        .send({ name: 'Test User', email: 'test@example.com' })\n        .expect(201);\n      expect(res.body.data).toHaveProperty('id');\n      expect(res.body.data.name).toBe('Test User');\n    });\n\n    it('should return 400 for missing fields', async () => {\n      const res = await request(app)\n        .post('/api/users')\n        .send({ name: 'No Email' })\n        .expect(400);\n      expect(res.body).toHaveProperty('error');\n    });\n  });\n\n  describe('GET /api/users/:id', () => {\n    it('should return 404 for non-existent user', async () => {\n      await request(app)\n        .get('/api/users/9999')\n        .expect(404);\n    });\n  });\n});",
              },
            ],
            exercises: [
              {
                title: "Write Tests for a Task API",
                description: "Write comprehensive Jest + Supertest tests for the Task Management API, covering CRUD operations, validation, filtering, and error cases",
                starterCode: "const request = require('supertest');\nconst app = require('./app');\n\ndescribe('Task API', () => {\n  // Test POST /api/tasks - create\n  // Test GET /api/tasks - list all\n  // Test GET /api/tasks?status=done - filter\n  // Test PATCH /api/tasks/:id - update status\n  // Test DELETE /api/tasks/:id - delete\n  // Test 404 for non-existent task\n  // Test validation errors\n});",
                testCases: "POST creates task and returns 201 with correct shape; GET returns all tasks with count; GET with status filter returns only matching tasks; PATCH updates status and returns updated task; DELETE returns 204 and subsequent GET returns 404; Invalid POST returns 400 with error message; Non-existent ID returns 404 for all endpoints",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "CI/CD Pipeline for Node.js", config: "{\"nodes\":[{\"id\":\"push\",\"label\":\"Git Push\",\"x\":250,\"y\":20},{\"id\":\"install\",\"label\":\"npm ci\",\"x\":250,\"y\":90},{\"id\":\"lint\",\"label\":\"Lint & Format\",\"x\":250,\"y\":160},{\"id\":\"test\",\"label\":\"Run Tests\",\"x\":250,\"y\":230},{\"id\":\"build\",\"label\":\"Build\",\"x\":250,\"y\":300},{\"id\":\"deploy\",\"label\":\"Deploy\",\"x\":120,\"y\":370},{\"id\":\"notify\",\"label\":\"Notify\",\"x\":380,\"y\":370},{\"id\":\"done\",\"label\":\"Done\",\"x\":250,\"y\":440}],\"edges\":[{\"from\":\"push\",\"to\":\"install\"},{\"from\":\"install\",\"to\":\"lint\"},{\"from\":\"lint\",\"to\":\"test\"},{\"from\":\"test\",\"to\":\"build\"},{\"from\":\"build\",\"to\":\"deploy\"},{\"from\":\"build\",\"to\":\"notify\",\"label\":\"on failure\"},{\"from\":\"deploy\",\"to\":\"done\"}]}" },
            ],
            lesson: { title: "Testing and Deployment for Node.js", content: "Testing: Jest for unit tests (describe/it/expect). Supertest for HTTP integration tests. Mock external services with jest.mock(). Test coverage: npx jest --coverage. Environment variables: .env for development, .env.test for testing. Deployment: PM2 for process management (pm2 start app.js -i max). Docker: create Dockerfile, use multi-stage builds for smaller images. CI/CD: GitHub Actions runs tests on push, deploys on merge to main. Monitoring: use structured logging (winston/pino), health check endpoints, and alerting. Never hardcode secrets; use environment variables.", explanation: "This lesson covers testing with Jest/Supertest and deploying Node.js applications to production." },
          },
        ],
      },
      {
        title: "Phase 2: PHP & Laravel",
        description: "Learn PHP from scratch and build production-grade applications with the Laravel framework.",
        slug: "php-laravel",
        topics: [
          {
            title: "PHP Fundamentals",
            description: "Learn PHP syntax, variables, arrays, functions, OOP, and built-in functions.",
            slug: "php-fundamentals", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "PHP Syntax and Variables", description: "PHP code is embedded in HTML with <?php ... ?> tags. Variables start with $: $name = 'John'. PHP is dynamically typed. Strings can use single quotes (literal) or double quotes (parse variables: \"Hello $name\"). Heredoc/nowdoc for multi-line strings. Type declarations: function add(int $a, int $b): int { return $a + $b; }." },
              { title: "PHP Arrays", description: "PHP arrays are ordered maps. Indexed arrays: $arr = [1, 2, 3]. Associative arrays: $arr = ['key' => 'value']. Array functions: array_map(), array_filter(), array_reduce(), array_merge(), array_keys(), array_values(), in_array(), count(). Use foreach ($arr as $key => $value) for iteration." },
              { title: "PHP OOP", description: "OOP in PHP: class, new, $this, extends, implements, traits (horizontal code reuse). Visibility: public, protected, private. Constructor: __construct(). Static: static methods and properties. Namespaces: namespace App\\Models; use App\\Models\\User;. Autoloading with Composer (PSR-4 standard). Magic methods: __get(), __set(), __toString()." },
            ],
            examples: [
              {
                title: "PHP OOP: User Class with Validation",
                description: "A PHP class demonstrating OOP principles with constructor, getters, and validation",
                starterCode: "<?php\n\nclass User {\n  // Properties: name, email, password\n  // Constructor with validation\n  // Getters\n  // Method to return user as array\n}",
                solutionCode: "<?php\n\nnamespace App\\Models;\n\nclass User {\n  private string $name;\n  private string $email;\n  private string $passwordHash;\n\n  public function __construct(string $name, string $email, string $password) {\n    $this->setName($name);\n    $this->setEmail($email);\n    $this->passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);\n  }\n\n  public function getName(): string { return $this->name; }\n  public function getEmail(): string { return $this->email; }\n\n  private function setName(string $name): void {\n    if (strlen(trim($name)) < 2) {\n      throw new \\InvalidArgumentException('Name must be at least 2 characters');\n    }\n    $this->name = trim($name);\n  }\n\n  private function setEmail(string $email): void {\n    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {\n      throw new \\InvalidArgumentException('Invalid email format');\n    }\n    $this->email = strtolower($email);\n  }\n\n  public function verifyPassword(string $password): bool {\n    return password_verify($password, $this->passwordHash);\n  }\n\n  public function toArray(): array {\n    return [\n      'name' => $this->name,\n      'email' => $this->email,\n    ];\n  }\n}",
              },
            ],
            exercises: [
              {
                title: "Build a Shopping Cart Class",
                description: "Create a PHP ShoppingCart class with methods to add items, remove items, update quantity, calculate total, and apply discount codes",
                starterCode: "<?php\n\nclass ShoppingCart {\n  private array $items = [];\n\n  public function addItem(string $name, float $price, int $quantity = 1): void {\n    // Add item or update quantity\n  }\n\n  public function removeItem(string $name): void {\n    // Remove item from cart\n  }\n\n  public function getTotal(): float {\n    // Calculate total price\n  }\n\n  public function applyDiscount(string $code): float {\n    // Apply discount code and return discount amount\n  }\n}",
                testCases: "Adding same item twice increments quantity; Removing item removes it from cart; getTotal returns correct sum; applyDiscount with 'SAVE10' applies 10% discount; applyDiscount with invalid code returns 0; Empty cart has total of 0",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "PHP Request Lifecycle", config: "{\"nodes\":[{\"id\":\"req\",\"label\":\"HTTP Request\",\"x\":250,\"y\":20},{\"id\":\"php\",\"label\":\"PHP-FPM / mod_php\",\"x\":250,\"y\":90},{\"id\":\"parse\",\"label\":\"Parse PHP\",\"x\":250,\"y\":160},{\"id\":\"execute\",\"label\":\"Execute Script\",\"x\":250,\"y\":230},{\"id\":\"db\",\"label\":\"Database Query\",\"x\":120,\"y\":230},{\"id\":\"output\",\"label\":\"Generate HTML\",\"x\":250,\"y\":300},{\"id\":\"res\",\"label\":\"HTTP Response\",\"x\":250,\"y\":370}],\"edges\":[{\"from\":\"req\",\"to\":\"php\"},{\"from\":\"php\",\"to\":\"parse\"},{\"from\":\"parse\",\"to\":\"execute\"},{\"from\":\"execute\",\"to\":\"db\",\"label\":\"if needed\"},{\"from\":\"db\",\"to\":\"execute\"},{\"from\":\"execute\",\"to\":\"output\"},{\"from\":\"output\",\"to\":\"res\"}]}" },
            ],
            lesson: { title: "PHP Fundamentals", content: "PHP is a server-side scripting language. Variables start with $: $name = 'John'. Types: string, int, float, bool, array, object, null. Arrays: indexed ($arr = [1,2,3]), associative ($arr = ['key' => 'value']). Functions: function add($a, $b) { return $a + $b; }. OOP: class, new, $this, extends, implements, traits. Superglobals: $_GET, $_POST, $_SERVER, $_SESSION, $_COOKIE. Namespaces: namespace App\\Models; use App\\Models\\User;. Composer is the dependency manager (like npm for PHP). PSR standards define coding conventions.", explanation: "This lesson introduces PHP syntax, data types, OOP, and the PHP ecosystem." },
          },
          {
            title: "Laravel Basics: Routing & Controllers",
            description: "Set up Laravel, understand MVC architecture, routing, controllers, and blade templates.",
            slug: "laravel-routing-controllers", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "MVC Architecture", description: "Laravel follows Model-View-Controller. Models handle data and business logic (Eloquent ORM). Views are Blade templates that render HTML. Controllers handle HTTP requests, orchestrate models, and return views or JSON responses. This separation makes code maintainable, testable, and follows the Single Responsibility Principle." },
              { title: "Laravel Routing", description: "Routes are defined in routes/web.php (web middleware) and routes/api.php (API middleware). Route::get('/users', [UserController::class, 'index']). Route parameters: Route::get('/users/{id}', ...). Named routes: Route::get(...)->name('users.show'). Route groups: shared prefix, middleware, namespace. Resource routes: Route::resource('posts', PostController::class) creates all CRUD routes." },
              { title: "Blade Templating", description: "Blade is Laravel's templating engine. {{ $variable }} escapes HTML output (XSS protection). {!! $raw !!} outputs unescaped HTML. Directives: @if, @else, @elseif, @unless, @foreach, @forelse, @for, @while. Layout inheritance: @extends, @section, @yield, @include. Components: <x-alert type=\"success\" />. Stacks: @push/@stack for scripts. @csrf generates CSRF token field." },
            ],
            examples: [
              {
                title: "Laravel Controller with CRUD Operations",
                description: "A complete Laravel controller with resource methods",
                starterCode: "<?php\n\nnamespace App\\Http\\Controllers;\n\nuse App\\Models\\Post;\nuse Illuminate\\Http\\Request;\n\nclass PostController extends Controller {\n  // index, show, store, update, destroy methods\n}",
                solutionCode: "<?php\n\nnamespace App\\Http\\Controllers;\n\nuse App\\Models\\Post;\nuse App\\Http\\Requests\\StorePostRequest;\nuse Illuminate\\Http\\JsonResponse;\n\nclass PostController extends Controller {\n  public function index(): JsonResponse {\n    $posts = Post::with('user')\n      ->latest()\n      ->paginate(15);\n    return response()->json($posts);\n  }\n\n  public function show(Post $post): JsonResponse {\n    $post->load('user', 'comments');\n    return response()->json(['data' => $post]);\n  }\n\n  public function store(StorePostRequest $request): JsonResponse {\n    $post = $request->user()->posts()->create($request->validated());\n    return response()->json(['data' => $post], 201);\n  }\n\n  public function update(StorePostRequest $request, Post $post): JsonResponse {\n    $this->authorize('update', $post);\n    $post->update($request->validated());\n    return response()->json(['data' => $post]);\n  }\n\n  public function destroy(Post $post): JsonResponse {\n    $this->authorize('delete', $post);\n    $post->delete();\n    return response()->json(null, 204);\n  }\n}",
              },
            ],
            exercises: [
              {
                title: "Build a Blog with Laravel Routes",
                description: "Create routes and a controller for a blog with posts and comments. Implement resource routes for posts and nested routes for comments.",
                starterCode: "<?php\n\n// routes/web.php\n\n// routes/api.php\n\n// App\\Http\\Controllers\\PostController.php\n\n// App\\Http\\Controllers\\CommentController.php\n\n// Create a Blade layout with @extends and @section",
                testCases: "Posts resource route creates all CRUD endpoints; Comments are nested under posts (posts/{post}/comments); Controller uses route model binding; Blade template extends a layout; CSRF protection is included in forms",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Laravel Request Lifecycle", config: "{\"nodes\":[{\"id\":\"req\",\"label\":\"HTTP Request\",\"x\":250,\"y\":20},{\"id\":\"public\",\"label\":\"public/index.php\",\"x\":250,\"y\":90},{\"id\":\"kernel\",\"label\":\"HTTP Kernel\",\"x\":250,\"y\":160},{\"id\":\"middleware\",\"label\":\"Middleware Stack\",\"x\":250,\"y\":230},{\"id\":\"router\",\"label\":\"Route Matching\",\"x\":250,\"y\":300},{\"id\":\"controller\",\"label\":\"Controller\",\"x\":250,\"y\":370},{\"id\":\"response\",\"label\":\"Response\",\"x\":250,\"y\":440}],\"edges\":[{\"from\":\"req\",\"to\":\"public\"},{\"from\":\"public\",\"to\":\"kernel\"},{\"from\":\"kernel\",\"to\":\"middleware\"},{\"from\":\"middleware\",\"to\":\"router\"},{\"from\":\"router\",\"to\":\"controller\"},{\"from\":\"controller\",\"to\":\"response\"}]}" },
            ],
            lesson: { title: "Laravel Routing and Controllers", content: "Laravel follows MVC (Model-View-Controller). Routes in routes/web.php: Route::get('/users', [UserController::class, 'index']). Route groups with middleware: Route::middleware('auth')->group(...). Resource controllers: php artisan make:controller UserController --resource. Blade templates: {{ $variable }} escapes output, {!! $raw !!} doesn't. Blade directives: @if, @foreach, @extends, @section, @yield, @include. Components: <x-alert type=\"success\" />. Artisan CLI: php artisan make:model, make:migration, make:seeder, tinker (REPL).", explanation: "This lesson covers Laravel routing, controllers, Blade templating, and the Artisan CLI." },
          },
          {
            title: "Eloquent ORM & Database",
            description: "Master Laravel's Eloquent ORM, migrations, relationships, query scopes, and seeding.",
            slug: "eloquent-orm-database", difficulty: 3, prerequisites: [0, 1],
            concepts: [
              { title: "Eloquent Models", description: "Eloquent models represent database tables. Each model corresponds to a table (convention: User model → users table). Define fillable/guarded for mass assignment protection. Casts: $casts = ['is_admin' => 'boolean', 'metadata' => 'array']. Accessors: getFullNameAttribute(). Mutators: setPasswordAttribute(). Appending computed attributes: $appends = ['full_name']." },
              { title: "Eloquent Relationships", description: "Relationships: hasOne, hasMany, belongsTo, belongsToMany, hasManyThrough, morphMany. Eager loading: Post::with('user', 'comments')->get() prevents N+1 problem. Lazy eager loading: $post->load('comments'). Querying relationships: $user->posts()->where('published', true)->get(). Pivot tables for many-to-many with additional columns: withPivot(), withTimestamps()." },
              { title: "Migrations & Seeders", description: "Migrations are version control for database schema: php artisan make:migration. Schema::create() and Schema::table() define tables. Rollback: php artisan migrate:rollback. Seeders populate data: php artisan make:seeder. Factories generate fake data: Post::factory()->count(50)->create(). DatabaseSeeder calls seeders in order. Use php artisan migrate:fresh --seed for clean setup." },
            ],
            examples: [
              {
                title: "Eloquent Relationships and Query Scopes",
                description: "Defining relationships, scopes, and performing complex queries",
                starterCode: "<?php\n\nnamespace App\\Models;\n\nuse Illuminate\\Database\\Eloquent\\Model;\n\nclass Post extends Model {\n  // Define relationship with User\n  // Define scope for published posts\n  // Define scope for filtering by category\n}",
                solutionCode: "<?php\n\nnamespace App\\Models;\n\nuse Illuminate\\Database\\Eloquent\\Model;\nuse Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;\nuse Illuminate\\Database\\Eloquent\\Relations\\HasMany;\nuse Illuminate\\Database\\Eloquent\\Builder;\n\nclass Post extends Model {\n  protected $fillable = ['title', 'content', 'user_id', 'category_id', 'published_at'];\n\n  protected $casts = [\n    'published_at' => 'datetime',\n  ];\n\n  public function user(): BelongsTo {\n    return $this->belongsTo(User::class);\n  }\n\n  public function comments(): HasMany {\n    return $this->hasMany(Comment::class);\n  }\n\n  public function scopePublished(Builder $query): Builder {\n    return $query->whereNotNull('published_at')\n      ->where('published_at', '<=', now());\n  }\n\n  public function scopeByCategory(Builder $query, string $categoryId): Builder {\n    return $query->where('category_id', $categoryId);\n  }\n\n  public function scopePopular(Builder $query, int $minComments = 5): Builder {\n    return $query->withCount('comments')\n      ->having('comments_count', '>=', $minComments);\n  }\n}\n\nclass User extends Model {\n  public function posts(): HasMany {\n    return $this->hasMany(Post::class);\n  }\n\n  public function latestPosts(): HasMany {\n    return $this->hasMany(Post::class)->latest()->limit(5);\n  }\n}",
              },
            ],
            exercises: [
              {
                title: "Design an E-Commerce Database",
                description: "Create migrations and Eloquent models for an e-commerce system: Users, Products, Categories, Orders, OrderItems. Define relationships and write a query to get a user's order history with products.",
                starterCode: "<?php\n\n// Create migrations for:\n// categories (id, name, slug)\n// products (id, name, price, category_id, stock)\n// orders (id, user_id, total, status, created_at)\n// order_items (id, order_id, product_id, quantity, price)\n\n// Define Eloquent relationships\n// Write query to get user's orders with products",
                testCases: "All tables have proper foreign keys and indexes; Product belongsTo Category; Order belongsTo User; Order hasMany OrderItems; OrderItem belongsTo Product; Query returns user's orders with nested products; Soft deletes used on orders",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Eloquent Relationship Types", config: "{\"nodes\":[{\"id\":\"oto\",\"label\":\"hasOne / belongsTo\",\"x\":250,\"y\":20},{\"id\":\"otm\",\"label\":\"hasMany / belongsTo\",\"x\":250,\"y\":90},{\"id\":\"mtm\",\"label\":\"belongsToMany\",\"x\":250,\"y\":160},{\"id\":\"htm\",\"label\":\"hasManyThrough\",\"x\":250,\"y\":230},{\"id\":\"poly\",\"label\":\"morphMany / morphTo\",\"x\":250,\"y\":300}],\"edges\":[{\"from\":\"oto\",\"to\":\"otm\",\"label\":\"User → Profile\"},{\"from\":\"otm\",\"to\":\"mtm\",\"label\":\"Post → Comments\"},{\"from\":\"mtm\",\"to\":\"htm\",\"label\":\"User ↔ Role\"},{\"from\":\"htm\",\"to\":\"poly\",\"label\":\"Country → Posts\"}]}" },
            ],
            lesson: { title: "Eloquent ORM and Database Management", content: "Eloquent is Laravel's Active Record ORM. Models: php artisan make:model Post -m (with migration). Migrations define table structure: Schema::create('posts', function (Blueprint $table) { ... }). Relationships: hasOne, hasMany, belongsTo, belongsToMany, hasManyThrough. Eager loading prevents N+1: Post::with('comments')->get(). Query scopes: scopePublished($query). Accessors & mutators: getFullNameAttribute(), setPasswordAttribute(). Factories & Seeders: Post::factory()->count(50)->create(). Pagination: Post::paginate(15). Soft deletes: use SoftDeletes trait.", explanation: "This lesson covers Eloquent ORM, database migrations, relationships, and seeding in Laravel." },
          },
          {
            title: "Laravel API Development",
            description: "Build RESTful APIs with Laravel: API resources, Sanctum authentication, validation, and rate limiting.",
            slug: "laravel-api-development", difficulty: 3, prerequisites: [0, 1, 2],
            concepts: [
              { title: "API Resources", description: "API Resources transform Eloquent models into JSON. php artisan make:resource UserResource. Customize response shape with toArray(). Conditional attributes: when(), whenLoaded(). Resource collections: UserResource::collection($users). Add metadata to collections: ::collection()->additional(['total' => $count]). Nest related resources: 'posts' => PostResource::collection($this->whenLoaded('posts'))." },
              { title: "Laravel Sanctum", description: "Sanctum provides token-based API authentication. Use HasApiTokens trait on User model. Issue tokens: $user->createToken('app')->plainTextToken. Protect routes: Route::middleware('auth:sanctum'). Token abilities: createToken('app', ['read', 'write']). Check abilities: $user->tokenCan('write'). SPA authentication uses session cookies. Token expiration: config/sanctum.php." },
              { title: "Form Requests & Validation", description: "Form Requests encapsulate validation logic: php artisan make:request StoreUserRequest. Define rules(): array of validation rules. authorize(): return true or check permissions. Custom messages(): override error messages. Validated data: $request->validated(). Custom rules: php artisan make:rule. After validation hook: passedValidation(). Use validate() on the request for inline validation." },
            ],
            examples: [
              {
                title: "API Resource with Conditional Data",
                description: "Creating an API resource that conditionally includes relationships",
                starterCode: "<?php\n\nnamespace App\\Http\\Resources;\n\nuse Illuminate\\Http\\Resources\\Json\\JsonResource;\n\nclass PostResource extends JsonResource {\n  public function toArray($request) {\n    // Return post data with conditional relationships\n  }\n}",
                solutionCode: "<?php\n\nnamespace App\\Http\\Resources;\n\nuse Illuminate\\Http\\Resources\\Json\\JsonResource;\n\nclass PostResource extends JsonResource {\n  public function toArray($request): array {\n    return [\n      'id' => $this->id,\n      'title' => $this->title,\n      'content' => $this->when($request->user()?->isAdmin(), $this->content),\n      'excerpt' => str($this->content)->limit(150),\n      'author' => new UserResource($this->whenLoaded('user')),\n      'comments_count' => $this->whenCounted('comments'),\n      'comments' => CommentResource::collection($this->whenLoaded('comments')),\n      'published_at' => $this->published_at?->toISOString(),\n      'created_at' => $this->created_at->toISOString(),\n      'can' => [\n        'update' => $request->user()?->can('update', $this->resource),\n        'delete' => $request->user()?->can('delete', $this->resource),\n      ],\n    ];\n  }\n}",
              },
            ],
            exercises: [
              {
                title: "Build a Product API with Sanctum",
                description: "Create a REST API for products: public read endpoints, authenticated write endpoints using Sanctum tokens. Add rate limiting, API versioning, and proper error responses.",
                starterCode: "<?php\n\n// routes/api.php - v1 routes\n\n// App\\Http\\Controllers\\Api\\V1\\ProductController.php\n// - index: public, paginated\n// - show: public\n// - store: auth:sanctum, validated\n// - update: auth:sanctum, validated\n// - destroy: auth:sanctum, admin only\n\n// App\\Http\\Resources\\ProductResource.php\n\n// App\\Http\\Requests\\StoreProductRequest.php",
                testCases: "Public routes accessible without auth; Write routes require valid Sanctum token; Validation errors return 422 with details; Rate limiting is applied (60 req/min); API versioning via /api/v1/ prefix; Destroy requires admin token ability",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Sanctum Token Authentication", config: "{\"nodes\":[{\"id\":\"login\",\"label\":\"POST /login\",\"x\":250,\"y\":20},{\"id\":\"verify\",\"label\":\"Verify credentials\",\"x\":250,\"y\":90},{\"id\":\"token\",\"label\":\"Create token\",\"x\":250,\"y\":160},{\"id\":\"return\",\"label\":\"Return token\",\"x\":250,\"y\":230},{\"id\":\"req\",\"label\":\"API request + Bearer\",\"x\":250,\"y\":300},{\"id\":\"check\",\"label\":\"auth:sanctum\",\"x\":250,\"y\":370},{\"id\":\"allow\",\"label\":\"Process request\",\"x\":120,\"y\":440},{\"id\":\"deny\",\"label\":\"401 Unauthorized\",\"x\":380,\"y\":440}],\"edges\":[{\"from\":\"login\",\"to\":\"verify\"},{\"from\":\"verify\",\"to\":\"token\"},{\"from\":\"token\",\"to\":\"return\"},{\"from\":\"return\",\"to\":\"req\"},{\"from\":\"req\",\"to\":\"check\"},{\"from\":\"check\",\"to\":\"allow\",\"label\":\"valid\"},{\"from\":\"check\",\"to\":\"deny\",\"label\":\"invalid\"}]}" },
            ],
            lesson: { title: "Laravel API Development", content: "API Routes in routes/api.php. API Resources: php artisan make:resource UserResource transforms models to JSON. Form Requests for validation: php artisan make:request StoreUserRequest. Laravel Sanctum for API tokens: use Laravel\\Sanctum\\HasApiTokens trait. Rate limiting: config in app/Http/Kernel.php. API versioning: prefix routes with /api/v1/. CORS: config/cors.php. Response macros: response()->json()->withHeaders(). Error handling: custom exception handler in app/Exceptions/Handler.php. API documentation with Scramble or Scribe. Testing APIs: php artisan test --filter=UserApiTest with RefreshDatabase trait.", explanation: "This lesson covers building RESTful APIs with Laravel, Sanctum authentication, and API best practices." },
          },
          {
            title: "Queues, Jobs & Notifications",
            description: "Handle background processing with queues, scheduled tasks, email, and real-time notifications.",
            slug: "queues-jobs-notifications", difficulty: 3, prerequisites: [0, 1, 2],
            concepts: [
              { title: "Laravel Queues", description: "Queues defer time-consuming tasks (email sending, image processing, report generation) to background workers. Drivers: database, Redis, SQS, Beanstalkd. Create jobs: php artisan make:job ProcessPodcast. Dispatch: ProcessPodcast::dispatch($podcast). Chain jobs: Bus::chain([...]). Batch jobs: Bus::batch([...]). Failed jobs table tracks failures. Retry: php artisan queue:retry all." },
              { title: "Task Scheduling", description: "Laravel's scheduler replaces cron for task scheduling. Define all schedules in app/Console/Kernel.php: $schedule->command('emails:send')->daily(). Schedule frequency: everyMinute, hourly, daily, weekly, monthly. Timezone: ->timezone('America/Chicago'). Prevent overlap: ->withoutOverlapping(). Run on one server: ->onOneServer(). Output: ->sendOutputTo(), ->emailOutputTo()." },
              { title: "Notifications & Mail", description: "Notifications: php artisan make:notification InvoicePaid. Channels: mail, database, broadcast, Slack, SMS (Vonage). Mail: Mail::to($user)->send(new OrderShipped($order)). Markdown mailables for rich email templates. Queue mail: new OrderShipped()->queue(). Laravel Echo + Pusher/WebSockets for real-time events. Broadcast notifications to the frontend in real-time." },
            ],
            examples: [
              {
                title: "Job with Retry Logic and Notifications",
                description: "A queued job that processes an order, sends notifications, and handles failures",
                starterCode: "<?php\n\nnamespace App\\Jobs;\n\nuse Illuminate\\Bus\\Queueable;\nuse Illuminate\\Queue\\SerializesModels;\nuse Illuminate\\Queue\\InteractsWithQueue;\nuse Illuminate\\Contracts\\Queue\\ShouldQueue;\n\nclass ProcessOrder implements ShouldQueue {\n  use Queueable, InteractsWithQueue, SerializesModels;\n\n  public $tries = 3;\n  public $backoff = [30, 60, 120];\n\n  // Handle order processing\n  // Notify user on success\n  // Handle failure\n}",
                solutionCode: "<?php\n\nnamespace App\\Jobs;\n\nuse App\\Models\\Order;\nuse App\\Notifications\\OrderProcessed;\nuse App\\Notifications\\OrderFailed;\nuse Illuminate\\Bus\\Queueable;\nuse Illuminate\\Contracts\\Queue\\ShouldQueue;\nuse Illuminate\\Foundation\\Bus\\Dispatchable;\nuse Illuminate\\Queue\\InteractsWithQueue;\nuse Illuminate\\Queue\\SerializesModels;\n\nclass ProcessOrder implements ShouldQueue {\n  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;\n\n  public $tries = 3;\n  public $backoff = [30, 60, 120];\n\n  public function __construct(public Order $order) {}\n\n  public function handle(): void {\n    $this->order->update(['status' => 'processing']);\n\n    $this->order->user->notify(new OrderProcessed($this->order));\n\n    $this->order->update(['status' => 'completed']);\n  }\n\n  public function failed(\\Throwable $exception): void {\n    $this->order->update(['status' => 'failed']);\n    $this->order->user->notify(new OrderFailed($this->order, $exception->getMessage()));\n  }\n}",
              },
            ],
            exercises: [
              {
                title: "Create a Scheduled Report Generator",
                description: "Build a job that generates a weekly sales report, stores it, and emails it to admins. Schedule it to run every Monday at 8 AM.",
                starterCode: "<?php\n\n// App\\Jobs\\GenerateWeeklyReport.php\n// - Calculate total sales, orders, new users\n// - Generate PDF/excel report\n// - Store in storage\n// - Notify admins via email\n\n// App\\Console\\Kernel.php\n// - Schedule every Monday at 8 AM\n\n// App\\Notifications\\WeeklyReportReady.php\n// - Mail notification with download link",
                testCases: "Job calculates correct weekly metrics; Report file is stored in storage/app/reports; Job handles week with no sales gracefully; Schedule is configured for Monday 8 AM; Notification is sent to all admin users; Failed job is logged in failed_jobs table",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Laravel Queue Job Lifecycle", config: "{\"nodes\":[{\"id\":\"dispatch\",\"label\":\"Dispatch Job\",\"x\":250,\"y\":20},{\"id\":\"queue\",\"label\":\"Stored in Queue\",\"x\":250,\"y\":90},{\"id\":\"worker\",\"label\":\"Worker picks up\",\"x\":250,\"y\":160},{\"id\":\"execute\",\"label\":\"handle()\",\"x\":250,\"y\":230},{\"id\":\"success\",\"label\":\"Job completed\",\"x\":120,\"y\":300},{\"id\":\"fail\",\"label\":\"Exception thrown\",\"x\":380,\"y\":300},{\"id\":\"retry\",\"label\":\"Retry (if tries left)\",\"x\":380,\"y\":370},{\"id\":\"failedDb\",\"label\":\"Store in failed_jobs\",\"x\":380,\"y\":440}],\"edges\":[{\"from\":\"dispatch\",\"to\":\"queue\"},{\"from\":\"queue\",\"to\":\"worker\"},{\"from\":\"worker\",\"to\":\"execute\"},{\"from\":\"execute\",\"to\":\"success\",\"label\":\"ok\"},{\"from\":\"execute\",\"to\":\"fail\",\"label\":\"error\"},{\"from\":\"fail\",\"to\":\"retry\",\"label\":\"tries < max\"},{\"from\":\"fail\",\"to\":\"failedDb\",\"label\":\"tries = max\"},{\"from\":\"retry\",\"to\":\"queue\"}]}" },
            ],
            lesson: { title: "Queues, Jobs, and Notifications in Laravel", content: "Queues: defer time-consuming tasks. Drivers: database, redis, sqs. Create job: php artisan make:job ProcessPodcast. Dispatch: ProcessPodcast::dispatch($podcast)->delay(now()->addMinutes(10)). Failed jobs: failed_jobs table, php artisan queue:retry. Task Scheduling: define in app/Console/Kernel.php: $schedule->command('inspire')->hourly(). Notifications: php artisan make:notification InvoicePaid. Channels: mail, database, broadcast, Slack, SMS. Mail: Mail::to($user)->send(new OrderShipped($order)). Markdown mailables for rich emails. Laravel Echo + Pusher for real-time WebSocket events.", explanation: "This lesson covers Laravel queues, job processing, task scheduling, and notification systems." },
          },
        ],
      },
      {
        title: "Phase 3: Production & DevOps",
        description: "Learn deployment, monitoring, CI/CD, and production best practices for backend applications.",
        slug: "production-devops-backend",
        topics: [
          {
            title: "Docker & Containerization",
            description: "Containerize Node.js and Laravel applications with Docker and Docker Compose.",
            slug: "docker-containerization", difficulty: 3, prerequisites: [0],
            concepts: [
              { title: "Docker Images & Containers", description: "A Docker image is a read-only template with application code, dependencies, and configuration. A container is a running instance of an image. Images are built from Dockerfiles using layers (each instruction creates a layer). Multi-stage builds separate build dependencies from production runtime for smaller images. Use .dockerignore to exclude unnecessary files." },
              { title: "Docker Compose", description: "Docker Compose defines multi-container applications in docker-compose.yml. Services: app, database, cache, queue, web server. Networks for inter-service communication. Volumes for persistent data and development hot-reload. Environment variables from .env file. docker compose up -d starts all services. docker compose down stops and removes containers." },
              { title: "Container Best Practices", description: "Use specific base image tags (node:20-alpine, not node:latest). Run as non-root user. Minimize layers by combining RUN commands. Use .dockerignore. Health checks: HEALTHCHECK in Dockerfile. Set resource limits: deploy.resources.limits. Never store secrets in images. Use multi-stage builds. Scan images for vulnerabilities: docker scan." },
            ],
            examples: [
              {
                title: "Docker Compose for Node.js + PostgreSQL",
                description: "A docker-compose.yml for a Node.js app with PostgreSQL and Redis",
                starterCode: "# docker-compose.yml\nversion: '3.8'\n\nservices:\n  # Node.js app\n  # PostgreSQL database\n  # Redis cache",
                solutionCode: "version: '3.8'\n\nservices:\n  app:\n    build:\n      context: .\n      dockerfile: Dockerfile\n    ports:\n      - '3000:3000'\n    environment:\n      - NODE_ENV=production\n      - DATABASE_URL=postgresql://user:password@db:5432/mydb\n      - REDIS_URL=redis://cache:6379\n    depends_on:\n      db:\n        condition: service_healthy\n      cache:\n        condition: service_healthy\n    restart: unless-stopped\n\n  db:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: password\n      POSTGRES_DB: mydb\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n    healthcheck:\n      test: ['CMD-SHELL', 'pg_isready -U user -d mydb']\n      interval: 10s\n      timeout: 5s\n      retries: 5\n\n  cache:\n    image: redis:7-alpine\n    healthcheck:\n      test: ['CMD', 'redis-cli', 'ping']\n      interval: 10s\n      timeout: 5s\n      retries: 5\n\nvolumes:\n  pgdata:",
              },
            ],
            exercises: [
              {
                title: "Dockerize a Laravel Application",
                description: "Create a Dockerfile and docker-compose.yml for a Laravel app with PHP-FPM, Nginx, MySQL, and Redis. Include proper permissions and health checks.",
                starterCode: "# Dockerfile\n# - PHP 8.3-FPM base\n# - Install system dependencies\n# - Install Composer\n# - Copy application code\n# - Set proper permissions\n\n# docker-compose.yml\n# - app (PHP-FPM)\n# - web (Nginx)\n# - db (MySQL)\n# - cache (Redis)",
                testCases: "Dockerfile uses multi-stage build for production; PHP-FPM runs as non-root user; Nginx configured as reverse proxy; MySQL has persistent volume; Redis health check configured; Database migrations run on container start; Storage directory is writable",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "Docker Build & Deploy Pipeline", config: "{\"nodes\":[{\"id\":\"code\",\"label\":\"Source Code\",\"x\":250,\"y\":20},{\"id\":\"dockerfile\",\"label\":\"Dockerfile\",\"x\":250,\"y\":90},{\"id\":\"build\",\"label\":\"docker build\",\"x\":250,\"y\":160},{\"id\":\"image\",\"label\":\"Docker Image\",\"x\":250,\"y\":230},{\"id\":\"push\",\"label\":\"docker push\",\"x\":250,\"y\":300},{\"id\":\"registry\",\"label\":\"Container Registry\",\"x\":250,\"y\":370},{\"id\":\"pull\",\"label\":\"docker pull\",\"x\":250,\"y\":440},{\"id\":\"run\",\"label\":\"docker run\",\"x\":250,\"y\":510}],\"edges\":[{\"from\":\"code\",\"to\":\"dockerfile\"},{\"from\":\"dockerfile\",\"to\":\"build\"},{\"from\":\"build\",\"to\":\"image\"},{\"from\":\"image\",\"to\":\"push\"},{\"from\":\"push\",\"to\":\"registry\"},{\"from\":\"registry\",\"to\":\"pull\"},{\"from\":\"pull\",\"to\":\"run\"}]}" },
            ],
            lesson: { title: "Docker and Containerization for Backend", content: "Docker packages apps with all dependencies. Dockerfile: FROM node:20-alpine, WORKDIR /app, COPY package*.json ./, RUN npm ci --production, COPY . ., CMD [\"node\", \"server.js\"]. Multi-stage builds: separate build and production stages. Docker Compose: define services (app, db, redis, nginx) in docker-compose.yml. Volumes for persistent data and hot reloading. Networks for inter-service communication. docker build -t myapp ., docker compose up -d. .dockerignore to exclude node_modules. Health checks: HEALTHCHECK in Dockerfile. Laravel-specific: ensure storage/ and bootstrap/cache/ are writable.", explanation: "This lesson covers Docker, Docker Compose, and containerizing Node.js and Laravel applications." },
          },
          {
            title: "CI/CD & Deployment",
            description: "Set up GitHub Actions for automated testing and deployment to cloud platforms.",
            slug: "cicd-deployment-backend", difficulty: 3, prerequisites: [0],
            concepts: [
              { title: "GitHub Actions", description: "GitHub Actions automates CI/CD pipelines. Workflows are YAML files in .github/workflows/. Define triggers: on push, pull_request, schedule. Jobs run in parallel by default; use needs to sequence. Steps: actions/checkout, setup-node/setup-php, run tests, build, deploy. Secrets stored in repository settings → secrets. Matrix builds test across multiple versions." },
              { title: "Deployment Strategies", description: "Common strategies: Rolling deployment (replace instances gradually), Blue-green (two identical environments, switch traffic), Canary (gradually route % of traffic to new version). Zero-downtime: use load balancers, health checks, graceful shutdown. Rollback: keep previous deployment artifacts, automate rollback on health check failure. Database migrations: run before deployment, make backward-compatible." },
              { title: "Monitoring & Observability", description: "Production monitoring: structured logging (JSON format, correlation IDs), metrics (request rate, latency, error rate, resource usage), tracing (distributed tracing across services). Tools: Sentry for error tracking, Datadog/New Relic for APM, Grafana + Prometheus for metrics, ELK stack for log aggregation. Set up alerts for critical thresholds. Health check endpoints for load balancers." },
            ],
            examples: [
              {
                title: "GitHub Actions CI/CD Workflow",
                description: "A complete GitHub Actions workflow for a Node.js API",
                starterCode: "# .github/workflows/deploy.yml\nname: Deploy\n\non:\n  push:\n    branches: [main]\n\njobs:\n  # Test job\n  # Deploy job",
                solutionCode: "name: Test and Deploy\n\non:\n  push:\n    branches: [main, staging]\n  pull_request:\n    branches: [main]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    services:\n      postgres:\n        image: postgres:16-alpine\n        env:\n          POSTGRES_USER: test\n          POSTGRES_PASSWORD: test\n          POSTGRES_DB: testdb\n        ports:\n          - 5432:5432\n        options: >-\n          --health-cmd pg_isready\n          --health-interval 10s\n          --health-timeout 5s\n          --health-retries 5\n\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n          cache: 'npm'\n      - run: npm ci\n      - run: npm run lint\n      - run: npm test\n        env:\n          DATABASE_URL: postgresql://test:test@localhost:5432/testdb\n\n  deploy:\n    needs: test\n    if: github.ref == 'refs/heads/main'\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Deploy to production\n        run: |\n          echo \"Deploying to production...\"\n        env:\n          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}",
              },
            ],
            exercises: [
              {
                title: "Create a CI/CD Pipeline for Laravel",
                description: "Design a GitHub Actions workflow that runs PHP tests, lints code, builds assets, and deploys to a server. Include database migrations and cache clearing.",
                starterCode: "# .github/workflows/laravel-ci.yml\nname: Laravel CI/CD\n\non:\n  push:\n    branches: [main]\n\njobs:\n  test:\n    # PHP setup, MySQL service, run tests\n\n  deploy:\n    needs: test\n    # Deploy to server via SSH",
                testCases: "Workflow runs on push to main; PHP 8.3 is set up with Composer; MySQL service is configured for tests; PHPUnit tests run successfully; Linting (Pint/PHPCS) passes; Deployment only runs if tests pass; SSH deploy uses secrets for credentials",
              },
            ],
            visualizations: [
              { type: "flowchart", title: "CI/CD Pipeline Overview", config: "{\"nodes\":[{\"id\":\"push\",\"label\":\"Git Push\",\"x\":250,\"y\":20},{\"id\":\"trigger\",\"label\":\"GitHub Actions\",\"x\":250,\"y\":90},{\"id\":\"lint\",\"label\":\"Lint & Format\",\"x\":250,\"y\":160},{\"id\":\"test\",\"label\":\"Run Tests\",\"x\":250,\"y\":230},{\"id\":\"build\",\"label\":\"Build Artifacts\",\"x\":250,\"y\":300},{\"id\":\"staging\",\"label\":\"Deploy Staging\",\"x\":120,\"y\":370},{\"id\":\"approval\",\"label\":\"Manual Approval\",\"x\":380,\"y\":370},{\"id\":\"prod\",\"label\":\"Deploy Production\",\"x\":250,\"y\":440}],\"edges\":[{\"from\":\"push\",\"to\":\"trigger\"},{\"from\":\"trigger\",\"to\":\"lint\"},{\"from\":\"lint\",\"to\":\"test\"},{\"from\":\"test\",\"to\":\"build\"},{\"from\":\"build\",\"to\":\"staging\"},{\"from\":\"staging\",\"to\":\"approval\"},{\"from\":\"approval\",\"to\":\"prod\"}]}" },
            ],
            lesson: { title: "CI/CD and Deployment for Backend Apps", content: "CI/CD automates testing and deployment. GitHub Actions: .github/workflows/deploy.yml defines jobs. Steps: checkout code, setup Node/PHP, install dependencies, run tests, build, deploy. Deploy Node.js to Railway/Render/VPS. Deploy Laravel to Laravel Forge, DigitalOcean, or AWS. Environment management: .env.example for template, actual secrets in CI secrets or platform env vars. Database migrations run on deploy: php artisan migrate --force. Zero-downtime deployment: blue-green or rolling updates. Rollback strategy: keep previous release, quick revert. Monitoring: use Sentry for error tracking, New Relic for performance.", explanation: "This lesson covers CI/CD with GitHub Actions and deploying backend applications to production." },
          },
        ],
      },
    ],
  },
{
    title: "Mobile App Development",
    description: "Build native and cross-platform mobile applications with React Native and Flutter.",
    slug: "mobile-app-development",
    stream: "mobile",
    modules: [
      {
        title: "Phase 1: React Native",
        description: "Build cross-platform mobile apps with React Native, Expo, and TypeScript.",
        slug: "react-native",
        topics: [
          {
            title: "React Native Fundamentals",
            description: "Set up React Native with Expo, components, JSX, and the mobile render cycle.",
            slug: "react-native-fundamentals", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "Core Components", description: "React Native provides platform-specific components: View, Text, Image, ScrollView, FlatList, TextInput, TouchableOpacity, Modal, SafeAreaView. No HTML — only React Native components." },
              { title: "StyleSheet", description: "Styles use StyleSheet.create() with camelCase CSS-like properties. Flexbox is default layout with column direction. No CSS inheritance. Platform.select() for platform-specific styles." },
              { title: "Expo Ecosystem", description: "Expo simplifies development with managed workflow, pre-built modules, OTA updates. Expo Go for testing. EAS Build for cloud builds. Expo Router for file-based routing." },
            ],
            examples: [
              { title: "React Native Counter App", description: "A counter app with useState and TouchableOpacity", starterCode: "import React from 'react';\nimport { View, Text, TouchableOpacity, StyleSheet } from 'react-native';\n\nexport default function Counter() {\n  return (<View style={styles.container}><Text>Counter</Text></View>);\n}\nconst styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });", solutionCode: "import React, { useState } from 'react';\nimport { View, Text, TouchableOpacity, StyleSheet } from 'react-native';\n\nexport default function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>Counter</Text>\n      <Text style={styles.count}>{count}</Text>\n      <View style={styles.buttonRow}>\n        <TouchableOpacity style={[styles.button, styles.decrement]} onPress={() => setCount(c => c - 1)}>\n          <Text style={styles.buttonText}>-</Text>\n        </TouchableOpacity>\n        <TouchableOpacity style={[styles.button, styles.increment]} onPress={() => setCount(c => c + 1)}>\n          <Text style={styles.buttonText}>+</Text>\n        </TouchableOpacity>\n      </View>\n    </View>\n  );\n}\nconst styles = StyleSheet.create({\n  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },\n  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },\n  count: { fontSize: 48, fontWeight: 'bold', color: '#333', marginBottom: 30 },\n  buttonRow: { flexDirection: 'row', gap: 10 },\n  button: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: '#007AFF' },\n  decrement: { backgroundColor: '#FF3B30' },\n  increment: { backgroundColor: '#34C759' },\n  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },\n});" },
            ],
            exercises: [{ title: "Build a Todo List App", description: "Create a todo app with add, toggle, delete using FlatList", starterCode: "import React, { useState } from 'react';\nimport { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';\n\nexport default function TodoApp() {\n  const [todos, setTodos] = useState([]);\n  const [text, setText] = useState('');\n  return <View>{/* Build UI */}</View>;\n}", testCases: "Adding todo adds to list; Tapping toggles completed; Delete button removes; FlatList used; Empty state shown" }],
            visualizations: [{ type: "flowchart", title: "React Native Bridge Architecture", config: "{\"nodes\":[{\"id\":\"js\",\"label\":\"JS Thread\",\"x\":250,\"y\":20},{\"id\":\"bridge\",\"label\":\"RN Bridge\",\"x\":250,\"y\":100},{\"id\":\"native\",\"label\":\"Native Modules\",\"x\":120,\"y\":180},{\"id\":\"shadow\",\"label\":\"Shadow Thread\",\"x\":380,\"y\":180}],\"edges\":[{\"from\":\"js\",\"to\":\"bridge\"},{\"from\":\"bridge\",\"to\":\"native\"},{\"from\":\"bridge\",\"to\":\"shadow\"}]}" }],
            lesson: { title: "React Native Fundamentals", content: "React Native lets you build mobile apps with React. Expo simplifies setup: npx create-expo-app. Core components: View, Text, Image, ScrollView, FlatList, TextInput, TouchableOpacity. Flexbox layout is default. StyleSheet.create() for styles. Platform.select() for platform-specific code. Expo Go for testing. Hot reloading updates instantly.", explanation: "This lesson introduces React Native, Expo, and core components." },
          },
          {
            title: "Navigation & Routing",
            description: "Implement navigation with React Navigation: stack, tab, and drawer navigators.",
            slug: "react-native-navigation", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "Stack Navigator", description: "Stack Navigator provides card-based navigation. navigate('Screen', params) pushes, goBack() pops. Pass params between screens. Header customization with options." },
              { title: "Tab Navigator", description: "Tab Navigator creates bottom tab bar. Each tab has its own stack. Customize with tabBarIcon and tabBarBadge. Lazy loading for performance." },
              { title: "Navigation Type Safety", description: "TypeScript with React Navigation: define RootStackParamList, useNavigation<NativeStackNavigationProp<>>, useRoute<RouteProp<>>. Prevents errors and ensures param types." },
            ],
            examples: [
              { title: "React Navigation Setup", description: "Stack and Tab navigation with typed params", starterCode: "import { NavigationContainer } from '@react-navigation/native';\nimport { createNativeStackNavigator } from '@react-navigation/native-stack';\n\ntype RootStackParamList = { Home: undefined; Details: { itemId: number } };\nconst Stack = createNativeStackNavigator<RootStackParamList>();\n// Build navigator", solutionCode: "import { NavigationContainer } from '@react-navigation/native';\nimport { createNativeStackNavigator } from '@react-navigation/native-stack';\n\ntype RootStackParamList = { Home: undefined; Details: { itemId: number; title: string } };\nconst Stack = createNativeStackNavigator<RootStackParamList>();\n\nfunction HomeScreen({ navigation }) {\n  return (<View><Button title=\"Go to Details\" onPress={() => navigation.navigate('Details', { itemId: 42, title: 'My Item' })} /></View>);\n}\n\nfunction DetailsScreen({ route, navigation }) {\n  const { itemId, title } = route.params;\n  return (<View><Text>Item: {title} (ID: {itemId})</Text><Button title=\"Go Back\" onPress={() => navigation.goBack()} /></View>);\n}\n\nexport default function App() {\n  return (<NavigationContainer><Stack.Navigator><Stack.Screen name=\"Home\" component={HomeScreen} /><Stack.Screen name=\"Details\" component={DetailsScreen} /></Stack.Navigator></NavigationContainer>);\n}" },
            ],
            exercises: [{ title: "Build a Multi-Screen App", description: "Create an app with tabs (Home, Search, Profile) and a detail screen", starterCode: "// App.tsx - Navigation setup\n// screens/HomeScreen.tsx\n// screens/DetailScreen.tsx\n// screens/SearchScreen.tsx\n// screens/ProfileScreen.tsx", testCases: "Bottom tab navigator with 3 tabs; Home has FlatList; Tapping item navigates to Detail; Back button returns" }],
            visualizations: [{ type: "flowchart", title: "React Navigation Structure", config: "{\"nodes\":[{\"id\":\"nav\",\"label\":\"NavigationContainer\",\"x\":250,\"y\":20},{\"id\":\"tabs\",\"label\":\"Tab Navigator\",\"x\":250,\"y\":100},{\"id\":\"home\",\"label\":\"Home\",\"x\":100,\"y\":180},{\"id\":\"search\",\"label\":\"Search\",\"x\":250,\"y\":180},{\"id\":\"profile\",\"label\":\"Profile\",\"x\":400,\"y\":180}],\"edges\":[{\"from\":\"nav\",\"to\":\"tabs\"},{\"from\":\"tabs\",\"to\":\"home\"},{\"from\":\"tabs\",\"to\":\"search\"},{\"from\":\"tabs\",\"to\":\"profile\"}]}" }],
            lesson: { title: "React Navigation", content: "React Navigation is the standard. Stack Navigator for push/pop. Tab Navigator for bottom tabs. NavigationContainer wraps app. navigate('Screen', { params }). goBack(). Deep linking, header customization, type-safe navigation.", explanation: "This lesson covers React Navigation for mobile apps." },
          },
          {
            title: "State Management",
            description: "Manage app state with React Context, Zustand, and data fetching patterns.",
            slug: "state-management-mobile", difficulty: 3, prerequisites: [0],
            concepts: [
              { title: "Zustand", description: "Lightweight state management: create((set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })) })). No providers needed. Supports persist, devtools, immer middleware." },
              { title: "React Query", description: "Handles server state: useQuery for reads, useMutation for writes. Automatic caching, refetching, pagination, optimistic updates. staleTime and cacheTime for cache control." },
              { title: "Persistent Storage", description: "AsyncStorage for persistent key-value. SecureStore for sensitive data. Zustand persist middleware for automatic state persistence. MMKV for fast synchronous storage." },
            ],
            examples: [
              { title: "Zustand Auth Store", description: "Zustand store for auth with AsyncStorage persistence", starterCode: "import { create } from 'zustand';\nimport { persist, createJSONStorage } from 'zustand/middleware';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\n// Create auth store", solutionCode: "import { create } from 'zustand';\nimport { persist, createJSONStorage } from 'zustand/middleware';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\n\ninterface AuthState {\n  user: { id: string; email: string } | null;\n  token: string | null;\n  login: (email: string, password: string) => Promise<void>;\n  logout: () => void;\n}\n\nexport const useAuthStore = create<AuthState>()(\n  persist(\n    (set) => ({\n      user: null, token: null,\n      login: async (email, password) => {\n        const response = await fetch('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });\n        const data = await response.json();\n        set({ user: data.user, token: data.token });\n      },\n      logout: () => set({ user: null, token: null }),\n    }),\n    { name: 'auth-storage', storage: createJSONStorage(() => AsyncStorage) },\n  )\n);" },
            ],
            exercises: [{ title: "Build a Shopping Cart Store", description: "Create a Zustand store for cart with add/remove/update quantity, totals, persistence", starterCode: "import { create } from 'zustand';\n\ninterface CartItem { id: string; name: string; price: number; quantity: number; }\n// Create store with addItem, removeItem, updateQuantity, getTotal", testCases: "addItem adds or increments; removeItem removes; getTotal calculates correctly; cart persists across restarts" }],
            visualizations: [{ type: "flowchart", title: "State Management Decision", config: "{\"nodes\":[{\"id\":\"type\",\"label\":\"State type?\",\"x\":250,\"y\":20},{\"id\":\"server\",\"label\":\"React Query\",\"x\":100,\"y\":100},{\"id\":\"simple\",\"label\":\"Simple?\",\"x\":400,\"y\":100},{\"id\":\"context\",\"label\":\"Context\",\"x\":300,\"y\":180},{\"id\":\"zustand\",\"label\":\"Zustand\",\"x\":500,\"y\":180}],\"edges\":[{\"from\":\"type\",\"to\":\"server\",\"label\":\"server\"},{\"from\":\"type\",\"to\":\"simple\",\"label\":\"client\"},{\"from\":\"simple\",\"to\":\"context\",\"label\":\"yes\"},{\"from\":\"simple\",\"to\":\"zustand\",\"label\":\"no\"}]}" }],
            lesson: { title: "Mobile State Management", content: "Zustand: lightweight, simple API. React Query for server state: useQuery, useMutation. AsyncStorage for persistent storage. SecureStore for sensitive data. MMKV for fast storage.", explanation: "This lesson covers state management in mobile apps." },
          },
          {
            title: "Native Features & APIs",
            description: "Access device features: camera, location, push notifications, and biometrics.",
            slug: "native-features-apis", difficulty: 3, prerequisites: [0, 1],
            concepts: [
              { title: "Camera & Media", description: "expo-camera: request permissions, capture photos/videos. expo-image-picker: pick from gallery. expo-media-library: save/read media. Handle permissions with Permission.requestAsync()." },
              { title: "Location & Maps", description: "expo-location: getCurrentPositionAsync() for one-time, watchPositionAsync() for tracking. Options: accuracy, distanceInterval. Geofencing support." },
              { title: "Push Notifications", description: "expo-notifications: schedule local, handle push. Get Expo push token. Notification channels (Android). Handle notification tap to navigate. Badge count on iOS." },
            ],
            examples: [
              { title: "Camera with Permission Handling", description: "Using expo-camera with proper permissions", starterCode: "import { Camera } from 'expo-camera';\nimport { useState, useRef } from 'react';\nimport { View, Text, TouchableOpacity } from 'react-native';\n\nexport default function CameraScreen() {\n  return <View>{/* Camera */}</View>;\n}", solutionCode: "import { Camera, CameraType } from 'expo-camera';\nimport { useState, useRef } from 'react';\nimport { View, Text, TouchableOpacity, Image } from 'react-native';\n\nexport default function CameraScreen() {\n  const [permission, requestPermission] = Camera.useCameraPermissions();\n  const [photo, setPhoto] = useState(null);\n  const cameraRef = useRef(null);\n  if (!permission) return <View />;\n  if (!permission.granted) {\n    return (<View><Text>We need camera permission</Text><TouchableOpacity onPress={requestPermission}><Text>Grant</Text></TouchableOpacity></View>);\n  }\n  async function takePicture() {\n    if (cameraRef.current) { const photo = await cameraRef.current.takePictureAsync(); setPhoto(photo); }\n  }\n  return (<View style={{ flex: 1 }}><Camera ref={cameraRef} style={{ flex: 1 }} type={CameraType.back}><TouchableOpacity onPress={takePicture}><Text>Take Photo</Text></TouchableOpacity></Camera>{photo && <Image source={{ uri: photo.uri }} style={{ width: 100, height: 100 }} />}</View>);\n}" },
            ],
            exercises: [{ title: "Build a Location Tracker", description: "Track and display user location in real-time", starterCode: "import * as Location from 'expo-location';\nimport { useState, useEffect } from 'react';\nimport { View, Text } from 'react-native';\n\nexport default function LocationTracker() {\n  const [location, setLocation] = useState(null);\n  return <View>{/* Display location */}</View>;\n}", testCases: "Requests location permission; Displays latitude/longitude; Updates in real-time; Shows accuracy; Handles denial" }],
            visualizations: [{ type: "flowchart", title: "Expo Permission Flow", config: "{\"nodes\":[{\"id\":\"call\",\"label\":\"API called\",\"x\":250,\"y\":20},{\"id\":\"check\",\"label\":\"Granted?\",\"x\":250,\"y\":100},{\"id\":\"request\",\"label\":\"Request\",\"x\":250,\"y\":180},{\"id\":\"granted\",\"label\":\"Execute\",\"x\":120,\"y\":260},{\"id\":\"denied\",\"label\":\"Fallback\",\"x\":380,\"y\":260}],\"edges\":[{\"from\":\"call\",\"to\":\"check\"},{\"from\":\"check\",\"to\":\"granted\",\"label\":\"yes\"},{\"from\":\"check\",\"to\":\"request\",\"label\":\"no\"},{\"from\":\"request\",\"to\":\"granted\",\"label\":\"granted\"},{\"from\":\"request\",\"to\":\"denied\",\"label\":\"denied\"}]}" }],
            lesson: { title: "Native Device Features", content: "Camera: expo-camera. Location: expo-location. Push Notifications: expo-notifications. Biometrics: expo-local-authentication. Always request permissions at point of use. Handle denials gracefully.", explanation: "This lesson covers native device features in React Native." },
          },
        ],
      },
      {
        title: "Phase 2: Flutter & Dart",
        description: "Learn Flutter and Dart for natively compiled, beautiful mobile applications.",
        slug: "flutter-dart",
        topics: [
          {
            title: "Dart Fundamentals",
            description: "Learn Dart syntax, null safety, async programming, and OOP patterns.",
            slug: "dart-fundamentals", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "Dart Null Safety", description: "Prevents null reference errors at compile time. Non-nullable (String) vs nullable (String?). Safe navigation ?., default values ??, late variables. Required named parameters." },
              { title: "Dart Collections", description: "List (ordered), Set (unique), Map (key-value). .map(), .where(), .reduce(). Spread operator [...]. Collection if/for. Map iteration with forEach." },
              { title: "Async in Dart", description: "Future<T> for async values. async/await. Stream<T> for event sequences. try/catch/on. Future.wait() for concurrent. async* and yield for generators." },
            ],
            examples: [
              { title: "Dart Class with Factory", description: "Dart OOP, null safety, and factory pattern", starterCode: "class User {\n  final String name;\n  final String email;\n  // Constructor, factory fromJson, toJson\n}", solutionCode: "class User {\n  final String name;\n  final String email;\n  final DateTime createdAt;\n\n  User({required this.name, required this.email}) : createdAt = DateTime.now();\n\n  factory User.fromJson(Map<String, dynamic> json) {\n    return User(name: json['name'] as String, email: json['email'] as String);\n  }\n\n  Map<String, dynamic> toJson() => {'name': name, 'email': email};\n  String get initials => name.split(' ').map((n) => n[0]).join().toUpperCase();\n}\n\nvoid main() {\n  final user = User(name: 'John Doe', email: 'john@example.com');\n  print(user.initials);\n}" },
            ],
            exercises: [{ title: "Build a Data Processing Pipeline", description: "Process products: filter by price, sort, total value, most expensive", starterCode: "class Product { final String name; final double price; final int quantity; Product({required this.name, required this.price, required this.quantity}); }\n\nList<Product> filterByPriceRange(List<Product> products, double min, double max) { /* return filtered */ }\ndouble totalInventoryValue(List<Product> products) { /* return total */ }", testCases: "filterByPriceRange returns correct subset; totalInventoryValue correct; empty lists handled" }],
            visualizations: [{ type: "flowchart", title: "Dart Compilation", config: "{\"nodes\":[{\"id\":\"source\",\"label\":\"Dart Source\",\"x\":250,\"y\":20},{\"id\":\"compile\",\"label\":\"Dart Compiler\",\"x\":250,\"y\":100},{\"id\":\"jit\",\"label\":\"JIT (Dev)\",\"x\":120,\"y\":180},{\"id\":\"aot\",\"label\":\"AOT (Prod)\",\"x\":380,\"y\":180}],\"edges\":[{\"from\":\"source\",\"to\":\"compile\"},{\"from\":\"compile\",\"to\":\"jit\",\"label\":\"debug\"},{\"from\":\"compile\",\"to\":\"aot\",\"label\":\"release\"}]}" }],
            lesson: { title: "Dart Fundamentals", content: "Dart: client-optimized OOP. Variables: var, final, const. Null safety: String? vs String. Types: int, double, String, bool, List, Map, Set. Async: Future<T>, async/await. Classes, constructors. Collections: map(), where(), reduce().", explanation: "This lesson introduces Dart syntax, null safety, and async programming." },
          },
          {
            title: "Flutter Widgets & Layout",
            description: "Master Flutter's widget tree, stateful/stateless widgets, and layout system.",
            slug: "flutter-widgets-layout", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "Widget Tree", description: "Everything is a widget. StatelessWidget: immutable, builds once. StatefulWidget: mutable, setState() triggers rebuild. Lifecycle: createState, initState, build, didUpdateWidget, dispose." },
              { title: "Layout Widgets", description: "Row: horizontal. Column: vertical. Expanded: takes remaining space. Stack: layers. Container: padding, margin, decoration. SizedBox: fixed size. Wrap: wraps to next line." },
              { title: "Material Design", description: "MaterialApp wraps with Material Design. Scaffold: AppBar, body, BottomNavigationBar, FAB, Drawer. ThemeData for colors, typography. Card, ListTile, Chip, SnackBar." },
            ],
            examples: [
              { title: "Flutter Product Card", description: "Stateful widget with favorite toggle", starterCode: "import 'package:flutter/material.dart';\n\nclass ProductCard extends StatefulWidget {\n  final String name;\n  final double price;\n  @override State<ProductCard> createState() => _ProductCardState();\n}\n\nclass _ProductCardState extends State<ProductCard> {\n  @override Widget build(BuildContext context) { return Card(child: Text(widget.name)); }\n}", solutionCode: "import 'package:flutter/material.dart';\n\nclass ProductCard extends StatefulWidget {\n  final String name;\n  final double price;\n  const ProductCard({super.key, required this.name, required this.price});\n  @override State<ProductCard> createState() => _ProductCardState();\n}\n\nclass _ProductCardState extends State<ProductCard> {\n  bool _isFavorite = false;\n  @override\n  Widget build(BuildContext context) {\n    return Card(child: Padding(padding: const EdgeInsets.all(12), child: Row(\n      mainAxisAlignment: MainAxisAlignment.spaceBetween,\n      children: [\n        Expanded(child: Text(widget.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold))),\n        IconButton(icon: Icon(_isFavorite ? Icons.favorite : Icons.favorite_border, color: _isFavorite ? Colors.red : Colors.grey), onPressed: () => setState(() => _isFavorite = !_isFavorite)),\n      ],\n    )));\n  }\n}" },
            ],
            exercises: [{ title: "Build a Profile Screen", description: "Create profile screen with avatar, name, bio, stats, posts list", starterCode: "import 'package:flutter/material.dart';\n\nclass ProfileScreen extends StatelessWidget {\n  @override Widget build(BuildContext context) { return Scaffold(appBar: AppBar(title: Text('Profile')), body: // Build UI); }\n}", testCases: "AppBar with title; CircleAvatar, name, bio; Stats row; ListView with posts; Proper padding" }],
            visualizations: [{ type: "flowchart", title: "Flutter Widget Lifecycle", config: "{\"nodes\":[{\"id\":\"create\",\"label\":\"createState()\",\"x\":250,\"y\":20},{\"id\":\"init\",\"label\":\"initState()\",\"x\":250,\"y\":90},{\"id\":\"build\",\"label\":\"build()\",\"x\":250,\"y\":160},{\"id\":\"update\",\"label\":\"didUpdateWidget()\",\"x\":250,\"y\":230},{\"id\":\"setState\",\"label\":\"setState()\",\"x\":420,\"y\":230},{\"id\":\"dispose\",\"label\":\"dispose()\",\"x\":250,\"y\":300}],\"edges\":[{\"from\":\"create\",\"to\":\"init\"},{\"from\":\"init\",\"to\":\"build\"},{\"from\":\"build\",\"to\":\"update\"},{\"from\":\"update\",\"to\":\"build\"},{\"from\":\"build\",\"to\":\"setState\"},{\"from\":\"setState\",\"to\":\"build\"},{\"from\":\"build\",\"to\":\"dispose\"}]}" }],
            lesson: { title: "Flutter Widgets and Layout", content: "Everything is a widget. StatelessWidget vs StatefulWidget. Row, Column, Expanded, Stack, Container. Scaffold: AppBar, body, FAB. MaterialApp for Material Design. Hot reload preserves state.", explanation: "This lesson covers Flutter widgets and layout system." },
          },
          {
            title: "Flutter State Management",
            description: "Manage app state with Provider, Riverpod, and BLoC patterns.",
            slug: "flutter-state-management", difficulty: 3, prerequisites: [0, 1],
            concepts: [
              { title: "Provider", description: "ChangeNotifier for state, ChangeNotifierProvider for providing. context.watch<Model>() rebuilds, context.read<Model>() accesses without rebuild." },
              { title: "Riverpod", description: "Compile-safe, testable. StateProvider for simple, StateNotifierProvider for complex. ref.watch() reactive, ref.read() one-time. AutoDispose, family providers." },
              { title: "BLoC Pattern", description: "Events in, States out. BlocProvider provides, BlocBuilder rebuilds. BlocListener for side effects. Cubit for simpler single-state management. emit() notifies." },
            ],
            examples: [
              { title: "Riverpod Counter", description: "Simple counter with Riverpod", starterCode: "import 'package:flutter_riverpod/flutter_riverpod.dart';\nimport 'package:flutter/material.dart';\n\nfinal counterProvider = StateProvider<int>((ref) => 0);\n\nclass CounterPage extends ConsumerWidget {\n  @override Widget build(BuildContext context, WidgetRef ref) { final count = ref.watch(counterProvider); return Scaffold(body: Center(child: Text('$count'))); }\n}", solutionCode: "import 'package:flutter_riverpod/flutter_riverpod.dart';\nimport 'package:flutter/material.dart';\n\nfinal counterProvider = StateProvider<int>((ref) => 0);\n\nvoid main() { runApp(const ProviderScope(child: MaterialApp(home: CounterPage()))); }\n\nclass CounterPage extends ConsumerWidget {\n  const CounterPage({super.key});\n  @override Widget build(BuildContext context, WidgetRef ref) {\n    final count = ref.watch(counterProvider);\n    return Scaffold(appBar: AppBar(title: const Text('Counter')), body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [\n      Text('$count', style: const TextStyle(fontSize: 48)),\n      Row(mainAxisAlignment: MainAxisAlignment.center, children: [\n        ElevatedButton(onPressed: () => ref.read(counterProvider.notifier).state--, child: const Text('-')),\n        const SizedBox(width: 20),\n        ElevatedButton(onPressed: () => ref.read(counterProvider.notifier).state++, child: const Text('+')),\n      ]),\n    ])));\n  }\n}" },
            ],
            exercises: [{ title: "Build a Todo App with Riverpod", description: "Todo app: add, toggle, delete, filter by status", starterCode: "// todo_provider.dart - StateNotifier\n// filter_provider.dart - StateProvider\n\nclass Todo { final String id; final String title; final bool completed; }", testCases: "Add todo with unique ID; Toggle completed; Delete todo; Filter all/active/completed; Empty state" }],
            visualizations: [{ type: "flowchart", title: "Riverpod Provider Hierarchy", config: "{\"nodes\":[{\"id\":\"scope\",\"label\":\"ProviderScope\",\"x\":250,\"y\":20},{\"id\":\"counter\",\"label\":\"counterPrv\",\"x\":120,\"y\":100},{\"id\":\"todos\",\"label\":\"todosPrv\",\"x\":380,\"y\":100},{\"id\":\"filter\",\"label\":\"filterPrv\",\"x\":120,\"y\":180},{\"id\":\"filtered\",\"label\":\"filteredTodos\",\"x\":380,\"y\":180},{\"id\":\"ui\",\"label\":\"Widgets\",\"x\":250,\"y\":260}],\"edges\":[{\"from\":\"scope\",\"to\":\"counter\"},{\"from\":\"scope\",\"to\":\"todos\"},{\"from\":\"todos\",\"to\":\"filter\"},{\"from\":\"filter\",\"to\":\"filtered\"},{\"from\":\"todos\",\"to\":\"filtered\"},{\"from\":\"counter\",\"to\":\"ui\"},{\"from\":\"filtered\",\"to\":\"ui\"}]}" }],
            lesson: { title: "Flutter State Management", content: "Provider: ChangeNotifier, context.watch/read. Riverpod: StateProvider, ref.watch/read. BLoC: Events in, States out. Choose Provider for simple, Riverpod for most, BLoC for enterprise.", explanation: "This lesson covers state management in Flutter." },
          },
          {
            title: "App Store Deployment",
            description: "Prepare apps for Google Play Store and Apple App Store submission.",
            slug: "app-store-deployment", difficulty: 2, prerequisites: [0, 1],
            concepts: [
              { title: "iOS App Store", description: "Apple Developer account ($99/year). App ID, certificates, provisioning. Archive in Xcode. App Store Connect: metadata, screenshots. TestFlight for beta." },
              { title: "Google Play Store", description: "Google Play Console ($25 one-time). Signed app bundle: keytool, flutter build appbundle. Store listing, screenshots, content rating. Internal → production." },
              { title: "CI/CD for Mobile", description: "Fastlane: automate build, screenshots, deploy. EAS Build for Expo. GitHub Actions for CI/CD. CodePush/EAS Update for OTA updates. Semantic versioning." },
            ],
            examples: [
              { title: "Fastlane Configuration", description: "Automate Flutter builds and deployments", starterCode: "# fastlane/Fastfile - Android and iOS lanes", solutionCode: "default_platform(:flutter)\n\nplatform :flutter do\n  lane :android_beta do\n    sh('flutter build appbundle --release')\n    upload_to_play_store(track: 'internal', aab: '../build/app/outputs/bundle/release/app-release.aab')\n  end\n  lane :ios_beta do\n    sh('flutter build ios --release')\n    build_app(workspace: 'Runner.xcworkspace', scheme: 'Runner', export_method: 'app-store')\n    upload_to_testflight(skip_waiting_for_build_processing: true)\n  end\nend" },
            ],
            exercises: [{ title: "Prepare an App for Release", description: "Release checklist: version, app icon, splash screen, signing, store listing", starterCode: "# Checklist: version, icon, splash, signing, store listing", testCases: "Version 1.0.0+1; App icon configured; Splash screen; Android signing; iOS bundle ID; Privacy policy URL" }],
            visualizations: [{ type: "flowchart", title: "App Store Submission", config: "{\"nodes\":[{\"id\":\"dev\",\"label\":\"Development\",\"x\":250,\"y\":20},{\"id\":\"test\",\"label\":\"Testing\",\"x\":250,\"y\":90},{\"id\":\"review\",\"label\":\"Store Review\",\"x\":250,\"y\":160},{\"id\":\"approve\",\"label\":\"Approved?\",\"x\":250,\"y\":230},{\"id\":\"publish\",\"label\":\"Published\",\"x\":120,\"y\":300},{\"id\":\"fix\",\"label\":\"Fix & Resubmit\",\"x\":380,\"y\":300}],\"edges\":[{\"from\":\"dev\",\"to\":\"test\"},{\"from\":\"test\",\"to\":\"review\"},{\"from\":\"review\",\"to\":\"approve\"},{\"from\":\"approve\",\"to\":\"publish\",\"label\":\"yes\"},{\"from\":\"approve\",\"to\":\"fix\",\"label\":\"no\"},{\"from\":\"fix\",\"to\":\"review\"}]}" }],
            lesson: { title: "App Store Deployment", content: "iOS: $99/year, certificates, provisioning, Xcode archive, App Store Connect. Android: $25, signed bundle, Play Console. Fastlane automates. EAS Build for Expo. OTA updates with CodePush/EAS Update.", explanation: "This lesson covers deploying apps to Google Play and Apple App Store." },
          },
        ],
      },
    ],
  },
{
    title: "AI & Prompt Engineering",
    description: "Master AI fundamentals, LLM prompting techniques, RAG systems, AI agents, and production AI applications.",
    slug: "ai-prompt-engineering",
    stream: "ai",
    modules: [
      {
        title: "Phase 1: AI & LLM Fundamentals",
        description: "Understand how AI models work, transformer architecture, and the LLM landscape.",
        slug: "ai-llm-fundamentals",
        topics: [
          {
            title: "AI & Machine Learning Basics",
            description: "Learn AI concepts: supervised/unsupervised learning, neural networks, and deep learning.",
            slug: "ai-ml-basics", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "Supervised Learning", description: "Uses labeled data (input-output pairs). Classification: predict categories. Regression: predict continuous values. Algorithms: Linear Regression, Decision Trees, Random Forest, Neural Networks. Training/test split for evaluation." },
              { title: "Neural Networks", description: "Layers of interconnected neurons. Each neuron: weighted sum + bias, activation function (ReLU, sigmoid). Training: forward pass, loss, backpropagation, weight update. GPU acceleration for matrix operations." },
              { title: "Evaluation Metrics", description: "Classification: Accuracy, Precision, Recall, F1 Score, ROC-AUC. Regression: MSE, MAE, R². Cross-validation: k-fold CV. Train/validation/test split: 70/15/15." },
            ],
            examples: [
              { title: "Simple Neural Network with NumPy", description: "Neural network from scratch in Python", starterCode: "import numpy as np\n\ndef sigmoid(x):\n    return 1 / (1 + np.exp(-x))\n\ndef sigmoid_derivative(x):\n    return x * (1 - x)\n\nclass NeuralNetwork:\n    def __init__(self, layers):\n        pass\n    def forward(self, X):\n        pass\n    def train(self, X, y, epochs, lr):\n        pass", solutionCode: "import numpy as np\n\ndef sigmoid(x):\n    return 1 / (1 + np.exp(-x))\n\ndef sigmoid_derivative(x):\n    return x * (1 - x)\n\nclass NeuralNetwork:\n    def __init__(self, layers):\n        self.weights = []\n        self.biases = []\n        for i in range(len(layers) - 1):\n            w = np.random.randn(layers[i], layers[i+1]) * 0.1\n            b = np.zeros((1, layers[i+1]))\n            self.weights.append(w)\n            self.biases.append(b)\n\n    def forward(self, X):\n        self.activations = [X]\n        for w, b in zip(self.weights, self.biases):\n            z = np.dot(self.activations[-1], w) + b\n            self.activations.append(sigmoid(z))\n        return self.activations[-1]\n\n    def backward(self, X, y, lr):\n        m = X.shape[0]\n        delta = (self.activations[-1] - y) * sigmoid_derivative(self.activations[-1])\n        for i in range(len(self.weights) - 1, -1, -1):\n            self.weights[i] -= lr * np.dot(self.activations[i].T, delta) / m\n            self.biases[i] -= lr * np.sum(delta, axis=0, keepdims=True) / m\n            if i > 0:\n                delta = np.dot(delta, self.weights[i].T) * sigmoid_derivative(self.activations[i])\n\n    def train(self, X, y, epochs, lr):\n        for epoch in range(epochs):\n            output = self.forward(X)\n            self.backward(X, y, lr)\n            if epoch % 1000 == 0:\n                loss = np.mean((y - output) ** 2)\n                print(f'Epoch {epoch}, Loss: {loss:.4f}')" },
            ],
            exercises: [{ title: "Implement K-Nearest Neighbors", description: "KNN from scratch using Euclidean distance", starterCode: "import numpy as np\nfrom collections import Counter\n\nclass KNN:\n    def __init__(self, k=3):\n        self.k = k\n    def fit(self, X, y):\n        pass\n    def predict(self, X):\n        pass\n    def _euclidean_distance(self, a, b):\n        pass", testCases: "KNN k=1 returns exact match; k=3 classifies correctly; Euclidean distance correct; handles multiple samples" }],
            visualizations: [{ type: "flowchart", title: "Neural Network Training", config: "{\"nodes\":[{\"id\":\"data\",\"label\":\"Training Data\",\"x\":250,\"y\":20},{\"id\":\"forward\",\"label\":\"Forward Pass\",\"x\":250,\"y\":90},{\"id\":\"loss\",\"label\":\"Calculate Loss\",\"x\":250,\"y\":160},{\"id\":\"back\",\"label\":\"Backpropagation\",\"x\":250,\"y\":230},{\"id\":\"update\",\"label\":\"Update Weights\",\"x\":250,\"y\":300},{\"id\":\"done\",\"label\":\"Done?\",\"x\":250,\"y\":370},{\"id\":\"eval\",\"label\":\"Evaluate\",\"x\":400,\"y\":370},{\"id\":\"repeat\",\"label\":\"Next epoch\",\"x\":100,\"y\":370}],\"edges\":[{\"from\":\"data\",\"to\":\"forward\"},{\"from\":\"forward\",\"to\":\"loss\"},{\"from\":\"loss\",\"to\":\"back\"},{\"from\":\"back\",\"to\":\"update\"},{\"from\":\"update\",\"to\":\"done\"},{\"from\":\"done\",\"to\":\"eval\",\"label\":\"yes\"},{\"from\":\"done\",\"to\":\"repeat\",\"label\":\"no\"},{\"from\":\"repeat\",\"to\":\"forward\"}]}" }],
            lesson: { title: "AI and Machine Learning Basics", content: "AI: machines performing human-like tasks. ML: AI that learns from data. Supervised (labeled), Unsupervised (unlabeled), Reinforcement (reward). Neural Networks: layers, weights, activation functions. Training: forward pass, loss, backpropagation, weight update. Metrics: accuracy, precision, recall, F1. Overfitting: regularization, dropout.", explanation: "This lesson introduces AI, machine learning, and neural networks." },
          },
          {
            title: "Transformer Architecture & LLMs",
            description: "Understand attention mechanisms, transformer architecture, and how GPT models work.",
            slug: "transformer-architecture-llms", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "Self-Attention", description: "Each token attends to all others. Q, K, V matrices. Attention = softmax(QK^T / sqrt(d_k)). Multi-head: multiple parallel heads. Captures relationships regardless of distance." },
              { title: "Transformer Architecture", description: "Encoder: self-attention + feed-forward, residual connections, layer norm. Decoder: masked self-attention + cross-attention + feed-forward. GPT uses decoder-only. Positional encoding for order." },
              { title: "LLM Training", description: "Pretraining: predict next token on massive corpus. SFT: instruction-response pairs. RLHF/DPO: align with human preferences. Safety evaluation and red teaming before deployment." },
            ],
            examples: [
              { title: "Scaled Dot-Product Attention", description: "Python implementation of attention mechanism", starterCode: "import numpy as np\n\ndef scaled_dot_product_attention(Q, K, V, mask=None):\n    pass", solutionCode: "import numpy as np\n\ndef scaled_dot_product_attention(Q, K, V, mask=None):\n    d_k = Q.shape[-1]\n    scores = np.dot(Q, K.T) / np.sqrt(d_k)\n    if mask is not None:\n        scores = np.where(mask == 0, -1e9, scores)\n    attention_weights = np.exp(scores - np.max(scores, axis=-1, keepdims=True))\n    attention_weights = attention_weights / np.sum(attention_weights, axis=-1, keepdims=True)\n    output = np.dot(attention_weights, V)\n    return output, attention_weights\n\nQ = np.random.randn(4, 8)\nK = np.random.randn(4, 8)\nV = np.random.randn(4, 8)\noutput, weights = scaled_dot_product_attention(Q, K, V)\nprint(f'Output shape: {output.shape}')" },
            ],
            exercises: [{ title: "Implement Temperature Sampling", description: "Sample from probability distribution with temperature control", starterCode: "import numpy as np\n\ndef temperature_sampling(logits, temperature=1.0):\n    pass\n\ndef generate_text(model_output, temperature):\n    pass", testCases: "Temperature 0 returns most likely; Temperature 1 proportional; >1 increases diversity; <1 reduces diversity" }],
            visualizations: [{ type: "flowchart", title: "LLM Training Pipeline", config: "{\"nodes\":[{\"id\":\"pretrain\",\"label\":\"Pretraining\",\"x\":250,\"y\":20},{\"id\":\"sft\",\"label\":\"SFT\",\"x\":250,\"y\":100},{\"id\":\"reward\",\"label\":\"Reward Model\",\"x\":250,\"y\":180},{\"id\":\"rlhf\",\"label\":\"RLHF/DPO\",\"x\":250,\"y\":260},{\"id\":\"eval\",\"label\":\"Safety Eval\",\"x\":250,\"y\":340},{\"id\":\"deploy\",\"label\":\"Deploy\",\"x\":250,\"y\":420}],\"edges\":[{\"from\":\"pretrain\",\"to\":\"sft\"},{\"from\":\"sft\",\"to\":\"reward\"},{\"from\":\"reward\",\"to\":\"rlhf\"},{\"from\":\"rlhf\",\"to\":\"eval\"},{\"from\":\"eval\",\"to\":\"deploy\"}]}" }],
            lesson: { title: "Transformer Architecture and LLMs", content: "Transformers replaced RNNs. Self-attention: Q, K, V matrices. Multi-head attention. GPT: decoder-only. LLM training: pretraining, SFT, RLHF/DPO. Tokenization: BPE, SentencePiece. Temperature controls randomness. Top-p and top-k sampling.", explanation: "This lesson covers transformer architecture, attention, and LLM training." },
          },
          {
            title: "LLM Landscape & Tools",
            description: "Survey the LLM ecosystem: GPT, Claude, Gemini, Llama, and tools.",
            slug: "llm-landscape-tools", difficulty: 1, prerequisites: [0],
            concepts: [
              { title: "Major LLM Providers", description: "OpenAI: GPT-4, GPT-4o. Anthropic: Claude 3.5 Sonnet, Opus. Google: Gemini 1.5. Meta: Llama 3 (open-source). Mistral: Mixtral. Each has different strengths in reasoning, coding, speed, cost." },
              { title: "LLM APIs and SDKs", description: "Python: openai, anthropic packages. Chat completions: system, user, assistant messages. Parameters: temperature, max_tokens, top_p. Streaming: stream=True. Function calling for structured output." },
              { title: "Open Source Tools", description: "LangChain: chains, agents, RAG. LlamaIndex: indexing, retrieval. Hugging Face: models, datasets. Ollama: local models. vLLM: high-throughput serving. LiteLLM: unified API." },
            ],
            examples: [
              { title: "OpenAI API Chat Completion", description: "Chat completion with system prompt and streaming", starterCode: "from openai import OpenAI\n\nclient = OpenAI()\n# Make chat completion request", solutionCode: "from openai import OpenAI\n\nclient = OpenAI()\n\ndef chat_with_gpt(prompt, system_prompt=\"You are a helpful assistant.\"):\n    response = client.chat.completions.create(\n        model=\"gpt-4o\",\n        messages=[\n            {\"role\": \"system\", \"content\": system_prompt},\n            {\"role\": \"user\", \"content\": prompt},\n        ],\n        temperature=0.7,\n        max_tokens=500,\n    )\n    return response.choices[0].message.content\n\nresult = chat_with_gpt(\"Explain quantum computing in one sentence.\")\nprint(result)" },
            ],
            exercises: [{ title: "Build a Multi-Model Chat Client", description: "Python class that switches between OpenAI, Anthropic, and local models", starterCode: "from openai import OpenAI\nimport anthropic\n\nclass MultiModelChat:\n    def __init__(self):\n        self.openai_client = OpenAI()\n        self.anthropic_client = anthropic.Anthropic()\n    def chat(self, model, messages, **kwargs):\n        pass", testCases: "Works with gpt-4o; Works with claude-3-5-sonnet; Raises error for unsupported model; Consistent message format" }],
            visualizations: [{ type: "flowchart", title: "LLM Inference Pipeline", config: "{\"nodes\":[{\"id\":\"input\",\"label\":\"User Input\",\"x\":250,\"y\":20},{\"id\":\"tokenize\",\"label\":\"Tokenize\",\"x\":250,\"y\":90},{\"id\":\"embed\",\"label\":\"Embeddings\",\"x\":250,\"y\":160},{\"id\":\"model\",\"label\":\"Transformer\",\"x\":250,\"y\":230},{\"id\":\"sample\",\"label\":\"Sample Token\",\"x\":250,\"y\":300},{\"id\":\"decode\",\"label\":\"Decode\",\"x\":250,\"y\":370},{\"id\":\"output\",\"label\":\"Text\",\"x\":250,\"y\":440}],\"edges\":[{\"from\":\"input\",\"to\":\"tokenize\"},{\"from\":\"tokenize\",\"to\":\"embed\"},{\"from\":\"embed\",\"to\":\"model\"},{\"from\":\"model\",\"to\":\"sample\"},{\"from\":\"sample\",\"to\":\"decode\"},{\"from\":\"decode\",\"to\":\"output\"}]}" }],
            lesson: { title: "LLM Landscape and Tools", content: "GPT-4, Claude, Gemini, Llama, Mistral. OpenAI SDK, Anthropic SDK. Chat completions: system, user, assistant. Temperature, max_tokens, streaming. LangChain, LlamaIndex, Hugging Face, Ollama. Token counting with tiktoken.", explanation: "This lesson surveys the LLM ecosystem and tools." },
          },
        ],
      },
      {
        title: "Phase 2: Prompt Engineering & Applications",
        description: "Master prompt engineering, RAG, AI agents, and production AI.",
        slug: "prompt-engineering-applications",
        topics: [
          {
            title: "Prompt Engineering Fundamentals",
            description: "Master core prompting: zero-shot, few-shot, chain-of-thought, and role prompting.",
            slug: "prompt-engineering-fundamentals", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "Zero-Shot Prompting", description: "Ask the model directly without examples. Be specific and clear. Specify output format (JSON, markdown). Works well for common tasks." },
              { title: "Few-Shot Prompting", description: "Provide 2-5 examples of input-output pairs. Helps model understand pattern, format, and style. In-context learning without weight updates." },
              { title: "Chain-of-Thought (CoT)", description: "Prompt the model to show reasoning step by step. Use 'Let's think step by step'. Improves accuracy on complex reasoning tasks. Self-consistency: multiple CoT and vote." },
            ],
            examples: [
              { title: "Few-Shot Sentiment Analysis", description: "Demonstrating few-shot prompting for sentiment classification", starterCode: "from openai import OpenAI\n\nclient = OpenAI()\n\nprompt = \"\"\"Classify sentiment as positive or negative.\n\nText: \"I loved this movie!\"\nSentiment: positive\n\nText: \"The service was terrible.\"\nSentiment: negative\n\nText: \"It was okay.\"\nSentiment:\"\"\"\n# Complete the prompt", solutionCode: "from openai import OpenAI\n\nclient = OpenAI()\n\nprompt = \"\"\"Classify the sentiment as positive or negative.\n\nText: \"I loved this movie!\"\nSentiment: positive\n\nText: \"The service was terrible.\"\nSentiment: negative\n\nText: \"The food was amazing!\"\nSentiment: positive\n\nText: \"It was okay, nothing special.\"\nSentiment:\"\"\"\n\nresponse = client.chat.completions.create(\n    model=\"gpt-4o\",\n    messages=[{\"role\": \"user\", \"content\": prompt}],\n    temperature=0.1,\n)\nprint(response.choices[0].message.content)" },
            ],
            exercises: [{ title: "Design a Prompt Template System", description: "Create a Python class managing prompt templates with variables, CoT, and output format", starterCode: "class PromptTemplate:\n    def __init__(self, template):\n        self.template = template\n    def format(self, **kwargs):\n        pass\n    def add_chain_of_thought(self):\n        pass\n    def specify_output_format(self, format_type):\n        pass", testCases: "Template variables correctly substituted; Chain-of-thought appended; JSON output format specified; Missing variables raise error" }],
            visualizations: [{ type: "flowchart", title: "Prompt Engineering Techniques", config: "{\"nodes\":[{\"id\":\"start\",\"label\":\"Task complexity?\",\"x\":250,\"y\":20},{\"id\":\"zero\",\"label\":\"Zero-Shot\",\"x\":100,\"y\":100},{\"id\":\"few\",\"label\":\"Few-Shot\",\"x\":250,\"y\":100},{\"id\":\"cot\",\"label\":\"Chain-of-Thought\",\"x\":400,\"y\":100},{\"id\":\"role\",\"label\":\"Role Prompting\",\"x\":250,\"y\":180}],\"edges\":[{\"from\":\"start\",\"to\":\"zero\",\"label\":\"simple\"},{\"from\":\"start\",\"to\":\"few\",\"label\":\"pattern\"},{\"from\":\"start\",\"to\":\"cot\",\"label\":\"reasoning\"},{\"from\":\"zero\",\"to\":\"role\"},{\"from\":\"few\",\"to\":\"role\"},{\"from\":\"cot\",\"to\":\"role\"}]}" }],
            lesson: { title: "Prompt Engineering Fundamentals", content: "Zero-shot: direct query. Few-shot: provide examples. Chain-of-Thought: step-by-step reasoning. Role prompting: act as expert. Be specific, specify format, use delimiters. Temperature controls creativity. System prompts for consistent behavior.", explanation: "This lesson covers core prompt engineering techniques." },
          },
          {
            title: "Advanced Prompting Techniques",
            description: "Learn advanced techniques: tree-of-thought, self-consistency, and structured output prompting.",
            slug: "advanced-prompting", difficulty: 3, prerequisites: [0, 1],
            concepts: [
              { title: "Tree-of-Thought (ToT)", description: "Generate multiple reasoning paths, evaluate each, explore most promising. BFS/DFS over reasoning. Better than CoT for complex planning. Use state evaluation prompts to score." },
              { title: "Self-Consistency", description: "Run same prompt multiple times (temperature > 0). Take majority vote. Improves reliability on reasoning tasks. Combine with CoT: multiple CoT chains and vote." },
              { title: "Structured Output", description: "JSON mode or function calling for structured responses. Define schema, validate output. Pydantic for schema validation. Improves reliability in production pipelines." },
            ],
            examples: [
              { title: "Structured JSON Output", description: "Forcing LLM to output valid JSON with response_format", starterCode: "from openai import OpenAI\nimport json\n\nclient = OpenAI()\n\nprompt = \"\"\"Extract name, age, and skills from text as JSON.\nText: \"John is a 28-year-old engineer skilled in Python.\"\n\"\"\"\n# Get structured JSON", solutionCode: "from openai import OpenAI\nimport json\n\nclient = OpenAI()\n\nprompt = \"\"\"Extract from text and return as JSON:\n{\"name\": \"string\", \"age\": \"number\", \"skills\": [\"string\"]}\n\nText: \"John is a 28-year-old engineer skilled in Python, JavaScript, and Docker.\"\n\"\"\"\n\nresponse = client.chat.completions.create(\n    model=\"gpt-4o\",\n    messages=[{\"role\": \"user\", \"content\": prompt}],\n    response_format={\"type\": \"json_object\"},\n    temperature=0.1,\n)\n\nresult = json.loads(response.choices[0].message.content)\nprint(f\"Name: {result['name']}, Age: {result['age']}\")\nprint(f\"Skills: {', '.join(result['skills'])}\")" },
            ],
            exercises: [{ title: "Build a Self-Consistency Pipeline", description: "Run a prompt N times and use majority voting for the final answer", starterCode: "def self_consistency(prompt, model, n=5, temperature=0.7):\n    # Run prompt n times, collect answers, majority vote\n    pass\n\ndef extract_answer(text):\n    # Parse answer from model output\n    pass", testCases: "Runs prompt n times; Majority vote selects most common; Handles ties; Works with different temperatures; Returns confidence score" }],
            visualizations: [{ type: "flowchart", title: "Self-Consistency Flow", config: "{\"nodes\":[{\"id\":\"prompt\",\"label\":\"Prompt\",\"x\":250,\"y\":20},{\"id\":\"run1\",\"label\":\"Run 1\",\"x\":100,\"y\":100},{\"id\":\"run2\",\"label\":\"Run 2\",\"x\":250,\"y\":100},{\"id\":\"run3\",\"label\":\"Run N\",\"x\":400,\"y\":100},{\"id\":\"vote\",\"label\":\"Majority Vote\",\"x\":250,\"y\":180},{\"id\":\"answer\",\"label\":\"Final Answer\",\"x\":250,\"y\":260}],\"edges\":[{\"from\":\"prompt\",\"to\":\"run1\"},{\"from\":\"prompt\",\"to\":\"run2\"},{\"from\":\"prompt\",\"to\":\"run3\"},{\"from\":\"run1\",\"to\":\"vote\"},{\"from\":\"run2\",\"to\":\"vote\"},{\"from\":\"run3\",\"to\":\"vote\"},{\"from\":\"vote\",\"to\":\"answer\"}]}" }],
            lesson: { title: "Advanced Prompting Techniques", content: "Tree-of-Thought: explore multiple reasoning paths. Self-Consistency: majority vote over multiple runs. Structured Output: JSON mode, function calling. Prompt chaining: break complex tasks into steps. Automatic prompt optimization: DSPy.", explanation: "This lesson covers advanced prompting techniques for LLMs." },
          },
          {
            title: "Retrieval-Augmented Generation (RAG)",
            description: "Build RAG systems: document ingestion, embeddings, vector search, and context-aware generation.",
            slug: "rag-systems", difficulty: 3, prerequisites: [0, 1],
            concepts: [
              { title: "Document Ingestion", description: "Load documents: PDF, markdown, text, web. Chunking: split into 500-1000 token pieces, 10-20% overlap. Semantic chunking: split by meaning. LangChain loaders, Unstructured.io for parsing." },
              { title: "Embeddings & Vector Search", description: "Embeddings: text to dense vectors. OpenAI text-embedding-3-small. Vector DB: Pinecone, Chroma, Weaviate, pgvector. Cosine similarity. ANN for speed. Metadata filtering for hybrid search." },
              { title: "RAG Pipeline", description: "Query → embed → search → retrieve top-k → inject into prompt → LLM generates. Re-ranking: cross-encoder improves relevance. Citations: include source references. Guardrails: relevance check, hallucination detection." },
            ],
            examples: [
              { title: "Simple RAG Pipeline", description: "Building a basic RAG system with Chroma and OpenAI", starterCode: "import chromadb\nfrom openai import OpenAI\n\nclient = OpenAI()\nchroma_client = chromadb.Client()\ncollection = chroma_client.create_collection(\"docs\")\n# Add documents, create query function", solutionCode: "import chromadb\nfrom openai import OpenAI\n\nclient = OpenAI()\nchroma_client = chromadb.Client()\ncollection = chroma_client.create_collection(\"docs\")\n\ndocuments = [\n    \"The sky is blue because of Rayleigh scattering.\",\n    \"Photosynthesis converts CO2 and water into glucose.\",\n    \"Python is a high-level programming language.\",\n]\n\nfor i, doc in enumerate(documents):\n    embedding = client.embeddings.create(model=\"text-embedding-3-small\", input=doc).data[0].embedding\n    collection.add(embeddings=[embedding], documents=[doc], ids=[str(i)])\n\ndef query_rag(question, top_k=2):\n    q_embedding = client.embeddings.create(model=\"text-embedding-3-small\", input=question).data[0].embedding\n    results = collection.query(query_embeddings=[q_embedding], n_results=top_k)\n    context = \"\\n\".join(results['documents'][0])\n    response = client.chat.completions.create(\n        model=\"gpt-4o\",\n        messages=[\n            {\"role\": \"system\", \"content\": f\"Answer using this context:\\n{context}\"},\n            {\"role\": \"user\", \"content\": question},\n        ],\n    )\n    return response.choices[0].message.content\n\nprint(query_rag(\"Why is the sky blue?\"))" },
            ],
            exercises: [{ title: "Build a Document Q&A System", description: "Create a RAG system that ingests PDFs, chunks them, and answers questions with citations", starterCode: "from langchain.text_splitter import RecursiveCharacterTextSplitter\nfrom langchain.document_loaders import PyPDFLoader\n\n# Load PDF, split into chunks, create embeddings, store in vector DB, build query function", testCases: "PDFs loaded and chunked; Chunks stored in vector DB; Questions return relevant answers; Answers include source citations; Handles questions outside document scope" }],
            visualizations: [{ type: "flowchart", title: "RAG Pipeline", config: "{\"nodes\":[{\"id\":\"docs\",\"label\":\"Documents\",\"x\":250,\"y\":20},{\"id\":\"chunk\",\"label\":\"Chunking\",\"x\":250,\"y\":90},{\"id\":\"embed\",\"label\":\"Embeddings\",\"x\":250,\"y\":160},{\"id\":\"store\",\"label\":\"Vector DB\",\"x\":250,\"y\":230},{\"id\":\"query\",\"label\":\"User Query\",\"x\":100,\"y\":300},{\"id\":\"search\",\"label\":\"Vector Search\",\"x\":250,\"y\":300},{\"id\":\"context\",\"label\":\"Inject Context\",\"x\":250,\"y\":370},{\"id\":\"llm\",\"label\":\"LLM Generates\",\"x\":250,\"y\":440},{\"id\":\"answer\",\"label\":\"Answer\",\"x\":250,\"y\":510}],\"edges\":[{\"from\":\"docs\",\"to\":\"chunk\"},{\"from\":\"chunk\",\"to\":\"embed\"},{\"from\":\"embed\",\"to\":\"store\"},{\"from\":\"query\",\"to\":\"search\"},{\"from\":\"store\",\"to\":\"search\"},{\"from\":\"search\",\"to\":\"context\"},{\"from\":\"context\",\"to\":\"llm\"},{\"from\":\"llm\",\"to\":\"answer\"}]}" }],
            lesson: { title: "Retrieval-Augmented Generation (RAG)", content: "RAG combines retrieval with generation. Document ingestion: load, chunk, embed. Vector DB: Pinecone, Chroma, Weaviate. Embedding models: text-embedding-3-small. Query: embed, search, inject context, generate. Re-ranking for better relevance. Citations for trust. Guardrails for safety.", explanation: "This lesson covers building RAG systems for document Q&A." },
          },
          {
            title: "AI Agents & Tool Use",
            description: "Build AI agents that can use tools, make decisions, and execute multi-step tasks.",
            slug: "ai-agents-tool-use", difficulty: 4, prerequisites: [0, 1, 2],
            concepts: [
              { title: "Function Calling", description: "LLMs can call defined functions. Define tool schema: name, description, parameters (JSON Schema). Model decides when to call which tool. Enables: web search, calculations, API calls, database queries." },
              { title: "Agent Architectures", description: "ReAct: Reason + Act loop. Plan-and-Execute: plan first, execute. Multi-agent: specialized agents collaborate. LangChain Agents: tools + LLM + agent type. Memory: conversation history, vector store." },
              { title: "Agent Safety", description: "Human-in-the-loop for critical actions. Tool permissions: restrict what agents can do. Input/output validation. Rate limiting. Max steps to prevent infinite loops. Logging and monitoring. Prompt injection prevention." },
            ],
            examples: [
              { title: "OpenAI Function Calling Agent", description: "An agent that can search and calculate using function calling", starterCode: "from openai import OpenAI\nimport json\nimport math\n\nclient = OpenAI()\n\ntools = [{\"type\": \"function\", \"function\": {\"name\": \"calculate\", \"description\": \"Evaluate a math expression\", \"parameters\": {\"type\": \"object\", \"properties\": {\"expression\": {\"type\": \"string\"}}, \"required\": [\"expression\"]}}}]\n\n# Build agent loop", solutionCode: "from openai import OpenAI\nimport json\nimport math\n\nclient = OpenAI()\n\ntools = [{\"type\": \"function\", \"function\": {\"name\": \"calculate\", \"description\": \"Evaluate a math expression\", \"parameters\": {\"type\": \"object\", \"properties\": {\"expression\": {\"type\": \"string\", \"description\": \"Math expression\"}}, \"required\": [\"expression\"]}}}]\n\ndef run_agent(user_query):\n    messages = [{\"role\": \"user\", \"content\": user_query}]\n    while True:\n        response = client.chat.completions.create(model=\"gpt-4o\", messages=messages, tools=tools, tool_choice=\"auto\")\n        msg = response.choices[0].message\n        if not msg.tool_calls:\n            return msg.content\n        messages.append(msg)\n        for tool_call in msg.tool_calls:\n            if tool_call.function.name == \"calculate\":\n                args = json.loads(tool_call.function.arguments)\n                result = eval(args[\"expression\"], {\"__builtins__\": {}}, {\"sqrt\": math.sqrt, \"pow\": pow, \"sin\": math.sin})\n                messages.append({\"role\": \"tool\", \"tool_call_id\": tool_call.id, \"content\": str(result)})\n\nprint(run_agent(\"What is the square root of 144 plus 7?\"))" },
            ],
            exercises: [{ title: "Build a Multi-Tool Agent", description: "Create an agent with web search, calculator, and database query tools", starterCode: "import json\nfrom openai import OpenAI\n\nclient = OpenAI()\n\ntools = [\n    # calculator tool\n    # web_search tool (simulated)\n    # database_query tool (simulated)\n]\n\ndef run_agent(query):\n    pass", testCases: "Agent uses calculator for math; Agent uses search for web questions; Agent uses database for data queries; Agent handles multiple tool calls; Agent stops when answer is complete" }],
            visualizations: [{ type: "flowchart", title: "AI Agent Workflow", config: "{\"nodes\":[{\"id\":\"query\",\"label\":\"User Query\",\"x\":250,\"y\":20},{\"id\":\"think\",\"label\":\"LLM Reasons\",\"x\":250,\"y\":100},{\"id\":\"tool\",\"label\":\"Tool needed?\",\"x\":250,\"y\":180},{\"id\":\"call\",\"label\":\"Execute Tool\",\"x\":120,\"y\":260},{\"id\":\"result\",\"label\":\"Tool Result\",\"x\":120,\"y\":340},{\"id\":\"answer\",\"label\":\"Final Answer\",\"x\":380,\"y\":260}],\"edges\":[{\"from\":\"query\",\"to\":\"think\"},{\"from\":\"think\",\"to\":\"tool\"},{\"from\":\"tool\",\"to\":\"call\",\"label\":\"yes\"},{\"from\":\"tool\",\"to\":\"answer\",\"label\":\"no\"},{\"from\":\"call\",\"to\":\"result\"},{\"from\":\"result\",\"to\":\"think\"}]}" }],
            lesson: { title: "AI Agents and Tool Use", content: "Function calling: define tools, LLM calls them. ReAct: Reason + Act loop. Plan-and-Execute: plan first. Multi-agent: specialized agents. LangChain Agents: tools + LLM. Safety: human-in-the-loop, tool permissions, rate limiting, max steps, logging.", explanation: "This lesson covers building AI agents with tool use capabilities." },
          },
          {
            title: "Production AI Applications",
            description: "Deploy AI applications: API design, streaming, caching, monitoring, and cost optimization.",
            slug: "production-ai-applications", difficulty: 3, prerequisites: [0, 1, 2],
            concepts: [
              { title: "API Design for AI", description: "Wrap LLM calls in REST APIs. Streaming: Server-Sent Events (SSE). Rate limiting: token bucket or sliding window. Request validation: sanitize inputs, check length. Response caching: cache identical prompts. Authentication: API keys, JWT. Versioning: /v1/chat." },
              { title: "Cost Optimization", description: "Caching identical prompts. Prompt compression: summarize long context. Smaller models for simple tasks (GPT-3.5 vs GPT-4). Batch processing. Token counting before API calls. Set max_tokens per call. Monitor usage with dashboards." },
              { title: "Monitoring & Observability", description: "Log prompts and responses (with PII redaction). Track latency, token usage, error rates. LLM-specific metrics: hallucination rate, refusal rate, relevance scores. Tools: LangSmith, Weights & Biases, Helicone, custom dashboards. Set up alerts for anomalies." },
            ],
            examples: [
              { title: "Streaming Chat API with FastAPI", description: "Building a streaming LLM endpoint with FastAPI", starterCode: "from fastapi import FastAPI\nfrom fastapi.responses import StreamingResponse\nfrom openai import OpenAI\n\napp = FastAPI()\nclient = OpenAI()\n\n@app.post(\"/chat/stream\")\nasync def chat_stream(request: dict):\n    # Stream LLM response\n    pass", solutionCode: "from fastapi import FastAPI\nfrom fastapi.responses import StreamingResponse\nfrom openai import OpenAI\nimport json\n\napp = FastAPI()\nclient = OpenAI()\n\nasync def generate_stream(prompt: str):\n    stream = client.chat.completions.create(\n        model=\"gpt-4o\",\n        messages=[{\"role\": \"user\", \"content\": prompt}],\n        stream=True,\n    )\n    for chunk in stream:\n        if chunk.choices[0].delta.content:\n            yield f\"data: {json.dumps({'content': chunk.choices[0].delta.content})}\\n\\n\"\n    yield \"data: [DONE]\\n\\n\"\n\n@app.post(\"/chat/stream\")\nasync def chat_stream(request: dict):\n    prompt = request.get(\"prompt\", \"\")\n    if not prompt:\n        return {\"error\": \"Prompt is required\"}\n    return StreamingResponse(generate_stream(prompt), media_type=\"text/event-stream\")" },
            ],
            exercises: [{ title: "Build a Caching LLM Proxy", description: "Create a proxy that caches LLM responses by prompt hash, with configurable TTL", starterCode: "import hashlib\nimport json\nfrom functools import lru_cache\n\nclass LLMProxy:\n    def __init__(self, ttl_seconds=3600):\n        self.cache = {}\n        self.ttl = ttl_seconds\n    \n    def get_cache_key(self, messages):\n        pass\n    \n    async def chat(self, messages):\n        pass", testCases: "Identical prompts return cached response; Cache expires after TTL; Different prompts are cached separately; Cache hit counter increments; Cache miss triggers API call" }],
            visualizations: [{ type: "flowchart", title: "Production AI Architecture", config: "{\"nodes\":[{\"id\":\"client\",\"label\":\"Client\",\"x\":250,\"y\":20},{\"id\":\"api\",\"label\":\"API Gateway\",\"x\":250,\"y\":90},{\"id\":\"auth\",\"label\":\"Auth\",\"x\":250,\"y\":160},{\"id\":\"cache\",\"label\":\"Cache\",\"x\":120,\"y\":230},{\"id\":\"llm\",\"label\":\"LLM API\",\"x\":380,\"y\":230},{\"id\":\"response\",\"label\":\"Response\",\"x\":250,\"y\":300}],\"edges\":[{\"from\":\"client\",\"to\":\"api\"},{\"from\":\"api\",\"to\":\"auth\"},{\"from\":\"auth\",\"to\":\"cache\"},{\"from\":\"cache\",\"to\":\"response\",\"label\":\"hit\"},{\"from\":\"cache\",\"to\":\"llm\",\"label\":\"miss\"},{\"from\":\"llm\",\"to\":\"response\"}]}" }],
            lesson: { title: "Production AI Applications", content: "API design: FastAPI, streaming (SSE). Cost optimization: caching, prompt compression, model selection. Monitoring: LangSmith, Helicone, track latency and token usage. Security: input validation, rate limiting, PII redaction. Deployment: Docker, load balancing, auto-scaling.", explanation: "This lesson covers deploying AI applications to production." },
          },
        ],
      },
    ],
  },
{
    title: "Data Science",
    description: "Master data analysis, statistics, machine learning, and data pipelines with Python.",
    slug: "data-science",
    stream: "data",
    modules: [
      {
        title: "Phase 1: Python & Data Analysis",
        description: "Learn Python for data science, NumPy, Pandas, and data visualization.",
        slug: "python-data-analysis",
        topics: [
          {
            title: "Python for Data Science",
            description: "Master Python fundamentals specifically for data analysis: NumPy arrays, Pandas DataFrames, and Jupyter notebooks.",
            slug: "python-data-science", difficulty: 1, prerequisites: [],
            concepts: [
              { title: "Jupyter Notebooks", description: "Interactive computing environment. Cells: code or markdown. Magic commands: %timeit, %matplotlib inline. Keyboard shortcuts: Shift+Enter to run. Kernels can be restarted. Export to HTML, PDF, Python scripts." },
              { title: "Python Data Types", description: "Lists, tuples, dictionaries, sets. List comprehensions: [x*2 for x in range(10)]. Dictionary comprehensions. Generator expressions for memory efficiency. zip() for parallel iteration. enumerate() for index+value." },
              { title: "File I/O & Data Loading", description: "open() with context manager. csv module: reader, DictReader. json module: load, dump. pandas read_csv, read_excel, read_json, read_sql. Handle encoding and delimiters. Chunking for large files." },
            ],
            examples: [
              { title: "List Comprehension for Data", description: "Using list comprehensions and generators for data processing", starterCode: "import math\n\ndata = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n# Transform to squares, filter evens, sum\nresult = # write code", solutionCode: "import math\n\ndata = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n\nevens = [x for x in data if x % 2 == 0]\nsquares = [x**2 for x in data]\nsqrt_evens = [math.sqrt(x) for x in evens]\n\nstats = {\n    'count': len(data),\n    'sum': sum(data),\n    'mean': sum(data) / len(data),\n    'min': min(data),\n    'max': max(data),\n    'evens': evens,\n    'squares': squares,\n    'sqrt_evens': sqrt_evens,\n}\n\nfor key, value in stats.items():\n    print(f\"{key}: {value}\")" },
            ],
            exercises: [{ title: "Data Cleaning Utility Functions", description: "Write functions to clean CSV data: strip whitespace, handle missing values, convert types", starterCode: "import csv\n\ndef clean_csv(input_path, output_path):\n    \"\"\"Read CSV, clean data, write cleaned CSV\"\"\"\n    pass\n\ndef strip_whitespace(value):\n    pass\n\ndef handle_missing(value, default='N/A'):\n    pass", testCases: "CSV read correctly; Whitespace stripped from all values; Missing values replaced with default; Output CSV has same columns; Type conversion functions work" }],
            visualizations: [{ type: "flowchart", title: "Data Science Workflow", config: "{\"nodes\":[{\"id\":\"collect\",\"label\":\"Collect Data\",\"x\":250,\"y\":20},{\"id\":\"clean\",\"label\":\"Clean Data\",\"x\":250,\"y\":100},{\"id\":\"explore\",\"label\":\"Explore\",\"x\":250,\"y\":180},{\"id\":\"model\",\"label\":\"Model\",\"x\":250,\"y\":260},{\"id\":\"evaluate\",\"label\":\"Evaluate\",\"x\":250,\"y\":340},{\"id\":\"deploy\",\"label\":\"Deploy\",\"x\":250,\"y\":420}],\"edges\":[{\"from\":\"collect\",\"to\":\"clean\"},{\"from\":\"clean\",\"to\":\"explore\"},{\"from\":\"explore\",\"to\":\"model\"},{\"from\":\"model\",\"to\":\"evaluate\"},{\"from\":\"evaluate\",\"to\":\"deploy\"}]}" }],
            lesson: { title: "Python for Data Science", content: "Jupyter Notebooks: interactive cells, markdown, magic commands. Python basics: lists, dicts, comprehensions. File I/O: csv, json, pandas readers. Virtual environments: venv, conda. Essential packages: numpy, pandas, matplotlib, seaborn, scikit-learn. Install with pip/conda.", explanation: "This lesson introduces Python for data science and Jupyter notebooks." },
          },
          {
            title: "NumPy & Array Computing",
            description: "Master NumPy for numerical computing: arrays, vectorized operations, and linear algebra.",
            slug: "numpy-array-computing", difficulty: 2, prerequisites: [0],
            concepts: [
              { title: "NumPy Arrays", description: "ndarray: homogeneous, fixed-size. Types: int32, float64, bool. Create: np.array(), np.zeros(), np.ones(), np.arange(), np.linspace(). Shape, dtype, ndim, size attributes." },
              { title: "Vectorized Operations", description: "Operations on entire arrays without Python loops. Broadcasting: align arrays of different shapes. Universal functions (ufuncs): np.add, np.sin, np.log. 100x faster than Python loops." },
              { title: "Linear Algebra", description: "np.dot() for matrix multiplication. np.linalg: inv, det, eig, svd, solve. Transpose: .T or np.transpose(). Reshape: .reshape(). Stack: np.vstack, np.hstack, np.concatenate." },
            ],
            examples: [
              { title: "NumPy Matrix Operations", description: "Matrix operations and broadcasting demonstrations", starterCode: "import numpy as np\n\nA = np.array([[1, 2, 3], [4, 5, 6]])\nB = np.array([[7, 8, 9], [10, 11, 12]])\n# Add, multiply, dot product, transpose, reshape", solutionCode: "import numpy as np\n\nA = np.array([[1, 2, 3], [4, 5, 6]])\nB = np.array([[7, 8, 9], [10, 11, 12]])\n\nprint(\"Element-wise addition:\")\nprint(A + B)\n\nprint(\"\\nElement-wise multiplication:\")\nprint(A * B)\n\nprint(\"\\nTranspose of A:\")\nprint(A.T)\n\nC = np.dot(A, B.T)\nprint(\"\\nMatrix multiplication A @ B.T:\")\nprint(C)\n\nprint(\"\\nReshape A to (3, 2):\")\nprint(A.reshape(3, 2))\n\nprint(\"\\nBroadcasting: add [1, 2, 3] to each row:\")\nprint(A + np.array([1, 2, 3]))" },
            ],
            exercises: [{ title: "Implement Linear Regression with NumPy", description: "Solve linear regression using the normal equation: θ = (X^T X)^(-1) X^T y", starterCode: "import numpy as np\n\nclass LinearRegression:\n    def fit(self, X, y):\n        pass\n    def predict(self, X):\n        pass\n    def score(self, X, y):\n        pass", testCases: "fit computes correct coefficients; predict returns correct shape; R² score >= 0.85 on test data; Handles single feature; Works with bias term" }],
            visualizations: [{ type: "memory", title: "NumPy Array Memory Layout", config: "{\"layers\":[{\"label\":\"ndarray Object\",\"properties\":{\"data\":\"pointer to data buffer\",\"dtype\":\"float64\",\"shape\":\"(3, 4)\",\"strides\":\"(32, 8)\",\"ndim\":\"2\"}},{\"label\":\"Data Buffer\",\"properties\":{\"row0\":\"[1.0, 2.0, 3.0, 4.0]\",\"row1\":\"[5.0, 6.0, 7.0, 8.0]\",\"row2\":\"[9.0, 10.0, 11.0, 12.0]\",\"order\":\"C-contiguous (row-major)\"}}]}" }, { type: "flowchart", title: "NumPy Array Computing Step-by-Step Flow", config: "{\"nodes\":[{\"id\":\"create\",\"label\":\"Create ndarray\\n(np.array)\",\"x\":250,\"y\":20},{\"id\":\"dtype\",\"label\":\"Define dtype\\n(float64, int32)\",\"x\":250,\"y\":100},{\"id\":\"vectorize\",\"label\":\"Vectorize\\n(No Loops)\",\"x\":250,\"y\":180},{\"id\":\"broadcast\",\"label\":\"Broadcast\\n(Align Shapes)\",\"x\":250,\"y\":260},{\"id\":\"ufunc\",\"label\":\"Apply ufunc\\n(np.add, np.sin)\",\"x\":250,\"y\":340},{\"id\":\"result\",\"label\":\"Result Array\\n(Output)\",\"x\":250,\"y\":420}],\"edges\":[{\"from\":\"create\",\"to\":\"dtype\",\"label\":\"specify\"},{\"from\":\"dtype\",\"to\":\"vectorize\",\"label\":\"prepare\"},{\"from\":\"vectorize\",\"to\":\"broadcast\",\"label\":\"align\"},{\"from\":\"broadcast\",\"to\":\"ufunc\",\"label\":\"compute\"},{\"from\":\"ufunc\",\"to\":\"result\",\"label\":\"output\"}]},{\"id\":\"step-2\",\"title\":\"Step 2: Define Data Type\",\"description\":\"Specify the dtype to control memory usage and precision. Common types include float64 (double precision), float32, int32, int64, and bool. The dtype determines how many bytes each element occupies and what operations are valid.\",\"highlightNodes\":[\"create\",\"dtype\"],\"highlightEdges\":[\"create->dtype\"]},{\"id\":\"step-3\",\"title\":\"Step 3: Vectorize Operations\",\"description\":\"Instead of writing Python loops, apply operations to entire arrays at once. Vectorized operations are implemented in C under the hood, making them 50-100x faster than equivalent Python loops. Write arr * 2 instead of looping through each element.\",\"highlightNodes\":[\"dtype\",\"vectorize\"],\"highlightEdges\":[\"dtype->vectorize\"]},{\"id\":\"step-4\",\"title\":\"Step 4: Apply Broadcasting\",\"description\":\"Broadcasting allows NumPy to perform operations on arrays of different shapes. Smaller arrays are virtually expanded along dimensions of size 1 to match larger arrays. For example, adding a 1D array of shape (3,) to a 2D array of shape (4, 3) broadcasts the 1D array across all 4 rows.\",\"highlightNodes\":[\"vectorize\",\"broadcast\"],\"highlightEdges\":[\"vectorize->broadcast\"]},{\"id\":\"step-5\",\"title\":\"Step 5: Execute Universal Functions\",\"description\":\"Universal functions (ufuncs) are vectorized wrappers for C functions that operate element-wise on arrays. Examples include np.add, np.subtract, np.multiply, np.sin, np.log, and np.exp. Ufuncs support out parameters for in-place operations to save memory.\",\"highlightNodes\":[\"broadcast\",\"ufunc\"],\"highlightEdges\":[\"broadcast->ufunc\"]},{\"id\":\"step-6\",\"title\":\"Step 6: Obtain Result Array\",\"description\":\"The computation produces a new ndarray with the results. NumPy returns a new array rather than modifying the original, following functional programming principles. The result array has the appropriate shape and dtype based on the broadcasting rules and ufunc output.\",\"highlightNodes\":[\"ufunc\",\"result\"],\"highlightEdges\":[\"ufunc->result\"]}]}" }],
            lesson: { title: "NumPy and Array Computing", content: "NumPy: ndarray, homogeneous, fast. Vectorized operations: no loops. Broadcasting: automatic shape alignment. Important functions: arange, linspace, reshape, dot, concatenate. Linear algebra: np.linalg. Random: np.random. Boolean indexing: arr[arr > 5]. Fancy indexing: arr[[0, 2, 4]].", explanation: "This lesson covers NumPy for numerical computing." },
          },
          {
            title: "Pandas & DataFrames",
            description: "Master Pandas for data manipulation: DataFrames, grouping, merging, and time series.",
            slug: "pandas-dataframes", difficulty: 2, prerequisites: [0, 1],
            concepts: [
              { title: "DataFrame Operations", description: "df.head(), df.info(), df.describe(). Column selection: df['col'], df[['col1', 'col2']]. Boolean filtering: df[df['age'] > 30]. loc (label) vs iloc (position). apply() for custom functions." },
              { title: "Grouping & Aggregation", description: "df.groupby('category'). Aggregation: mean, sum, count, std, min, max. agg() for multiple aggregations. Transform: groupby transform for group-level operations. Pivot tables: pd.pivot_table()." },
              { title: "Merging & Joining", description: "pd.merge(left, right, on, how). Inner, left, right, outer joins. pd.concat() for stacking. join() on index. merge_asof() for nearest match. Handling duplicate columns." },
            ],
            examples: [
              { title: "Sales Data Analysis with Pandas", description: "Grouping, aggregation, and pivot tables on sales data", starterCode: "import pandas as pd\n\nsales = pd.DataFrame({\n    'date': pd.date_range('2024-01-01', periods=12, freq='ME'),\n    'product': ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'],\n    'region': ['East', 'East', 'West', 'West', 'East', 'East', 'West', 'West', 'East', 'East', 'West', 'West'],\n    'revenue': [100, 150, 200, 120, 180, 160, 220, 140, 190, 170, 210, 130],\n    'units': [10, 15, 20, 12, 18, 16, 22, 14, 19, 17, 21, 13],\n})\n# Analyze by product, region, month", solutionCode: "import pandas as pd\n\nsales = pd.DataFrame({\n    'date': pd.date_range('2024-01-01', periods=12, freq='ME'),\n    'product': ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'],\n    'region': ['East', 'East', 'West', 'West', 'East', 'East', 'West', 'West', 'East', 'East', 'West', 'West'],\n    'revenue': [100, 150, 200, 120, 180, 160, 220, 140, 190, 170, 210, 130],\n    'units': [10, 15, 20, 12, 18, 16, 22, 14, 19, 17, 21, 13],\n})\n\nsales['month'] = sales['date'].dt.month\nsales['price_per_unit'] = sales['revenue'] / sales['units']\n\nprint(\"Total revenue by product:\")\nprint(sales.groupby('product')['revenue'].sum())\n\nprint(\"\\nTotal revenue by region:\")\nprint(sales.groupby('region')['revenue'].sum())\n\nprint(\"\\nProduct-Region pivot table:\")\npivot = pd.pivot_table(sales, values='revenue', index='product', columns='region', aggfunc='sum')\nprint(pivot)\n\nprint(\"\\nMonthly revenue trend:\")\nprint(sales.groupby('month')['revenue'].sum())" },
            ],
            exercises: [{ title: "Clean and Analyze E-commerce Data", description: "Clean messy order data, compute metrics, create customer summary", starterCode: "import pandas as pd\nimport numpy as np\n\norders = pd.read_csv('orders.csv')\n# Clean: handle NaN, fix dates, remove duplicates\n# Compute: total revenue, avg order value, top customers\n# Create: customer lifetime value summary", testCases: "NaN values handled; Dates converted to datetime; Duplicates removed; Total revenue calculated; Top 5 customers identified; Customer summary created" }],
            visualizations: [{ type: "flowchart", title: "Pandas Data Pipeline", config: "{\"nodes\":[{\"id\":\"load\",\"label\":\"Load Data\",\"x\":250,\"y\":20},{\"id\":\"inspect\",\"label\":\"Inspect\",\"x\":250,\"y\":100},{\"id\":\"clean\",\"label\":\"Clean\",\"x\":250,\"y\":180},{\"id\":\"transform\",\"label\":\"Transform\",\"x\":250,\"y\":260},{\"id\":\"analyze\",\"label\":\"Analyze\",\"x\":250,\"y\":340},{\"id\":\"export\",\"label\":\"Export\",\"x\":250,\"y\":420}],\"edges\":[{\"from\":\"load\",\"to\":\"inspect\"},{\"from\":\"inspect\",\"to\":\"clean\"},{\"from\":\"clean\",\"to\":\"transform\"},{\"from\":\"transform\",\"to\":\"analyze\"},{\"from\":\"analyze\",\"to\":\"export\"}]}" }],
            lesson: { title: "Pandas and DataFrames", content: "DataFrame: 2D labeled data. Series: 1D labeled. Read: read_csv, read_excel, read_sql. Inspect: head, info, describe. Filter: boolean indexing, query, loc, iloc. Group: groupby, agg, transform. Merge: merge, concat, join. Date: pd.to_datetime, dt accessor. Missing: isna, fillna, dropna.", explanation: "This lesson covers Pandas for data manipulation and analysis." },
          },
          {
            title: "Data Visualization",
            description: "Create compelling visualizations with Matplotlib, Seaborn, and interactive Plotly charts.",
            slug: "data-visualization", difficulty: 2, prerequisites: [1, 2],
            concepts: [
              { title: "Matplotlib", description: "Figure and Axes. plt.plot(), scatter(), bar(), hist(), boxplot(). Customize: title, labels, legend, grid, colors, markers. Subplots: plt.subplots(nrows, ncols). Save: plt.savefig(). Style sheets: plt.style.use()." },
              { title: "Seaborn", description: "Statistical visualizations built on Matplotlib. sns.barplot, boxplot, violinplot, heatmap, pairplot, jointplot. hue for grouping. Auto confidence intervals. Better defaults than Matplotlib." },
              { title: "Interactive Visualization", description: "Plotly: interactive charts with zoom, hover, export. plotly.express for quick charts. plotly.graph_objects for custom. Dash for dashboards. Streamlit for data apps. Altair for declarative viz." },
            ],
            examples: [
              { title: "Comprehensive Data Dashboard", description: "Multi-chart visualization with Matplotlib and Seaborn", starterCode: "import matplotlib.pyplot as plt\nimport seaborn as sns\nimport pandas as pd\nimport numpy as np\n\nnp.random.seed(42)\ndf = pd.DataFrame({'x': range(50), 'y': np.random.randn(50).cumsum(), 'category': np.random.choice(['A', 'B', 'C'], 50)})\n# Create 2x2 subplot grid", solutionCode: "import matplotlib.pyplot as plt\nimport seaborn as sns\nimport pandas as pd\nimport numpy as np\n\nnp.random.seed(42)\ndf = pd.DataFrame({'x': range(50), 'y': np.random.randn(50).cumsum(), 'category': np.random.choice(['A', 'B', 'C'], 50)})\ndf['value'] = np.random.normal(100, 15, 50) + (df['category'] == 'A') * 10\n\nfig, axes = plt.subplots(2, 2, figsize=(12, 10))\n\naxes[0, 0].plot(df['x'], df['y'], color='steelblue', linewidth=2)\naxes[0, 0].set_title('Line Chart - Cumulative Sum')\naxes[0, 0].fill_between(df['x'], df['y'], alpha=0.2, color='steelblue')\n\nsns.boxplot(data=df, x='category', y='value', palette='Set2', ax=axes[0, 1])\naxes[0, 1].set_title('Box Plot by Category')\n\nsns.histplot(data=df, x='value', hue='category', kde=True, ax=axes[1, 0], palette='Set2', alpha=0.6)\naxes[1, 0].set_title('Distribution with KDE')\n\ncorr_data = df[['x', 'y', 'value']].corr()\nsns.heatmap(corr_data, annot=True, cmap='coolwarm', center=0, ax=axes[1, 1])\naxes[1, 1].set_title('Correlation Heatmap')\n\nplt.tight_layout()\nplt.show()" },
            ],
            exercises: [{ title: "Create an Exploratory Data Analysis Report", description: "Load a dataset and create a comprehensive EDA with 4+ chart types", starterCode: "import pandas as pd\nimport matplotlib.pyplot as plt\nimport seaborn as sns\n\ndf = pd.read_csv('dataset.csv')\n# Create: distribution plot, boxplot by category, correlation heatmap, scatter plot", testCases: "At least 4 chart types; Proper titles and labels; Color-coded by category; Correlation matrix; Insights documented; Subplot layout clean" }],
            visualizations: [{ type: "flowchart", title: "Visualization Decision Tree", config: "{\"nodes\":[{\"id\":\"goal\",\"label\":\"Goal?\",\"x\":250,\"y\":20},{\"id\":\"compare\",\"label\":\"Compare\",\"x\":100,\"y\":100},{\"id\":\"dist\",\"label\":\"Distribution\",\"x\":250,\"y\":100},{\"id\":\"relate\",\"label\":\"Relationship\",\"x\":400,\"y\":100},{\"id\":\"bar\",\"label\":\"Bar/Box\",\"x\":60,\"y\":180},{\"id\":\"hist\",\"label\":\"Histogram\",\"x\":200,\"y\":180},{\"id\":\"scatter\",\"label\":\"Scatter\",\"x\":340,\"y\":180},{\"id\":\"heatmap\",\"label\":\"Heatmap\",\"x\":440,\"y\":180}],\"edges\":[{\"from\":\"goal\",\"to\":\"compare\"},{\"from\":\"goal\",\"to\":\"dist\"},{\"from\":\"goal\",\"to\":\"relate\"},{\"from\":\"compare\",\"to\":\"bar\"},{\"from\":\"dist\",\"to\":\"hist\"},{\"from\":\"relate\",\"to\":\"scatter\"},{\"from\":\"relate\",\"to\":\"heatmap\"}]}" }],
            lesson: { title: "Data Visualization", content: "Matplotlib: Figure, Axes, plot, scatter, bar, hist. Seaborn: barplot, boxplot, heatmap, pairplot. Best practices: choose right chart, label axes, use color meaningfully, avoid chart junk. Interactive: Plotly for zoom/hover. Dashboards: Dash, Streamlit. Export: PNG, SVG, PDF, HTML.", explanation: "This lesson covers data visualization with Matplotlib, Seaborn, and Plotly." },
          },
        ],
      },
      {
        title: "Phase 2: Statistics & Machine Learning",
        description: "Learn statistics, probability, and machine learning with scikit-learn.",
        slug: "statistics-machine-learning",
        topics: [
          {
            title: "Statistics & Probability",
            description: "Master descriptive statistics, probability distributions, hypothesis testing, and A/B testing.",
            slug: "statistics-probability", difficulty: 3, prerequisites: [0, 1],
            concepts: [
              { title: "Descriptive Statistics", description: "Mean, median, mode, range, variance, standard deviation. Percentiles, quartiles, IQR. Skewness and kurtosis. Box plots for outlier detection. Z-score: (x - μ) / σ. Summary statistics with df.describe()." },
              { title: "Probability Distributions", description: "Normal: bell curve, 68-95-99.7 rule. Binomial: success/failure. Poisson: event counts. Uniform: equal probability. Central Limit Theorem: sample means approach normal. PDF, CDF, PPF." },
              { title: "Hypothesis Testing", description: "Null vs alternative hypothesis. p-value: probability of observing data if null is true. Type I (false positive) vs Type II (false negative). t-test: compare means. Chi-square: categorical data. ANOVA: multiple groups. Confidence intervals." },
            ],
            examples: [
              { title: "A/B Test Analysis", description: "Statistical analysis of A/B test results with hypothesis testing", starterCode: "from scipy import stats\nimport numpy as np\n\nnp.random.seed(42)\ncontrol = np.random.binomial(1, 0.10, 1000)\ntreatment = np.random.binomial(1, 0.13, 1000)\n# Analyze A/B test", solutionCode: "from scipy import stats\nimport numpy as np\n\nnp.random.seed(42)\ncontrol = np.random.binomial(1, 0.10, 1000)\ntreatment = np.random.binomial(1, 0.13, 1000)\n\nn_control = len(control)\nn_treatment = len(treatment)\nconv_control = control.sum()\nconv_treatment = treatment.sum()\nrate_control = conv_control / n_control\nrate_treatment = conv_treatment / n_treatment\nlift = (rate_treatment - rate_control) / rate_control * 100\n\nse = np.sqrt((rate_control * (1 - rate_control) / n_control) + (rate_treatment * (1 - rate_treatment) / n_treatment))\nz_score = (rate_treatment - rate_control) / se\np_value = 2 * (1 - stats.norm.cdf(abs(z_score)))\nci = (rate_treatment - rate_control) - 1.96 * se, (rate_treatment - rate_control) + 1.96 * se\n\nprint(f\"Control rate: {rate_control:.3f}\")\nprint(f\"Treatment rate: {rate_treatment:.3f}\")\nprint(f\"Lift: {lift:.2f}%\")\nprint(f\"p-value: {p_value:.4f}\")\nprint(f\"95% CI: [{ci[0]:.4f}, {ci[1]:.4f}]\")" },
            ],
            exercises: [{ title: "Analyze a Real-World Dataset", description: "Perform full statistical analysis: descriptive stats, normality test, correlation, t-test", starterCode: "import pandas as pd\nfrom scipy import stats\n\ndf = pd.read_csv('data.csv')\n# 1. Descriptive statistics\n# 2. Normality test (Shapiro-Wilk)\n# 3. Correlation analysis\n# 4. T-test between groups\n# 5. Visualize distributions", testCases: "Descriptive stats computed; Normality tested; Correlations found; T-test significant/not significant; Distributions visualized; Written summary of findings" }],
            visualizations: [{ type: "flowchart", title: "Statistical Testing Flow", config: "{\"nodes\":[{\"id\":\"type\",\"label\":\"Data type?\",\"x\":250,\"y\":20},{\"id\":\"cat\",\"label\":\"Categorical\",\"x\":120,\"y\":100},{\"id\":\"num\",\"label\":\"Numerical\",\"x\":380,\"y\":100},{\"id\":\"chi\",\"label\":\"Chi-Square\",\"x\":120,\"y\":180},{\"id\":\"normal\",\"label\":\"Normal?\",\"x\":380,\"y\":180},{\"id\":\"ttest\",\"label\":\"t-test\",\"x\":300,\"y\":260},{\"id\":\"mann\",\"label\":\"Mann-Whitney\",\"x\":460,\"y\":260}],\"edges\":[{\"from\":\"type\",\"to\":\"cat\"},{\"from\":\"type\",\"to\":\"num\"},{\"from\":\"cat\",\"to\":\"chi\"},{\"from\":\"num\",\"to\":\"normal\"},{\"from\":\"normal\",\"to\":\"ttest\",\"label\":\"yes\"},{\"from\":\"normal\",\"to\":\"mann\",\"label\":\"no\"}]}" }],
            lesson: { title: "Statistics and Probability", content: "Descriptive: mean, median, std, percentiles. Distributions: Normal, Binomial, Poisson, Uniform. CLT: sample means → normal. Hypothesis: null vs alternative, p-value, Type I/II error. Tests: t-test, chi-square, ANOVA. A/B testing: control vs treatment, sample size, significance. scipy.stats for all tests.", explanation: "This lesson covers statistics and probability for data science." },
          },
          {
            title: "Machine Learning with Scikit-learn",
            description: "Build ML models: classification, regression, clustering, and model evaluation.",
            slug: "ml-scikit-learn", difficulty: 3, prerequisites: [0, 1, 2],
            concepts: [
              { title: "Supervised Learning", description: "Regression: LinearRegression, Ridge, Lasso, RandomForestRegressor. Classification: LogisticRegression, SVC, RandomForestClassifier, GradientBoosting. Train/test split. Cross-validation. Feature scaling." },
              { title: "Model Evaluation", description: "Regression: MSE, MAE, R². Classification: accuracy, precision, recall, F1, ROC-AUC, confusion matrix. Cross-validation: cross_val_score. GridSearchCV for hyperparameter tuning. Learning curves for bias/variance." },
              { title: "Unsupervised Learning", description: "KMeans: n_clusters, inertia, elbow method. DBSCAN: density-based, handles noise. PCA: dimensionality reduction, explained variance. t-SNE: visualization of high-dim data. Feature engineering: OneHotEncoder, PolynomialFeatures." },
            ],
            examples: [
              { title: "End-to-End ML Pipeline", description: "Complete ML pipeline with preprocessing, training, and evaluation", starterCode: "from sklearn.model_selection import train_test_split, cross_val_score\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import classification_report\nimport pandas as pd\n\n# Build pipeline", solutionCode: "from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV\nfrom sklearn.preprocessing import StandardScaler, OneHotEncoder\nfrom sklearn.compose import ColumnTransformer\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import classification_report, confusion_matrix\nimport pandas as pd\nimport numpy as np\n\nnp.random.seed(42)\nX = np.random.randn(500, 5)\ny = (X[:, 0] + X[:, 1] * 0.5 > 0).astype(int)\n\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\n\npipeline = Pipeline([\n    ('scaler', StandardScaler()),\n    ('clf', RandomForestClassifier(n_estimators=100, random_state=42)),\n])\n\npipeline.fit(X_train, y_train)\n\ny_pred = pipeline.predict(X_test)\nprint(\"Classification Report:\")\nprint(classification_report(y_test, y_pred))\nprint(\"\\nConfusion Matrix:\")\nprint(confusion_matrix(y_test, y_pred))\n\ncv_scores = cross_val_score(pipeline, X, y, cv=5)\nprint(f\"\\nCross-validation accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})\")" },
            ],
            exercises: [{ title: "Build a Classifier from Scratch", description: "Create and compare multiple classifiers on the same dataset", starterCode: "from sklearn.datasets import make_classification\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.tree import DecisionTreeClassifier\nfrom sklearn.svm import SVC\n\nX, y = make_classification(n_samples=1000, n_features=20, n_informative=10, random_state=42)\n# Compare 3 classifiers, tune hyperparameters, evaluate", testCases: "3+ classifiers compared; Cross-validation used; Hyperparameter tuning done; Confusion matrices shown; Best model identified; Feature importance analyzed" }],
            visualizations: [{ type: "flowchart", title: "ML Model Selection", config: "{\"nodes\":[{\"id\":\"problem\",\"label\":\"Problem type?\",\"x\":250,\"y\":20},{\"id\":\"class\",\"label\":\"Classification\",\"x\":100,\"y\":100},{\"id\":\"reg\",\"label\":\"Regression\",\"x\":400,\"y\":100},{\"id\":\"logistic\",\"label\":\"Logistic Reg\",\"x\":50,\"y\":180},{\"id\":\"rf\",\"label\":\"Random Forest\",\"x\":150,\"y\":180},{\"id\":\"linear\",\"label\":\"Linear Reg\",\"x\":350,\"y\":180},{\"id\":\"xgb\",\"label\":\"XGBoost\",\"x\":450,\"y\":180}],\"edges\":[{\"from\":\"problem\",\"to\":\"class\"},{\"from\":\"problem\",\"to\":\"reg\"},{\"from\":\"class\",\"to\":\"logistic\"},{\"from\":\"class\",\"to\":\"rf\"},{\"from\":\"reg\",\"to\":\"linear\"},{\"from\":\"reg\",\"to\":\"xgb\"}]}" }],
            lesson: { title: "Machine Learning with Scikit-learn", content: "Supervised: Regression (Linear, Ridge, Lasso), Classification (Logistic, SVM, Random Forest, XGBoost). Unsupervised: KMeans, DBSCAN, PCA. Pipeline: preprocessing + model. GridSearchCV for hyperparameters. Metrics: MSE, R², accuracy, F1, ROC-AUC. Cross-validation: k-fold CV.", explanation: "This lesson covers machine learning with scikit-learn." },
          },
          {
            title: "Data Pipelines & ETL",
            description: "Build data pipelines: extraction, transformation, loading, and orchestration with Python.",
            slug: "data-pipelines-etl", difficulty: 3, prerequisites: [0, 1, 2],
            concepts: [
              { title: "ETL Process", description: "Extract: APIs, databases, files, web scraping. Transform: clean, normalize, aggregate, join. Load: database, data warehouse, files. ELT variant: load raw, transform in warehouse. Incremental vs full loads." },
              { title: "Data Orchestration", description: "Apache Airflow: DAGs, tasks, operators, scheduling. Prefect: Python-native workflows. Luigi: Spotify's pipeline tool. Cron for simple scheduling. Dependencies: task A before task B. Error handling: retries, alerts on failure." },
              { title: "Data Quality", description: "Great Expectations for data validation. Schema validation: column types, null checks. Data profiling: pandas-profiling. Monitoring: data freshness, row counts, distributions. Unit tests for transforms. Data lineage tracking." },
            ],
            examples: [
              { title: "Simple ETL Pipeline", description: "Extract from API, transform, load to CSV and SQLite", starterCode: "import requests\nimport pandas as pd\nimport sqlite3\n\n# Extract from API\n# Transform data\n# Load to SQLite", solutionCode: "import requests\nimport pandas as pd\nimport sqlite3\nfrom datetime import datetime\n\nclass ETLPipeline:\n    def __init__(self, db_path='data.db'):\n        self.conn = sqlite3.connect(db_path)\n\n    def extract(self, url):\n        response = requests.get(url)\n        response.raise_for_status()\n        return pd.DataFrame(response.json())\n\n    def transform(self, df):\n        df['extracted_at'] = datetime.now()\n        df.columns = df.columns.str.lower().str.replace(' ', '_')\n        if 'price' in df.columns:\n            df['price'] = pd.to_numeric(df['price'], errors='coerce')\n        df = df.drop_duplicates()\n        return df\n\n    def load(self, df, table_name):\n        df.to_sql(table_name, self.conn, if_exists='replace', index=False)\n        print(f\"Loaded {len(df)} rows to {table_name}\")\n\n    def run(self, url, table_name):\n        df = self.extract(url)\n        df = self.transform(df)\n        self.load(df, table_name)\n        return df\n\npipeline = ETLPipeline()\nresult = pipeline.run('https://api.example.com/products', 'products')" },
            ],
            exercises: [{ title: "Build a Data Pipeline with Airflow DAG", description: "Create an Airflow DAG that extracts, transforms, and loads data daily", starterCode: "from airflow import DAG\nfrom airflow.operators.python import PythonOperator\nfrom datetime import datetime, timedelta\n\ndefault_args = {'owner': 'data_team', 'retries': 3, 'retry_delay': timedelta(minutes=5)}\n\ndag = DAG('etl_pipeline', default_args=default_args, schedule_interval='@daily', start_date=datetime(2024, 1, 1))\n\ndef extract_data():\n    pass\n\ndef transform_data():\n    pass\n\ndef load_data():\n    pass", testCases: "DAG has 3 tasks; Tasks run in correct order; Extract pulls from API; Transform cleans data; Load inserts to database; Retry config set; Daily schedule" }],
            visualizations: [{ type: "flowchart", title: "ETL Pipeline Architecture", config: "{\"nodes\":[{\"id\":\"api\",\"label\":\"API\",\"x\":100,\"y\":20},{\"id\":\"db\",\"label\":\"Database\",\"x\":250,\"y\":20},{\"id\":\"file\",\"label\":\"Files\",\"x\":400,\"y\":20},{\"id\":\"extract\",\"label\":\"Extract\",\"x\":250,\"y\":100},{\"id\":\"transform\",\"label\":\"Transform\",\"x\":250,\"y\":180},{\"id\":\"validate\",\"label\":\"Validate\",\"x\":250,\"y\":260},{\"id\":\"load\",\"label\":\"Load\",\"x\":250,\"y\":340},{\"id\":\"dw\",\"label\":\"Data Warehouse\",\"x\":250,\"y\":420}],\"edges\":[{\"from\":\"api\",\"to\":\"extract\"},{\"from\":\"db\",\"to\":\"extract\"},{\"from\":\"file\",\"to\":\"extract\"},{\"from\":\"extract\",\"to\":\"transform\"},{\"from\":\"transform\",\"to\":\"validate\"},{\"from\":\"validate\",\"to\":\"load\"},{\"from\":\"load\",\"to\":\"dw\"}]}" }],
            lesson: { title: "Data Pipelines and ETL", content: "ETL: Extract (API, DB, files), Transform (clean, normalize, aggregate), Load (warehouse, DB). ELT: load raw, transform later. Airflow: DAGs, operators, scheduling. Prefect: Python-native. Data quality: Great Expectations, schema validation, profiling. Monitoring: freshness, counts, alerts.", explanation: "This lesson covers building data pipelines and ETL processes." },
          },
        ],
      },
    ],
  },
];

export async function seedCurriculum() {
  console.log("Seeding curriculum...");

  const topicIdMap = new Map<string, string>();

  for (const course of courses) {
    console.log(`Creating course: ${course.title}`);

    const createdCourse = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        description: course.description,
        stream: course.stream,
        published: true,
      },
      create: {
        title: course.title,
        description: course.description,
        slug: course.slug,
        stream: course.stream,
        published: true,
      },
    });

    for (const module of course.modules) {
      console.log(`  Creating module: ${module.title}`);

      const createdModule = await prisma.module.upsert({
        where: {
          courseId_slug: {
            courseId: createdCourse.id,
            slug: module.slug,
          },
        },
        update: {
          title: module.title,
          description: module.description,
          published: true,
        },
        create: {
          title: module.title,
          description: module.description,
          slug: module.slug,
          courseId: createdCourse.id,
          published: true,
        },
      });

      for (let i = 0; i < module.topics.length; i++) {
        const topic = module.topics[i];
        console.log(`    Creating topic: ${topic.title}`);

        const createdTopic = await prisma.topic.upsert({
          where: {
            moduleId_slug: {
              moduleId: createdModule.id,
              slug: topic.slug,
            },
          },
          update: {
            title: topic.title,
            description: topic.description,
            difficulty: topic.difficulty,
            published: true,
            order: i + 1,
          },
          create: {
            title: topic.title,
            description: topic.description,
            slug: topic.slug,
            difficulty: topic.difficulty,
            moduleId: createdModule.id,
            order: i + 1,
            published: true,
          },
        });

        topicIdMap.set(`${course.slug}:${module.slug}:${i}`, createdTopic.id);

        const createdLesson = await prisma.lesson.upsert({
          where: {
            topicId_slug: {
              topicId: createdTopic.id,
              slug: topic.slug,
            },
          },
          update: {
            title: topic.lesson.title,
            content: topic.lesson.content,
            explanation: topic.lesson.explanation,
            published: true,
          },
          create: {
            title: topic.lesson.title,
            slug: topic.slug,
            content: topic.lesson.content,
            explanation: topic.lesson.explanation,
            topicId: createdTopic.id,
            published: true,
          },
        });

        await prisma.concept.deleteMany({ where: { lessonId: createdLesson.id } });
        if (topic.concepts.length > 0) {
          await prisma.concept.createMany({
            data: topic.concepts.map((c, idx) => ({
              title: c.title,
              description: c.description,
              lessonId: createdLesson.id,
              order: idx + 1,
            })),
          });
        }

        await prisma.example.deleteMany({ where: { lessonId: createdLesson.id } });
        if (topic.examples.length > 0) {
          await prisma.example.createMany({
            data: topic.examples.map((e, idx) => ({
              title: e.title,
              description: e.description,
              starterCode: e.starterCode,
              solutionCode: e.solutionCode,
              testCases: "",
              lessonId: createdLesson.id,
              order: idx + 1,
            })),
          });
        }

        await prisma.exercise.deleteMany({ where: { lessonId: createdLesson.id } });
        if (topic.exercises.length > 0) {
          await prisma.exercise.createMany({
            data: topic.exercises.map((ex, idx) => ({
              title: ex.title,
              description: ex.description,
              instructions: ex.description,
              starterCode: ex.starterCode,
              solutionCode: "",
              testCases: ex.testCases,
              hints: "",
              lessonId: createdLesson.id,
              order: idx + 1,
            })),
          });
        }

        await prisma.visualization.deleteMany({ where: { lessonId: createdLesson.id } });
        if (topic.visualizations.length > 0) {
          await prisma.visualization.createMany({
            data: topic.visualizations.map((v) => ({
              type: v.type,
              title: v.title,
              config: v.config,
              lessonId: createdLesson.id,
            })),
          });
        }
      }
    }
  }

  console.log("Linking prerequisites...");
  for (const course of courses) {
    for (const module of course.modules) {
      for (let i = 0; i < module.topics.length; i++) {
        const topic = module.topics[i];
        const topicId = topicIdMap.get(`${course.slug}:${module.slug}:${i}`);
        if (!topicId) continue;

        for (const prereqIndex of topic.prerequisites) {
          const prereqId = topicIdMap.get(`${course.slug}:${module.slug}:${prereqIndex}`);
          if (prereqId) {
            await prisma.topicPrerequisite.upsert({
              where: {
                topicId_prerequisiteId: {
                  topicId,
                  prerequisiteId: prereqId,
                },
              },
              update: {},
              create: {
                topicId,
                prerequisiteId: prereqId,
              },
            });
          }
        }
      }
    }
  }

  console.log("Seeding completed successfully!");
}