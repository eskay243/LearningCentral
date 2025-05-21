import { useQuery } from "@tanstack/react-query";
import { User, UserRole } from "@/types";
import { useState, useEffect } from "react";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  
  const { 
    data: user, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (redirectToLogin) {
      // Redirect to login
      window.location.href = "/api/login";
    }
  }, [redirectToLogin]);

  // Provide a login function
  const login = () => {
    // For testing/development purposes, use the test login page
    // In production, this would use the regular login endpoint
    window.location.href = "/test-login";
  };

  // Provide a test login function specifically for demo roles
  const testLogin = () => {
    window.location.href = "/test-login";
  };

  // Provide a logout function
  const logout = () => {
    window.location.href = "/api/logout";
  };

  // Handle manual retry of authentication
  const retryAuth = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error("Authentication retry failed:", error);
      setRedirectToLogin(true);
    }
  };

  return {
    user,
    isLoading,
    isError,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === UserRole.ADMIN,
    isMentor: user?.role === UserRole.MENTOR,
    isStudent: user?.role === UserRole.STUDENT,
    isAffiliate: user?.role === UserRole.AFFILIATE,
    login,
    testLogin,
    logout,
    retryAuth
  };
}

export default useAuth;
