module.exports = {
  apps: [
    {
      name: 'harmonix',
      script: 'dist/index.js',
      instances: 1, // Must be 1 so Discord voice Gateway & Player maintain local in-memory socket state
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
