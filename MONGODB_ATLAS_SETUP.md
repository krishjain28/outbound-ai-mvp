# 🌟 MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Click **"Try Free"**
3. Sign up with your email or use Google/GitHub
4. Complete the registration process

## Step 2: Create a New Cluster
1. After logging in, click **"Create"** → **"Cluster"**
2. Choose **"M0 FREE"** tier (perfect for development)
3. Select a cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region closest to you
5. Keep the default cluster name or change it to "outbound-ai-cluster"
6. Click **"Create Cluster"** (this takes 3-5 minutes)

## Step 3: Create Database User
1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username: `outbound-ai-user`
5. Set a strong password (save this!)
6. For Database User Privileges, select **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Configure Network Access
1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, use specific IP addresses
4. Click **"Confirm"**

## Step 5: Get Connection String
1. Go back to **"Clusters"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"4.1 or later"**
5. Copy the connection string (it looks like this):
   ```
   mongodb+srv://outbound-ai-user:<password>@outbound-ai-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update Your Environment File
1. Replace `<password>` in the connection string with your actual password
2. Add your database name at the end: `/outbound-ai-mvp`
3. Your final connection string should look like:
   ```
   mongodb+srv://outbound-ai-user:yourpassword@outbound-ai-cluster.xxxxx.mongodb.net/outbound-ai-mvp?retryWrites=true&w=majority
   ```

## Step 7: Update Backend Configuration
Update your `backend/.env` file with the Atlas connection string:
```env
MONGODB_URI=mongodb+srv://outbound-ai-user:yourpassword@outbound-ai-cluster.xxxxx.mongodb.net/outbound-ai-mvp?retryWrites=true&w=majority
```

## Step 8: Test the Connection
Run the application:
```bash
npm run dev
```

## 🔧 Troubleshooting

### Common Issues:
1. **"IP not whitelisted"**: Add your IP to Network Access
2. **"Authentication failed"**: Check username/password in connection string
3. **"Connection timeout"**: Check network access settings
4. **"Database not found"**: MongoDB will create it automatically on first use

### Security Best Practices:
- Use specific IP addresses in production
- Create separate users for different environments
- Use strong, unique passwords
- Enable database auditing for production

## 🎉 Success!
Once connected, you'll see in your terminal:
```
MongoDB connected successfully
Server running on port 5000
```

Your authentication system is now ready to use with cloud database storage! 