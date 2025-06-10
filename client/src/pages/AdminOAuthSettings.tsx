import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Save, Eye, EyeOff, AlertCircle, CheckCircle2, Video, Key, Shield, TestTube, Info } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

// Video provider configuration schemas
const googleMeetSchema = z.object({
  provider: z.literal("google_meet"),
  isActive: z.boolean(),
  settings: z.object({
    clientId: z.string().min(1, "Client ID is required"),
    clientSecret: z.string().min(1, "Client Secret is required"),
    projectId: z.string().min(1, "Project ID is required"),
    calendarId: z.string().optional(),
  }),
  features: z.object({
    recording: z.boolean(),
    waiting_room: z.boolean(),
    chat: z.boolean(),
    polls: z.boolean(),
  }),
});

const zoomSchema = z.object({
  provider: z.literal("zoom"),
  isActive: z.boolean(),
  settings: z.object({
    apiKey: z.string().min(1, "API Key is required"),
    apiSecret: z.string().min(1, "API Secret is required"),
    accountId: z.string().min(1, "Account ID is required"),
    webhookSecret: z.string().optional(),
  }),
  features: z.object({
    recording: z.boolean(),
    waiting_room: z.boolean(),
    chat: z.boolean(),
    polls: z.boolean(),
  }),
});

const zohoSchema = z.object({
  provider: z.literal("zoho"),
  isActive: z.boolean(),
  settings: z.object({
    clientId: z.string().min(1, "Client ID is required"),
    clientSecret: z.string().min(1, "Client Secret is required"),
    region: z.string().min(1, "Region is required"),
    refreshToken: z.string().optional(),
  }),
  features: z.object({
    recording: z.boolean(),
    waiting_room: z.boolean(),
    chat: z.boolean(),
    polls: z.boolean(),
  }),
});

type VideoProviderConfig = z.infer<typeof googleMeetSchema> | z.infer<typeof zoomSchema> | z.infer<typeof zohoSchema>;

