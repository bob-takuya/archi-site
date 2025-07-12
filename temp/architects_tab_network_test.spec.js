/**
 * Architects Tab Network Monitoring Test
 * 
 * This Playwright test specifically monitors network requests when loading
 * the architects tab to identify connectivity issues, failed requests,
 * and performance problems.
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    baseURL: 'http://localhost:3000',
    timeout: 30000,
    networkTimeout: 10000,
    retries: 3
};

// Network monitoring state
let networkLogs = [];
let failedRequests = [];
let slowRequests = [];
let criticalRequests = [];

// Critical files for architects tab functionality
const CRITICAL_FILES = [
    'archimap.sqlite3.json',
    'archimap.sqlite3',
    'sqlite.worker.js',
    'sql-wasm.wasm'
];

test.describe('Architects Tab Network Analysis', () => {
    test.beforeEach(async ({ page }) => {
        // Reset monitoring arrays
        networkLogs = [];
        failedRequests = [];
        slowRequests = [];
        criticalRequests = [];

        // Set up comprehensive network monitoring
        await setupNetworkMonitoring(page);
        
        // Set viewport for consistent testing
        await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('Monitor network requests during architects tab loading', async ({ page }) => {
        console.log('🔍 Starting architects tab network monitoring...');
        
        // Navigate to the main page first
        await page.goto('/', { waitUntil: 'networkidle' });
        
        // Wait a moment for initial page load
        await page.waitForTimeout(1000);
        
        console.log('📍 Navigating to architects tab...');
        
        // Navigate to architects page and monitor
        const navigationPromise = page.goto('/architects', { 
            waitUntil: 'networkidle',
            timeout: TEST_CONFIG.timeout 
        });
        
        try {
            await navigationPromise;
            console.log('✅ Navigation completed');
        } catch (error) {
            console.error('❌ Navigation failed:', error.message);
            
            // Continue with analysis even if navigation fails
            await page.waitForTimeout(5000);
        }
        
        // Wait for potential lazy-loaded content
        await page.waitForTimeout(3000);
        
        // Analyze the results
        await analyzeNetworkResults(page);
        
        // Generate and save comprehensive report
        await generateNetworkReport();
        
        // Perform assertions based on findings
        await performNetworkAssertions();
    });

    test('Test database initialization specifically', async ({ page }) => {
        console.log('🔍 Testing database initialization process...');
        
        // Monitor database-specific requests
        const dbRequests = [];
        
        page.on('request', request => {
            const url = request.url();
            if (CRITICAL_FILES.some(file => url.includes(file))) {
                dbRequests.push({
                    url,
                    method: request.method(),
                    timestamp: Date.now(),
                    resourceType: request.resourceType()
                });
                console.log(`📡 DB Request: ${request.method()} ${url}`);
            }
        });
        
        page.on('response', response => {
            const url = response.url();
            if (CRITICAL_FILES.some(file => url.includes(file))) {
                const request = dbRequests.find(req => req.url === url);
                if (request) {
                    request.status = response.status();
                    request.statusText = response.statusText();
                    request.duration = Date.now() - request.timestamp;
                    request.size = response.headers()['content-length'] || 'unknown';
                    
                    console.log(`📡 DB Response: ${response.status()} ${url} (${request.duration}ms)`);
                }
            }
        });
        
        // Navigate to architects tab
        await page.goto('/architects', { waitUntil: 'networkidle' });
        
        // Wait for database initialization
        await page.waitForTimeout(5000);
        
        // Evaluate database status in browser context
        const dbStatus = await page.evaluate(async () => {
            try {
                // Try to access the database service
                if (window.ArchitectService) {
                    return { available: true, type: 'ArchitectService' };
                }
                
                // Check for SQL.js or sql.js-httpvfs
                if (window.SQL) {
                    return { available: true, type: 'SQL.js' };
                }
                
                // Check for any database-related errors in console
                const errors = [];
                const originalError = console.error;
                console.error = (...args) => {
                    errors.push(args.join(' '));
                    originalError.apply(console, args);
                };
                
                return { 
                    available: false, 
                    errors: errors.filter(err => 
                        err.includes('database') || 
                        err.includes('sqlite') || 
                        err.includes('sql.js')
                    )
                };
            } catch (error) {
                return { available: false, error: error.message };
            }
        });
        
        console.log('💾 Database Status:', JSON.stringify(dbStatus, null, 2));
        console.log('📊 Database Requests:', JSON.stringify(dbRequests, null, 2));
        
        // Save database-specific report
        await saveDatabaseReport(dbRequests, dbStatus);
        
        // Assertions for database functionality
        expect(dbRequests.length).toBeGreaterThan(0, 'Should make database-related requests');
        
        const successfulDbRequests = dbRequests.filter(req => req.status >= 200 && req.status < 400);
        expect(successfulDbRequests.length).toBeGreaterThan(0, 'Should have successful database requests');
    });

    test('Test for specific error scenarios', async ({ page }) => {
        console.log('🔍 Testing specific error scenarios...');
        
        const errors = [];
        const consoleMessages = [];
        
        // Capture console messages and errors
        page.on('console', msg => {
            consoleMessages.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: Date.now()
            });
            
            if (msg.type() === 'error') {
                console.log(`🔴 Console Error: ${msg.text()}`);
            }
        });
        
        page.on('pageerror', error => {
            errors.push({
                message: error.message,
                name: error.name,
                stack: error.stack,
                timestamp: Date.now()
            });
            console.log(`🔴 Page Error: ${error.message}`);
        });
        
        // Test navigation with error capture
        try {
            await page.goto('/architects', { 
                waitUntil: 'networkidle',
                timeout: TEST_CONFIG.timeout 
            });
        } catch (error) {
            console.log(`⚠️ Navigation error captured: ${error.message}`);
        }
        
        // Wait for potential errors to surface
        await page.waitForTimeout(5000);
        
        // Check for loading indicators or error messages in the UI
        const loadingState = await page.evaluate(() => {
            // Check for loading spinners
            const spinners = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner');
            
            // Check for error messages
            const errorMessages = document.querySelectorAll('[data-testid*="error"], .error, .alert-error');
            
            // Check for empty states
            const emptyStates = document.querySelectorAll('[data-testid*="empty"], .empty-state');
            
            return {
                hasSpinners: spinners.length > 0,
                hasErrors: errorMessages.length > 0,
                hasEmptyStates: emptyStates.length > 0,
                spinnerCount: spinners.length,
                errorCount: errorMessages.length,
                emptyStateCount: emptyStates.length
            };
        });
        
        console.log('🎭 UI State:', JSON.stringify(loadingState, null, 2));
        
        // Save error analysis report
        await saveErrorReport(errors, consoleMessages, loadingState);
        
        // If we have persistent loading states, that indicates a problem
        if (loadingState.hasSpinners) {
            console.log('⚠️ Found persistent loading indicators - possible stuck state');
        }
        
        if (loadingState.hasErrors) {
            console.log('❌ Found error messages in UI');
        }
    });
});

async function setupNetworkMonitoring(page) {
    console.log('🔧 Setting up network monitoring...');
    
    // Monitor all requests
    page.on('request', request => {
        const startTime = Date.now();
        const url = request.url();
        
        const logEntry = {
            id: `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`,
            url,
            method: request.method(),
            resourceType: request.resourceType(),
            timestamp: startTime,
            headers: request.headers(),
            isCritical: CRITICAL_FILES.some(file => url.includes(file))
        };
        
        networkLogs.push(logEntry);
        
        if (logEntry.isCritical) {
            console.log(`🔑 Critical request: ${request.method()} ${url}`);
            criticalRequests.push(logEntry);
        }
    });
    
    // Monitor responses
    page.on('response', response => {
        const url = response.url();
        const logEntry = networkLogs.find(log => log.url === url);
        
        if (logEntry) {
            logEntry.status = response.status();
            logEntry.statusText = response.statusText();
            logEntry.responseHeaders = response.headers();
            logEntry.duration = Date.now() - logEntry.timestamp;
            logEntry.size = response.headers()['content-length'] || 'unknown';
            
            // Check for failures
            if (response.status() >= 400) {
                console.log(`❌ Failed request: ${response.status()} ${url}`);
                failedRequests.push(logEntry);
            }
            
            // Check for slow requests
            if (logEntry.duration > 5000) {
                console.log(`🐌 Slow request: ${url} (${logEntry.duration}ms)`);
                slowRequests.push(logEntry);
            }
            
            if (logEntry.isCritical) {
                console.log(`🔑 Critical response: ${response.status()} ${url} (${logEntry.duration}ms)`);
            }
        }
    });
    
    // Monitor failed requests
    page.on('requestfailed', request => {
        const url = request.url();
        const logEntry = networkLogs.find(log => log.url === url);
        
        if (logEntry) {
            logEntry.failed = true;
            logEntry.failureText = request.failure()?.errorText || 'Unknown error';
            logEntry.duration = Date.now() - logEntry.timestamp;
            
            console.log(`💥 Request failed: ${url} - ${logEntry.failureText}`);
            failedRequests.push(logEntry);
        }
    });
}

async function analyzeNetworkResults(page) {
    console.log('\n📊 Analyzing network results...');
    
    const totalRequests = networkLogs.length;
    const failedCount = failedRequests.length;
    const slowCount = slowRequests.length;
    const criticalCount = criticalRequests.length;
    
    console.log(`📈 Network Statistics:`);
    console.log(`   Total requests: ${totalRequests}`);
    console.log(`   Failed requests: ${failedCount}`);
    console.log(`   Slow requests (>5s): ${slowCount}`);
    console.log(`   Critical requests: ${criticalCount}`);
    
    if (failedRequests.length > 0) {
        console.log('\n❌ Failed Requests:');
        failedRequests.forEach(req => {
            console.log(`   ${req.method} ${req.url} - ${req.status || 'FAILED'} ${req.statusText || req.failureText || ''}`);
        });
    }
    
    if (slowRequests.length > 0) {
        console.log('\n🐌 Slow Requests:');
        slowRequests.forEach(req => {
            console.log(`   ${req.url} - ${req.duration}ms`);
        });
    }
    
    // Check for missing critical files
    const missingCriticalFiles = CRITICAL_FILES.filter(file => 
        !criticalRequests.some(req => req.url.includes(file))
    );
    
    if (missingCriticalFiles.length > 0) {
        console.log('\n⚠️ Missing Critical Files:');
        missingCriticalFiles.forEach(file => {
            console.log(`   ${file} - No request detected`);
        });
    }
    
    // Analyze response times
    const successfulRequests = networkLogs.filter(req => req.status >= 200 && req.status < 400);
    if (successfulRequests.length > 0) {
        const avgResponseTime = successfulRequests.reduce((sum, req) => sum + req.duration, 0) / successfulRequests.length;
        console.log(`\n⚡ Average response time: ${avgResponseTime.toFixed(2)}ms`);
    }
}

async function generateNetworkReport() {
    const timestamp = new Date().toISOString();
    const reportData = {
        timestamp,
        summary: {
            totalRequests: networkLogs.length,
            failedRequests: failedRequests.length,
            slowRequests: slowRequests.length,
            criticalRequests: criticalRequests.length,
            successRate: networkLogs.length > 0 ? 
                ((networkLogs.length - failedRequests.length) / networkLogs.length * 100).toFixed(2) + '%' : 
                'N/A'
        },
        allRequests: networkLogs,
        failedRequests,
        slowRequests,
        criticalRequests,
        missingCriticalFiles: CRITICAL_FILES.filter(file => 
            !criticalRequests.some(req => req.url.includes(file))
        )
    };
    
    const reportPath = path.join(__dirname, `architects_network_report_${Date.now()}.json`);
    
    try {
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`📄 Network report saved: ${reportPath}`);
    } catch (error) {
        console.error('❌ Failed to save network report:', error.message);
    }
    
    return reportData;
}

async function saveDatabaseReport(dbRequests, dbStatus) {
    const reportData = {
        timestamp: new Date().toISOString(),
        databaseStatus: dbStatus,
        databaseRequests: dbRequests,
        analysis: {
            totalDbRequests: dbRequests.length,
            successfulDbRequests: dbRequests.filter(req => req.status >= 200 && req.status < 400).length,
            failedDbRequests: dbRequests.filter(req => req.status >= 400 || req.status === undefined).length,
            averageDbResponseTime: dbRequests.length > 0 ? 
                dbRequests.reduce((sum, req) => sum + (req.duration || 0), 0) / dbRequests.length : 
                0
        }
    };
    
    const reportPath = path.join(__dirname, `database_analysis_report_${Date.now()}.json`);
    
    try {
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`💾 Database report saved: ${reportPath}`);
    } catch (error) {
        console.error('❌ Failed to save database report:', error.message);
    }
}

async function saveErrorReport(errors, consoleMessages, loadingState) {
    const reportData = {
        timestamp: new Date().toISOString(),
        pageErrors: errors,
        consoleMessages: consoleMessages,
        uiState: loadingState,
        analysis: {
            totalErrors: errors.length,
            totalConsoleMessages: consoleMessages.length,
            errorMessages: consoleMessages.filter(msg => msg.type === 'error').length,
            warningMessages: consoleMessages.filter(msg => msg.type === 'warning').length
        }
    };
    
    const reportPath = path.join(__dirname, `error_analysis_report_${Date.now()}.json`);
    
    try {
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`🚨 Error report saved: ${reportPath}`);
    } catch (error) {
        console.error('❌ Failed to save error report:', error.message);
    }
}

async function performNetworkAssertions() {
    console.log('\n✅ Performing network assertions...');
    
    // Critical assertions that should not fail
    try {
        // Should have made some network requests
        expect(networkLogs.length).toBeGreaterThan(0, 'Should make network requests when loading architects tab');
        
        // Critical files should be requested
        const criticalFileRequests = CRITICAL_FILES.filter(file => 
            criticalRequests.some(req => req.url.includes(file))
        );
        
        if (criticalFileRequests.length === 0) {
            console.log('⚠️ Warning: No critical database files were requested');
        }
        
        // Should not have too many failed requests
        const failureRate = networkLogs.length > 0 ? (failedRequests.length / networkLogs.length) * 100 : 0;
        
        if (failureRate > 50) {
            console.log(`❌ High failure rate detected: ${failureRate.toFixed(1)}%`);
        } else if (failureRate > 20) {
            console.log(`⚠️ Moderate failure rate: ${failureRate.toFixed(1)}%`);
        } else {
            console.log(`✅ Low failure rate: ${failureRate.toFixed(1)}%`);
        }
        
        // Check for specific critical file failures
        const failedCriticalFiles = failedRequests.filter(req => req.isCritical);
        if (failedCriticalFiles.length > 0) {
            console.log('❌ Critical file loading failures detected:');
            failedCriticalFiles.forEach(req => {
                console.log(`   ${req.url} - ${req.status || 'FAILED'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Assertion failed:', error.message);
        throw error;
    }
}

// Export for use in other tests
module.exports = {
    setupNetworkMonitoring,
    analyzeNetworkResults,
    generateNetworkReport,
    CRITICAL_FILES,
    TEST_CONFIG
};