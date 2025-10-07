/**
 * Quick test to see items.json structure
 */

const ITEMS_JSON_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/refs/heads/master/formatted/items.json';

async function testItemsJson() {
  const response = await fetch(ITEMS_JSON_URL);
  const data = await response.json();
  
  console.log('Type of data:', typeof data);
  console.log('Is Array:', Array.isArray(data));
  
  if (Array.isArray(data)) {
    console.log('Total items:', data.length);
    console.log('First item:', JSON.stringify(data[0], null, 2));
  } else {
    const keys = Object.keys(data);
    console.log('Total keys:', keys.length);
    console.log('First 10 keys:', keys.slice(0, 10));
    console.log('First item:', JSON.stringify(data[keys[0]], null, 2));
  }
}

testItemsJson();
