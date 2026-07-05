const { doubleCsrf } = require('csrf-csrf');
const env = require('../config/environment');

const {
    doubleCsrfProtection,
    generateToken
} = doubleCsrf({
    getSecret: () => env.SESSION_SECRET,
    cookieName: '__Host-3m-csrf',
    cookieOptions: {
        path: '/',
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        signed: true
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getTokenFromRequest: (req) => {
        return req.headers['x-csrf-token'] || (req.body && req.body._csrf);
    }
});

module.exports = {
    csrfProtection: doubleCsrfProtection,
    generateCsrfToken: generateToken
};
