import { Request, Response, RequestHandler } from "express";
import { UserRole, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Test user login for development purposes
export const devLogin: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { username = "testuser", role = UserRole.ADMIN } = req.body;
    
    // Create a user ID from the username
    const userId = `dev-${Buffer.from(username).toString('base64').substring(0, 10)}`;
    
    // Use username as email if no @ is present
    const email = username.includes('@') ? username : `${username}@example.com`;
    
    // Create or update the user in the database
    const user = await db
      .insert(users)
      .values({
        id: userId,
        email,
        role,
        firstName: "Test",
        lastName: "User",
        profileImageUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${email}&backgroundColor=6d28d9`,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { 
          role,
          updatedAt: new Date()
        }
      })
      .returning();
      
    // Create session and login
    if (req.session && user[0]) {
      const mockAuthUser = {
        id: user[0].id,
        email: user[0].email,
        role: user[0].role,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        profileImageUrl: user[0].profileImageUrl,
        claims: {
          sub: user[0].id,
          email: user[0].email,
          first_name: user[0].firstName,
          last_name: user[0].lastName,
          profile_image_url: user[0].profileImageUrl,
          role: user[0].role,
          exp: Math.floor(Date.now() / 1000) + 86400
        },
        access_token: "dev-mock-token",
        refresh_token: "dev-mock-refresh-token",
        expires_at: Math.floor(Date.now() / 1000) + 86400 // 24 hours
      };
      
      // Save user to session
      req.login(mockAuthUser, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Session error", error: err.message });
        }
        return res.json({
          message: "Development login successful",
          user: {
            id: user[0].id,
            email: user[0].email,
            firstName: user[0].firstName,
            lastName: user[0].lastName,
            role: user[0].role
          }
        });
      });
    } else {
      res.status(500).json({ message: "Failed to create session" });
    }
  } catch (error) {
    console.error("Dev login error:", error);
    res.status(500).json({ message: "Login failed", error: String(error) });
  }
};

// Update user's role for testing purposes
export const updateUserRole: RequestHandler = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id || req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const role = req.params.role;
    
    // Validate role
    const availableRoles = Object.values(UserRole);
    if (!availableRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    
    try {
      // Update user role in database
      const updateResult = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      const updatedUser = updateResult[0];
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update session information
      if (req.user) {
        req.user.role = role;
        
        // If using claims, update those too
        if (req.user.claims) {
          req.user.claims.role = role;
        }
      }
      
      // Return updated user info
      res.json({
        message: `Role updated to ${role}`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          profileImageUrl: updatedUser.profileImageUrl,
          role: updatedUser.role,
          affiliateCode: updatedUser.affiliateCode
        }
      });
    } catch (dbError) {
      console.error("Database error when switching role:", dbError);
      res.status(500).json({ message: "Database error when switching role" });
    }
  } catch (error) {
    console.error("Error switching user role:", error);
    res.status(500).json({ message: "Failed to switch user role" });
  }
};

// Demo user authentication middleware for testing
export const isTestAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // For testing, we'll redirect to the test login page instead of showing an error
  // This allows easy testing of the role-switching functionality
  return res.redirect("/test-login");
};