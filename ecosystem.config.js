module.exports = {
    apps : [
        {
            name: "deploy-service",
            script: "./server/service.js",
            args: "9898",
            log_date_format: 'YYYY-MM-DD HH:mm Z',
            error_file: './logs',
            out_file: './logs',
            env: {
                PORT: 9898,
                NODE_ENV: "development",
            },
            env_production: {
                PORT: 9898,
                NODE_ENV: "production",
            }
        }
    ]
}