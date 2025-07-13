#!/usr/bin/env node

const axios = require('axios');

const BACKEND_URL = 'https://outbound-ai.onrender.com/api/env';

console.log('🔍 Checking production backend API key status...');

axios.get(BACKEND_URL)
  .then(res => {
    console.log('\nProduction /api/env status:');
    Object.entries(res.data).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    if (Object.values(res.data).every(v => v === 'SET')) {
      console.log('\n✅ All required API keys are set in production!');
    } else {
      console.log('\n⚠️  Some API keys are missing in production.');
    }
  })
  .catch(err => {
    console.error('❌ Failed to check production backend:', err.message);
    process.exit(1);
  }); 