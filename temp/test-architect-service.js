// Test script to debug the architect loading issue
const testArchitectService = async () => {
  try {
    console.log('Testing RealArchitectService...');
    
    // Dynamic import since this is a module
    const { getAllArchitects, getArchitectNationalities, getArchitectCategories, getArchitectSchools } = 
      await import('../src/services/api/RealArchitectService.ts');
    
    console.log('Service imported successfully');
    
    // Test basic functionality
    console.log('Testing getAllArchitects...');
    const result = await getAllArchitects(1, 12);
    console.log('Architects result:', {
      total: result.total,
      resultsLength: result.results.length,
      firstArchitect: result.results[0] || 'No architects found'
    });
    
    // Test filter options
    console.log('Testing getArchitectNationalities...');
    const nationalities = await getArchitectNationalities();
    console.log('Nationalities:', nationalities.slice(0, 5), `... (${nationalities.length} total)`);
    
    console.log('Testing getArchitectCategories...');
    const categories = await getArchitectCategories();
    console.log('Categories:', categories.slice(0, 5), `... (${categories.length} total)`);
    
    console.log('Testing getArchitectSchools...');
    const schools = await getArchitectSchools();
    console.log('Schools:', schools.slice(0, 5), `... (${schools.length} total)`);
    
  } catch (error) {
    console.error('Error in test:', error);
    
    // Test if database service is working
    try {
      const { getDatabaseStatus } = await import('../src/services/db/FixedDatabaseService.ts');
      console.log('Database status:', getDatabaseStatus());
    } catch (dbError) {
      console.error('Database service error:', dbError);
    }
  }
};

testArchitectService();