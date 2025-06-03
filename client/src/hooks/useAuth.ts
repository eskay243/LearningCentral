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
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/user", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null; // Not authenticated
        }
        
        if (!res.ok) {
          throw new Error(`Authentication failed: ${res.status}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Auth query error:", error);
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });



  useEffect(() => {
    if (redirectToLogin) {
      // Redirect to login
      window.location.href = "/api/login";
    }
  }, [redirectToLogin]);

  // Provide a login function
  const login = () => {
    window.location.href = "/api/login";
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
    isAdmin: user?.role === "admin",
    isMentor: user?.role === "mentor", 
    isStudent: user?.role === "student",
    isAffiliate: user?.role === "affiliate",
    login,
    logout,
    retryAuth
  };
}

export default useAuth;
