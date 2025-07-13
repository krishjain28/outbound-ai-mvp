#!/bin/bash

echo "🚀 Setting up Outbound AI MVP Authentication System..."

# Create environment files
echo "📝 Creating environment files..."

# Backend environment file
cat > backend/.env << EOF
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/outbound-ai-mvp
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
EOF

# Frontend environment file
cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000/api
EOF

echo "✅ Environment files created"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "🔧 Installing backend dependencies..."
cd backend && npm install

echo "🎨 Installing frontend dependencies..."
cd ../frontend && npm install

echo "✅ All dependencies installed"

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if mongosh --eval "db.runCommand('ping').ok" > /dev/null 2>&1; then
    echo "✅ MongoDB is running"
else
    echo "⚠️  MongoDB is not running. Please start MongoDB before running the application."
    echo "   - macOS: brew services start mongodb/brew/mongodb-community"
    echo "   - Linux: sudo systemctl start mongod"
    echo "   - Windows: net start MongoDB"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  npm run dev          # Start both frontend and backend"
echo "  npm run server       # Start backend only (port 5000)"
echo "  npm run client       # Start frontend only (port 3000)"
echo ""
echo "📚 Documentation: Check README.md for detailed instructions"
echo "🔐 Security: Change JWT_SECRET in backend/.env for production"
echo ""
echo "Happy coding! 🚀" 