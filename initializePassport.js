const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;

function initialize(passport, getUserByEmail) {

    const authenticateUser = async (email, password, done) => {
        console.log('[AUTH] Login attempt:', email);

        const user = await getUserByEmail(email);
        if (!user || !user.password) {
            console.log('[AUTH] User not found');
            return done(null, false);
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            console.log('[AUTH] Password match');
            return done(null, user);
        }

        console.log('[AUTH] Password mismatch');
        return done(null, false);
    };

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

    passport.serializeUser((user, done) => {
        done(null, user.email);
    });

    passport.deserializeUser(async (email, done) => {
        const user = await getUserByEmail(email);
        return done(null, user);
    });
}

module.exports = initialize;
