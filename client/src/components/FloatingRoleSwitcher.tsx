import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Users, 
  GraduationCap, 
  DollarSign, 
  Settings,
  X,
  Loader2,
  RotateCcw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { UserRole } from "@shared/schema";

interface FloatingRoleSwitcherProps {
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
}

export default function FloatingRoleSwitcher({ 
  isEnabled, 
  onToggleEnabled 
}: FloatingRoleSwitcherProps) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Get original user role for permissions (stored when first logged in)
  const originalUserRole = localStorage.getItem('original-user-role') || user?.role;

  // Filter available roles based on current user's permissions
  const getAvailableRoles = () => {
    const allRoles = [
      {
        key: UserRole.ADMIN,
        label: "Admin",
        icon: Shield,
        color: "bg-red-500 hover:bg-red-600",
        description: "Full system access"
      },
      {
        key: UserRole.MENTOR,
        label: "Mentor",
        icon: Users,
        color: "bg-blue-500 hover:bg-blue-600",
        description: "Course management"
      },
      {
        key: UserRole.STUDENT,
        label: "Student",
        icon: GraduationCap,
        color: "bg-green-500 hover:bg-green-600",
        description: "Learning interface"
      },
      {
        key: UserRole.AFFILIATE,
        label: "Affiliate",
        icon: DollarSign,
        color: "bg-purple-500 hover:bg-purple-600",
        description: "Partner access"
      }
    ];

    if (originalUserRole === UserRole.ADMIN) {
      // Admin can switch to all roles
      return allRoles;
    } else if (originalUserRole === UserRole.MENTOR) {
      // Mentor can only switch between mentor and student
      return allRoles.filter(role => 
        role.key === UserRole.MENTOR || role.key === UserRole.STUDENT
      );
    }
    
    // Students and affiliates cannot use role switcher (handled by permission check above)
    return [];
  };

  const roles = getAvailableRoles();

  const switchUserRole = async (role: string) => {
    setIsSwitching(true);
    try {
      const response = await fetch(`/api/switch-user-role/${role}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to switch role: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      toast({
        title: "Role switched successfully",
        description: `Changed to ${role} role. Refreshing interface...`,
      });

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Close the switcher and refresh
      setIsOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error("Role switch error:", error);
      toast({
        title: "Failed to switch role",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSwitching(false);
    }
  };

  // Don't render if not enabled or user doesn't have permission based on original role
  const canUseRoleSwitcher = user && (originalUserRole === UserRole.ADMIN || originalUserRole === UserRole.MENTOR);
  if (!isEnabled || !canUseRoleSwitcher) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
          size="sm"
        >
          {isOpen ? <X className="h-6 w-6" /> : <RotateCcw className="h-6 w-6" />}
        </Button>
      </div>

      {/* Role Switcher Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40">
          <Card className="w-80 shadow-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Role Switcher
                </h3>
                <Badge variant="outline" className="text-xs">
                  Current: {user.role}
                </Badge>
              </div>

              {/* Admin Toggle Control */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4">
                <Label htmlFor="role-switcher-toggle" className="text-sm font-medium">
                  Enable Role Switcher
                </Label>
                <Switch
                  id="role-switcher-toggle"
                  checked={isEnabled}
                  onCheckedChange={onToggleEnabled}
                />
              </div>

              <div className="space-y-2">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isCurrentRole = user.role === role.key;
                  
                  return (
                    <Button
                      key={role.key}
                      variant={isCurrentRole ? "outline" : "ghost"}
                      className={`w-full justify-start h-auto p-3 ${
                        isCurrentRole 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      disabled={isSwitching || isCurrentRole}
                      onClick={() => switchUserRole(role.key)}
                    >
                      <div className="flex items-center w-full">
                        <div className={`p-2 rounded-full mr-3 ${role.color} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {role.description}
                          </div>
                        </div>
                        {isSwitching ? (
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        ) : isCurrentRole ? (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        ) : null}
                      </div>
                    </Button>
                  );
                })}
              </div>

              <div className="mt-4 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
                  <Settings className="h-3 w-3 inline mr-1" />
                  Development tool - Admin only
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Overlay to close when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}