# SecureCode Analyzer

**SecureCode Analyzer** is a web-based Secure Coding Review and Static Application Security Testing (SAST) platform designed to identify common security vulnerabilities in source code and provide actionable remediation guidance.

## Features

* **Application & Language Selection** — Select the application and programming language for security review.
* **Code Input** — Submit source code by:

  * Pasting code into the integrated editor
  * Uploading a source-code file
* **Static Security Analysis** — Analyze source code for common security weaknesses.
* **Vulnerability Detection** — Identify security issues and classify them by severity.
* **Security Findings** — View vulnerability type, severity, affected file, line number, description, and impact.
* **Remediation Guidance** — Get secure coding recommendations and suggested remediation.
* **Security Dashboard** — View security status, scan information, and vulnerability summaries.
* **Scan History** — Track previous security reviews.
* **Reports** — Document and export security findings.
* **Responsive UI** — Designed for desktop, tablet, and mobile devices.

## Security Analysis

The platform is designed to use static analysis techniques and security rules to identify vulnerabilities such as:

* SQL Injection
* Command Injection
* Hardcoded Credentials
* Weak Cryptography
* Insecure Deserialization
* Sensitive Information Exposure
* Cross-Site Scripting (XSS)

The analysis architecture can integrate tools such as **Semgrep** and **Bandit**, along with custom security rules.

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Lucide React

### Backend

* Node.js
* Express.js
* TypeScript

### Security Analysis

* Semgrep
* Bandit
* Custom Security Rules

### Database

* MongoDB / MongoDB Atlas

## Architecture

```text
User
 │
 ▼
React Frontend
 │
 │ REST API
 ▼
Node.js + Express Backend
 │
 ▼
Security Analysis Engine
 │
 ├── Semgrep
 ├── Bandit
 └── Custom Rules
 │
 ▼
Normalized Security Findings
 │
 ▼
Results & Reports
```

## Application Workflow

```text
Select Application & Language
            ↓
     Paste Code / Upload File
            ↓
         Analyze Code
            ↓
      Static Security Scan
            ↓
     Vulnerability Findings
            ↓
     Security Recommendations
            ↓
        Remediation
            ↓
       Security Report
```

## Project Structure

```text
CodeAlpha_SecureCode-Analyzer/
│
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── README.md
```

## Installation

### Prerequisites

* Node.js
* npm
* Git

### Clone Repository

```bash
git clone https://github.com/pranav-ithape/CodeAlpha_SecureCode-Analyzer.git
cd CodeAlpha_SecureCode-Analyzer
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open the local URL provided by Vite in your browser.

## Security Considerations

Since the application handles source code, the implementation should:

* Validate uploaded files and file sizes.
* Reject unsupported file types.
* Validate API input.
* Never directly execute untrusted uploaded code on the main server.
* Run security-analysis tools in an isolated environment.
* Store credentials and API keys securely using environment variables.

## Future Enhancements

* Additional programming-language support
* OWASP Top 10 and CWE mapping
* Dependency vulnerability scanning
* GitHub repository scanning
* CI/CD integration
* Automated remediation suggestions
* Role-based access control
* Advanced security reports

## Author

**Pranav Ithape**

GitHub: [https://github.com/pranav-ithape](https://github.com/pranav-ithape)

Repository: [https://github.com/pranav-ithape/CodeAlpha_SecureCode-Analyzer](https://github.com/pranav-ithape/CodeAlpha_SecureCode-Analyzer)

---

**SecureCode Analyzer — Find vulnerabilities. Fix faster. Code securely.**
