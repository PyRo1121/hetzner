#!/bin/bash

validate_env_file() {
    local env_file="$1"
    local line_num=0
    
    while IFS= read -r line || [[ -n "$line" ]]; do
        ((line_num++))
        
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        
        # Check for proper variable format
        if ! [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
            echo "Line $line_num: Invalid format - $line"
            echo "Expected format: VARIABLE_NAME=value"
            return 1
        fi
        
        # Extract value part after =
        local value="${line#*=}"
        
        # Check if value is properly quoted (starts and ends with quotes)
        if [[ "$value" =~ ^[\"\'].*[\"\']$ ]]; then
            # Value is properly quoted, skip special character check
            continue
        fi
        
        # Check if unquoted value contains special characters that need quoting
        # Exclude quotes from the special character check since we already handle quoted values
        if [[ "$value" =~ [\$\`\\!\#\%\^\&\*\(\)\|\<\>\?\;[:space:]] ]]; then
            echo "Line $line_num: Unquoted special characters detected"
            echo "Please quote the value: ${line%%=*}=\"$value\""
            return 1
        fi
    done < "$env_file"
    
    return 0
}

# Test the function
validate_env_file ".env"
echo "Validation completed successfully!"