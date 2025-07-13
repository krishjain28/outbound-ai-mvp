#!/bin/bash
set -e

echo "🚀 Starting Outbound AI Deployment..."

# Navigate to backend directory
cd backend

echo "📦 Installing dependencies..."
npm install --production

echo "🔧 Starting server..."
exec node server.js
