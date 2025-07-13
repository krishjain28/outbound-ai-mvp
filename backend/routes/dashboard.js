const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const { app: logger } = require('../utils/logger');

// Dashboard HTML template
const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI SDR Backend Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            color: white;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .status-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .status-card:hover {
            transform: translateY(-5px);
        }
        
        .status-card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-online {
            background: #4CAF50;
            box-shadow: 0 0 10px #4CAF50;
        }
        
        .status-offline {
            background: #f44336;
            box-shadow: 0 0 10px #f44336;
        }
        
        .status-warning {
            background: #ff9800;
            box-shadow: 0 0 10px #ff9800;
        }
        
        .endpoints-section {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .endpoints-section h3 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }
        
        .endpoint-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .endpoint-item {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            border-left: 4px solid #667eea;
        }
        
        .endpoint-method {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .endpoint-path {
            font-family: 'Courier New', monospace;
            color: #666;
            font-size: 0.9rem;
        }
        
        .stats-section {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .stat-item {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            color: white;
            opacity: 0.8;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .status-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 AI SDR Backend Dashboard</h1>
            <p>Real-time system status and monitoring</p>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <h3>System Status</h3>
                <div>
                    <span class="status-indicator status-online"></span>
                    <strong>Online</strong>
                </div>
                <p style="margin-top: 10px; color: #666;">Backend service is running and responding to requests.</p>
            </div>
            
            <div class="status-card">
                <h3>Database Connection</h3>
                <div id="db-status">
                    <span class="status-indicator status-online"></span>
                    <strong>Connected</strong>
                </div>
                <p style="margin-top: 10px; color: #666;">MongoDB Atlas connection is active.</p>
            </div>
            
            <div class="status-card">
                <h3>API Status</h3>
                <div>
                    <span class="status-indicator status-online"></span>
                    <strong>Operational</strong>
                </div>
                <p style="margin-top: 10px; color: #666;">All API endpoints are functioning normally.</p>
            </div>
        </div>
        
        <div class="endpoints-section">
            <h3>📡 Available API Endpoints</h3>
            <div class="endpoint-list">
                <div class="endpoint-item">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/health</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/api/health</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">POST</div>
                    <div class="endpoint-path">/api/auth/register</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">POST</div>
                    <div class="endpoint-path">/api/auth/login</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/api/user/profile</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/api/calls</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">GET</div>
                    <div class="endpoint-path">/api/workers/status</div>
                </div>
                <div class="endpoint-item">
                    <div class="endpoint-method">POST</div>
                    <div class="endpoint-path">/api/workers/start</div>
                </div>
            </div>
        </div>
        
        <div class="stats-section">
            <h3>📊 System Statistics</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value" id="uptime">--</div>
                    <div class="stat-label">Uptime</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="memory-usage">--</div>
                    <div class="stat-label">Memory Usage</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="active-connections">--</div>
                    <div class="stat-label">Active Connections</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="requests-count">--</div>
                    <div class="stat-label">Total Requests</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>AI SDR Backend System | Powered by Node.js & Express</p>
            <p>Deployed on Render | Database: MongoDB Atlas</p>
        </div>
    </div>
    
    <script>
        // Update dashboard data
        async function updateDashboard() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                
                // Update database status
                const dbStatus = document.getElementById('db-status');
                if (data.database && data.database.status === 'connected') {
                    dbStatus.innerHTML = '<span class="status-indicator status-online"></span><strong>Connected</strong>';
                } else {
                    dbStatus.innerHTML = '<span class="status-indicator status-offline"></span><strong>Disconnected</strong>';
                }
                
                // Update stats
                if (data.uptime) {
                    document.getElementById('uptime').textContent = data.uptime;
                }
                if (data.memoryUsage) {
                    document.getElementById('memory-usage').textContent = data.memoryUsage;
                }
                if (data.workers && data.workers.status) {
                    document.getElementById('active-connections').textContent = data.workers.status;
                }
                
            } catch (error) {
                console.error('Failed to update dashboard:', error);
            }
        }
        
        // Update every 30 seconds
        updateDashboard();
        setInterval(updateDashboard, 30000);
    </script>
</body>
</html>
`;

// Dashboard route
router.get('/', asyncHandler(async (req, res) => {
  logger.info('Dashboard accessed', { 
    ip: req.ip, 
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  res.setHeader('Content-Type', 'text/html');
  res.send(dashboardHTML);
}));

// API status endpoint for dashboard
router.get('/api/status', asyncHandler(async (req, res) => {
  const status = {
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime,
    memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    database: {
      status: 'connected',
      readyState: 1
    },
    workers: {
      status: 'running'
    }
  };
  
  res.json(status);
}));

module.exports = router; 