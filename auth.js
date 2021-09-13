const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

const GOOGLE_CLIENT_ID = "#####";
const GOOGLE_CLIENT_SECRET = "######";

const dev = false;

const getAuthRedirect = (dev) => {
  if (dev) {
    return "http://localhost:3000/auth/google/oauth2/callback";
  }
  return "https://video-call-app-harish.herokuapp.com/auth/google/oauth2/callback";
};

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: getAuthRedirect(dev),
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
