const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/errorHandler');
const { app: logger } = require('../utils/logger');

// Professional API documentation HTML
const apiDocsHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI SDR API Documentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            border-left: 4px solid #007bff;
        }
        
        .header h1 {
            color: #007bff;
            font-size: 2rem;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .header p {
            color: #666;
            font-size: 1.1rem;
        }
        
        .status-section {
            background: #fff;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .status-item {
            padding: 15px;
            border-radius: 6px;
            background: #f8f9fa;
            border-left: 3px solid #28a745;
        }
        
        .status-item h4 {
            color: #28a745;
            margin-bottom: 5px;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-item p {
            color: #333;
            font-weight: 500;
        }
        
        .endpoints-section {
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .endpoints-section h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .endpoint-group {
            margin-bottom: 25px;
        }
        
        .endpoint-group h3 {
            color: #007bff;
            margin-bottom: 15px;
            font-size: 1.2rem;
            font-weight: 500;
        }
        
        .endpoint-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 10px;
            border-left: 3px solid #007bff;
        }
        
        .endpoint-method {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-right: 10px;
        }
        
        .endpoint-path {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            color: #333;
            font-size: 0.9rem;
        }
        
        .endpoint-description {
            color: #666;
            font-size: 0.85rem;
            margin-top: 5px;
        }
        
        .info-section {
            background: #fff;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .info-section h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.3rem;
            font-weight: 600;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .info-item {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        .info-item h4 {
            color: #007bff;
            margin-bottom: 5px;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-item p {
            color: #333;
            font-size: 0.9rem;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px 10px;
            }
            
            .header h1 {
                font-size: 1.5rem;
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
            <h1>AI SDR API</h1>
            <p>Professional API for AI-powered Sales Development Representative system</p>
        </div>
        
        <div class="status-section">
            <h2>System Status</h2>
            <div class="status-grid">
                <div class="status-item">
                    <h4>API Status</h4>
                    <p id="api-status">Online</p>
                </div>
                <div class="status-item">
                    <h4>Database</h4>
                    <p id="db-status">Connected</p>
                </div>
                <div class="status-item">
                    <h4>Environment</h4>
                    <p id="env-status">Production</p>
                </div>
                <div class="status-item">
                    <h4>Version</h4>
                    <p id="version-status">1.0.0</p>
                </div>
            </div>
        </div>
        
        <div class="endpoints-section">
            <h2>API Endpoints</h2>
            
            <div class="endpoint-group">
                <h3>Health & Status</h3>
                <div class="endpoint-item">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/health</span>
                    <div class="endpoint-description">System health check and status information</div>
                </div>
                <div class="endpoint-item">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/health</span>
                    <div class="endpoint-description">Detailed API health status</div>
                </div>
            </div>
            
            <div class="endpoint-group">
                <h3>Authentication</h3>
                <div class="endpoint-item">
                    <span class="endpoint-method">POST</span>
                    <span class="endpoint-path">/api/auth/register</span>
                    <div class="endpoint-description">User registration</div>
                </div>
                <div class="endpoint-item">
                    <span class="endpoint-method">POST</span>
                    <span class="endpoint-path">/api/auth/login</span>
                    <div class="endpoint-description">User authentication</div>
                </div>
            </div>
            
            <div class="endpoint-group">
                <h3>User Management</h3>
                <div class="endpoint-item">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/user/profile</span>
                    <div class="endpoint-description">Get user profile information</div>
                </div>
            </div>
            
            <div class="endpoint-group">
                <h3>Call Management</h3>
                <div class="endpoint-item">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/calls</span>
                    <div class="endpoint-description">Get call history and status</div>
                </div>
            </div>
            
            <div class="endpoint-group">
                <h3>Worker Management</h3>
                <div class="endpoint-item">
                    <span class="endpoint-method">GET</span>
                    <span class="endpoint-path">/api/workers/status</span>
                    <div class="endpoint-description">Get worker status</div>
                </div>
                <div class="endpoint-item">
                    <span class="endpoint-method">POST</span>
                    <span class="endpoint-path">/api/workers/start</span>
                    <div class="endpoint-description">Start background workers</div>
                </div>
                <div class="endpoint-item">
                    <span class="endpoint-method">POST</span>
                    <span class="endpoint-path">/api/workers/stop</span>
                    <div class="endpoint-description">Stop background workers</div>
                </div>
            </div>
        </div>
        
        <div class="info-section">
            <h2>System Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <h4>Deployment</h4>
                    <p>Render Cloud Platform</p>
                </div>
                <div class="info-item">
                    <h4>Database</h4>
                    <p>MongoDB Atlas</p>
                </div>
                <div class="info-item">
                    <h4>Framework</h4>
                    <p>Node.js & Express</p>
                </div>
                <div class="info-item">
                    <h4>Security</h4>
                    <p>JWT Authentication</p>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>AI SDR API | Production Environment | Deployed on Render</p>
            <p>For API access and integration, contact the development team</p>
        </div>
    </div>
    
    <script>
        // Update status information
        async function updateStatus() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                
                // Update database status
                const dbStatus = document.getElementById('db-status');
                if (data.database && data.database.status === 'connected') {
                    dbStatus.textContent = 'Connected';
                    dbStatus.parentElement.style.borderLeftColor = '#28a745';
                } else {
                    dbStatus.textContent = 'Disconnected';
                    dbStatus.parentElement.style.borderLeftColor = '#dc3545';
                }
                
                // Update environment
                const envStatus = document.getElementById('env-status');
                if (data.environment) {
                    envStatus.textContent = data.environment.charAt(0).toUpperCase() + data.environment.slice(1);
                }
                
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }
        
        // Update status on load and every 30 seconds
        updateStatus();
        setInterval(updateStatus, 30000);
    </script>
</body>
</html>
`;

// API documentation route
router.get('/', asyncHandler(async (req, res) => {
  logger.info(`API documentation accessed | ip: ${req.ip} | userAgent: ${req.get('User-Agent')}`);
  
  res.setHeader('Content-Type', 'text/html');
  res.send(apiDocsHTML);
}));

module.exports = router; 