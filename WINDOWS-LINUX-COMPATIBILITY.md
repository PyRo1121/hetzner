# Windows to Linux Compatibility Guide

## Overview
When developing on Windows and deploying to Linux servers, there are several compatibility considerations to ensure smooth deployment.

## Line Endings Issue

### Problem
Windows uses CRLF (`\r\n`) line endings while Linux uses LF (`\n`) line endings. This can cause parsing errors when bash scripts or configuration files created on Windows are executed on Linux.

### Symptoms
- "unexpected EOF while looking for matching quote" errors
- Environment variables not being sourced properly
- Bash scripts failing to parse correctly

### Solution
Convert files to Unix line endings before transferring to Linux:

```powershell
# Convert .env file to Unix line endings
(Get-Content .env -Raw) -replace '`r`n', '`n' | Set-Content .env -NoNewline -Encoding UTF8

# Convert shell scripts to Unix line endings
(Get-Content script.sh -Raw) -replace '`r`n', '`n' | Set-Content script.sh -NoNewline -Encoding UTF8
```

## Files That Need Conversion
- `.env` files
- Shell scripts (`.sh`)
- Configuration files
- Any text files that will be parsed by Linux tools

## Automated Solution
Add this to your deployment process:

```bash
# On the Linux server, convert line endings if needed
dos2unix .env
dos2unix *.sh
```

## Verification
Test that files parse correctly on Linux:

```bash
# Test .env file parsing
set -a; source .env; echo "DOMAIN=$DOMAIN"

# Test shell script execution
bash -n script.sh  # Check syntax without execution
```

## Best Practices
1. Always convert line endings when transferring files from Windows to Linux
2. Use UTF-8 encoding for all configuration files
3. Test file parsing on the target Linux environment
4. Consider using Git with proper line ending configuration (`core.autocrlf`)