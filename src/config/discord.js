const env = require('./environment');

module.exports = {
    clientId: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    callbackUrl: env.DISCORD_CALLBACK_URL
};
