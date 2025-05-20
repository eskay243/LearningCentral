import { useQuery } from "@tanstack/react-query";
import { User } from "@/types";

export function useAuth() {
  const { data: user, isLoading, isError, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

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
  };
}

export default useAuth;
