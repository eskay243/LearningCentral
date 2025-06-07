import type { Express, RequestHandler } from "express";

// Simple authentication system for development
export interface SimpleUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Demo users for testing different roles
const demoUsers: Record<string, SimpleUser> = {
  'dev-student': {
    id: 'dev-student',
    email: 'student@codelabeducare.com',
    firstName: 'Demo',
    lastName: 'Student',
    role: 'student',
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'dev-admin': {
    id: 'dev-admin',
    email: 'admin@codelabeducare.com',
    firstName: 'Demo',
    lastName: 'Admin',
    role: 'admin',
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  'dev-mentor': {
    id: 'dev-mentor',
    email: 'mentor@codelabeducare.com',
    firstName: 'Demo',
    lastName: 'Mentor',
    role: 'mentor',
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// Current user state (in memory for demo)
let currentUser: SimpleUser = demoUsers['dev-student'];

export function setupSimpleAuth(app: Express) {
  // Get current user
  app.get('/api/user', (req, res) => {
    res.json(currentUser);
  });

  // Switch user role for testing
  app.get('/api/switch-user-role/:role', (req, res) => {
    const { role } = req.params;
    const userKey = `dev-${role}`;
    
    if (demoUsers[userKey]) {
      currentUser = demoUsers[userKey];
      res.json({ message: `Switched to ${role} role`, user: currentUser });
    } else {
      res.status(400).json({ message: 'Invalid role' });
    }
  });

  // Logout (reset to student)
  app.get('/api/logout', (req, res) => {
    currentUser = demoUsers['dev-student'];
    res.redirect('/');
  });

  // Login endpoint (for compatibility)
  app.get('/api/login', (req, res) => {
    res.redirect('/');
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  req.user = currentUser;
  next();
};

export const hasRole = (roles: string | string[]): RequestHandler => {
  return (req, res, next) => {
    const user = req.user as SimpleUser;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (allowedRoles.includes(user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Insufficient permissions' });
    }
  };
};