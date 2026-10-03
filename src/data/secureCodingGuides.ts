export interface GuideTopic {
  id: string;
  title: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  cwe: string;
  owasp: string;
  languages: string[];
  summary: string;
  whatIsIt: string;
  whyItMatters: string[];
  howItHappens: string;
  vulnerableCode: { language: string; code: string; highlightedLines?: number[] };
  whyIsItVulnerable: string[];
  secureCode: { language: string; code: string; highlightedLines?: number[] };
  principles: string[];
  preventionChecklist: string[];
  detection: { static: string[]; manual: string[]; tools: string[] };
  testing: string;
  remediation: string[];
  commonMistakes: { mistake: string; why: string }[];
  secureAlternatives: { unsafe: string; secure: string }[];
  codeReviewQuestions: string[];
  relatedFindings: string[];
  relatedRules: { id: string; name: string; scanner: string }[];
}

export const SECURE_CODING_CATEGORIES = [
  "Injection", "Cross-Site Scripting", "Authentication", "Authorization / Access Control",
  "Cryptography", "Secrets Management", "Input Validation", "Output Encoding",
  "File Upload Security", "Path Traversal", "Command Injection", "SQL Injection",
  "NoSQL Injection", "LDAP Injection", "XML Security", "Server-Side Request Forgery",
  "Cross-Site Request Forgery", "Security Misconfiguration", "Session Management",
  "API Security", "Deserialization", "Race Conditions", "Memory Safety",
  "Error Handling", "Logging and Monitoring", "Dependency Security",
  "Container Security", "Configuration Security", "Cryptographic Key Management",
  "Secure File Handling"
];

