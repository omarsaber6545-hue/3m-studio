const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const env = require('./environment');

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Configure Discord OAuth2 Strategy
passport.use(new DiscordStrategy({
    clientID: env.DISCORD_CLIENT_ID,
    clientSecret: env.DISCORD_CLIENT_SECRET,
    callbackURL: env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'email']
}, (accessToken, refreshToken, profile, done) => {
    // Pass raw profile info to services layer to match or link accounts
    return done(null, {
        discordId: profile.id,
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar,
        globalName: profile.global_name
    });
}));

module.exports = passport;
