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
  if (!req.isAuthenticated()) {
    console.log("Authentication failed: User not authenticated");
    return res.status(401).json({ message: "Unauthorized: Not authenticated" });
  }
  
  const user = req.user as any;

  if (!user) {
    console.log("Authentication failed: No user in request");
    return res.status(401).json({ message: "Unauthorized: No user" });
  }

  // Check if token has expired
  if (user.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    
    // Token is still valid
    if (now <= user.expires_at) {
      return next();
    }
    
    // Token expired, try to refresh
    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      console.log("Authentication failed: Token expired and no refresh token");
      return res.redirect("/api/login");
    }
    
    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
      return next();
    } catch (error) {
      console.error("Authentication failed: Token refresh error", error);
      return res.redirect("/api/login");
    }
  } else if (user.id || (user.claims && user.claims.sub)) {
    // User exists in DB but doesn't have token info
    // This is a valid user that was authenticated via session
    return next();
  } else {
    console.log("Authentication failed: Invalid user or missing required fields");
    return res.status(401).json({ message: "Unauthorized: Invalid session data" });
  }
};

// Middleware to check if the user has a specific role
export const hasRole = (role: string | string[]): RequestHandler => {
  return async (req: any, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get user data - first try from the request which should have the DB user
      let user = req.user;
      
      // If no role in the user object from the request, try to get from DB
      if (!user.role && user.claims && user.claims.sub) {
        const dbUser = await storage.getUser(user.claims.sub);
        if (dbUser) {
          // Update the request user with DB data for future middleware
          req.user = { ...user, ...dbUser };
          user = req.user;
        }
      }
      
      if (!user || !user.role) {
        console.error("Role check failed: User has no role", user);
        return res.status(401).json({ message: "User not found or has no role assigned" });
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
