#!/bin/bash

# Quick Network Check for Architects Tab Loading Issues
# This script performs rapid network diagnostics to identify immediate issues

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3000}"
TIMEOUT=10

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️  $message${NC}" ;;
        "HEADER") echo -e "${MAGENTA}${message}${NC}" ;;
    esac
}

print_header() {
    echo
    echo "=================================="
    print_status "HEADER" "$1"
    echo "=================================="
}

# Function to test URL accessibility
test_url() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $description... "
    
    # Use curl to test the URL
    response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" --connect-timeout $TIMEOUT "$url" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        status_code=$(echo $response | cut -d: -f1)
        response_time=$(echo $response | cut -d: -f2)
        
        if [[ $status_code -eq $expected_status ]]; then
            print_status "SUCCESS" "OK (${status_code}, ${response_time}s)"
            return 0
        else
            print_status "ERROR" "HTTP $status_code (${response_time}s)"
            return 1
        fi
    else
        print_status "ERROR" "Connection failed"
        return 1
    fi
}

# Function to test file size and content
test_file_details() {
    local url=$1
    local description=$2
    local min_size=${3:-1024}
    
    echo -n "Analyzing $description... "
    
    # Get file size and content type
    response=$(curl -s -I --connect-timeout $TIMEOUT "$url" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        content_length=$(echo "$response" | grep -i "content-length" | awk '{print $2}' | tr -d '\r')
        content_type=$(echo "$response" | grep -i "content-type" | awk '{print $2}' | tr -d '\r')
        
        if [[ -n "$content_length" && $content_length -gt $min_size ]]; then
            size_kb=$((content_length / 1024))
            print_status "SUCCESS" "OK (${size_kb} KB, $content_type)"
            return 0
        else
            print_status "WARNING" "Small file or no size info ($content_length bytes)"
            return 1
        fi
    else
        print_status "ERROR" "Cannot analyze file"
        return 1
    fi
}

# Function to check if server is running
check_server() {
    print_header "Server Connectivity Check"
    
    if test_url "$BASE_URL" "Base URL"; then
        print_status "SUCCESS" "Server is running and accessible"
        return 0
    else
        print_status "ERROR" "Server is not accessible at $BASE_URL"
        print_status "INFO" "Please ensure the development server is running"
        print_status "INFO" "Try: npm start or yarn start"
        return 1
    fi
}

# Function to test critical endpoints
test_endpoints() {
    print_header "Critical Endpoints Test"
    
    local failed=0
    
    # Test main pages
    test_url "$BASE_URL/architects" "Architects page" || failed=$((failed + 1))
    
    # Test static assets
    test_url "$BASE_URL/static/js/main.js" "React bundle" 404 || {
        # Try alternative patterns
        test_url "$BASE_URL/static/js/bundle.js" "React bundle (alt)" 404 || {
            print_status "WARNING" "React bundle not found at expected locations"
            failed=$((failed + 1))
        }
    }
    
    return $failed
}

# Function to test database files
test_database_files() {
    print_header "Database Files Test"
    
    local failed=0
    
    # Test database configuration
    if test_url "$BASE_URL/archi-site/db/archimap.sqlite3.json" "Database config"; then
        test_file_details "$BASE_URL/archi-site/db/archimap.sqlite3.json" "Config file content" 100
    else
        failed=$((failed + 1))
    fi
    
    # Test SQLite database file
    if test_url "$BASE_URL/archi-site/db/archimap.sqlite3" "SQLite database"; then
        test_file_details "$BASE_URL/archi-site/db/archimap.sqlite3" "Database file" 1048576  # 1MB minimum
    else
        failed=$((failed + 1))
    fi
    
    # Test SQLite worker
    if test_url "$BASE_URL/archi-site/sqlite.worker.js" "SQLite worker"; then
        test_file_details "$BASE_URL/archi-site/sqlite.worker.js" "Worker script" 1024
    else
        failed=$((failed + 1))
    fi
    
    # Test WebAssembly
    if test_url "$BASE_URL/archi-site/sql-wasm.wasm" "WebAssembly module"; then
        test_file_details "$BASE_URL/archi-site/sql-wasm.wasm" "WASM module" 1024
    else
        failed=$((failed + 1))
    fi
    
    return $failed
}

# Function to test performance
test_performance() {
    print_header "Performance Test"
    
    echo -n "Testing response time for main page... "
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --connect-timeout $TIMEOUT "$BASE_URL" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        # Convert to milliseconds for easier reading
        response_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "unknown")
        
        if (( $(echo "$response_time < 1.0" | bc -l 2>/dev/null || echo 0) )); then
            print_status "SUCCESS" "Fast response (${response_ms}ms)"
        elif (( $(echo "$response_time < 3.0" | bc -l 2>/dev/null || echo 0) )); then
            print_status "WARNING" "Moderate response (${response_ms}ms)"
        else
            print_status "ERROR" "Slow response (${response_ms}ms)"
        fi
    else
        print_status "ERROR" "Performance test failed"
    fi
}

