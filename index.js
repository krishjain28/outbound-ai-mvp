// Main entry point for Render deployment
console.log('🚀 Starting Outbound AI Backend Server...');

// Change working directory to backend
const path = require('path');
const backendDir = path.join(__dirname, 'backend');

console.log('Changing working directory to:', backendDir);
process.chdir(backendDir);

console.log('Current working directory:', process.cwd());
console.log('Loading server.js...');

// Now require server.js from the backend directory
require('./server.js');
