const os = require('os');
const process = require('process');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byEndpoint: {},
        byMethod: {},
        responseTimeSum: 0,
        responseTimeCount: 0,
      },
      calls: {
        total: 0,
        successful: 0,
        failed: 0,
        averageDuration: 0,
        totalDuration: 0,
      },
      system: {
        startTime: Date.now(),
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: 0,
      },
      errors: [],
      alerts: [],
    };

    // Start system monitoring
    this.startSystemMonitoring();
  }

  startSystemMonitoring() {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000); // Update every 30 seconds
  }

  updateSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    this.metrics.system = {
      startTime: this.metrics.system.startTime,
      cpuUsage: this.getCpuUsage(),
      memoryUsage: (usedMem / totalMem) * 100,
      uptime: process.uptime(),
      loadAverage: os.loadavg(),
      freeMemory: freeMem,
      totalMemory: totalMem,
      nodeVersion: process.version,
      platform: os.platform(),
    };
  }

  getCpuUsage() {
    let totalIdle = 0;
    let totalTick = 0;

    os.cpus().forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - ~~((100 * totalIdle) / totalTick);
  }

  // Request monitoring middleware
  requestMonitoring() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Track request
      this.metrics.requests.total++;

      // Track by endpoint
      const endpoint = req.route?.path || req.path;
      this.metrics.requests.byEndpoint[endpoint] =
        (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;

      // Track by method
      this.metrics.requests.byMethod[req.method] =
        (this.metrics.requests.byMethod[req.method] || 0) + 1;

      // Monitor response
      res.on('finish', () => {
        const duration = Date.now() - startTime;

        // Update response time metrics
        this.metrics.requests.responseTimeSum += duration;
        this.metrics.requests.responseTimeCount++;

        // Track success/error
        if (res.statusCode >= 400) {
          this.metrics.requests.errors++;
          this.logError(req, res, duration);
        } else {
          this.metrics.requests.success++;
        }

        // Check for slow requests
        if (duration > 5000) {
          // 5 seconds
          this.createAlert('slow_request', {
            endpoint,
            method: req.method,
            duration,
            statusCode: res.statusCode,
          });
        }
      });

      next();
    };
  }

  // Call monitoring
  trackCall(callData) {
    this.metrics.calls.total++;

    if (callData.status === 'completed' && callData.outcome === 'success') {
      this.metrics.calls.successful++;
    } else if (callData.status === 'failed' || callData.outcome === 'failed') {
      this.metrics.calls.failed++;
    }

    if (callData.duration) {
      this.metrics.calls.totalDuration += callData.duration;
      this.metrics.calls.averageDuration =
        this.metrics.calls.totalDuration / this.metrics.calls.total;
    }
  }

  // Error logging
  logError(req, res, duration) {
    const error = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
    };

    this.metrics.errors.push(error);

    // Keep only last 100 errors
    if (this.metrics.errors.length > 100) {
      this.metrics.errors = this.metrics.errors.slice(-100);
    }

    // Create alert for server errors
    if (res.statusCode >= 500) {
      this.createAlert('server_error', error);
    }
  }

  // Alert system
  createAlert(type, data) {
    const alert = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date().toISOString(),
      severity: this.getAlertSeverity(type),
    };

    this.metrics.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.metrics.alerts.length > 50) {
      this.metrics.alerts = this.metrics.alerts.slice(-50);
    }

    // Log alert
    console.warn(`🚨 Alert [${type}]:`, data);

    // Send to external monitoring if configured
    this.sendToExternalMonitoring(alert);
  }

  getAlertSeverity(type) {
    const severityMap = {
      server_error: 'high',
      slow_request: 'medium',
      high_error_rate: 'high',
      high_cpu_usage: 'medium',
      high_memory_usage: 'medium',
      call_failure_rate: 'high',
    };

    return severityMap[type] || 'low';
  }

  // Send alerts to external monitoring services
  sendToExternalMonitoring(alert) {
    // Integration with external services like Sentry, DataDog, etc.
    // This would be implemented based on your monitoring stack

    if (process.env.SENTRY_DSN) {
      // Send to Sentry
      console.log('Sending alert to Sentry:', alert);
    }

    if (process.env.SLACK_WEBHOOK) {
      // Send to Slack
      this.sendSlackAlert(alert);
    }
  }

  async sendSlackAlert(alert) {
    try {
      const webhook = process.env.SLACK_WEBHOOK;
      if (!webhook) return;

      const message = {
        text: `🚨 Alert: ${alert.type}`,
        attachments: [
          {
            color:
              alert.severity === 'high'
                ? 'danger'
                : alert.severity === 'medium'
                  ? 'warning'
                  : 'good',
            fields: [
              {
                title: 'Type',
                value: alert.type,
                short: true,
              },
              {
                title: 'Severity',
                value: alert.severity,
                short: true,
              },
              {
                title: 'Timestamp',
                value: alert.timestamp,
                short: true,
              },
              {
                title: 'Data',
                value: JSON.stringify(alert.data, null, 2),
                short: false,
              },
            ],
          },
        ],
      };

      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  // Health check with detailed metrics
  getHealthStatus() {
    const now = Date.now();
    const uptime = now - this.metrics.system.startTime;
    const avgResponseTime =
      this.metrics.requests.responseTimeCount > 0
        ? this.metrics.requests.responseTimeSum /
          this.metrics.requests.responseTimeCount
        : 0;

    const errorRate =
      this.metrics.requests.total > 0
        ? (this.metrics.requests.errors / this.metrics.requests.total) * 100
        : 0;

    const callSuccessRate =
      this.metrics.calls.total > 0
        ? (this.metrics.calls.successful / this.metrics.calls.total) * 100
        : 0;

    return {
      status: this.getOverallStatus(),
      timestamp: new Date().toISOString(),
      uptime,
      metrics: {
        requests: {
          total: this.metrics.requests.total,
          success: this.metrics.requests.success,
          errors: this.metrics.requests.errors,
          errorRate: errorRate.toFixed(2),
          averageResponseTime: avgResponseTime.toFixed(2),
          byEndpoint: this.metrics.requests.byEndpoint,
          byMethod: this.metrics.requests.byMethod,
        },
        calls: {
          total: this.metrics.calls.total,
          successful: this.metrics.calls.successful,
          failed: this.metrics.calls.failed,
          successRate: callSuccessRate.toFixed(2),
          averageDuration: this.metrics.calls.averageDuration.toFixed(2),
        },
        system: this.metrics.system,
        alerts: this.metrics.alerts.length,
        recentErrors: this.metrics.errors.slice(-10),
      },
    };
  }

  getOverallStatus() {
    const errorRate =
      this.metrics.requests.total > 0
        ? (this.metrics.requests.errors / this.metrics.requests.total) * 100
        : 0;

    const avgResponseTime =
      this.metrics.requests.responseTimeCount > 0
        ? this.metrics.requests.responseTimeSum /
          this.metrics.requests.responseTimeCount
        : 0;

    // Determine status based on metrics
    if (
      errorRate > 10 ||
      avgResponseTime > 10000 ||
      this.metrics.system.memoryUsage > 90
    ) {
      return 'unhealthy';
    } else if (
      errorRate > 5 ||
      avgResponseTime > 5000 ||
      this.metrics.system.memoryUsage > 80
    ) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  // Performance monitoring
  performanceMonitoring() {
    return (req, res, next) => {
      const startTime = process.hrtime();
      const startMemory = process.memoryUsage();

      res.on('finish', () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;
        const endMemory = process.memoryUsage();

        const performanceData = {
          endpoint: req.route?.path || req.path,
          method: req.method,
          duration,
          memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
          statusCode: res.statusCode,
          timestamp: new Date().toISOString(),
        };

        // Log performance data
        if (duration > 1000) {
          // Log slow requests
          console.warn('Slow request detected:', performanceData);
        }
      });

      next();
    };
  }

  // Reset metrics (for testing or periodic resets)
  resetMetrics() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byEndpoint: {},
        byMethod: {},
        responseTimeSum: 0,
        responseTimeCount: 0,
      },
      calls: {
        total: 0,
        successful: 0,
        failed: 0,
        averageDuration: 0,
        totalDuration: 0,
      },
      system: {
        startTime: Date.now(),
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: 0,
      },
      errors: [],
      alerts: [],
    };
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

module.exports = {
  monitoringService,
  requestMonitoring: () => monitoringService.requestMonitoring(),
  performanceMonitoring: () => monitoringService.performanceMonitoring(),
  trackCall: callData => monitoringService.trackCall(callData),
  getHealthStatus: () => monitoringService.getHealthStatus(),
  createAlert: (type, data) => monitoringService.createAlert(type, data),
  resetMetrics: () => monitoringService.resetMetrics(),
};