# Function to suggest fixes
suggest_fixes() {
    print_header "Diagnostic Summary & Recommendations"
    
    local total_failed=$1
    
    if [[ $total_failed -eq 0 ]]; then
        print_status "SUCCESS" "All tests passed! Network connectivity looks good."
        print_status "INFO" "If you're still experiencing issues, try:"
        echo "  • Clear browser cache and reload"
        echo "  • Check browser console for JavaScript errors"
        echo "  • Verify WebAssembly support in your browser"
    else
        print_status "ERROR" "$total_failed tests failed. Recommendations:"
        
        echo
        echo "🔧 Common Solutions:"
        echo "  1. Ensure development server is running: npm start"
        echo "  2. Check if database files exist in public/archi-site/db/"
        echo "  3. Verify file permissions and web server configuration"
        echo "  4. Test direct file access in browser:"
        echo "     $BASE_URL/archi-site/db/archimap.sqlite3.json"
        echo "  5. Check for CORS issues in browser developer tools"
        echo "  6. Verify WebAssembly support: go to chrome://flags and enable WASM"
        
        echo
        echo "🔍 Advanced Debugging:"
        echo "  • Run: node temp/network_diagnostics.js --base-url $BASE_URL"
        echo "  • Open: temp/network_analysis_tool.html in browser"
        echo "  • Run: npx playwright test temp/architects_tab_network_test.spec.js"
        
        echo
        echo "📁 Check these file locations:"
        echo "  • public/archi-site/db/archimap.sqlite3"
        echo "  • public/archi-site/db/archimap.sqlite3.json"  
        echo "  • public/archi-site/sqlite.worker.js"
        echo "  • public/archi-site/sql-wasm.wasm"
    fi
}

# Main execution
main() {
    echo "🔍 Quick Network Check for Architects Tab"
    echo "Base URL: $BASE_URL"
    echo "Timeout: ${TIMEOUT}s"
    echo
    
    local total_failed=0
    
    # Run all tests
    if ! check_server; then
        print_status "ERROR" "Cannot continue - server not accessible"
        exit 1
    fi
    
    test_endpoints
    total_failed=$((total_failed + $?))
    
    test_database_files  
    total_failed=$((total_failed + $?))
    
    test_performance
    
    suggest_fixes $total_failed
    
    echo
    if [[ $total_failed -eq 0 ]]; then
        print_status "SUCCESS" "All network checks passed!"
        exit 0
    else
        print_status "ERROR" "Network issues detected. See recommendations above."
        exit 1
    fi
}

# Show usage if requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: $0 [BASE_URL]"
    echo "  BASE_URL: Base URL to test (default: http://localhost:3000)"
    echo
    echo "Examples:"
    echo "  $0                                    # Test localhost:3000"
    echo "  $0 http://localhost:5000              # Test custom port"
    echo "  $0 https://myapp.vercel.app           # Test production"
    exit 0
fi

# Check dependencies
if ! command -v curl &> /dev/null; then
    print_status "ERROR" "curl is required but not installed"
    exit 1
fi

# Run main function
main