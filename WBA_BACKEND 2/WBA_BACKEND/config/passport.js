require("dotenv").config();
 
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
 
const User = require("../models/User");
 
// DEBUG
console.log("GOOGLE CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE CLIENT SECRET:", process.env.GOOGLE_CLIENT_SECRET);
 
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
 
      // IMPORTANT
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
 
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("GOOGLE PROFILE:", profile);
 
        const email = profile.emails[0].value.toLowerCase();
 
        let user = await User.findOne({ email });
 
        // CREATE USER IF NOT EXISTS
        let isNewUser = false;
 
        if (!user) {
          isNewUser = true;
 
          user = await User.create({
            name: profile.displayName,
            email,
            password: "GOOGLE_AUTH_USER",
          });
        }
 
        user.isNewUser = isNewUser;
 
        return done(null, user);
 
      } catch (error) {
        console.log("GOOGLE ERROR:", error);
        return done(error, null);
      }
    }
  )
);
 
// SESSION
/*passport.serializeUser((user, done) => {
  done(null, user.id);
});
 
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});*/