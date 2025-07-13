#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 MongoDB Atlas Connection String Verification');
console.log('==============================================\n');

console.log('❌ Current connection string is invalid:');
console.log('mongodb+srv://krishjain28:krishjain28@cluster0.v7ckm.mongodb.net/outbound-ai-mvp?retryWrites=true&w=majority');
console.log('\n');

console.log('🔧 The cluster hostname "cluster0.v7ckm.mongodb.net" does not exist.');
console.log('\n');

console.log('📋 To fix this, you need to:');
console.log('\n');

console.log('1. 🔐 Login to MongoDB Atlas Dashboard');
console.log('   https://cloud.mongodb.com/');
console.log('\n');

console.log('2. 🗂️  Find your cluster');
console.log('   - Look for your cluster name (might be different from "cluster0")');
console.log('   - Check the cluster status (should be "Active")');
console.log('   - Note the exact cluster hostname');
console.log('\n');

console.log('3. 🔗 Get the correct connection string');
console.log('   - Click "Connect" on your cluster');
console.log('   - Choose "Connect your application"');
console.log('   - Copy the connection string');
console.log('   - Replace <password> with your actual password');
console.log('\n');

console.log('4. 🌐 Common MongoDB Atlas hostname patterns:');
console.log('   - cluster0.xxxxx.mongodb.net');
console.log('   - cluster1.xxxxx.mongodb.net');
console.log('   - mycluster.xxxxx.mongodb.net');
console.log('   - (where xxxxx is your unique identifier)');
console.log('\n');

console.log('5. 🔄 Update Render Environment Variables');
console.log('   - Go to https://dashboard.render.com/');
console.log('   - Select your backend service');
console.log('   - Go to Environment tab');
console.log('   - Update MONGODB_URI with the correct connection string');
console.log('   - Save and redeploy');
console.log('\n');

console.log('6. 🧪 Test the connection');
console.log('   - After updating, test with: node test-mongodb-connection.js');
console.log('   - Check backend health: curl https://outbound-ai.onrender.com/health');
console.log('\n');

console.log('💡 Alternative: Check your MongoDB Atlas email');
console.log('   - Look for emails from MongoDB Atlas');
console.log('   - They usually contain the correct connection string');
console.log('\n');

console.log('🚨 If you don\'t have a MongoDB Atlas cluster:');
console.log('   1. Go to https://cloud.mongodb.com/');
console.log('   2. Create a free cluster');
console.log('   3. Set up database access (username/password)');
console.log('   4. Set up network access (allow all IPs: 0.0.0.0/0)');
console.log('   5. Get the connection string');
console.log('\n');

console.log('📞 Need help?');
console.log('   - MongoDB Atlas documentation: https://docs.atlas.mongodb.com/');
console.log('   - Render documentation: https://render.com/docs'); 