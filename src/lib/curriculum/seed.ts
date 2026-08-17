import { prisma } from "@/lib/db";
import { phase5, phase6, phase7 } from './frontend-phases';
import { aiPromptEngineeringCourse } from './ai-course';
import { validateExecutableTopic } from './executable-contract';
import { nodejsBackendCourse } from './backend-nodejs-course';
import { phpBackendCourse } from './backend-php-course';
import { laravelBackendCourse } from './backend-laravel-course';
import { nextjsFullstackCourse } from './fullstack-nextjs-course';
import { dataScienceCourse } from './data-science-course';
import { devopsCourse } from './devops-course';
import { mobileCourse } from './mobile-course';

interface CourseSeed {
  title: string;
  description: string;
  slug: string;
  stream: string;
  imageUrl?: string;
  order?: number;
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
      examples: { title: string; description: string; starterCode: string; solutionCode: string; testCases?: string; expectedOutput?: string }[];
      exercises: { title: string; description: string; instructions?: string; starterCode: string; solutionCode?: string; testCases: string; hints?: string; difficulty?: number }[];
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
    imageUrl: "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=A%20modern%20frontend%20development%20workspace%20with%20HTML%20CSS%20JavaScript%20code%20on%20screens%2C%20clean%20minimal%20design%2C%20dark%20theme&image_size=landscape_16_9",
    order: 1,
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
      phase5,
      phase6,
      phase7,
    ],
  },
  nodejsBackendCourse as unknown as CourseSeed,
  phpBackendCourse as unknown as CourseSeed,
  laravelBackendCourse as unknown as CourseSeed,
  nextjsFullstackCourse as unknown as CourseSeed,
  aiPromptEngineeringCourse as unknown as CourseSeed,
  dataScienceCourse as unknown as CourseSeed,
  devopsCourse as unknown as CourseSeed,
  mobileCourse as unknown as CourseSeed,
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
        imageUrl: course.imageUrl ?? null,
        order: course.order ?? 0,
        published: true,
      },
      create: {
        title: course.title,
        description: course.description,
        slug: course.slug,
        stream: course.stream,
        imageUrl: course.imageUrl ?? null,
        order: course.order ?? 0,
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

        // Validate Executable Learning Contract
        const validation = validateExecutableTopic(topic as any);
        if (!validation.valid) {
          console.warn(`  [Executable Contract] Topic "${topic.title}" warnings: ${validation.errors.join("; ")}`);
        }

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
              testCases: e.testCases || "",
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
              instructions: ex.instructions || ex.description,
              starterCode: ex.starterCode,
              solutionCode: ex.solutionCode || ex.starterCode,
              testCases: ex.testCases,
              hints: ex.hints || "Analyze the requirements and implement the solution step-by-step.",
              difficulty: ex.difficulty || topic.difficulty || 1,
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