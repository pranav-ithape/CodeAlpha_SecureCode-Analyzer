# SecureCode Analyzer

**SecureCode Analyzer** is a comprehensive web-based Secure Coding Review and Static Application Security Testing (SAST) platform. Designed for high-velocity SecOps pipelines, it identifies common security vulnerabilities in source code and provides actionable remediation guidance, mapping directly to CWE and OWASP standards.

![SecureCode Analyzer Logo](./public/logo.png)

## 🚀 Key Features

* **Application & Language Selection** — Perform security reviews across multiple programming languages (Python, JavaScript, TypeScript, Java, PHP).
* **Automated Static Security Analysis** — Leverage integrated scanners (Semgrep, Bandit, and Custom Regex Engines) to deeply analyze code structure and identify vulnerabilities.
* **Security Rules Management** — Browse, search, and enable/disable specific security rules from an internal library of 60+ rules covering SQLi, XSS, SSRF, Deserialization, Path Traversal, and more.
* **Vulnerability Findings & Triage** — View categorized vulnerabilities including severity, CWE mapping, OWASP references, exact file and line number, and a highlighted vulnerable code snippet.
* **Secure Coding Guide** — An extensive, built-in developer knowledge base featuring deep dives into vulnerability categories, vulnerable/secure code comparisons, and remediation checklists.
* **Security Dashboard** — Real-time metrics and dynamic visual charts summarizing your organizational security posture, recent scans, and active vulnerabilities.
* **Recommendations Engine** — Immediate, actionable insights to remediate findings across your codebase.
* **Scan History & Project Management** — Track previous security reviews and organize your codebases into distinct projects.

## 🛠 Technology Stack

### Frontend (Client)
* **Framework:** React 18 with TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS (Dark Mode Native)
* **Routing:** React Router v6
* **Icons:** Google Material Symbols

### Backend (API & Analysis)
* **Runtime:** Node.js
* **Framework:** Express.js with TypeScript
* **Database:** MongoDB (via Mongoose)
* **Security Engines:** Semgrep, Python Bandit, and Custom Regex Engine

## 🏗 Architecture Workflow

```text
Developer Input (UI)
       │ (Uploads Code / Selects Project)
       ▼
React Frontend
       │ (REST API)
       ▼
Node.js + Express Backend
       │
       ├── Queries MongoDB for Active Security Rules
       │
       ▼
Security Analysis Orchestrator
       │
       ├── Semgrep Scanner
       ├── Bandit Scanner
       └── Custom Regex Engine
       │
       ▼
Normalized Security Findings (Stored in MongoDB)
       │
       ▼
Findings Dashboard & Remediation Details
       │ (Links to)
       ▼
Secure Coding Guide (Educational Knowledge Base)
```

## 📂 Project Structure

```text
CodeAlpha_SecureCode-Analyzer/
│
├── backend/                     # Express.js REST API & Scanning Engine
│   ├── scripts/                 # Database seeders (e.g., seed-rules.ts)
│   ├── src/
│   │   ├── analyzers/           # Custom Regex, Semgrep, and Bandit integrations
│   │   ├── controllers/         # Route logic
│   │   ├── models/              # Mongoose Schemas (Finding, Project, Rule, Scan)
│   │   ├── routes/              # Express API Routes
│   │   ├── services/            # Core business logic
│   │   └── app.ts               # Express application setup
│   └── package.json
│
├── src/                         # React Frontend Client
│   ├── components/              # Reusable UI components (Sidebar, Navbar)
│   ├── contexts/                # React Context (Auth)
│   ├── data/                    # Static UI data (Secure Coding Guides)
│   ├── layouts/                 # Page Layout wrappers
│   ├── pages/                   # Main Views (Dashboard, Findings, Security Rules, etc.)
│   ├── utils/                   # API Fetch helpers
│   ├── App.tsx                  # React Router definitions
│   └── main.tsx                 # Entry point
│
├── public/                      # Static assets (Logo, Favicon)
├── package.json                 # Frontend dependencies
├── tailwind.config.js           # Tailwind CSS configuration
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** (Node Package Manager)
* **MongoDB** (Local instance or MongoDB Atlas cluster)
* **Python** (Required for Bandit scanning)
* **Semgrep** (Required for JS/TS scanning)

### 1. Clone the Repository
```bash
git clone https://github.com/pranav-ithape/CodeAlpha_SecureCode-Analyzer.git
cd CodeAlpha_SecureCode-Analyzer
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create a .env file based on the example
cp .env.example .env
# Edit .env and ensure MONGODB_URI is correctly pointed to your database

# Seed the Security Rules library into your database
npm run seed:rules

# Start the backend server (runs on port 5000 by default)
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
# From the root directory of the project
npm install

# Start the Vite development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

## 🛡️ Security Considerations
Since the application handles sensitive source code, the implementation enforces:
* Strict validation of uploaded files and API input.
* Security analysis tools are executed in sandboxed subprocess environments.
* The application never directly `eval()`s or executes uploaded code on the main Node server.
* Sensitive configurations and database credentials are fully externalized via `.env`.

## 👨‍💻 Author

**Pranav Ithape**

* GitHub: [https://github.com/pranav-ithape](https://github.com/pranav-ithape)
* Repository: [CodeAlpha_SecureCode-Analyzer](https://github.com/pranav-ithape/CodeAlpha_SecureCode-Analyzer)

---

**SecureCode Analyzer — Find vulnerabilities. Fix faster. Code securely.**
