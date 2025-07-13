// Main entry point for Render deployment
console.log('🚀 Starting Outbound AI Backend Server...');

// Change to backend directory and start the server
process.chdir('./backend');
require('./server.js');
