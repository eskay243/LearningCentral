import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { UserRole } from "@shared/schema";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "codelab_educare_development_session_secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  const user = await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    role: UserRole.STUDENT, // Default role for new users
  });
  return user;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const claims = tokens.claims();
      const dbUser = await upsertUser(claims);
      
      // Create a user object that combines the DB user with claims
      const user = {
        ...dbUser,
        claims
      };
      
      // Add token information
      updateUserSession(user, tokens);
      
      verified(null, user);
    } catch (error) {
      console.error("Authentication verification error:", error);
      verified(error as Error);
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      console.log("Authentication failed: User not authenticated");
      return res.status(401).json({ message: "Unauthorized: Not authenticated" });
    }
    
    const user = req.user as any;

    if (!user) {
      console.log("Authentication failed: No user in request");
      return res.status(401).json({ message: "Unauthorized: No user" });
    }

    // Determine user ID from various possible sources
    const userId = user.id || (user.claims && user.claims.sub);
    
    // If we have a user ID, we consider this a valid authentication regardless of tokens
    // This handles cases where the user is already in the DB and in session
    if (userId) {
      // If we're missing the DB user properties but have the ID, try to fetch from DB
      if (!user.role && userId) {
        try {
          const dbUser = await storage.getUser(userId);
          if (dbUser) {
            // Update the request user with DB data for future middleware
            req.user = { ...user, ...dbUser };
          }
        } catch (err) {
          console.log(`Failed to fetch user details for ID ${userId}:`, err);
          // Continue anyway, this shouldn't block authentication
        }
      }
      
      // Check expiration only if we have expires_at or claims.exp
      const expirationTime = user.expires_at || (user.claims && user.claims.exp);
      
      if (expirationTime) {
        const now = Math.floor(Date.now() / 1000);
        
        // If token is still valid, proceed
        if (now <= expirationTime) {
          return next();
        }
        
        // Token expired, try to refresh
        const refreshToken = user.refresh_token;
        if (refreshToken) {
          try {
            const config = await getOidcConfig();
            const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
            updateUserSession(user, tokenResponse);
            await upsertUser(tokenResponse.claims());
            return next();
          } catch (error) {
            console.error("Token refresh failed:", error);
            // Continue with the authentication if we have the user ID
            // The client will need to handle re-authentication if needed
            return next();
          }
        }
      }
      
      // Valid user ID without expiration check or after failed token refresh
      return next();
    }
    
    console.log("Authentication failed: Could not determine user ID");
    return res.status(401).json({ message: "Unauthorized: Invalid session data" });
  } catch (error) {
    console.error("Authentication system error:", error);
    return res.status(500).json({ message: "Authentication system error" });
  }
};

// Middleware to check if the user has a specific role
export const hasRole = (role: string | string[]): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get user data from the request
      let user = req.user;
      
      // Determine user ID from possible locations
      const userId = user.id || (user.claims && user.claims.sub);
      
      if (!userId) {
        console.error("Role check failed: Cannot determine user ID");
        return res.status(401).json({ message: "Cannot determine user identity" });
      }
      
      // If user has no role or we need to refresh user data, get from DB
      if (!user.role) {
        try {
          const dbUser = await storage.getUser(userId);
          if (dbUser) {
            // Update the request user with DB data for future middleware
            req.user = { ...user, ...dbUser };
            user = req.user;
          }
        } catch (err) {
          console.error(`Failed to fetch user role for ID ${userId}:`, err);
          return res.status(500).json({ message: "Error fetching user data" });
        }
      }
      
      if (!user.role) {
        console.error("Role check failed: User has no role", user);
        return res.status(403).json({ 
          message: "Access denied. You have not been assigned a role in the system. Please contact an administrator."
        });
      }
      
      // Check if user has one of the required roles
      if (Array.isArray(role)) {
        if (!role.includes(user.role)) {
          return res.status(403).json({
            message: `Access denied. Required roles: ${role.join(', ')}, your role: ${user.role}`
          });
        }
      } else {
        // Single role check
        if (user.role !== role) {
          return res.status(403).json({ 
            message: `Access denied. Required role: ${role}, your role: ${user.role}` 
          });
        }
      }
      
      next();
    } catch (error) {
      console.error("Error in role check middleware:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};
