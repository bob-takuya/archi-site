/**
 * Database Health Check Script
 * Simple verification of database connection status and basic functionality
 */

async function checkDatabaseHealth() {
  console.log("🔍 Database Health Check Starting...");
  console.log("-".repeat(50));
  
  const results = {
    timestamp: new Date().toISOString(),
    status: "unknown",
    details: {},
    errors: []
  };
  
  try {
    // Import database service
    const dbService = await import('../src/services/db/ClientDatabaseService.js');
    console.log("✅ Database service imported");
    
    // Check current status
    const currentStatus = dbService.getDatabaseStatus();
    console.log(`📊 Current Status: ${currentStatus}`);
    results.details.current_status = currentStatus;
    
    // Initialize if needed
    if (currentStatus !== 'ready') {
      console.log("🚀 Initializing database...");
      await dbService.initDatabase();
      const newStatus = dbService.getDatabaseStatus();
      console.log(`📊 Post-init Status: ${newStatus}`);
      results.details.post_init_status = newStatus;
    }
    
    // Test basic query
    console.log("🔍 Testing basic query...");
    const versionResult = await dbService.executeQuery('SELECT sqlite_version()');
    if (versionResult && versionResult.length > 0) {
      const version = versionResult[0].values[0][0];
      console.log(`✅ SQLite Version: ${version}`);
      results.details.sqlite_version = version;
    }
    
    // Test table access
    console.log("📋 Testing table access...");
    const tablesResult = await dbService.executeQuery("SELECT name FROM sqlite_master WHERE type='table'");
    const tableCount = tablesResult[0]?.values?.length || 0;
    console.log(`✅ Found ${tableCount} tables`);
    results.details.table_count = tableCount;
    
    // Test ZCDARCHITECT table
    console.log("🏗️ Testing ZCDARCHITECT table...");
    const countResult = await dbService.executeQuery("SELECT COUNT(*) FROM ZCDARCHITECT");
    const recordCount = countResult[0]?.values?.[0]?.[0] || 0;
    console.log(`✅ ZCDARCHITECT records: ${recordCount}`);
    results.details.architect_records = recordCount;
    
    // Overall status
    if (dbService.getDatabaseStatus() === 'ready' && tableCount > 0 && recordCount > 0) {
      results.status = "healthy";
      console.log("\n🎉 Database is HEALTHY and fully functional!");
    } else if (dbService.getDatabaseStatus() === 'ready' && tableCount > 0) {
      results.status = "partial";
      console.log("\n⚠️ Database is connected but may have data issues");
    } else {
      results.status = "unhealthy";
      console.log("\n❌ Database has connection issues");
    }
    
  } catch (error) {
    results.status = "error";
    results.errors.push(error.message);
    console.error("\n❌ Health Check Failed:", error.message);
  }
  
  console.log("-".repeat(50));
  console.log(`📊 Final Status: ${results.status.toUpperCase()}`);
  
  return results;
}

// Export for use in other modules
export { checkDatabaseHealth };

// Auto-run if called directly
if (typeof window === 'undefined') {
  checkDatabaseHealth();
} else {
  window.checkDatabaseHealth = checkDatabaseHealth;
}