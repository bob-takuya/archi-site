# Network Analysis Guide for Architects Tab Loading Issues

This guide provides comprehensive tools and methods to diagnose and fix network-related issues preventing the architects tab from loading properly.

## 🎯 Quick Start

If you're experiencing architects tab loading issues, start here:

```bash
# 1. Quick network check (fastest)
chmod +x temp/quick_network_check.sh
./temp/quick_network_check.sh

# 2. If issues found, run detailed analysis
node temp/network_diagnostics.js

# 3. For browser-specific issues, run Playwright test
npx playwright test temp/architects_tab_network_test.spec.js
```

## 📋 Available Tools

### 1. Quick Network Check Script
**File:** `temp/quick_network_check.sh`
**Purpose:** Rapid diagnosis of common network issues
**Runtime:** ~30 seconds

```bash
# Basic usage
./temp/quick_network_check.sh

# Custom URL
./temp/quick_network_check.sh http://localhost:5000

# Help
./temp/quick_network_check.sh --help
```

**What it checks:**
- Server accessibility
- Critical endpoint availability
- Database file accessibility
- Basic performance metrics
- File sizes and content types

### 2. Comprehensive Network Diagnostics
**File:** `temp/network_diagnostics.js`
**Purpose:** Detailed Node.js-based network analysis
**Runtime:** ~2-3 minutes

```bash
# Basic usage
node temp/network_diagnostics.js

# Custom base URL
node temp/network_diagnostics.js --base-url http://localhost:5000
```

**What it analyzes:**
- Endpoint accessibility with detailed HTTP analysis
- Database file integrity (JSON validity, SQLite headers, WASM format)
- CORS configuration testing
- Performance metrics and bottleneck identification
- File size analysis and download speeds
- Generates comprehensive JSON report

### 3. Browser Network Monitoring
**File:** `temp/architects_tab_network_test.spec.js`
**Purpose:** Real browser behavior analysis using Playwright
**Runtime:** ~1-2 minutes

```bash
# Run the test
npx playwright test temp/architects_tab_network_test.spec.js

# Run with UI mode for visual debugging
npx playwright test temp/architects_tab_network_test.spec.js --ui

# Run with debugging
npx playwright test temp/architects_tab_network_test.spec.js --debug
```

**What it monitors:**
- Real browser network requests during tab loading
- JavaScript errors and console messages
- Database initialization process
- UI loading states and error displays
- Critical file loading timing
- Generates browser-specific analysis reports

### 4. Interactive Network Analysis Tool
**File:** `temp/network_analysis_tool.html`
**Purpose:** Browser-based interactive monitoring dashboard
**Usage:** Open in browser while testing

```bash
# Serve the tool (if needed)
python3 -m http.server 8080

# Then open: http://localhost:8080/temp/network_analysis_tool.html
```

**Features:**
- Real-time network request monitoring
- Interactive dashboard with multiple tabs
- Database connectivity testing
- Performance analysis
- Recommended fixes generation

## 🔍 Common Issues and Solutions

### Issue 1: Database Config File Not Found (404)
**Symptoms:**
- Error: `archimap.sqlite3.json` returns 404
- Architects tab shows loading spinner indefinitely

**Diagnosis:**
```bash
./temp/quick_network_check.sh
# Look for: "❌ Database config - HTTP 404"
```

**Solutions:**
1. Verify file exists: `ls public/archi-site/db/archimap.sqlite3.json`
2. Check web server configuration to serve `.json` files
3. Ensure correct file permissions: `chmod 644 public/archi-site/db/archimap.sqlite3.json`
4. For development: restart server with `npm start`

### Issue 2: SQLite Database File Too Large/Slow
**Symptoms:**
- Very slow loading times
- Network timeouts
- Browser memory issues

**Diagnosis:**
```bash
node temp/network_diagnostics.js
# Look for performance warnings and file sizes
```

**Solutions:**
1. Enable GZIP compression on web server
2. Consider chunked loading configuration
3. Use CDN for large files in production
4. Check `serverMode` setting in database config

### Issue 3: WebAssembly (WASM) Loading Issues
**Symptoms:**
- Error: `sql-wasm.wasm` fails to load
- Database initialization errors
- Browser compatibility issues

**Diagnosis:**
```bash
npx playwright test temp/architects_tab_network_test.spec.js
# Check console errors for WASM-related messages
```

**Solutions:**
1. Verify WASM file exists and has correct MIME type
2. Configure server to serve `.wasm` files with `application/wasm`
3. Check browser WebAssembly support
4. Test in different browsers (Chrome, Firefox, Safari)

