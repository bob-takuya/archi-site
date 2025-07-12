#!/usr/bin/env node

/**
 * Network Diagnostics Script for Architects Tab Loading Issues
 * 
 * This script performs comprehensive network analysis to identify
 * connectivity issues preventing the architects tab from loading.
 * 
 * Usage: node network_diagnostics.js [--base-url http://localhost:3000]
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const DEFAULT_BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

// Parse command line arguments
const args = process.argv.slice(2);
const baseUrlIndex = args.indexOf('--base-url');
const BASE_URL = baseUrlIndex !== -1 && args[baseUrlIndex + 1] 
    ? args[baseUrlIndex + 1] 
    : DEFAULT_BASE_URL;

// ANSI colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Test results storage
const testResults = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    tests: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
    }
};

// Helper functions
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colorMap = {
        info: colors.cyan,
        success: colors.green,
        error: colors.red,
        warning: colors.yellow,
        header: colors.magenta + colors.bright
    };
    
    const color = colorMap[type] || colors.reset;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function logHeader(message) {
    console.log('\n' + '='.repeat(60));
    log(message, 'header');
    console.log('='.repeat(60));
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const lib = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            timeout: TIMEOUT,
            headers: {
                'User-Agent': 'Network-Diagnostics/1.0',
                ...options.headers
            }
        };
        
        const startTime = Date.now();
        
        const req = lib.request(requestOptions, (res) => {
            const duration = Date.now() - startTime;
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                    headers: res.headers,
                    data: data,
                    duration: duration,
                    url: url
                });
            });
        });
        
        req.on('error', (error) => {
            reject({
                error: error.message,
                code: error.code,
                url: url,
                duration: Date.now() - startTime
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject({
                error: 'Request timeout',
                code: 'TIMEOUT',
                url: url,
                duration: TIMEOUT
            });
        });
        
        req.end();
    });
}

// Test functions
async function testEndpointAccessibility() {
    logHeader('Testing Endpoint Accessibility');
    
    const endpoints = [
        '/',
        '/architects',
        '/archi-site/db/archimap.sqlite3.json',
        '/archi-site/db/archimap.sqlite3',
        '/archi-site/sqlite.worker.js',
        '/archi-site/sql-wasm.wasm',
        '/static/js/main.js', // React bundle
        '/static/css/main.css' // CSS bundle
    ];
    
    for (const endpoint of endpoints) {
        const url = BASE_URL + endpoint;
        
        try {
            log(`Testing: ${endpoint}`, 'info');
            const result = await makeRequest(url, { method: 'HEAD' });
            
            const test = {
                name: `Endpoint: ${endpoint}`,
                url: url,
                passed: result.statusCode >= 200 && result.statusCode < 400,
                details: {
                    statusCode: result.statusCode,
                    statusMessage: result.statusMessage,
                    duration: result.duration,
                    contentLength: result.headers['content-length'] || 'unknown',
                    contentType: result.headers['content-type'] || 'unknown'
                }
            };
            
            if (test.passed) {
                log(`✅ ${endpoint} - ${result.statusCode} (${result.duration}ms)`, 'success');
                if (result.headers['content-length']) {
                    const sizeKB = (parseInt(result.headers['content-length']) / 1024).toFixed(1);
                    log(`   Size: ${sizeKB} KB`, 'info');
                }
            } else {
                log(`❌ ${endpoint} - ${result.statusCode} ${result.statusMessage}`, 'error');
                test.error = `HTTP ${result.statusCode}: ${result.statusMessage}`;
            }
            
            testResults.tests.push(test);
            testResults.summary.total++;
            if (test.passed) testResults.summary.passed++;
            else testResults.summary.failed++;
            
        } catch (error) {
            log(`❌ ${endpoint} - ${error.error} (${error.code})`, 'error');
            
            const test = {
                name: `Endpoint: ${endpoint}`,
                url: url,
                passed: false,
                error: `${error.error} (${error.code})`,
                details: {
                    duration: error.duration
                }
            };
            
            testResults.tests.push(test);
            testResults.summary.total++;
            testResults.summary.failed++;
        }
    }
}

async function testDatabaseFiles() {
    logHeader('Testing Database File Integrity');
    
    const databaseTests = [
        {
            name: 'Database Config JSON',
            endpoint: '/archi-site/db/archimap.sqlite3.json',
            checks: ['json_valid', 'has_url', 'has_serverMode']
        },
        {
            name: 'SQLite Database File',
            endpoint: '/archi-site/db/archimap.sqlite3',
            checks: ['size_reasonable', 'sqlite_headers']
        },
        {
            name: 'SQLite Worker Script',
            endpoint: '/archi-site/sqlite.worker.js',
            checks: ['is_javascript', 'size_reasonable']
        },
        {
            name: 'WebAssembly Module',
            endpoint: '/archi-site/sql-wasm.wasm',
            checks: ['is_wasm', 'size_reasonable']
        }
    ];
    
    for (const dbTest of databaseTests) {
        const url = BASE_URL + dbTest.endpoint;
        
        try {
            log(`Testing: ${dbTest.name}`, 'info');
            const result = await makeRequest(url);
            
            const test = {
                name: dbTest.name,
                url: url,
                passed: result.statusCode === 200,
                details: {
                    statusCode: result.statusCode,
                    duration: result.duration,
                    size: result.data.length,
                    contentType: result.headers['content-type'] || 'unknown'
                },
                checks: []
            };
            
            if (result.statusCode === 200) {
                // Perform specific checks
                for (const check of dbTest.checks) {
                    const checkResult = performFileCheck(check, result);
                    test.checks.push(checkResult);
                    
                    if (checkResult.passed) {
                        log(`   ✅ ${checkResult.name}`, 'success');
                    } else {
                        log(`   ❌ ${checkResult.name}: ${checkResult.error}`, 'error');
                        test.passed = false;
                    }
                }
                
                log(`✅ ${dbTest.name} - OK (${(result.data.length / 1024).toFixed(1)} KB)`, 'success');
            } else {
                log(`❌ ${dbTest.name} - ${result.statusCode}`, 'error');
                test.error = `HTTP ${result.statusCode}`;
            }
            
            testResults.tests.push(test);
            testResults.summary.total++;
            if (test.passed) testResults.summary.passed++;
            else testResults.summary.failed++;
            
        } catch (error) {
            log(`❌ ${dbTest.name} - ${error.error}`, 'error');
            
            const test = {
                name: dbTest.name,
                url: url,
                passed: false,
                error: error.error,
                details: {
                    duration: error.duration
                }
            };
            
            testResults.tests.push(test);
            testResults.summary.total++;
            testResults.summary.failed++;
        }
    }
}

function performFileCheck(checkType, result) {
    const { data, headers } = result;
    
    switch (checkType) {
        case 'json_valid':
            try {
                JSON.parse(data);
                return { name: 'Valid JSON', passed: true };
            } catch (e) {
                return { name: 'Valid JSON', passed: false, error: 'Invalid JSON format' };
            }
            
        case 'has_url':
            try {
                const json = JSON.parse(data);
                const hasUrl = json.url || (json[0] && json[0].config && json[0].config.url);
                return { 
                    name: 'Has database URL', 
                    passed: !!hasUrl,
                    error: hasUrl ? null : 'No database URL found in config'
                };
            } catch (e) {
                return { name: 'Has database URL', passed: false, error: 'Cannot parse JSON' };
            }
            
        case 'has_serverMode':
            try {
                const json = JSON.parse(data);
                const hasMode = json.serverMode || (json[0] && json[0].config && json[0].config.serverMode);
                return { 
                    name: 'Has server mode', 
                    passed: !!hasMode,
                    error: hasMode ? null : 'No serverMode found in config'
                };
            } catch (e) {
                return { name: 'Has server mode', passed: false, error: 'Cannot parse JSON' };
            }
            
        case 'size_reasonable':
            const minSize = checkType === 'sqlite_database' ? 1024 * 1024 : 1024; // 1MB for DB, 1KB for others
            return {
                name: 'Reasonable file size',
                passed: data.length >= minSize,
                error: data.length < minSize ? `File too small: ${data.length} bytes` : null
            };
            
        case 'sqlite_headers':
            const sqliteHeader = data.slice(0, 16);
            const isSqlite = sqliteHeader.startsWith('SQLite format 3');
            return {
                name: 'SQLite file format',
                passed: isSqlite,
                error: isSqlite ? null : 'Invalid SQLite file header'
            };
            
        case 'is_javascript':
            const contentType = headers['content-type'] || '';
            const isJs = contentType.includes('javascript') || data.includes('function') || data.includes('var ');
            return {
                name: 'JavaScript content',
                passed: isJs,
                error: isJs ? null : 'Does not appear to be JavaScript'
            };
            
        case 'is_wasm':
            const wasmHeader = data.slice(0, 4);
            const isWasm = wasmHeader[0] === 0x00 && wasmHeader[1] === 0x61 && 
                          wasmHeader[2] === 0x73 && wasmHeader[3] === 0x6d;
            return {
                name: 'WebAssembly format',
                passed: isWasm,
                error: isWasm ? null : 'Invalid WebAssembly file header'
            };
            
        default:
            return { name: checkType, passed: false, error: 'Unknown check type' };
    }
}

async function testCORSConfiguration() {
    logHeader('Testing CORS Configuration');
    
    const corsTests = [
        '/archi-site/db/archimap.sqlite3',
        '/archi-site/sqlite.worker.js',
        '/archi-site/sql-wasm.wasm'
    ];
    
    for (const endpoint of corsTests) {
        const url = BASE_URL + endpoint;
        
        try {
            log(`Testing CORS: ${endpoint}`, 'info');
            const result = await makeRequest(url, {
                headers: {
                    'Origin': 'http://localhost:3000',
                    'Access-Control-Request-Method': 'GET'
                }
            });
            
            const corsHeaders = {
                'access-control-allow-origin': result.headers['access-control-allow-origin'],
                'access-control-allow-methods': result.headers['access-control-allow-methods'],
                'access-control-allow-headers': result.headers['access-control-allow-headers']
            };
            
            const test = {
                name: `CORS: ${endpoint}`,
                url: url,
                passed: result.statusCode === 200,
                details: {
                    statusCode: result.statusCode,
                    corsHeaders: corsHeaders,
                    duration: result.duration
                }
            };
            
            if (corsHeaders['access-control-allow-origin']) {
                log(`✅ CORS enabled for ${endpoint}`, 'success');
            } else {
                log(`⚠️  No CORS headers for ${endpoint}`, 'warning');
                testResults.summary.warnings++;
            }
            
            testResults.tests.push(test);
            testResults.summary.total++;
            if (test.passed) testResults.summary.passed++;
            else testResults.summary.failed++;
            
        } catch (error) {
            log(`❌ CORS test failed for ${endpoint}: ${error.error}`, 'error');
            
            const test = {
                name: `CORS: ${endpoint}`,
                url: url,
                passed: false,
                error: error.error
            };
            
            testResults.tests.push(test);
            testResults.summary.total++;
            testResults.summary.failed++;
        }
    }
}

async function testPerformance() {
    logHeader('Testing Performance Metrics');
    
    const performanceTests = [
        { name: 'Small file (favicon)', endpoint: '/favicon.ico' },
        { name: 'Medium file (worker)', endpoint: '/archi-site/sqlite.worker.js' },
        { name: 'Large file (database)', endpoint: '/archi-site/db/archimap.sqlite3' }
    ];
    
    for (const perfTest of performanceTests) {
        const url = BASE_URL + perfTest.endpoint;
        
        try {
            log(`Performance test: ${perfTest.name}`, 'info');
            const result = await makeRequest(url);
            
            const sizeKB = result.data.length / 1024;
            const speedKBps = sizeKB / (result.duration / 1000);
            
            const test = {
                name: `Performance: ${perfTest.name}`,
                url: url,
                passed: result.statusCode === 200 && result.duration < 30000, // 30 second timeout
                details: {
                    statusCode: result.statusCode,
                    duration: result.duration,
                    sizeKB: sizeKB.toFixed(1),
                    speedKBps: speedKBps.toFixed(1)
                }
            };
            
            if (test.passed) {
                log(`✅ ${perfTest.name} - ${result.duration}ms (${speedKBps.toFixed(1)} KB/s)`, 'success');
            } else {
                log(`❌ ${perfTest.name} - Too slow or failed`, 'error');
            }
            
            // Performance thresholds
            if (result.duration > 10000) {
                log(`⚠️  Slow response time: ${result.duration}ms`, 'warning');
                testResults.summary.warnings++;
            }
            
            testResults.tests.push(test);
            testResults.summary.total++;
            if (test.passed) testResults.summary.passed++;
            else testResults.summary.failed++;
            
        } catch (error) {
            log(`❌ Performance test failed for ${perfTest.name}: ${error.error}`, 'error');
            
            const test = {
                name: `Performance: ${perfTest.name}`,
                url: url,
                passed: false,
                error: error.error,
                details: {
                    duration: error.duration
                }
            };
            
            testResults.tests.push(test);
            testResults.summary.total++;
            testResults.summary.failed++;
        }
    }
}

function generateRecommendations() {
    logHeader('Generating Recommendations');
    
    const recommendations = [];
    const failedTests = testResults.tests.filter(test => !test.passed);
    
    // Analyze failed tests and generate specific recommendations
    if (failedTests.some(test => test.name.includes('Database Config'))) {
        recommendations.push({
            priority: 'HIGH',
            issue: 'Database configuration file not accessible',
            solution: 'Ensure /archi-site/db/archimap.sqlite3.json is properly served and contains valid configuration',
            commands: [
                'Check if the file exists in the public directory',
                'Verify JSON syntax is valid',
                'Ensure web server is configured to serve .json files'
            ]
        });
    }
    
    if (failedTests.some(test => test.name.includes('SQLite Database File'))) {
        recommendations.push({
            priority: 'HIGH',
            issue: 'SQLite database file not accessible',
            solution: 'Ensure the database file is properly placed and served',
            commands: [
                'Check if archimap.sqlite3 exists in /archi-site/db/',
                'Verify file permissions and size',
                'Test direct URL access in browser'
            ]
        });
    }
    
    if (failedTests.some(test => test.name.includes('WebAssembly'))) {
        recommendations.push({
            priority: 'MEDIUM',
            issue: 'WebAssembly module not loading',
            solution: 'Ensure WASM files are served with correct MIME type',
            commands: [
                'Configure server to serve .wasm files with application/wasm MIME type',
                'Check browser WebAssembly support',
                'Verify WASM file integrity'
            ]
        });
    }
    
    if (failedTests.some(test => test.name.includes('CORS'))) {
        recommendations.push({
            priority: 'MEDIUM',
            issue: 'CORS headers missing or incorrect',
            solution: 'Configure proper CORS headers for database files',
            commands: [
                'Add Access-Control-Allow-Origin headers',
                'Configure server to allow cross-origin requests for database files',
                'Test with browser developer tools'
            ]
        });
    }
    
    if (testResults.summary.warnings > 0) {
        recommendations.push({
            priority: 'LOW',
            issue: 'Performance issues detected',
            solution: 'Optimize file serving and consider compression',
            commands: [
                'Enable GZIP compression for static files',
                'Use CDN for large database files',
                'Implement chunked loading for better performance'
            ]
        });
    }
    
    if (recommendations.length === 0) {
        log('✅ No issues found - all tests passed!', 'success');
    } else {
        recommendations.forEach((rec, index) => {
            log(`\n${index + 1}. [${rec.priority}] ${rec.issue}`, rec.priority === 'HIGH' ? 'error' : rec.priority === 'MEDIUM' ? 'warning' : 'info');
            log(`   Solution: ${rec.solution}`, 'info');
            rec.commands.forEach(cmd => {
                log(`   • ${cmd}`, 'info');
            });
        });
    }
    
    testResults.recommendations = recommendations;
}

async function saveReport() {
    const reportPath = path.join(__dirname, `network_diagnostics_report_${Date.now()}.json`);
    
    try {
        await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
        log(`📄 Full report saved to: ${reportPath}`, 'success');
    } catch (error) {
        log(`❌ Failed to save report: ${error.message}`, 'error');
    }
}

function printSummary() {
    logHeader('Test Summary');
    
    const { summary } = testResults;
    const passRate = ((summary.passed / summary.total) * 100).toFixed(1);
    
    log(`Total Tests: ${summary.total}`, 'info');
    log(`Passed: ${summary.passed}`, 'success');
    log(`Failed: ${summary.failed}`, summary.failed > 0 ? 'error' : 'info');
    log(`Warnings: ${summary.warnings}`, summary.warnings > 0 ? 'warning' : 'info');
    log(`Pass Rate: ${passRate}%`, passRate >= 90 ? 'success' : passRate >= 70 ? 'warning' : 'error');
    
    if (summary.failed === 0) {
        log('\n🎉 All critical tests passed! The architects tab should load properly.', 'success');
    } else {
        log(`\n⚠️  ${summary.failed} tests failed. The architects tab may not load correctly.`, 'error');
        log('Check the recommendations above for solutions.', 'info');
    }
}

// Main execution
async function main() {
    log('🚀 Starting Network Diagnostics for Architects Tab', 'header');
    log(`Base URL: ${BASE_URL}`, 'info');
    log(`Timeout: ${TIMEOUT}ms`, 'info');
    
    try {
        await testEndpointAccessibility();
        await testDatabaseFiles();
        await testCORSConfiguration();
        await testPerformance();
        
        generateRecommendations();
        printSummary();
        await saveReport();
        
    } catch (error) {
        log(`❌ Diagnostic script failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Run the diagnostics
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = {
    main,
    testResults,
    makeRequest,
    performFileCheck
};