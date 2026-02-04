import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { env } from './env';
import { findOrCreateSocialUser } from '../controllers/social-auth.controller';

// Map Prisma User to Express.User (which extends JWTPayload)
const toExpressUser = (user: { id: string; email: string; role: string; fullName: string }): Express.User => ({
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
});

// Google OAuth Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
                callbackURL: '/api/auth/google/callback',
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(new Error('No email found in Google profile'));
                    }
                    const user = await findOrCreateSocialUser({
                        provider: 'GOOGLE',
                        providerUserId: profile.id,
                        email,
                        fullName: profile.displayName || email.split('@')[0],
                        avatarUrl: profile.photos?.[0]?.value,
                    });
                    done(null, toExpressUser(user));
                } catch (error) {
                    done(error as Error);
                }
            }
        )
    );
}

// Facebook OAuth Strategy
if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) {
    passport.use(
        new FacebookStrategy(
            {
                clientID: env.FACEBOOK_APP_ID,
                clientSecret: env.FACEBOOK_APP_SECRET,
                callbackURL: '/api/auth/facebook/callback',
                profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(new Error('No email found in Facebook profile. Please ensure your Facebook account has a verified email.'));
                    }
                    const user = await findOrCreateSocialUser({
                        provider: 'FACEBOOK',
                        providerUserId: profile.id,
                        email,
                        fullName: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || email.split('@')[0],
                        avatarUrl: profile.photos?.[0]?.value,
                    });
                    done(null, toExpressUser(user));
                } catch (error) {
                    done(error as Error);
                }
            }
        )
    );
}

export default passport;
