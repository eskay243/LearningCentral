import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Save, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

interface OAuthProvider {
  name: string;
  displayName: string;
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

const defaultProviders: Record<string, Partial<OAuthProvider>> = {
  google: {
    name: "google",
    displayName: "Google",
    scope: "openid email profile",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo"
  },
  github: {
    name: "github",
    displayName: "GitHub",
    scope: "user:email",
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user"
  },
  microsoft: {
    name: "microsoft",
    displayName: "Microsoft",
    scope: "openid email profile",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userInfoUrl: "https://graph.microsoft.com/v1.0/me"
  }
};

export default function AdminOAuthSettings() {
  const [providers, setProviders] = useState<Record<string, OAuthProvider>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOAuthSettings();
  }, []);

  const loadOAuthSettings = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/oauth-settings");
      if (response.ok) {
        const data = await response.json();
        const loadedProviders: Record<string, OAuthProvider> = {};
        
        // Initialize with defaults and override with saved settings
        Object.keys(defaultProviders).forEach(key => {
          const saved = data.providers?.find((p: any) => p.name === key);
          loadedProviders[key] = {
            ...defaultProviders[key],
            enabled: false,
            clientId: "",
            clientSecret: "",
            redirectUri: `${window.location.origin}/api/auth/${key}/callback`,
            ...saved
          } as OAuthProvider;
        });
        
        setProviders(loadedProviders);
      }
    } catch (error) {
      toast({
        title: "Error loading settings",
        description: "Failed to load OAuth provider settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProvider = (providerName: string, updates: Partial<OAuthProvider>) => {
    setProviders(prev => ({
      ...prev,
      [providerName]: {
        ...prev[providerName],
        ...updates
      }
    }));
  };

  const toggleSecretVisibility = (providerName: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [providerName]: !prev[providerName]
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await apiRequest("POST", "/api/admin/oauth-settings", {
        providers: Object.values(providers)
      });
      
      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "OAuth provider settings have been updated successfully.",
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Failed to save OAuth provider settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (providerName: string) => {
    try {
      const response = await apiRequest("POST", `/api/admin/oauth-test/${providerName}`);
      if (response.ok) {
        toast({
          title: "Connection successful",
          description: `${providers[providerName].displayName} OAuth configuration is working.`,
        });
      } else {
        throw new Error("Connection failed");
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: `Failed to connect to ${providers[providerName].displayName}. Please check your configuration.`,
        variant: "destructive",
      });
    }
  };

  const renderProviderConfig = (providerName: string, provider: OAuthProvider) => (
    <Card key={providerName} className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {providerName === 'google' && (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {providerName === 'github' && (
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            )}
            {providerName === 'microsoft' && (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#F25022" d="M0 0h11.5v11.5H0z"/>
                <path fill="#00A4EF" d="M12.5 0H24v11.5H12.5z"/>
                <path fill="#7FBA00" d="M0 12.5h11.5V24H0z"/>
                <path fill="#FFB900" d="M12.5 12.5H24V24H12.5z"/>
              </svg>
            )}
          </div>
          <div>
            <CardTitle className="text-lg">{provider.displayName}</CardTitle>
            <CardDescription>Configure {provider.displayName} OAuth authentication</CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {provider.enabled && provider.clientId && provider.clientSecret && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          <Switch
            checked={provider.enabled}
            onCheckedChange={(checked) => updateProvider(providerName, { enabled: checked })}
          />
        </div>
      </CardHeader>
      
      {provider.enabled && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${providerName}-client-id`}>Client ID</Label>
              <Input
                id={`${providerName}-client-id`}
                value={provider.clientId}
                onChange={(e) => updateProvider(providerName, { clientId: e.target.value })}
                placeholder="Enter client ID"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor={`${providerName}-client-secret`}>Client Secret</Label>
              <div className="relative mt-1">
                <Input
                  id={`${providerName}-client-secret`}
                  type={showSecrets[providerName] ? "text" : "password"}
                  value={provider.clientSecret}
                  onChange={(e) => updateProvider(providerName, { clientSecret: e.target.value })}
                  placeholder="Enter client secret"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleSecretVisibility(providerName)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showSecrets[providerName] ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor={`${providerName}-redirect-uri`}>Redirect URI</Label>
            <Input
              id={`${providerName}-redirect-uri`}
              value={provider.redirectUri}
              onChange={(e) => updateProvider(providerName, { redirectUri: e.target.value })}
              className="mt-1 bg-gray-50 dark:bg-gray-800"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Use this URL in your {provider.displayName} OAuth app configuration
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => testConnection(providerName)}
              variant="outline"
              size="sm"
              disabled={!provider.clientId || !provider.clientSecret}
            >
              Test Connection
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="mr-3 h-8 w-8" />
            OAuth Provider Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure external authentication providers for your platform
          </p>
        </div>
        <Button onClick={saveSettings} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold">Google OAuth Setup:</h4>
              <p>1. Go to <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></p>
              <p>2. Create a new project or select existing one</p>
              <p>3. Enable Google+ API and create OAuth 2.0 credentials</p>
            </div>
            <div>
              <h4 className="font-semibold">GitHub OAuth Setup:</h4>
              <p>1. Go to <a href="https://github.com/settings/applications/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Developer Settings</a></p>
              <p>2. Register a new OAuth application</p>
            </div>
            <div>
              <h4 className="font-semibold">Microsoft OAuth Setup:</h4>
              <p>1. Go to <a href="https://portal.azure.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Azure Portal</a></p>
              <p>2. Register a new application in Azure Active Directory</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(providers).map(([name, provider]) => 
          renderProviderConfig(name, provider)
        )}
      </div>
    </div>
  );
}