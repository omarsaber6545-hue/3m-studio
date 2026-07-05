const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Helper to create DailyRotateFile transporter
const createTransporter = (filename, level) => {
    return new DailyRotateFile({
        filename: path.join(__dirname, '../../logs', `${filename}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: level,
        format: logFormat
    });
};

const logger = winston.createLogger({
    levels: winston.config.syslog.levels,
    level: 'info',
    format: logFormat,
    transports: [
        // Error logs
        createTransporter('error', 'error'),
        // System & Application logs
        createTransporter('system', 'info'),
        // Console transporter for Development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Dedicated Security Logger
const securityLogger = winston.createLogger({
    level: 'warn',
    format: logFormat,
    transports: [
        createTransporter('security', 'warn')
    ]
});

// Dedicated Access/Audit Logger
const auditLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
        createTransporter('access', 'info')
    ]
});

module.exports = {
    logger,
    securityLogger,
    auditLogger
};
