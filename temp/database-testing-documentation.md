# Database Connectivity Test Agent Documentation

This comprehensive test suite verifies database connection functionality and data accessibility for the archi-site project.

## Overview

The Database Connectivity Test Agent provides multiple testing approaches to verify:

1. **Database Initialization Status** - Whether the database service initializes correctly
2. **Worker Connection Health** - sql.js-httpvfs vs direct sql.js loading
3. **Basic Query Execution** - SQLite version, table listing, etc.
4. **ZCDARCHITECT Table Access** - Core data table accessibility and record counts
5. **Database File Loading** - Chunk processing and file accessibility
6. **Service Layer Functionality** - High-level service methods

## Test Files Created

### 1. `database-connectivity-test.js`
**Purpose**: Comprehensive browser-based test suite  
**Usage**: Import as ES module in browser environment  
**Features**:
- Complete database initialization testing
- Worker type detection (chunked vs direct loading)
- Table structure verification
- Data count validation
- Performance metrics collection

### 2. `database-health-check.js`
**Purpose**: Quick health status verification  
**Usage**: Lightweight check for basic database functionality  
**Features**:
- Fast status verification
- Basic query testing
- Simple pass/fail reporting

### 3. `database-test.html`
**Purpose**: Interactive web interface for database testing  
**Usage**: Open directly in web browser  
**Features**:
- Visual test interface
- Real-time log display
- Custom query execution
- Health check and full test modes
- Database metrics dashboard

### 4. `database-connectivity-test-node.js`
**Purpose**: Command-line environment verification  
**Usage**: `node database-connectivity-test-node.js`  
**Features**:
- File system checks
- Package dependency verification
- Configuration validation
- Environment compatibility testing

## How to Use

### Quick Health Check (Browser)

1. Open `temp/database-test.html` in a web browser
2. Click "Run Health Check"
3. View results in the interface

### Comprehensive Testing (Browser)

1. Open `temp/database-test.html` in a web browser
2. Click "Run Full Test Suite"
3. Review detailed test results and metrics

### Environment Testing (Command Line)

```bash
# Navigate to project directory
cd /path/to/archi-site

# Run environment tests
node temp/database-connectivity-test-node.js

# View results
cat temp/database-environment-test-results.json
```

### Custom Query Testing

1. Open `temp/database-test.html`
2. Enter SQL query in the custom query field
3. Examples:
   - `SELECT COUNT(*) FROM ZCDARCHITECT`
   - `SELECT name FROM sqlite_master WHERE type='table'`
   - `SELECT ZAR_NAME, ZAR_NAMEENG FROM ZCDARCHITECT LIMIT 5`

### Programmatic Usage

```javascript
// Import the test module
import { testDatabaseConnectivity } from './temp/database-connectivity-test.js';

// Run comprehensive tests
const results = await testDatabaseConnectivity();

// Check overall success
if (results.success) {
    console.log('All tests passed!');
} else {
    console.log('Some tests failed:', results.tests.filter(t => t.status === 'FAIL'));
}

// Quick health check
import { checkDatabaseHealth } from './temp/database-health-check.js';
const health = await checkDatabaseHealth();
console.log('Database status:', health.status);
```

## Test Results Interpretation

### Status Types
- **PASS**: Test completed successfully
- **FAIL**: Test failed - action required
- **WARN**: Test passed with warnings - review recommended
- **INFO**: Informational - no action required

### Database Status Values
- **not_initialized**: Database hasn't been set up yet
- **initializing**: Database is currently being initialized
- **ready**: Database is fully operational
- **error**: Database encountered an error

### Instance Types
- **sql.js-httpvfs worker**: Chunked loading via worker (preferred)
- **direct sql.js database**: Full file download (fallback)
- **unknown**: Unable to determine database type

## Common Issues and Solutions

### Issue: Database Initialization Fails
**Symptoms**: Status remains "error" or "not_initialized"  
**Solutions**:
- Check network connectivity
- Verify database files exist in `public/db/`
- Check browser console for detailed error messages
- Try refreshing the page

### Issue: ZCDARCHITECT Table Not Found
**Symptoms**: Table queries fail, record count is 0  
**Solutions**:
- Verify `archimap.sqlite` file is present and not corrupted
- Check file permissions
- Ensure database file is the correct version

### Issue: Worker Initialization Fails
**Symptoms**: Falls back to direct loading, chunked loading errors  
**Solutions**:
- Check that `sqlite.worker.js` and `sql-wasm.wasm` files exist
- Verify CORS headers allow worker loading
- Check network speed (slow connections may timeout)

### Issue: Performance is Slow
**Symptoms**: Long initialization times, query timeouts  
**Solutions**:
- Check network connection speed
- Consider using a CDN for database files
- Enable compression on web server
- Use chunked loading (sql.js-httpvfs)

## File Structure Requirements

```
public/
├── db/
│   ├── archimap.sqlite          # Main database file
│   └── database-info.json       # Database configuration
├── sql-wasm.wasm               # SQLite WebAssembly
└── sqlite.worker.js            # SQLite worker script

src/services/db/
├── ClientDatabaseService.ts     # Core database service
├── ArchitectService.ts         # Architect data service
└── index.ts                    # Service exports
```

## Performance Metrics

The test suite collects various performance metrics:

- **Initialization Time**: Time to initialize database connection
- **Query Response Time**: Time for basic queries to complete
- **File Size**: Database file size and download metrics
- **Success Rate**: Percentage of tests passing
- **Record Counts**: Number of records in key tables

## Integration with Development Workflow

### Pre-deployment Testing
```bash
# Run environment checks
node temp/database-connectivity-test-node.js

# Serve locally and test in browser
npx serve .
# Open: http://localhost:3000/temp/database-test.html
```

### Continuous Integration
The test scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Test Database Connectivity
  run: |
    node temp/database-connectivity-test-node.js
    # Additional browser testing with Playwright/Selenium
```

### Monitoring and Alerts
Use the health check function for production monitoring:

```javascript
// Production health endpoint
app.get('/health/database', async (req, res) => {
    const health = await checkDatabaseHealth();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

## Security Considerations

- Tests read database content but do not modify data
- Custom query interface should be restricted in production
- Database files should be served with appropriate CORS headers
- Monitor for SQL injection in custom queries (though read-only)

## Troubleshooting Checklist

- [ ] Database files exist and are accessible
- [ ] Web server serves static files correctly
- [ ] CORS headers allow cross-origin requests if needed
- [ ] Network connectivity is stable
- [ ] Browser supports WebAssembly and Web Workers
- [ ] JavaScript is enabled in browser
- [ ] No ad blockers interfering with worker scripts

## Support and Maintenance

- Test scripts are self-contained and can be run independently
- Results are saved to JSON files for analysis
- Logs provide detailed information for debugging
- Tests are designed to be non-destructive and safe to run repeatedly

For additional support, check the browser console for detailed error messages and review the generated test result files.