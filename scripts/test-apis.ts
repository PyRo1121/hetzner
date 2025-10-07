/**
 * API Testing Script
 * Tests all market, PvP, guild, and player search APIs
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  endpoint: string;
  status: 'PASS' | 'FAIL';
  statusCode?: number;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

async function testEndpoint(
  name: string,
  url: string,
  expectedStatus: number = 200
): Promise<TestResult> {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.status === expectedStatus && data.success !== false) {
      console.log(`   ✅ PASS (${response.status})`);
      return {
        endpoint: name,
        status: 'PASS',
        statusCode: response.status,
        data: data,
      };
    } else {
      console.log(`   ❌ FAIL (${response.status})`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return {
        endpoint: name,
        status: 'FAIL',
        statusCode: response.status,
        error: data.error || 'Unknown error',
      };
    }
  } catch (error: any) {
    console.log(`   ❌ FAIL (Network Error)`);
    console.log(`   Error: ${error.message}`);
    return {
      endpoint: name,
      status: 'FAIL',
      error: error.message,
    };
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  console.log('=' .repeat(60));
  
  // Market API Tests
  console.log('\n📊 MARKET APIs');
  console.log('-'.repeat(60));
  
  results.push(await testEndpoint(
    'Market Prices - Single Item',
    `${BASE_URL}/api/market/prices?items=T4_BAG&locations=Caerleon&qualities=1`
  ));
  
  results.push(await testEndpoint(
    'Market Prices - Multiple Items',
    `${BASE_URL}/api/market/prices?items=T4_BAG,T5_BAG&locations=Caerleon,Thetford`
  ));
  
  results.push(await testEndpoint(
    'Market History',
    `${BASE_URL}/api/market/history?items=T4_BAG&locations=Caerleon&timeScale=24`
  ));
  
  // PvP Kill Events API Tests
  console.log('\n⚔️  PVP KILL APIs');
  console.log('-'.repeat(60));
  
  results.push(await testEndpoint(
    'Recent Kills',
    `${BASE_URL}/api/pvp/kills?limit=10&offset=0`
  ));
  
  results.push(await testEndpoint(
    'Recent Kills - Pagination',
    `${BASE_URL}/api/pvp/kills?limit=10&offset=10`
  ));
  
  // Guild API Tests
  console.log('\n🛡️  GUILD APIs');
  console.log('-'.repeat(60));
  
  results.push(await testEndpoint(
    'Guild Leaderboard - Attacks',
    `${BASE_URL}/api/pvp/guilds?type=attacks&range=week&limit=10`
  ));
  
  results.push(await testEndpoint(
    'Guild Leaderboard - Defenses',
    `${BASE_URL}/api/pvp/guilds?type=defenses&range=week&limit=10`
  ));
  
  // Search API Tests
  console.log('\n🔍 SEARCH APIs');
  console.log('-'.repeat(60));
  
  results.push(await testEndpoint(
    'Player Search',
    `${BASE_URL}/api/pvp/search?q=test`
  ));
  
  results.push(await testEndpoint(
    'Guild Search',
    `${BASE_URL}/api/pvp/search?q=guild`
  ));
  
  // Player API Tests (requires a valid player ID from search)
  console.log('\n👤 PLAYER APIs');
  console.log('-'.repeat(60));
  
  // First, get a player ID from recent kills
  try {
    const killsResponse = await fetch(`${BASE_URL}/api/pvp/kills?limit=1`);
    const killsData = await killsResponse.json();
    
    if (killsData.success && killsData.data && killsData.data.length > 0) {
      const playerId = killsData.data[0].Killer?.Id;
      
      if (playerId) {
        results.push(await testEndpoint(
          'Player Details',
          `${BASE_URL}/api/pvp/player/${playerId}`
        ));
      } else {
        console.log('   ⚠️  SKIP - No player ID available');
        results.push({
          endpoint: 'Player Details',
          status: 'FAIL',
          error: 'No player ID available from kills data',
        });
      }
    } else {
      console.log('   ⚠️  SKIP - No kills data available');
      results.push({
        endpoint: 'Player Details',
        status: 'FAIL',
        error: 'No kills data available',
      });
    }
  } catch (error: any) {
    console.log('   ⚠️  SKIP - Failed to fetch kills for player ID');
    results.push({
      endpoint: 'Player Details',
      status: 'FAIL',
      error: error.message,
    });
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`   - ${r.endpoint}: ${r.error || 'Unknown error'}`);
      });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
