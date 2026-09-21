$apiUrl = "http://localhost:5000/api/scans"

function Test-Api {
    param([string]$name, [string]$lang, [string]$file)
    Write-Host "`n--- $name ---"
    
    $scriptDir = $PSScriptRoot
    if (-not $scriptDir) { $scriptDir = $PWD.Path }
    $absolutePath = Join-Path $scriptDir $file

    if (-not (Test-Path $absolutePath)) {
        Write-Host "File not found: $absolutePath"
        return
    }

    $content = [System.IO.File]::ReadAllText((Resolve-Path $absolutePath).Path)
    $payload = @{
        applicationName = "TestApp"
        language = $lang
        sourceCode = $content
    } | ConvertTo-Json -Depth 5
    
    try {
        Invoke-RestMethod -Uri $apiUrl -Method Post -Body $payload -ContentType "application/json" | ConvertTo-Json -Depth 5
    } catch {
        Write-Host "Error: $($_.Exception.Response.StatusCode) - $($_.ErrorDetails.Message)"
    }
}

Test-Api "Python Vulnerable" "python" "..\test-samples\python\vulnerable.py"
Test-Api "Python Secure" "python" "..\test-samples\python\secure.py"
Test-Api "JavaScript Vulnerable" "javascript" "..\test-samples\javascript\vulnerable.js"
Test-Api "JavaScript Secure" "javascript" "..\test-samples\javascript\secure.js"
Test-Api "TypeScript Vulnerable" "typescript" "..\test-samples\typescript\vulnerable.ts"
Test-Api "TypeScript Secure" "typescript" "..\test-samples\typescript\secure.ts"
Test-Api "Java Vulnerable" "java" "..\test-samples\java\vulnerable.java"
Test-Api "Java Secure" "java" "..\test-samples\java\secure.java"
Test-Api "C Vulnerable" "c" "..\test-samples\c\vulnerable.c"
Test-Api "C Secure" "c" "..\test-samples\c\secure.c"
Test-Api "C++ Vulnerable" "cpp" "..\test-samples\cpp\vulnerable.cpp"
Test-Api "C++ Secure" "cpp" "..\test-samples\cpp\secure.cpp"
Test-Api "PHP Vulnerable" "php" "..\test-samples\php\vulnerable.php"
Test-Api "PHP Secure" "php" "..\test-samples\php\secure.php"

Write-Host "`n--- Test: Unsupported language ---"
$payload = @{
    applicationName = "TestApp"
    language        = "unsupported_lang"
    sourceCode      = "print('hello')"
} | ConvertTo-Json -Depth 5

try {
    Invoke-RestMethod -Uri $apiUrl -Method Post -Body $payload -ContentType "application/json" | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Response.StatusCode) - $($_.ErrorDetails.Message)"
}
