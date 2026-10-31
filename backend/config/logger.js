const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure the logs directory exists before Winston creates the log files.
const logDirectory = path.resolve(__dirname, '../../logs');

if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Configure structured application logging.
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',

    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),

    defaultMeta: {
        service: 'hustlehub-backend'
    },

    transports: [
        new winston.transports.Console(),

        new winston.transports.File({
            filename: path.join(logDirectory, 'error.log'),
            level: 'error'
        }),

        new winston.transports.File({
            filename: path.join(logDirectory, 'app.log')
        })
    ]
});

module.exports = logger;