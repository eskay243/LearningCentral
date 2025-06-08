import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  RotateCcw, 
  Shield, 
  AlertTriangle,
  Info
} from "lucide-react";

interface AdminRoleSwitcherSettingsProps {
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
}

export default function AdminRoleSwitcherSettings({ 
  isEnabled, 
  onToggleEnabled 
}: AdminRoleSwitcherSettingsProps) {
  const { toast } = useToast();
  const [localEnabled, setLocalEnabled] = useState(isEnabled);

  useEffect(() => {
    setLocalEnabled(isEnabled);
  }, [isEnabled]);

  const handleToggle = (enabled: boolean) => {
    setLocalEnabled(enabled);
    onToggleEnabled(enabled);
    
    toast({
      title: enabled ? "Role Switcher Enabled" : "Role Switcher Disabled",
      description: enabled 
        ? "The floating role switcher is now available for testing"
        : "The floating role switcher has been hidden",
    });
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <CardTitle className="text-lg">Role Switcher Control</CardTitle>
          </div>
          <Badge variant={localEnabled ? "default" : "secondary"}>
            {localEnabled ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="role-switcher-toggle" className="text-base font-medium">
              Enable Floating Role Switcher
            </Label>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Shows a floating button for quick role switching during development
            </p>
          </div>
          <Switch
            id="role-switcher-toggle"
            checked={localEnabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {/* Status Information */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Development Tool
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                The role switcher allows testing different user permissions and features
              </p>
            </div>
          </div>

          {localEnabled && (
            <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <RotateCcw className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Floating Button Active
                </p>
                <p className="text-green-700 dark:text-green-300">
                  Look for the floating button in the bottom-right corner of the screen
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Role-Based Access
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                Admin: All roles • Mentor: Student/Mentor only • Student/Affiliate: No access
              </p>
            </div>
          </div>
        </div>

        {/* Available Roles */}
        <div className="space-y-3">
          <h4 className="font-medium text-slate-900 dark:text-slate-100">
            Available Roles
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Admin", color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" },
              { name: "Mentor", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" },
              { name: "Student", color: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200" },
              { name: "Affiliate", color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200" }
            ].map((role) => (
              <Badge key={role.name} variant="outline" className={role.color}>
                {role.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "Role Switcher Info",
                description: "Use the floating button to quickly switch between user roles for testing",
              });
            }}
          >
            <Info className="h-4 w-4 mr-2" />
            Show Info
          </Button>
          
          <Button
            variant={localEnabled ? "destructive" : "default"}
            size="sm"
            onClick={() => handleToggle(!localEnabled)}
          >
            <Shield className="h-4 w-4 mr-2" />
            {localEnabled ? "Disable" : "Enable"} Switcher
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}