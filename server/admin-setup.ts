import { storage } from "./storage";
import { UserRole } from "../shared/schema";

// This function will set a specified user as an admin
export async function setUserAsAdmin(userId: string) {
  try {
    const user = await storage.getUser(userId);
    
    if (!user) {
      console.log(`User with ID ${userId} not found`);
      return null;
    }
    
    // Set the user role to admin
    const updatedUser = await storage.updateUser(userId, {
      role: UserRole.ADMIN
    });
    
    console.log(`User ${updatedUser.email || userId} has been set as admin`);
    return updatedUser;
  } catch (error) {
    console.error("Error setting user as admin:", error);
    return null;
  }
}