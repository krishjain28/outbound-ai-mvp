#!/usr/bin/env node

/**
 * MongoDB Connection String Test
 * Tests the MongoDB Atlas connection string format
 */

const mongoose = require('./backend/node_modules/mongoose');

// Test connection string from render.yaml
const testMongoURI = 'mongodb+srv://krishjain:Krish@123@cluster0.v7ckm.mongodb.net/outbound-ai-mvp?retryWrites=true&w=majority';

console.log('🔍 Testing MongoDB Connection String...');
console.log('Connection String:', testMongoURI.replace(/\/\/.*@/, '//***:***@'));

async function testConnection() {
  try {
    console.log('\n📡 Attempting to connect to MongoDB Atlas...');
    
    await mongoose.connect(testMongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority'
    });

    console.log('✅ MongoDB connection successful!');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('   Port:', mongoose.connection.port);
    console.log('   Ready State:', mongoose.connection.readyState);

    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('   Collections:', collections.map(c => c.name));

    await mongoose.disconnect();
    console.log('\n✅ Connection test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ MongoDB connection failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('authentication')) {
      console.error('\n🔧 Authentication Issues:');
      console.error('   - Check username and password');
      console.error('   - Verify MongoDB Atlas user credentials');
      console.error('   - Ensure user has proper permissions');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🔧 Network Issues:');
      console.error('   - Check if MongoDB Atlas cluster is running');
      console.error('   - Verify network connectivity');
      console.error('   - Check IP whitelist in MongoDB Atlas');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n🔧 DNS Issues:');
      console.error('   - Check cluster hostname');
      console.error('   - Verify MongoDB Atlas cluster URL');
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection(); 