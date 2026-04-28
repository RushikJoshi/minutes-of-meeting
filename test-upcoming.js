// Test script to verify the upcoming meetings endpoint
const fetch = require('node-fetch');

async function testUpcomingMeetings() {
  try {
    console.log('Testing upcoming meetings endpoint...');

    const response = await fetch('http://localhost:5000/api/meetings/upcoming', {
      headers: {
        'Authorization': 'Bearer test-token',
        'x-workspace-id': 'test-workspace'
      }
    });

    console.log('Status:', response.status);
    if (response.status === 401) {
      console.log('✅ Endpoint exists and authentication is working (expected 401 without valid token)');
    } else {
      const data = await response.json();
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testUpcomingMeetings();