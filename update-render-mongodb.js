#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 MongoDB Connection String Update for Render');
console.log('==============================================\n');

// The correct MongoDB Atlas connection string
const correctMongoURI = 'mongodb+srv://krisjainista:krisjainista@18337.3yosqwx.mongodb.net/outbound-ai-mvp?retryWrites=true&w=majority&appName=18337';

console.log('✅ Correct MongoDB URI:');
console.log(correctMongoURI.replace(/\/\/.*@/, '//***:***@'));
console.log('\n');

console.log('⚠️  Note: Authentication failed with current credentials.');
console.log('   You may need to update the username/password in MongoDB Atlas.');
console.log('\n');

console.log('🚀 To update your Render environment variables:');
console.log('\n');

console.log('📝 Method 1: Render Dashboard (Recommended)');
console.log('1. Go to https://dashboard.render.com/');
console.log('2. Select your backend service (outbound-ai)');
console.log('3. Go to Environment tab');
console.log('4. Update MONGODB_URI with:');
console.log(`   ${correctMongoURI}`);
console.log('5. Click Save');
console.log('6. Click Redeploy');
console.log('\n');

console.log('🔧 Method 2: Check MongoDB Atlas Credentials');
console.log('1. Go to https://cloud.mongodb.com/');
console.log('2. Navigate to Database Access');
console.log('3. Check if user "krisjainista" exists');
console.log('4. Verify the password is correct');
console.log('5. If needed, create a new user or reset password');
console.log('\n');

console.log('🧪 After updating, test the connection:');
console.log('curl -X GET https://outbound-ai.onrender.com/health');
console.log('\n');

console.log('📋 Expected response should show:');
console.log('   "database": { "status": "connected" }');
console.log('\n');

console.log('🔍 If authentication still fails:');
console.log('1. Create a new MongoDB Atlas user');
console.log('2. Use a simple password (no special characters)');
console.log('3. Ensure the user has readWrite permissions');
console.log('4. Update the connection string with new credentials');
console.log('\n');

console.log('💡 Quick MongoDB Atlas User Setup:');
console.log('1. Go to Database Access in MongoDB Atlas');
console.log('2. Click "Add New Database User"');
console.log('3. Username: outbound-ai-user');
console.log('4. Password: OutboundAI2024!');
console.log('5. Built-in Role: Read and write to any database');
console.log('6. Update connection string with new credentials'); 