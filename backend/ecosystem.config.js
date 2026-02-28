module.exports = {
  apps: [{
    name: 'facturacion-api',
    script: 'server.js',
    cwd: '/var/www/facturacion-api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // Logs
    error_file: '/var/log/facturacion/error.log',
    out_file: '/var/log/facturacion/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    // Restart policy
    exp_backoff_restart_delay: 100,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
