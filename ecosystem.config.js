module.exports = {
    apps : [
        {
            name: "deploy-service-welfare2022",
            script: "./server/service.js",
            args: "20221",
            log_date_format: 'YYYY-MM-DD HH:mm Z',
            error_file: './logs',
            out_file: './logs',
            env: {
                PORT: 20221,
                NODE_ENV: "development",
            },
            env_production: {
                PORT: 20221,
                NODE_ENV: "production",
            }
        }
    ]
}