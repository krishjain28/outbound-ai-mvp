// Main entry point for Render deployment
console.log('🚀 Starting Outbound AI Backend Server...');

// Change working directory to backend for proper file loading
process.chdir('./backend');

// Start the server
require('./server.js');
