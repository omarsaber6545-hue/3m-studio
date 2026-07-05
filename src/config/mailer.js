const nodemailer = require('nodemailer');
const env = require('./environment');
const { logger } = require('./logger');

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: env.SMTP_USER && env.SMTP_PASS ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
    } : undefined
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
    if (error) {
        logger.error('❌ Mail transport initialization failed:', { error });
    } else {
        logger.info('📧 Mail transport initialized successfully and ready for dispatch');
    }
});

module.exports = transporter;
