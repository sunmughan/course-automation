// Complete Modern PHP 8+ Backend Engineering Course (Zero to Hero)

export const phpBackendCourse = {
  title: "Modern PHP 8+ Backend Engineering",
  description: "Master modern enterprise PHP 8+ from the ground up. Learn strict typing, constructor promotion, Match expressions, Object-Oriented Architecture, SOLID principles, PDO secure database persistence, RESTful APIs, CSRF/XSS defense, and PHPUnit automated testing.",
  slug: "php-backend-engineering",
  stream: "backend",
  imageUrl: "https://images.unsplash.com/photo-1599507593499-a3f7f7d97667?auto=format&fit=crop&w=1200&q=80",
  order: 3,
  modules: [
    {
      title: "Phase 1: Core PHP Fundamentals & Modern PHP 8+ Syntax",
      description: "Master PHP 8.2+ core syntax, strict type declarations, union/intersection types, match expressions, and error handling.",
      slug: "phase-1-php-core-syntax",
      topics: [
        {
          title: "PHP 8+ Syntax, Types & Control Structures",
          description: "Explore strict typing with declare(strict_types=1), match expressions, nullsafe operator (?->), and modern type systems.",
          slug: "php-syntax-types-control-structures",
          difficulty: 1,
          prerequisites: [],
          concepts: [
            {
              title: "Strict Typing in PHP 8",
              description: "By default, PHP coerces types weakly. Adding `declare(strict_types=1);` at the top of PHP files enforces exact scalar type checking on function arguments and return types, eliminating silent runtime bugs."
            },
            {
              title: "Match Expressions vs Switch",
              description: "PHP 8's `match` expression provides strict identity checking (`===`), returns a value directly without `break` statements, and throws an `UnhandledMatchError` if no pattern matches."
            },
            {
              title: "Nullsafe Operator & Named Arguments",
              description: "The nullsafe operator `$user?->profile?->getAddress()` short-circuits null evaluation without repetitive `isset()` or `!is_null()` checks. Named arguments allow passing parameters by name regardless of order."
            }
          ],
          examples: [
            {
              title: "PHP 8 Match Expression & Strict Types",
              description: "Demonstrating match expression for HTTP status code resolution",
              starterCode: `<?php
declare(strict_types=1);

function getHttpStatusMessage(int $statusCode): string {
    return match ($statusCode) {
        200 => 'OK: Request succeeded',
        201 => 'Created: Resource created',
        400 => 'Bad Request: Invalid payload',
        401 => 'Unauthorized: Authentication required',
        404 => 'Not Found: Resource does not exist',
        500 => 'Internal Server Error',
        default => 'Unknown Status Code',
    };
}

echo getHttpStatusMessage(200) . "\\n";
echo getHttpStatusMessage(404) . "\\n";`,
              solutionCode: `<?php
declare(strict_types=1);

function getHttpStatusMessage(int $statusCode): string {
    return match ($statusCode) {
        200 => 'OK: Request succeeded',
        201 => 'Created: Resource created',
        400 => 'Bad Request: Invalid payload',
        401 => 'Unauthorized: Authentication required',
        404 => 'Not Found: Resource does not exist',
        500 => 'Internal Server Error',
        default => 'Unknown Status Code',
    };
}

echo getHttpStatusMessage(200) . "\\n";
echo getHttpStatusMessage(404) . "\\n";`,
              expectedOutput: "OK: Request succeeded\nNot Found: Resource does not exist"
            }
          ],
          exercises: [
            {
              title: "Build a Strict Discount Calculator in PHP",
              description: "Write a PHP function calculateDiscount(float $price, string $tier): float that applies 20% for 'vip', 10% for 'member', and 0% for 'guest' using a match expression.",
              starterCode: `<?php
declare(strict_types=1);

function calculateDiscount(float $price, string $tier): float {
    // Use match expression to compute discounted price
}`,
              solutionCode: `<?php
declare(strict_types=1);

function calculateDiscount(float $price, string $tier): float {
    $rate = match (strtolower($tier)) {
        'vip' => 0.20,
        'member' => 0.10,
        'guest' => 0.0,
        default => 0.0,
    };
    return round($price * (1.0 - $rate), 2);
}`,
              testCases: `calculateDiscount(100.0, 'vip') returns 80.0; calculateDiscount(100.0, 'member') returns 90.0; calculateDiscount(100.0, 'guest') returns 100.0`,
              hints: "Use match on lowercase tier string to determine discount percentage and calculate discounted price."
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "PHP 8 Strict Match Expression Lifecycle",
              config: JSON.stringify({
                nodes: [
                  { id: "input", label: "Input Argument (int $status)", type: "Terminal", description: "Enforces strict integer type validation", x: 80, y: 100 },
                  { id: "engine", label: "Zend Engine 8 Type Checker", type: "Controller", description: "Throws TypeError if argument is string/null", x: 250, y: 100 },
                  { id: "match", label: "Match Expression Pattern (===)", type: "Service", description: "Direct strict identity matching without break fallthrough", x: 250, y: 220 },
                  { id: "output", label: "Evaluated Return Value", type: "Router", description: "Returns string directly to caller", x: 420, y: 220 }
                ],
                edges: [
                  { id: "e1", from: "input", to: "engine", label: "declare(strict_types=1)" },
                  { id: "e2", from: "engine", to: "match", label: "types verified" },
                  { id: "e3", from: "match", to: "output", label: "branch resolved" }
                ],
                steps: [
                  {
                    id: "s1",
                    title: "1. Strict Type Guard",
                    description: "Zend Engine checks that incoming parameters strictly match declared scalar types, preventing subtle coercion bugs.",
                    highlightNodes: ["input", "engine"],
                    highlightEdges: ["e1"],
                    code: "declare(strict_types=1);\nfunction handleStatus(int $code): string { ... }"
                  },
                  {
                    id: "s2",
                    title: "2. Match Expression Branching",
                    description: "Match executes strict (===) comparison across branches. Unlike switch, match returns a value expression directly.",
                    highlightNodes: ["match"],
                    highlightEdges: ["e2"],
                    code: "return match($code) {\n  200 => 'OK',\n  404 => 'Not Found',\n  default => 'Error'\n};"
                  },
                  {
                    id: "s3",
                    title: "3. Direct Value Return",
                    description: "Result is returned without fallthrough risk or boilerplate break statements.",
                    highlightNodes: ["output"],
                    highlightEdges: ["e3"],
                    code: "echo handleStatus(200); // Output: OK"
                  }
                ]
              })
            }
          ],
          lesson: {
            title: "Modern PHP 8+ Syntax & Type System",
            content: `### 🌟 1. Introduction: Modern PHP is NOT Legacy PHP
If you used PHP 10 years ago, modern PHP 8+ is a completely reimagined language:
- **Fast Execution**: Powered by Zend Engine 8 with JIT (Just-In-Time) compilation.
- **Strictly Typed**: Native support for scalar types, union types (\`int|float\`), and intersection types (\`Countable&Iterator\`).
- **Expressive**: Match expressions, Nullsafe operators, and Constructor Promotion eliminate 60% of legacy boilerplate code.

---

### 🔄 2. The Step-by-Step Modern PHP Lifecycle
1. **Strict Type Header**: Place \`declare(strict_types=1);\` at the top of every PHP file.
2. **Type Checking**: Zend Engine evaluates function inputs against type annotations.
3. **Pattern Matching**: Match expressions resolve values safely without silent \`switch\` fallthrough bugs.
4. **Null Safety**: Chained navigation (\`$obj?->prop?->method()\`) short-circuits gracefully if any segment is null.

---

### 💻 3. Exact Modern PHP 8+ Syntax
\`\`\`php
<?php
declare(strict_types=1);

// 1. Union Types & Match Expression
function calculateShipping(int|float $weight, string $country): float {
    $baseRate = match (strtoupper($country)) {
        'IN' => 50.0,
        'US' => 150.0,
        'EU' => 120.0,
        default => 200.0,
    };
    return $baseRate + ($weight * 10.0);
}

// 2. Nullsafe Operator (?->)
class Company { public ?Address $address = null; }
class Address { public string $city = 'Bangalore'; }

$company = new Company();
$city = $company->address?->city ?? 'Unknown City';
\`\`\`

---

### 🎯 4. Real-World Use Cases
- **Enterprise E-Commerce Platforms**: Magento, WooCommerce, and custom checkout engines.
- **High-Throughput Content Management**: WordPress VIP, Drupal enterprise portals.
- **Payment & FinTech APIs**: Stripe and Razorpay webhook handlers and invoicing pipelines.

---

### ⚠️ 5. Common Gotchas
- ❌ **Omitting declare(strict_types=1)**: Without this directive, PHP will implicitly convert \`"123"\` string into \`123\` integer.
- ❌ **Missing Default in Match**: If no branch matches in \`match\` and no \`default\` is specified, PHP throws an \`UnhandledMatchError\`.`,
            explanation: "Mastering PHP 8 modern features is essential for professional backend engineering."
          }
        }
      ]
    },
    {
      title: "Phase 2: Object-Oriented PHP, SOLID & Design Patterns",
      description: "Build maintainable backend architectures with OOP classes, interfaces, traits, enums, dependency injection, and PSR-4 autoloading.",
      slug: "phase-2-php-oop-solid",
      topics: [
        {
          title: "OOP Architecture, Interfaces & Dependency Injection",
          description: "Implement OOP design patterns, constructor promotion, readonly classes, interfaces, traits, and Inversion of Control in PHP.",
          slug: "php-oop-interfaces-di",
          difficulty: 3,
          prerequisites: [0],
          concepts: [
            {
              title: "Constructor Property Promotion & Readonly",
              description: "PHP 8 simplifies class definitions by combining property declaration and constructor assignment in one syntax: `public function __construct(public readonly string $id, public string $name) {}`."
            },
            {
              title: "Interfaces & Polymorphism",
              description: "Interfaces define public contracts that multiple classes can implement. Programming against interfaces rather than concrete classes allows swapping payment gateways or cache providers without changing business logic."
            },
            {
              title: "Dependency Injection & Inversion of Control (IoC)",
              description: "Instead of classes creating their own dependencies (`new DatabaseConnection()`), dependencies are injected through the constructor. This makes classes loosely coupled and testable with mock objects."
            }
          ],
          examples: [
            {
              title: "Payment Gateway Polymorphism in PHP",
              description: "Using interfaces and dependency injection for decoupled payment processors",
              starterCode: `<?php
declare(strict_types=1);

interface PaymentGatewayInterface {
    public function process(float $amount): bool;
}

class StripeGateway implements PaymentGatewayInterface {
    public function process(float $amount): bool {
        echo "Processed $" . number_format($amount, 2) . " via Stripe\\n";
        return true;
    }
}

class CheckoutService {
    public function __construct(private PaymentGatewayInterface $gateway) {}
    
    public function checkout(float $amount): bool {
        return $this->gateway->process($amount);
    }
}

$service = new CheckoutService(new StripeGateway());
$service->checkout(149.99);`,
              solutionCode: `<?php
declare(strict_types=1);

interface PaymentGatewayInterface {
    public function process(float $amount): bool;
}

class StripeGateway implements PaymentGatewayInterface {
    public function process(float $amount): bool {
        echo "Processed $" . number_format($amount, 2) . " via Stripe\\n";
        return true;
    }
}

class CheckoutService {
    public function __construct(private PaymentGatewayInterface $gateway) {}
    
    public function checkout(float $amount): bool {
        return $this->gateway->process($amount);
    }
}

$service = new CheckoutService(new StripeGateway());
$service->checkout(149.99);`,
              expectedOutput: "Processed $149.99 via Stripe"
            }
          ],
          exercises: [
            {
              title: "Build a Notification Service with Factory Pattern",
              description: "Implement a NotificationFactory that instantiates EmailNotification or SMSNotification based on channel string.",
              starterCode: `<?php
declare(strict_types=1);

interface NotifierInterface {
    public function send(string $to, string $msg): string;
}

class NotificationFactory {
    public static function create(string $channel): NotifierInterface {
        // Return appropriate instance
    }
}`,
              solutionCode: `<?php
declare(strict_types=1);

interface NotifierInterface {
    public function send(string $to, string $msg): string;
}

class EmailNotifier implements NotifierInterface {
    public function send(string $to, string $msg): string {
        return "Email sent to $to: $msg";
    }
}

class SMSNotifier implements NotifierInterface {
    public function send(string $to, string $msg): string {
        return "SMS sent to $to: $msg";
    }
}

class NotificationFactory {
    public static function create(string $channel): NotifierInterface {
        return match (strtolower($channel)) {
            'email' => new EmailNotifier(),
            'sms' => new SMSNotifier(),
            default => throw new InvalidArgumentException("Unknown channel: $channel"),
        };
    }
}`,
              testCases: `NotificationFactory::create('email')->send('a@b.com', 'hi') contains 'Email sent'; NotificationFactory::create('sms')->send('+123', 'hi') contains 'SMS sent'`,
              hints: "Use match in NotificationFactory to return the appropriate NotifierInterface implementation."
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "Dependency Injection & Inversion of Control Lifecycle",
              config: JSON.stringify({
                nodes: [
                  { id: "client", label: "CheckoutService (High-level)", type: "Controller", description: "Depends only on abstraction interface", x: 250, y: 30 },
                  { id: "interface", label: "«Interface» PaymentGateway", type: "Security", description: "Defines public contract: process(float $amount)", x: 250, y: 130 },
                  { id: "stripe", label: "StripeGateway", type: "Service", description: "Implements interface using Stripe API", x: 80, y: 240 },
                  { id: "paypal", label: "PayPalGateway", type: "Service", description: "Implements interface using PayPal SDK", x: 250, y: 240 },
                  { id: "mock", label: "MockPaymentGateway (Testing)", type: "Terminal", description: "Used in PHPUnit tests with zero network calls", x: 420, y: 240 }
                ],
                edges: [
                  { id: "e1", from: "client", to: "interface", label: "injects via constructor" },
                  { id: "e2", from: "stripe", to: "interface", label: "implements" },
                  { id: "e3", from: "paypal", to: "interface", label: "implements" },
                  { id: "e4", from: "mock", to: "interface", label: "implements" }
                ],
                steps: [
                  {
                    id: "s1",
                    title: "1. Inversion of Control Principle",
                    description: "High-level CheckoutService does NOT instantiate concrete StripeGateway. It accepts any class implementing PaymentGatewayInterface.",
                    highlightNodes: ["client", "interface"],
                    highlightEdges: ["e1"],
                    code: "class CheckoutService {\n  public function __construct(private PaymentGatewayInterface $gateway) {}\n}"
                  },
                  {
                    id: "s2",
                    title: "2. Swapping Implementations at Runtime",
                    description: "Production injects StripeGateway. Unit tests inject MockPaymentGateway without modifying CheckoutService code.",
                    highlightNodes: ["stripe", "mock"],
                    highlightEdges: ["e2", "e4"],
                    code: "$prod = new CheckoutService(new StripeGateway());\n$test = new CheckoutService(new MockPaymentGateway());"
                  }
                ]
              })
            }
          ],
          lesson: {
            title: "Object-Oriented Design & SOLID Principles in PHP",
            content: `### 🌟 1. Introduction: Building Scalable PHP Architecture
Writing procedural PHP with \`include 'db.php'\` creates unmaintainable spaghetti code. 
Object-Oriented PHP structures applications using **SOLID Principles**:
- **S**ingle Responsibility: One class handles one specific task (e.g. \`InvoiceCalculator\` does not send emails).
- **O**pen/Closed: Add new payment gateways by implementing an interface without changing existing checkout logic.
- **L**iskov Substitution: Any subclass or interface implementation can replace the base type safely.
- **I**nterface Segregation: Create specific, small interfaces instead of giant monolithic contracts.
- **D**ependency Inversion: Inject dependencies into constructors rather than creating hardcoded \`new Class()\` instances.

---

### 🔄 2. Step-by-Step Dependency Injection Flow
1. **Define Interface Contract**: \`interface MailerInterface { public function send(string $to, string $msg): bool; }\`
2. **Create Concrete Implementations**: \`SmtpMailer\` and \`SesMailer\` implement \`MailerInterface\`.
3. **Constructor Injection**: In \`UserRegistrationService\`, pass \`MailerInterface\` into \`__construct()\`.
4. **Service Container Resolution**: Framework container auto-wires the configured production mailer.

---

### 💻 3. Exact PHP 8+ Class Syntax
\`\`\`php
<?php
declare(strict_types=1);

// PHP 8 Constructor Promotion & Readonly Class
readonly class UserDTO {
    public function __construct(
        public string $id,
        public string $email,
        public string $role = 'student'
    ) {}
}

$user = new UserDTO('usr_101', 'aarav@skillforge.com');
// $user->email = 'new@b.com'; // Throws Error: Cannot modify readonly property!
\`\`\`

---

### 🎯 4. Real-World Use Cases
- **Multi-Tenant SaaS Backends**: Swapping tenant database connections and cache prefixes.
- **Pluggable Payment Gateways**: Supporting Stripe, PayPal, Razorpay, and Apple Pay seamlessly.
- **Automated Unit Testing**: Mocking third-party APIs in PHPUnit test suites.

---

### ⚠️ 5. Common Gotchas
- ❌ **Direct \`new\` Instantiation Inside Services**: Creates tight coupling and makes unit testing impossible.
- ❌ **Fat God Classes**: A \`UserManager\` class that handles database CRUD, password hashing, emails, PDF generation, and billing all in one file.`,
            explanation: "OOP principles enable modular architecture in large PHP enterprise backends."
          }
        }
      ]
    },
    {
      title: "Phase 3: Secure Database Persistence & RESTful APIs with PDO",
      description: "Connect to relational databases using PDO, execute prepared statements, prevent SQL injections, manage transactions, and build JSON REST APIs.",
      slug: "phase-3-php-database-pdo-apis",
      topics: [
        {
          title: "Secure Database Access with PDO & Prepared Statements",
          description: "Master PHP Data Objects (PDO), prepared statements with parameter binding, transaction management, and OWASP security.",
          slug: "php-pdo-prepared-statements",
          difficulty: 3,
          prerequisites: [1],
          concepts: [
            {
              title: "Why Prepared Statements Prevent SQL Injection",
              description: "String concatenation in SQL queries (`SELECT * FROM users WHERE email = '$email'`) allows attackers to inject malicious SQL commands. Prepared statements send the SQL query template and data parameters separately to the database engine, rendering injection impossible."
            },
            {
              title: "PDO Connection & Error Modes",
              description: "PDO provides a unified API across MySQL, PostgreSQL, and SQLite. Always configure `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION` and `PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC` to ensure failures throw catchable PDOExceptions."
            },
            {
              title: "Building RESTful JSON Endpoints in PHP",
              description: "Setting `header('Content-Type: application/json; charset=utf-8');`, reading `file_get_contents('php://input')`, and returning `json_encode($data)` with proper HTTP status codes (`http_response_code(200)`)."
            }
          ],
          examples: [
            {
              title: "PDO Prepared Statement Simulation",
              description: "Demonstrating safe parameter binding and sanitization",
              starterCode: `class MockPDOStatement {
  constructor(query, db) {
    this.query = query;
    this.db = db;
  }
  execute(params) {
    const email = params[':email'];
    return this.db.users.filter(u => u.email === email);
  }
}

const mockDb = {
  users: [
    { id: 1, name: 'Aarav', email: 'aarav@skillforge.com', role: 'admin' },
    { id: 2, name: 'Priya', email: 'priya@skillforge.com', role: 'instructor' }
  ]
};

const stmt = new MockPDOStatement('SELECT * FROM users WHERE email = :email', mockDb);
const results = stmt.execute({ ':email': 'aarav@skillforge.com' });
console.log('Secure Query Result:', JSON.stringify(results));`,
              solutionCode: `class MockPDOStatement {
  constructor(query, db) {
    this.query = query;
    this.db = db;
  }
  execute(params) {
    const email = params[':email'];
    return this.db.users.filter(u => u.email === email);
  }
}

const mockDb = {
  users: [
    { id: 1, name: 'Aarav', email: 'aarav@skillforge.com', role: 'admin' },
    { id: 2, name: 'Priya', email: 'priya@skillforge.com', role: 'instructor' }
  ]
};

const stmt = new MockPDOStatement('SELECT * FROM users WHERE email = :email', mockDb);
const results = stmt.execute({ ':email': 'aarav@skillforge.com' });
console.log('Secure Query Result:', JSON.stringify(results));`,
              expectedOutput: "Secure Query Result: [{\"id\":1,\"name\":\"Aarav\",\"email\":\"aarav@skillforge.com\",\"role\":\"admin\"}]"
            }
          ],
          exercises: [
            {
              title: "Build a PHP JSON Response Helper",
              description: "Write a PHP function jsonResponse(mixed $data, int $status = 200, array $headers = []): string that returns a formatted JSON string with status code header.",
              starterCode: `<?php
declare(strict_types=1);

function jsonResponse(mixed $data, int $status = 200): string {
    // Return JSON encoded string and set appropriate response code
}`,
              solutionCode: `<?php
declare(strict_types=1);

function jsonResponse(mixed $data, int $status = 200): string {
    if (function_exists('http_response_code')) {
        http_response_code($status);
    }
    return json_encode(['status' => $status, 'data' => $data], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
}`,
              testCases: `jsonResponse(['id' => 1], 200) contains 'status' && jsonResponse(['id' => 1], 200) contains '200'`,
              hints: "Use json_encode with formatting options to output structured API responses."
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "PDO Prepared Statement vs SQL Injection",
              config: JSON.stringify({
                nodes: [
                  { id: "client", label: "User Input: ' OR '1'='1", type: "Terminal", description: "Malicious SQL injection attempt payload", x: 80, y: 100 },
                  { id: "pdo", label: "PDO::prepare()", type: "Security", description: "Compiles static SQL template in database engine", x: 250, y: 100 },
                  { id: "exec", label: "PDOStatement::execute()", type: "Service", description: "Sends input strictly as raw data parameter", x: 250, y: 220 },
                  { id: "db", label: "PostgreSQL / MySQL Engine", type: "Database", description: "Data parameter cannot alter compiled SQL syntax tree", x: 420, y: 220 }
                ],
                edges: [
                  { id: "e1", from: "client", to: "pdo", label: "query parameterized" },
                  { id: "e2", from: "pdo", to: "exec", label: "bind parameters" },
                  { id: "e3", from: "exec", to: "db", label: "safe execution" }
                ],
                steps: [
                  {
                    id: "s1",
                    title: "1. Preparing the SQL Statement",
                    description: "The SQL structure is sent first with parameter placeholders (:email). Database compiles the execution plan.",
                    highlightNodes: ["pdo"],
                    highlightEdges: ["e1"],
                    code: "$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');"
                  },
                  {
                    id: "s2",
                    title: "2. Binding Input as Pure Data",
                    description: "Attacker payload is treated purely as string literals, completely preventing query structure alteration.",
                    highlightNodes: ["exec", "db"],
                    highlightEdges: ["e2", "e3"],
                    code: "$stmt->execute([':email' => $userInput]);\n$user = $stmt->fetch();"
                  }
                ]
              })
            }
          ],
          lesson: {
            title: "Database Security & REST APIs with PHP PDO",
            content: `### 🌟 1. Introduction: Why PDO is Mandatory
In legacy PHP, developers often wrote:
\`SELECT * FROM users WHERE email = '$email' AND password = '$pass'\`
If an attacker inputs \`' OR '1'='1\`, the query becomes:
\`SELECT * FROM users WHERE email = '' OR '1'='1'\`
This logs the attacker in as the first admin in the database!

**PDO Prepared Statements** completely solve this by separating the **SQL Command** from the **User Data**:
1. The database compiles the SQL query structure once.
2. The database receives the user input strictly as a parameter value.
3. It is mathematically impossible for user input to inject executable SQL commands.

---

### 🔄 2. Step-by-Step PDO Lifecycle
1. **Initialize PDO Connection**: Set UTF-8 charset and Exception error mode.
2. **Prepare Statement**: Call \`$pdo->prepare("SELECT * FROM users WHERE id = :id")\`.
3. **Execute with Bound Array**: Call \`$stmt->execute([':id' => $id])\`.
4. **Fetch Results**: Call \`$stmt->fetch(PDO::FETCH_ASSOC)\` or \`$stmt->fetchAll()\`.

---

### 💻 3. Exact Production PDO & API Syntax
\`\`\`php
<?php
declare(strict_types=1);

$dsn = "pgsql:host=localhost;port=5432;dbname=platform_db;";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, 'postgres', 'password', $options);
    
    // REST API Header
    header('Content-Type: application/json; charset=utf-8');
    
    $stmt = $pdo->prepare('SELECT id, title, stream FROM courses WHERE stream = :stream');
    $stmt->execute([':stream' => 'backend']);
    $courses = $stmt->fetchAll();
    
    echo json_encode(['status' => 'success', 'data' => $courses]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database operation failed']);
}
\`\`\`

---

### 🎯 4. Real-World Use Cases
- **Financial Transactions**: \`$pdo->beginTransaction()\` and \`$pdo->commit()\` for money transfers.
- **RESTful Microservices**: JSON endpoints for mobile and frontend SPAs.
- **User Authentication**: Secure password verification with \`password_verify($password, $user['password_hash'])\`.

---

### ⚠️ 5. Common Gotchas
- ❌ **Using \`PDO::ATTR_EMULATE_PREPARES => true\`**: Always disable emulate prepares so the database engine itself handles native parameter binding.
- ❌ **Leaking DB Credentials or Stack Traces in Production**: Always catch \`PDOException\` and log the error message internally without displaying passwords or connection strings to the client.`,
            explanation: "PDO prepared statements eliminate the entire class of SQL injection vulnerabilities."
          }
        }
      ]
    },
    {
      title: "Phase 4: Modern PHP Ecosystem, Testing & PSR Standards",
      description: "Master Composer dependency management, PHPUnit automated testing, mocking, PSR-7/PSR-15 middleware standards, and Docker containerization.",
      slug: "phase-4-php-ecosystem-testing",
      topics: [
        {
          title: "Composer, Autoloading & PHPUnit Testing",
          description: "Configure composer.json, PSR-4 autoloading, write unit and integration tests with PHPUnit, and implement mock assertions.",
          slug: "composer-phpunit-testing",
          difficulty: 3,
          prerequisites: [1],
          concepts: [
            {
              title: "Composer & PSR-4 Autoloading",
              description: "Composer is PHP's dependency manager. PSR-4 specifies how PHP namespaces map directly to file directory paths (e.g. `App\\Services\\UserService` maps to `src/Services/UserService.php`), automatically loaded by `vendor/autoload.php`."
            },
            {
              title: "PHPUnit Automated Testing",
              description: "PHPUnit is the standard testing framework for PHP. Test classes extend `TestCase` and use assertions (`assertEquals`, `assertTrue`, `assertCount`, `expectException`) following the Arrange-Act-Assert pattern."
            },
            {
              title: "Mocking Dependencies",
              description: "Using `$this->createMock(RepositoryInterface::class)` allows testing business logic in isolation without connecting to real databases or third-party APIs."
            }
          ],
          examples: [
            {
              title: "PHPUnit Test Suite Simulation",
              description: "Demonstrating assertion testing of a business logic calculation",
              starterCode: `class MockTestCase {
  assertEquals(expected, actual, msg = '') {
    if (expected !== actual) throw new Error(msg || \`Expected \${expected} but got \${actual}\`);
    return true;
  }
}

class CartTest extends MockTestCase {
  testTotalCalculation() {
    const items = [{ price: 50, qty: 2 }, { price: 20, qty: 1 }];
    const total = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    this.assertEquals(120, total, 'Cart total must equal 120');
    console.log('✓ CartTest::testTotalCalculation passed');
  }
}

const runner = new CartTest();
runner.testTotalCalculation();`,
              solutionCode: `class MockTestCase {
  assertEquals(expected, actual, msg = '') {
    if (expected !== actual) throw new Error(msg || \`Expected \${expected} but got \${actual}\`);
    return true;
  }
}

class CartTest extends MockTestCase {
  testTotalCalculation() {
    const items = [{ price: 50, qty: 2 }, { price: 20, qty: 1 }];
    const total = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
    this.assertEquals(120, total, 'Cart total must equal 120');
    console.log('✓ CartTest::testTotalCalculation passed');
  }
}

const runner = new CartTest();
runner.testTotalCalculation();`,
              expectedOutput: "✓ CartTest::testTotalCalculation passed"
            }
          ],
          exercises: [
            {
              title: "Build a PHP Assertion Library Function",
              description: "Write an assertion function assertArrayContains(array $arr, mixed $item): bool that verifies presence or throws an AssertionError.",
              starterCode: `<?php
declare(strict_types=1);

function assertArrayContains(array $haystack, mixed $needle): bool {
    // Verify presence or throw AssertionError
}`,
              solutionCode: `<?php
declare(strict_types=1);

function assertArrayContains(array $haystack, mixed $needle): bool {
    if (!in_array($needle, $haystack, true)) {
        throw new AssertionError("Item not found in array");
    }
    return true;
}`,
              testCases: `assertArrayContains([1, 2, 3], 2) === true`,
              hints: "Use in_array with strict equality true, throwing an exception if not found."
            }
          ],
          visualizations: [
            {
              type: "flow-animation",
              title: "PHP Continuous Integration & Testing Flow",
              config: JSON.stringify({
                nodes: [
                  { id: "git", label: "Git Push / Pull Request", type: "Terminal", description: "Developer commits code to GitHub repository", x: 80, y: 100 },
                  { id: "stan", label: "PHPStan Level 8 (Static Analysis)", type: "Security", description: "Detects type mismatches and undefined method calls", x: 250, y: 100 },
                  { id: "phpunit", label: "PHPUnit Test Suite", type: "Service", description: "Executes unit, integration, and contract tests", x: 250, y: 220 },
                  { id: "deploy", label: "Production Deployment (Docker)", type: "Cloud", description: "Deploys immutable Docker container image to Kubernetes", x: 420, y: 220 }
                ],
                edges: [
                  { id: "e1", from: "git", to: "stan", label: "triggers CI" },
                  { id: "e2", from: "stan", to: "phpunit", label: "types verified" },
                  { id: "e3", from: "phpunit", to: "deploy", label: "all assertions pass" }
                ],
                steps: [
                  {
                    id: "s1",
                    title: "1. Static Type Checking",
                    description: "PHPStan inspects codebase without running it, proving type safety across all method signatures.",
                    highlightNodes: ["git", "stan"],
                    highlightEdges: ["e1"],
                    code: "vendor/bin/phpstan analyse src --level=8"
                  },
                  {
                    id: "s2",
                    title: "2. Automated Test Execution",
                    description: "PHPUnit executes unit tests with mock database objects in milliseconds.",
                    highlightNodes: ["stan", "phpunit"],
                    highlightEdges: ["e2"],
                    code: "vendor/bin/phpunit --testdox"
                  },
                  {
                    id: "s3",
                    title: "3. Safe Production Deployment",
                    description: "CI pipeline automatically deploys code only when 100% of tests pass.",
                    highlightNodes: ["deploy"],
                    highlightEdges: ["e3"],
                    code: "docker build -t app:v2 . && kubectl rollout restart deployment/app"
                  }
                ]
              })
            }
          ],
          lesson: {
            title: "PHP Engineering Standards & Testing",
            content: `### 🌟 1. Introduction: Enterprise Standards in PHP
Modern PHP development follows standards governed by the **PHP-FIG** (Framework Interoperability Group):
- **PSR-4**: Autoloading standard. Class \`App\\Services\\AuthService\` automatically loads from file \`src/Services/AuthService.php\` without manual \`require\` calls.
- **PSR-7 & PSR-15**: HTTP message standards (Request, Response, Streams, Middleware).
- **PSR-12**: Coding Style Guidelines (spacing, bracket positioning, type declaration formatting).

---

### 🔄 2. Step-by-Step PHPUnit Test Flow (Arrange-Act-Assert)
1. **Arrange**: Set up required mock objects and test inputs.
2. **Act**: Invoke the method under test (\`$total = $cart->calculateTotal()\`).
3. **Assert**: Verify output matches expectations (\`$this->assertEquals(150, $total)\`).

---

### 💻 3. Exact PHPUnit Test Syntax
\`\`\`php
<?php
declare(strict_types=1);

namespace Tests\\Unit;

use PHPUnit\\Framework\\TestCase;
use App\\Services\\DiscountCalculator;

class DiscountCalculatorTest extends TestCase {
    public function testVipDiscountAppliesTwentyPercent(): void {
        // 1. Arrange
        $calculator = new DiscountCalculator();
        
        // 2. Act
        $discountedPrice = $calculator->apply(100.0, 'vip');
        
        // 3. Assert
        $this->assertEquals(80.0, $discountedPrice);
    }
}
\`\`\`

---

### 🎯 4. Real-World Use Cases
- **Automated Regression Testing**: Ensuring billing calculations and VAT tax formulas never break during updates.
- **Continuous Integration (CI/CD)**: Running GitHub Actions checks before merging pull requests.
- **Refactoring Legacy Code**: Adding test coverage before rewriting legacy modules.

---

### ⚠️ 5. Common Gotchas
- ❌ **Testing Against Live Production Databases**: Always mock repository layers or use isolated SQLite in-memory databases (\`:memory:\`) for fast unit tests.
- ❌ **Ignoring Edge Cases**: Always test null inputs, empty arrays, negative numbers, and boundary values.`,
            explanation: "Standards and test suites ensure high quality across production PHP services."
          }
        }
      ]
    }
  ]
};