export default function AdminOAuthSettings() {
  const [providers, setProviders] = useState<Record<string, OAuthProvider>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Video settings state
  const [activeProvider, setActiveProvider] = useState<string>("google_meet");
  const [showVideoSecrets, setShowVideoSecrets] = useState<Record<string, boolean>>({});

  // Fetch video provider settings
  const { data: providerSettings, isLoading: videoLoading } = useQuery({
    queryKey: ['/api/video-providers/settings'],
    queryFn: async () => {
      const response = await fetch('/api/video-providers/settings');
      if (!response.ok) throw new Error('Failed to fetch provider settings');
      return response.json();
    },
  });

  // Save video configuration mutation
  const saveVideoConfigMutation = useMutation({
    mutationFn: async (config: VideoProviderConfig) => {
      const response = await apiRequest("POST", "/api/video-providers/settings", config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/video-providers/settings'] });
      toast({
        title: "Configuration Saved",
        description: "Video provider settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test video connection mutation
  const testVideoConnectionMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("POST", `/api/video-providers/${provider}/test`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Test Successful",
        description: `Successfully connected to ${activeProvider.replace('_', ' ')} API`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  // Video settings helper functions
  const getVideoProviderStatus = (provider: string) => {
    const settings = providerSettings?.find((p: any) => p.provider === provider);
    if (!settings) return { status: 'not_configured', label: 'Not Configured', color: 'gray' };
    if (!settings.isActive) return { status: 'inactive', label: 'Configured but Inactive', color: 'yellow' };
    return { status: 'active', label: 'Active', color: 'green' };
  };

  const getVideoFormSchema = (provider: string) => {
    switch (provider) {
      case 'google_meet': return googleMeetSchema;
      case 'zoom': return zoomSchema;
      case 'zoho': return zohoSchema;
      default: return googleMeetSchema;
    }
  };

  const videoForm = useForm<VideoProviderConfig>({
    resolver: zodResolver(getVideoFormSchema(activeProvider)),
    defaultValues: {
      provider: activeProvider as any,
      isActive: false,
      settings: {},
      features: {
        recording: true,
        waiting_room: true,
        chat: true,
        polls: true
      }
    }
  });

  const toggleVideoSecretVisibility = (field: string) => {
    setShowVideoSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getVideoProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google_meet':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'zoom':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'zoho':
        return <Video className="w-5 h-5 text-red-500" />;
      default:
        return <Video className="w-5 h-5" />;
    }
  };

  const onVideoSubmit = (data: VideoProviderConfig) => {
    saveVideoConfigMutation.mutate(data);
  };

  const renderVideoSettings = () => {
    if (videoLoading) {
      return (
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {['google_meet', 'zoom', 'zoho'].map((provider) => {
            const status = getVideoProviderStatus(provider);
            return (
              <Card 
                key={provider}
                className={`cursor-pointer transition-all ${
                  activeProvider === provider ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setActiveProvider(provider)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getVideoProviderIcon(provider)}
                      <div>
                        <h3 className="font-medium capitalize">
                          {provider.replace('_', ' ')}
                        </h3>
                        <Badge 
                          variant={status.color === 'green' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                    {status.status === 'active' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Form {...videoForm}>
          <form onSubmit={videoForm.handleSubmit(onVideoSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  {getVideoProviderIcon(activeProvider)}
                  <span className="capitalize">
                    {activeProvider.replace('_', ' ')} Configuration
                  </span>
                </CardTitle>
                <CardDescription>
                  Configure {activeProvider.replace('_', ' ')} API settings for video conferencing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={videoForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Enable {activeProvider.replace('_', ' ')}
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Allow this provider to be used for video conferences
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {videoForm.watch('isActive') && (
                  <div className="space-y-4">
                    {activeProvider === 'google_meet' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={videoForm.control}
                            name="settings.clientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="Google OAuth Client ID" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={videoForm.control}
                            name="settings.clientSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client Secret</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      type={showVideoSecrets.clientSecret ? "text" : "password"}
                                      placeholder="Google OAuth Client Secret" 
                                      {...field} 
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2"
                                      onClick={() => toggleVideoSecretVisibility('clientSecret')}
                                    >
                                      {showVideoSecrets.clientSecret ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={videoForm.control}
                          name="settings.projectId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project ID</FormLabel>
                              <FormControl>
                                <Input placeholder="Google Cloud Project ID" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {activeProvider === 'zoom' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={videoForm.control}
                            name="settings.apiKey"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Key</FormLabel>
                                <FormControl>
                                  <Input placeholder="Zoom API Key" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={videoForm.control}
                            name="settings.apiSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Secret</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      type={showVideoSecrets.apiSecret ? "text" : "password"}
                                      placeholder="Zoom API Secret" 
                                      {...field} 
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2"
                                      onClick={() => toggleVideoSecretVisibility('apiSecret')}
                                    >
                                      {showVideoSecrets.apiSecret ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={videoForm.control}
                          name="settings.accountId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account ID</FormLabel>
                              <FormControl>
                                <Input placeholder="Zoom Account ID" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {activeProvider === 'zoho' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={videoForm.control}
                            name="settings.clientId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="Zoho Client ID" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={videoForm.control}
                            name="settings.clientSecret"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client Secret</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      type={showVideoSecrets.clientSecret ? "text" : "password"}
                                      placeholder="Zoho Client Secret" 
                                      {...field} 
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2"
                                      onClick={() => toggleVideoSecretVisibility('clientSecret')}
                                    >
                                      {showVideoSecrets.clientSecret ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={videoForm.control}
                          name="settings.region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select region" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="us">United States</SelectItem>
                                  <SelectItem value="eu">Europe</SelectItem>
                                  <SelectItem value="in">India</SelectItem>
                                  <SelectItem value="au">Australia</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <Separator />

                    <div>
                      <h4 className="text-sm font-medium mb-3">Feature Settings</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={videoForm.control}
                          name="features.recording"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">Recording</FormLabel>
                                <div className="text-xs text-muted-foreground">
                                  Enable session recording
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={videoForm.control}
                          name="features.waiting_room"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">Waiting Room</FormLabel>
                                <div className="text-xs text-muted-foreground">
                                  Enable waiting room
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={videoForm.control}
                          name="features.chat"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">Chat</FormLabel>
                                <div className="text-xs text-muted-foreground">
                                  Enable in-meeting chat
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={videoForm.control}
                          name="features.polls"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">Polls</FormLabel>
                                <div className="text-xs text-muted-foreground">
                                  Enable live polls
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => testVideoConnectionMutation.mutate(activeProvider)}
                        disabled={testVideoConnectionMutation.isPending}
                      >
                        <TestTube className="mr-2 h-4 w-4" />
                        {testVideoConnectionMutation.isPending ? "Testing..." : "Test Connection"}
                      </Button>

                      <Button type="submit" disabled={saveVideoConfigMutation.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {saveVideoConfigMutation.isPending ? "Saving..." : "Save Configuration"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="mr-3 h-8 w-8" />
            Authentication & Video Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure OAuth providers and video conferencing settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="oauth" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="oauth">OAuth Providers</TabsTrigger>
          <TabsTrigger value="video">Video Conferencing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="oauth" className="space-y-6 mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={saveSettings} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save OAuth Settings"}
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
        </TabsContent>
        
        <TabsContent value="video" className="space-y-6 mt-6">
          {renderVideoSettings()}
        </TabsContent>
      </Tabs>
    </div>
  );
}