export const guides: GuideTopic[] = [
  {
    id: "sql-injection-python",
    title: "SQL Injection in Python",
    category: "SQL Injection",
    severity: "Critical",
    cwe: "CWE-89",
    owasp: "A03:2021-Injection",
    languages: ["Python"],
    summary: "Improper neutralization of special elements used in an SQL command.",
    whatIsIt: "SQL Injection (SQLi) occurs when untrusted user input is directly concatenated or formatted into a database SQL query without proper sanitization or parameterization. This allows an attacker to manipulate the query's structure, altering its logic to bypass authentication or access unauthorized data.",
    whyItMatters: [
      "Unauthorized access to sensitive database records.",
      "Data exposure, modification, or deletion (e.g., dropping tables).",
      "Account compromise and authentication bypass.",
      "Potential remote command execution on the database server."
    ],
    howItHappens: "Untrusted Input \u2192 Application \u2192 String Concatenation \u2192 Unsafe Processing \u2192 Database Execution \u2192 Security Vulnerability",
    vulnerableCode: {
      language: "python",
      code: `import sqlite3\n\ndef get_user(username):\n    conn = sqlite3.connect('users.db')\n    cursor = conn.cursor()\n    # VULNERABLE: Direct string formatting with untrusted input\n    query = f"SELECT * FROM users WHERE username = '{username}'"\n    cursor.execute(query)\n    return cursor.fetchall()`
    },
    whyIsItVulnerable: [
      "Untrusted input (username) is directly inserted into the query string.",
      "An attacker can input `' OR '1'='1`, changing the query to `SELECT * FROM users WHERE username = '' OR '1'='1'`, returning all users.",
      "Missing input validation and lack of parameterized query usage."
    ],
    secureCode: {
      language: "python",
      code: `import sqlite3\n\ndef get_user(username):\n    conn = sqlite3.connect('users.db')\n    cursor = conn.cursor()\n    # SECURE: Using parameterized queries (?)\n    query = "SELECT * FROM users WHERE username = ?"\n    cursor.execute(query, (username,))\n    return cursor.fetchall()`
    },
    principles: [
      "Never trust user input.",
      "Always use parameterized database queries or prepared statements.",
      "Avoid dynamic SQL string concatenation.",
      "Apply least privilege to the database user account."
    ],
    preventionChecklist: [
      "Use parameterized queries (e.g., `execute(query, params)`).",
      "Avoid SQL string concatenation entirely.",
      "Validate input against strict allowlists.",
      "Use least-privileged database accounts (do not connect as root/admin).",
      "Run static analysis tools in CI/CD pipelines."
    ],
    detection: {
      static: ["AST analysis can detect string formatting passed to execute()"],
      manual: ["Review all cursor.execute() and ORM raw() calls"],
      tools: ["Semgrep", "Bandit", "CodeQL"]
    },
    testing: "Using a dedicated, isolated test environment, attempt to pass SQL metacharacters (e.g., `'`, `\"`, `;`, `--`) in input fields. Verify that the application correctly handles the characters as literal strings rather than executable SQL logic. Do not test against production.",
    remediation: [
      "Identify the vulnerable input source.",
      "Remove the unsafe string formatting or concatenation.",
      "Apply the correct parameterized query approach supported by the database driver.",
      "Update the code and write a unit test to verify.",
      "Run static analysis again.",
      "Verify the finding is resolved."
    ],
    commonMistakes: [
      { mistake: "Sanitizing input manually by escaping quotes.", why: "Manual escaping is error-prone and can often be bypassed by clever encoding or specific database dialect quirks." },
      { mistake: "Using parameterized queries for values, but concatenating table or column names.", why: "Table/column names usually cannot be parameterized. They must be strictly allowlisted." }
    ],
    secureAlternatives: [
      { unsafe: "String Concatenation (e.g., `+` or `f-strings`)", secure: "Parameterized Query (`execute(q, params)`)" },
      { unsafe: "Raw SQL in ORMs (e.g., `Model.objects.raw()`)", secure: "ORM native filtering (`Model.objects.filter()`) " }
    ],
    codeReviewQuestions: [
      "Is user input trusted without validation?",
      "Where does the database query input originate?",
      "Are parameterized queries used exclusively for dynamic values?",
      "Are dynamic table/column names validated against a strict allowlist?"
    ],
    relatedFindings: ["CWE-89", "SQL Injection Rule", "Injection Category"],
    relatedRules: [
      { id: "PY-SQL-001", name: "Python SQLite Injection", scanner: "Semgrep" }
    ]
  },
  {
    id: "os-command-injection",
    title: "OS Command Injection",
    category: "Command Injection",
    severity: "Critical",
    cwe: "CWE-78",
    owasp: "A03:2021-Injection",
    languages: ["Python", "JavaScript", "Java"],
    summary: "Improper neutralization of special elements used in an OS Command.",
    whatIsIt: "Command injection occurs when an application passes unsafe user supplied data (forms, cookies, HTTP headers) to a system shell. In this attack, the attacker-supplied OS commands are usually executed with the privileges of the vulnerable application.",
    whyItMatters: [
      "Full system compromise.",
      "Arbitrary command execution on the host OS.",
      "Unauthorized access to sensitive files and data.",
      "Service disruption."
    ],
    howItHappens: "Untrusted Input \u2192 Application \u2192 Unsafe System API (e.g., os.system) \u2192 System Shell \u2192 Command Execution \u2192 Full Compromise",
    vulnerableCode: {
      language: "python",
      code: `import os\n\ndef ping_host(hostname):\n    # VULNERABLE: Direct string formatting passed to system shell\n    command = f"ping -c 4 {hostname}"\n    os.system(command)`
    },
    whyIsItVulnerable: [
      "The input `hostname` is passed directly to the shell.",
      "An attacker can pass `example.com; cat /etc/passwd` to execute arbitrary commands.",
      "Using shell-enabled execution APIs like `os.system`."
    ],
    secureCode: {
      language: "python",
      code: `import subprocess\n\ndef ping_host(hostname):\n    # SECURE: Using subprocess with an array of arguments and shell=False\n    # Validate input strictly if possible\n    if not hostname.replace('.', '').isalnum():\n        raise ValueError("Invalid hostname")\n        \n    command = ["ping", "-c", "4", hostname]\n    subprocess.run(command, shell=False, check=True)`
    },
    principles: [
      "Never execute OS commands with user input if an alternative API exists.",
      "If OS commands are required, do not use a shell (e.g., `shell=False`).",
      "Pass arguments as a list/array, not as a concatenated string.",
      "Validate input against strict allowlists."
    ],
    preventionChecklist: [
      "Use language-specific APIs instead of OS commands (e.g., `os.mkdir` instead of `mkdir`).",
      "Use safe command execution APIs (e.g., `subprocess.run` with `shell=False`).",
      "Pass arguments as arrays/lists.",
      "Validate input (e.g., regex matching alphanumeric only)."
    ],
    detection: {
      static: ["Detect usage of unsafe functions like `os.system`, `subprocess.Popen(shell=True)`, `eval()`, `exec()`"],
      manual: ["Review all code that interacts with the operating system layer."],
      tools: ["Semgrep", "Bandit"]
    },
    testing: "Test by injecting shell metacharacters (`;`, `|`, `&&`, `$()`, `` ` ``). A vulnerable application will execute the appended commands.",
    remediation: [
      "Identify the OS command execution point.",
      "Refactor to use a native library function if possible.",
      "If an OS command is strictly required, use `subprocess` with a list of arguments.",
      "Ensure `shell=False` is set.",
      "Add strict input validation."
    ],
    commonMistakes: [
      { mistake: "Trying to filter out shell characters (like ';' or '|').", why: "Blacklisting is fundamentally flawed. Attackers find alternate ways to inject commands (e.g., using newlines, different encodings)." }
    ],
    secureAlternatives: [
      { unsafe: "os.system(cmd)", secure: "subprocess.run([cmd, arg], shell=False)" },
      { unsafe: "Shell Command Construction", secure: "Safe APIs / Strict Validation" }
    ],
    codeReviewQuestions: [
      "Is the application executing OS commands?",
      "Is `shell=True` used anywhere?",
      "Can the OS command be replaced by a native library function?"
    ],
    relatedFindings: ["CWE-78"],
    relatedRules: [
      { id: "PY-CMD-001", name: "Python Command Injection", scanner: "Semgrep" }
    ]
  },
  {
    id: "path-traversal-node",
    title: "Path Traversal in Node.js",
    category: "Path Traversal",
    severity: "High",
    cwe: "CWE-22",
    owasp: "A01:2021-Broken Access Control",
    languages: ["JavaScript", "TypeScript"],
    summary: "Improper limitation of a pathname to a restricted directory.",
    whatIsIt: "Path Traversal (or Directory Traversal) allows an attacker to access files and directories that are stored outside the web root folder. By manipulating variables that reference files with `../` sequences, attackers can access arbitrary files.",
    whyItMatters: [
      "Unauthorized access to sensitive system files (e.g., `/etc/passwd`).",
      "Exposure of application source code or configuration files.",
      "Leakage of secrets, API keys, or database credentials."
    ],
    howItHappens: "Untrusted Input (Filename) \u2192 Application \u2192 File API (e.g., fs.readFile) \u2192 File System Access \u2192 Security Vulnerability",
    vulnerableCode: {
      language: "javascript",
      code: `const fs = require('fs');\nconst path = require('path');\nconst express = require('express');\nconst app = express();\n\napp.get('/download', (req, res) => {\n  const filename = req.query.file;\n  // VULNERABLE: Direct concatenation allowing ../ sequences\n  const filePath = path.join(__dirname, 'public', 'downloads', filename);\n  \n  res.download(filePath);\n});`
    },
    whyIsItVulnerable: [
      "The user controls the `filename` parameter.",
      "If an attacker passes `../../../../etc/passwd`, `path.join` resolves it outside the intended directory.",
      "There is no validation that the final path remains within the restricted directory."
    ],
    secureCode: {
      language: "javascript",
      code: `const fs = require('fs');\nconst path = require('path');\nconst express = require('express');\nconst app = express();\n\napp.get('/download', (req, res) => {\n  const filename = req.query.file;\n  \n  // SECURE: Resolve the requested path and check if it starts with the base directory\n  const baseDir = path.join(__dirname, 'public', 'downloads');\n  \n  // path.basename ensures only the filename is used, stripping paths\n  const safeFilename = path.basename(filename);\n  const filePath = path.join(baseDir, safeFilename);\n  \n  // Optional secondary check\n  if (!filePath.startsWith(baseDir)) {\n      return res.status(403).send("Forbidden");\n  }\n  \n  res.download(filePath);\n});`
    },
    principles: [
      "Do not pass user input directly into filesystem APIs.",
      "Use `path.basename()` to extract only the file name.",
      "Verify that the absolute resolved path starts with the expected base directory."
    ],
    preventionChecklist: [
      "Use `path.basename()` on user input.",
      "Resolve absolute paths using `path.resolve()`.",
      "Check if the final path starts with the safe directory.",
      "Use indirect references (e.g., mapping IDs to files instead of filenames)."
    ],
    detection: {
      static: ["Identify user input flowing into `fs.readFile`, `res.download`, `res.sendFile`."],
      manual: ["Check routing that deals with file serving."],
      tools: ["ESLint Security Plugin", "Semgrep"]
    },
    testing: "Submit payloads like `../../../etc/passwd` or `..%2f..%2f..%2fetc/passwd` to file download endpoints and verify a 400/403 response or file not found.",
    remediation: [
      "Identify where user input constructs a file path.",
      "Apply `path.basename()`.",
      "Ensure path prefix validation.",
      "Run static analysis."
    ],
    commonMistakes: [
      { mistake: "Replacing '../' with empty strings.", why: "Attackers can bypass this using '....//' which evaluates to '../' after replacement, or by using URL encoding." }
    ],
    secureAlternatives: [
      { unsafe: "Direct string concatenation with filename", secure: "Indirect reference (ID mapped to DB) or path.basename + startswith verification" }
    ],
    codeReviewQuestions: [
      "Are files served dynamically based on user input?",
      "Is path traversal mitigation in place?"
    ],
    relatedFindings: ["CWE-22"],
    relatedRules: [
      { id: "JS-PT-001", name: "Node.js Path Traversal", scanner: "Semgrep" }
    ]
  },
  {
    id: "xss-react",
    title: "Cross-Site Scripting (XSS) in React",
    category: "Cross-Site Scripting",
    severity: "High",
    cwe: "CWE-79",
    owasp: "A03:2021-Injection",
    languages: ["JavaScript", "TypeScript"],
    summary: "Improper neutralization of input during web page generation.",
    whatIsIt: "Cross-Site Scripting (XSS) allows attackers to inject malicious client-side scripts into web pages viewed by other users. In React, this typically happens when using dangerouslySetInnerHTML or when rendering user input in unsafe contexts.",
    whyItMatters: [
      "Theft of user session cookies or authentication tokens.",
      "Unauthorized actions performed on behalf of the victim.",
      "Defacement of the web application.",
      "Redirection to malicious sites."
    ],
    howItHappens: "Untrusted Input \u2192 Database/API \u2192 React Component \u2192 dangerouslySetInnerHTML \u2192 Script Execution in Browser",
    vulnerableCode: {
      language: "typescript",
      code: `import React from 'react';\n\ninterface Props {\n  userBio: string; // e.g., "<script>alert('XSS')</script>"\n}\n\nexport const UserProfile: React.FC<Props> = ({ userBio }) => {\n  return (\n    <div>\n      <h2>User Biography</h2>\n      {/* VULNERABLE: Direct rendering of HTML from untrusted source */}\n      <div dangerouslySetInnerHTML={{ __html: userBio }} />\n    </div>\n  );\n};`
    },
    whyIsItVulnerable: [
      "React normally escapes variables automatically: `<div>{userBio}</div>` is safe.",
      "However, `dangerouslySetInnerHTML` bypasses this protection.",
      "If `userBio` contains a malicious script, the browser will execute it."
    ],
    secureCode: {
      language: "typescript",
      code: `import React from 'react';\nimport DOMPurify from 'dompurify';\n\ninterface Props {\n  userBio: string;\n}\n\nexport const UserProfile: React.FC<Props> = ({ userBio }) => {\n  // SECURE: Sanitize HTML content before rendering\n  const safeHTML = DOMPurify.sanitize(userBio);\n  \n  return (\n    <div>\n      <h2>User Biography</h2>\n      {/* Alternatively, just use {userBio} if HTML is not intended */}\n      <div dangerouslySetInnerHTML={{ __html: safeHTML }} />\n    </div>\n  );\n};`
    },
    principles: [
      "Let the framework (React, Vue, Angular) handle output encoding.",
      "Avoid `dangerouslySetInnerHTML` unless absolutely necessary.",
      "If rendering HTML is required, use a strict sanitizer like DOMPurify.",
      "Never render user input directly in `<script>`, `<style>`, or attributes like `href`."
    ],
    preventionChecklist: [
      "Avoid rendering raw HTML.",
      "Use DOMPurify when `dangerouslySetInnerHTML` is unavoidable.",
      "Ensure `href` attributes do not accept `javascript:` URIs.",
      "Configure a strict Content Security Policy (CSP)."
    ],
    detection: {
      static: ["Search for `dangerouslySetInnerHTML`.", "Search for `javascript:` URIs in a tags."],
      manual: ["Review all raw HTML rendering logic in frontend frameworks."],
      tools: ["ESLint (eslint-plugin-react)", "Semgrep"]
    },
    testing: "Input `<img src=x onerror=alert(1)>` or `<script>alert(1)</script>` into fields and verify they are displayed as text or safely stripped, rather than executed.",
    remediation: [
      "Identify the unsafe rendering method.",
      "Switch to native text node rendering if HTML is not needed.",
      "Apply DOMPurify to the input before rendering if HTML is required."
    ],
    commonMistakes: [
      { mistake: "Trying to write a custom regex to remove script tags.", why: "Browsers are very forgiving and attackers can use malformed tags, image onerrors, and event handlers to bypass regex filters." }
    ],
    secureAlternatives: [
      { unsafe: "dangerouslySetInnerHTML without sanitization", secure: "DOMPurify sanitization or normal JSX `{variable}`" }
    ],
    codeReviewQuestions: [
      "Is `dangerouslySetInnerHTML` used?",
      "If yes, is the data source 100% trusted or properly sanitized?"
    ],
    relatedFindings: ["CWE-79"],
    relatedRules: [
      { id: "REACT-XSS-001", name: "React dangerouslySetInnerHTML", scanner: "ESLint" }
    ]
  }
];
