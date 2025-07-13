// Test script to verify FastArchitectService is working
const testFastArchitectService = async () => {
  try {
    console.log('Testing FastArchitectService...');
    
    // Test the service that was working
    const { getAllArchitects, getArchitectNationalities, getArchitectCategories, getArchitectSchools } = 
      await import('../src/services/api/FastArchitectService.ts');
    
    console.log('FastArchitectService imported successfully');
    
    // Test basic functionality
    console.log('Testing getAllArchitects...');
    const result = await getAllArchitects(1, 12);
    console.log('Architects result:', {
      total: result.total,
      resultsLength: result.results.length,
      firstArchitect: result.results[0]?.name || 'No architects found',
      sampleData: result.results[0]
    });
    
    // Test filter options
    console.log('Testing getArchitectNationalities...');
    const nationalities = await getArchitectNationalities();
    console.log('Nationalities:', nationalities);
    
    console.log('Testing getArchitectCategories...');
    const categories = await getArchitectCategories();
    console.log('Categories:', categories);
    
    console.log('Testing getArchitectSchools...');
    const schools = await getArchitectSchools();
    console.log('Schools:', schools);
    
    console.log('FastArchitectService test completed successfully!');
    
  } catch (error) {
    console.error('Error in FastArchitectService test:', error);
  }
};

// Run the test
if (typeof window !== 'undefined') {
  testFastArchitectService();
} else {
  console.log('This test needs to run in a browser environment');
}

export default testFastArchitectService;