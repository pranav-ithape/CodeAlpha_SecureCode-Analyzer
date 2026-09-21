const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'secops-semgrep-'));
const tempFilePath = path.join(tempDir, 'source.js');
const sourceCode = `const { exec } = require("child_process");
const userInput = process.argv[2];
eval(userInput);`;

fs.writeFileSync(tempFilePath, sourceCode, 'utf8');
const rulesPath = path.resolve(__dirname, 'rules/semgrep/javascript-security.yml');

execFile('semgrep', ['--json', '-q', '--config', rulesPath, tempFilePath], (error, stdout, stderr) => {
    console.log("ERROR CODE:", error ? error.code : 0);
    console.log("STDOUT:", stdout ? stdout.substring(0, 500) : null);
    console.log("STDERR:", stderr);
});
