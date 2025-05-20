# User Management Guide

## Table of Contents
1. [Introduction](#introduction)
2. [User Roles Overview](#user-roles-overview)
3. [User Registration and Onboarding](#user-registration-and-onboarding)
4. [User Profile Management](#user-profile-management)
5. [Role Assignment and Permissions](#role-assignment-and-permissions)
6. [User Authentication](#user-authentication)
7. [Admin User Management Tools](#admin-user-management-tools)
8. [User Communication and Notifications](#user-communication-and-notifications)
9. [Security and Privacy Considerations](#security-and-privacy-considerations)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)

## Introduction

This guide provides comprehensive instructions for managing users within the Codelab Educare Learning Management System (LMS). It covers all aspects of user management, from initial registration to advanced administrative functions.

## User Roles Overview

The LMS implements a multi-role system to accommodate different user responsibilities and access levels:

### Student Role
- Primary consumers of course content
- Can enroll in courses and track progress
- Can participate in discussions and submit assignments
- Can access personal learning analytics

### Mentor Role
- Create and manage courses (subject to admin approval if configured)
- Assess student work and provide feedback
- Interact with students through discussions and messages
- Access analytics for their specific courses
- Receive compensation for student enrollments

### Admin Role
- Full system configuration and management
- User management across all roles
- Course approval and oversight
- System-wide analytics and reporting
- Financial management and processing

### Affiliate Role
- Promote courses through unique affiliate links
- Track referrals and commission earnings
- Access marketing materials and performance data
- No content creation or student management capabilities

## User Registration and Onboarding

### Registration Process

1. **User Authentication with ReplitAuth**
   - The system uses ReplitAuth for secure user authentication
   - Users can log in via their Replit accounts
   - First-time users are directed to complete their profile
   - No separate registration form is required

2. **Initial Profile Setup**
   - First-time users complete a profile with:
     - Name (First/Last)
     - Email address (if not provided by ReplitAuth)
     - Role selection (if permitted by system settings)
     - Bio/description (optional)
     - Profile image (optional or from ReplitAuth)

3. **Role-Specific Onboarding**
   - Students: Shown course catalog and enrollment instructions
   - Mentors: Guided to course creation tools and guidelines
   - Admins: Provided admin dashboard access and system overview
   - Affiliates: Directed to affiliate program details and tools

### Automated Welcome Communication

New users automatically receive:
- Welcome message in the system inbox
- Email confirmation (if email is provided)
- Role-specific orientation materials
- Getting started guides for relevant platform sections

## User Profile Management

### Profile Information

Users can manage the following profile elements:
- Personal information (name, email, profile image)
- Biography and professional details
- Password and security settings
- Communication preferences
- Notification settings

### Profile Visibility

Users can control profile visibility:
- Public profile visible to all LMS users
- Limited profile visible only to connected users
- Private profile with minimal shared information

### Profile Access

1. **For Users**
   - Access via Profile link in top navigation or sidebar
   - Edit profile through dedicated Edit Profile section
   - Update preferences and settings as needed

2. **For Administrators**
   - Access user profiles via Admin > Users section
   - Edit user details with administrative privileges
   - Override certain user settings when necessary

## Role Assignment and Permissions

### Role Assignment Process

1. **Self-Selected Roles**
   - If enabled, users can select roles during registration
   - Self-selected roles may require admin approval
   - Default role (typically Student) is assigned automatically

2. **Administrator-Assigned Roles**
   - Admins can assign or change user roles via Admin Dashboard
   - Multiple roles can be assigned to a single user if needed
   - Role changes trigger notification to affected users

### Permission Management

1. **Role-Based Permissions**
   - Permissions are primarily determined by user role
   - Standard permission sets are predefined for each role
   - Special permissions can be granted to individual users

2. **Custom Permission Sets**
   - Administrators can create custom permission sets
   - Custom sets can be assigned to individuals or groups
   - Permission inheritance can be configured for organizational hierarchy

## User Authentication

### Authentication Methods

The LMS uses ReplitAuth as the primary authentication method:
- Secure OAuth-based authentication
- Single sign-on (SSO) capability
- Profile information sharing with user consent
- Session management and timeout controls

### Security Measures

1. **Session Management**
   - Configurable session timeouts
   - Device tracking for suspicious logins
   - Concurrent session limitations (optional)

2. **Password Security**
   - Password strength requirements
   - Multi-factor authentication support
   - Secure password recovery process

3. **Access Controls**
   - IP-based restrictions (optional)
   - Rate limiting for authentication attempts
   - Lockout after failed attempts

## Admin User Management Tools

### User Search and Filtering

Administrators can locate users using:
- Name, email, or username search
- Role-based filtering
- Status filtering (active, inactive, pending approval)
- Course enrollment-based filtering
- Custom attribute-based filtering

### Bulk User Operations

The system supports bulk operations:
- Import users via CSV or Excel
- Export user data for analysis
- Bulk role assignment or changes
- Batch messaging and notifications
- Bulk enrollment in courses

### User Monitoring and Support

Admin tools for user support include:
- Login history and session tracking
- Activity logs and participation metrics
- Impersonation capability for troubleshooting
- Support ticket creation and management
- Direct message capability to users

## User Communication and Notifications

### Communication Channels

The LMS provides multiple communication methods:
- Internal messaging system
- Email notifications
- In-system notifications
- Announcements (role or course-specific)
- Discussion forums and threads

### Notification Management

1. **System Notifications**
   - Course enrollment confirmations
   - Assessment grading and feedback alerts
   - Discussion mentions and replies
   - System maintenance and updates
   - Payment and financial transactions

2. **Notification Preferences**
   - Users can customize notification frequency
   - Channel preferences (email, in-app, etc.)
   - Opt-out options for non-essential communications
   - Digest options for grouping notifications

## Security and Privacy Considerations

### Data Protection

The LMS implements several data protection measures:
- Encrypted storage of personal information
- GDPR and local privacy law compliance
- Data minimization principles
- Secure data transmission (TLS/SSL)

### Privacy Controls

Users have access to privacy tools:
- Data download capability
- Account deletion requests
- Consent management for data usage
- Third-party integration permissions

### Compliance Features

Administrative tools for compliance include:
- Audit logs of all user data access
- Data retention policy enforcement
- Privacy policy version tracking
- Data processing documentation

## Troubleshooting Common Issues

### Account Access Problems

Solutions for common access issues:
- Authentication error resolution steps
- Account recovery procedures
- Session timeout troubleshooting
- Browser compatibility guidance

### Profile Management Issues

Guidance for profile-related problems:
- Image upload troubleshooting
- Field validation error resolution
- Profile visibility troubleshooting
- Data synchronization issues

### Administrative Challenges

Support for admin-specific issues:
- Bulk operation error handling
- Permission configuration troubleshooting
- User import/export problem resolution
- Role assignment conflict resolution

## Technical Implementation

### User API Endpoints

The LMS implements REST API endpoints for user management:

```javascript
// Get user profile
app.get('/api/users/:id', isAuthenticated, async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// Update user profile
app.patch('/api/users/:id', isAuthenticated, async (req: any, res) => {
  try {
    // Only allow users to update their own profile, or admins to update any profile
    const userId = req.user.claims.sub;
    const userToUpdate = await storage.getUser(userId);
    
    if (req.params.id !== userId && userToUpdate?.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "Unauthorized to update other users" });
    }
    
    const updatedUser = await storage.updateUser(req.params.id, req.body);
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
});
```

### User Data Model

The database schema includes the following for users:

```typescript
// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  role: text("role").notNull().default(UserRole.STUDENT),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  affiliateCode: varchar("affiliate_code").unique(),
});
```