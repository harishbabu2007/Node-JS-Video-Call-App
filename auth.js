const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

const GOOGLE_CLIENT_ID =
  "489414191569-c60e3lg2bht0m6hf4j07q3t4gmb18ab3.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "qStvgdDv64udft-h5W_oQl39";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL:
        "http://video-call-app-harish.herokuapp.com/auth/google/oauth2/callback",
      passReqToCallback: true,
    },
    (request, accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});
