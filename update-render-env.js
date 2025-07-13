#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 MongoDB Connection String Update for Render');
console.log('==============================================\n');

// The new MongoDB Atlas connection string you provided
const newMongoURI = 'mongodb+srv://krishjain28:krishjain28@cluster0.v7ckm.mongodb.net/outbound-ai-mvp?retryWrites=true&w=majority';

console.log('📋 Current MongoDB URI to be set:');
console.log(newMongoURI.replace(/\/\/.*@/, '//***:***@'));
console.log('\n');

console.log('🚀 To update your Render environment variables, run these commands:');
console.log('\n');

console.log('# 1. Update MongoDB URI');
console.log(`render env set MONGODB_URI "${newMongoURI}"`);
console.log('\n');

console.log('# 2. Verify the environment variable was set');
console.log('render env ls');
console.log('\n');

console.log('# 3. Redeploy the backend to apply changes');
console.log('render deploy');
console.log('\n');

console.log('📝 Alternative: Update via Render Dashboard');
console.log('1. Go to https://dashboard.render.com/');
console.log('2. Select your backend service');
console.log('3. Go to Environment tab');
console.log('4. Update MONGODB_URI with the new connection string');
console.log('5. Save and redeploy');
console.log('\n');

console.log('🔍 After updating, test the connection:');
console.log('curl -X GET https://outbound-ai.onrender.com/health');
console.log('\n');

console.log('✅ Expected response should show database status as "connected"');
console.log('\n');

// Check if render CLI is installed
try {
  execSync('render --version', { stdio: 'ignore' });
  console.log('🎯 Render CLI detected! You can run the commands above directly.');
} catch (error) {
  console.log('⚠️  Render CLI not found. Please use the dashboard method or install Render CLI:');
  console.log('npm install -g @render/cli');
} 