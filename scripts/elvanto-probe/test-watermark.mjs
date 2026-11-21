/**
 * Test Watermark Date Filter with Elvanto API
 * 
 * This script tests the date_modified filter with the Elvanto API
 * to verify the watermark date format works correctly.
 * 
 * Usage: node scripts/elvanto-probe/test-watermark.mjs
 */

import 'dotenv/config';

const ELVANTO_API_KEY = process.env.ELVANTO_API_KEY;
const ELVANTO_BASE_URL = 'https://api.elvanto.com/v1';

if (!ELVANTO_API_KEY) {
  console.error('ELVANTO_API_KEY not found in environment');
  process.exit(1);
}

function formatForElvanto(isoDate) {
  const date = new Date(isoDate);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` + 
         `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

async function testDateFilter(dateFilter, label, paramName = 'date_modified') {
  console.log(`\n=== Testing ${label} ===`);
  console.log(`Parameter: ${paramName} = "${dateFilter}"`);
  
  const body = {
    page: 1,
    page_size: 10,
    fields: ['demographics', 'locations']
  };
  if (dateFilter) body[paramName] = dateFilter;
  
  // Also test with since parameter
  if (paramName === 'since') {
    delete body.date_modified;
    body.since = dateFilter;
  }
  
  const response = await fetch(`${ELVANTO_BASE_URL}/people/getAll.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(ELVANTO_API_KEY + ':').toString('base64')}`
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  
  if (data.status === 'ok') {
    const people = data.people?.person ?? [];
    console.log(`Total: ${data.people?.total ?? 0}`);
    console.log(`On this page: ${people.length}`);
    
    if (people.length > 0) {
      console.log('Sample records:');
      people.slice(0, 3).forEach(p => {
        console.log(`  ID: ${p.id}, date_modified: "${p.date_modified}", demographics: ${JSON.stringify(p.demographics)}`);
      });
    } else {
      console.log('No records returned');
    }
  } else {
    console.log(`Error: ${data.error?.message || 'Unknown error'}`);
  }
  
  return data;
}

async function main() {
  console.log('Testing Elvanto API date_modified filter');
  console.log('API Key:', ELVANTO_API_KEY ? 'SET' : 'NOT SET');
  
  // Test 1: No filter (should return all)
  await testDateFilter(null, 'No filter (baseline)');
  
  // Test 2: Watermark format (space, UTC)
  const watermarkDate = '2026-09-13 09:48:25';
  await testDateFilter(watermarkDate, `Watermark format: "${watermarkDate}"`);
  
  // Test 3: ISO format
  const isoDate = '2026-09-13T09:48:25.000Z';
  await testDateFilter(isoDate, `ISO format: "${isoDate}"`);
  
  // Test 4: Recent date (should return few/no results)
  const recentDate = formatForElvanto(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  await testDateFilter(recentDate, `Recent (24h ago): "${recentDate}"`);
  
  // Test 5: Future date (should return 0)
  const futureDate = formatForElvanto(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
  await testDateFilter(futureDate, `Future (24h ahead): "${futureDate}"`);
  
  // Test 6: Try 'since' parameter instead of 'date_modified'
  const sinceDate = '2026-09-13 09:48:25';
  await testDateFilter(sinceDate, `Using 'since' parameter: "${sinceDate}"`, 'since');
  
  // Test 7: Try 'modified_since' parameter
  const modifiedSinceDate = '2026-09-13 09:48:25';
  await testDateFilter(modifiedSinceDate, `Using 'modified_since' parameter: "${modifiedSinceDate}"`, 'modified_since');
  
  // Test 8: Try 'updated_since' parameter
  const updatedSinceDate = '2026-09-13 09:48:25';
  await testDateFilter(updatedSinceDate, `Using 'updated_since' parameter: "${updatedSinceDate}"`, 'updated_since');
  
  console.log('\n=== Summary ===');
  console.log('Check which format returns the expected results.');
  console.log('The watermark should use the format that returns records modified AFTER that date.');
}

main().catch(console.error);