### Issue 4: CORS Policy Violations
**Symptoms:**
- Console errors about CORS policy
- Cross-origin request failures
- Database files accessible directly but fail in app

**Diagnosis:**
```bash
node temp/network_diagnostics.js
# Check CORS configuration section
```

**Solutions:**
1. Add proper CORS headers to web server configuration
2. For development, ensure dev server CORS is configured
3. Check `Access-Control-Allow-Origin` headers
4. Verify cross-origin requests are allowed for database files

### Issue 5: JavaScript Bundle Loading Issues
**Symptoms:**
- Blank page or partial loading
- Console errors about missing modules
- React components not rendering

**Diagnosis:**
```bash
./temp/quick_network_check.sh
# Look for React bundle test results
```

**Solutions:**
1. Check if React build is complete: `npm run build`
2. Verify bundle files exist in `build/static/js/`
3. Clear browser cache and reload
4. Check for JavaScript errors in browser console

## 📊 Understanding Reports

### Network Diagnostics JSON Report
Generated by `network_diagnostics.js`, contains:

```json
{
  "timestamp": "2025-07-12T...",
  "baseUrl": "http://localhost:3000",
  "tests": [
    {
      "name": "Endpoint: /architects",
      "url": "...",
      "passed": true,
      "details": {
        "statusCode": 200,
        "duration": 45,
        "contentLength": "1234"
      }
    }
  ],
  "summary": {
    "total": 15,
    "passed": 13,
    "failed": 2,
    "warnings": 1
  },
  "recommendations": [...]
}
```

### Playwright Test Results
Generated as JSON files with browser-specific data:

```json
{
  "timestamp": "...",
  "summary": {
    "totalRequests": 25,
    "failedRequests": 2,
    "criticalRequests": 4,
    "successRate": "92%"
  },
  "failedRequests": [...],
  "criticalRequests": [...]
}
```

## 🛠️ Advanced Debugging

### Manual Browser Testing
1. Open browser developer tools (F12)
2. Navigate to Network tab
3. Clear network log
4. Navigate to `/architects`
5. Look for:
   - Red (failed) requests
   - Slow requests (>5 seconds)
   - Size anomalies
   - CORS errors in console

### Server-Side Debugging
```bash
# Check if files exist
ls -la public/archi-site/db/

# Test direct file access
curl -I http://localhost:3000/archi-site/db/archimap.sqlite3.json

# Check file sizes
du -h public/archi-site/db/*

# Test server response headers
curl -v http://localhost:3000/archi-site/db/archimap.sqlite3.json
```

### Database-Specific Testing
```bash
# Test SQLite file integrity
file public/archi-site/db/archimap.sqlite3

# Check JSON config syntax
cat public/archi-site/db/archimap.sqlite3.json | jq .

# Test WASM file
file public/archi-site/sql-wasm.wasm
```

## 📈 Performance Optimization

### Recommended File Sizes
- Database config JSON: < 1 KB
- SQLite database: 10-50 MB (varies)
- SQLite worker: 50-200 KB
- WASM module: 500 KB - 2 MB

### Performance Targets
- Initial page load: < 3 seconds
- Database initialization: < 10 seconds  
- Individual requests: < 1 second
- Critical file loading: < 5 seconds

### Optimization Strategies
1. **Enable compression:** GZIP for all text files
2. **Use chunked loading:** For large database files
3. **Implement caching:** Browser and CDN caching
4. **Optimize bundle size:** Code splitting and tree shaking
5. **Use CDN:** For static assets in production

## 🚨 Troubleshooting Checklist

Before diving into detailed analysis, check:

- [ ] Development server is running (`npm start`)
- [ ] Database files exist in correct locations
- [ ] Browser cache is cleared
- [ ] JavaScript is enabled in browser
- [ ] WebAssembly is supported in browser
- [ ] Network connection is stable
- [ ] No browser extensions blocking requests
- [ ] Correct URL is being accessed

## 📞 Getting Help

If issues persist after using these tools:

1. **Share the generated reports** from the diagnostics tools
2. **Include browser console output** (especially errors)
3. **Specify your environment:**
   - Browser version
   - Node.js version
   - Operating system
   - Network conditions

4. **Test in multiple browsers** to isolate browser-specific issues

## 🔄 Continuous Monitoring

For ongoing monitoring, consider:

1. **Regular testing:** Run quick checks after deployments
2. **Performance monitoring:** Track response times over time
3. **Error tracking:** Monitor console errors in production
4. **User feedback:** Collect reports of loading issues

---

**Note:** All tools are located in the `temp/` directory and generate timestamped reports for easy tracking and comparison.