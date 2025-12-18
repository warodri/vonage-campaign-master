const LocalStrategy = require('passport-local').Strategy;

function initialize(passport, getUserByEmail) {

    const authenticateUser = async (email, password, done) => {
        console.log('[AUTH] Login attempt:', email);

        const user = await getUserByEmail(email);
        if (!user) {
            console.log('[AUTH] User not found:', email);
            return done(null, false);
        }

        console.log('[AUTH] User found');

        if (password === user.password) {
            console.log('[AUTH] Password match');
            return done(null, user);
        }

        console.log('[AUTH] Password mismatch');
        return done(null, false);
    };

    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

    passport.serializeUser((user, done) => {
        console.log('[AUTH] serializeUser:', user.email);
        done(null, user.email);
    });

    passport.deserializeUser( async (email, done) => {
        console.log('[AUTH] deserializeUser:', email);
        const user = await getUserByEmail(email);
        return done(null, user);  
    });

}

module.exports = initialize;
