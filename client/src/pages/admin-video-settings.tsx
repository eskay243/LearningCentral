import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Video, 
  Settings, 
  Key, 
  Shield, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  Save,
  TestTube,
  Eye,
  EyeOff
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Video provider configuration schemas
const googleMeetSchema = z.object({
  provider: z.literal("google_meet"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  redirectUri: z.string().url("Valid redirect URI is required"),
  webhookUrl: z.string().url().optional(),
  isActive: z.boolean().default(false),
  features: z.object({
    recording: z.boolean().default(true),
    waiting_room: z.boolean().default(true),
    chat: z.boolean().default(true),
    polls: z.boolean().default(false)
  })
});

const zoomSchema = z.object({
  provider: z.literal("zoom"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  apiKey: z.string().min(1, "API Key is required"),
  accountId: z.string().min(1, "Account ID is required"),
  userId: z.string().min(1, "User ID is required"),
  redirectUri: z.string().url("Valid redirect URI is required"),
  webhookUrl: z.string().url().optional(),
  isActive: z.boolean().default(false),
  features: z.object({
    recording: z.boolean().default(true),
    waiting_room: z.boolean().default(true),
    chat: z.boolean().default(true),
    polls: z.boolean().default(true)
  })
});

const zohoSchema = z.object({
  provider: z.literal("zoho"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  apiKey: z.string().min(1, "API Key is required"),
  region: z.string().min(1, "Region is required"),
  dataCenter: z.string().min(1, "Data Center is required"),
  redirectUri: z.string().url("Valid redirect URI is required"),
  webhookUrl: z.string().url().optional(),
  isActive: z.boolean().default(false),
  features: z.object({
    recording: z.boolean().default(true),
    waiting_room: z.boolean().default(true),
    chat: z.boolean().default(true),
    polls: z.boolean().default(true)
  })
});

type VideoProviderConfig = z.infer<typeof googleMeetSchema> | z.infer<typeof zoomSchema> | z.infer<typeof zohoSchema>;

export default function AdminVideoSettings() {
  const { toast } = useToast();
  const [activeProvider, setActiveProvider] = useState<string>("google_meet");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Fetch video provider settings
  const { data: providerSettings, isLoading } = useQuery({
    queryKey: ['/api/video-providers/settings'],
    queryFn: async () => {
      const response = await fetch('/api/video-providers/settings');
      if (!response.ok) throw new Error('Failed to fetch provider settings');
      return response.json();
    },
  });

  // Save configuration mutation
  const saveConfigMutation = useMutation({
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

  // Test connection mutation
  const testConnectionMutation = useMutation({
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

  const toggleShowSecret = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getProviderIcon = (provider: string) => {
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

  const getProviderStatus = (provider: string) => {
    const settings = providerSettings?.find((p: any) => p.provider === provider);
    if (!settings) return { status: 'not_configured', label: 'Not Configured', color: 'gray' };
    if (!settings.isActive) return { status: 'inactive', label: 'Configured but Inactive', color: 'yellow' };
    return { status: 'active', label: 'Active', color: 'green' };
  };

  // Form configurations for each provider
  const getFormSchema = (provider: string) => {
    switch (provider) {
      case 'google_meet': return googleMeetSchema;
      case 'zoom': return zoomSchema;
      case 'zoho': return zohoSchema;
      default: return googleMeetSchema;
    }
  };

  const form = useForm<VideoProviderConfig>({
    resolver: zodResolver(getFormSchema(activeProvider)),
    defaultValues: {
      provider: activeProvider as any,
      isActive: false,
      features: {
        recording: true,
        waiting_room: true,
        chat: true,
        polls: true
      }
    }
  });

  // Update form when provider or settings change
  useEffect(() => {
    const settings = providerSettings?.find((p: any) => p.provider === activeProvider);
    if (settings) {
      form.reset({
        ...settings,
        provider: activeProvider as any,
        features: settings.features || {
          recording: true,
          waiting_room: true,
          chat: true,
          polls: true
        }
      });
    } else {
      form.reset({
        provider: activeProvider as any,
        isActive: false,
        features: {
          recording: true,
          waiting_room: true,
          chat: true,
          polls: true
        }
      });
    }
  }, [activeProvider, providerSettings, form]);

  const onSubmit = (data: VideoProviderConfig) => {
    saveConfigMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">Video Conferencing Settings</h1>
          <p className="text-gray-600">Configure API settings for Google Meet, Zoom, and Zoho Meeting</p>
        </div>
      </div>

      {/* Provider Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['google_meet', 'zoom', 'zoho'].map((provider) => {
          const status = getProviderStatus(provider);
          return (
            <Card
              key={provider}
              className={`cursor-pointer transition-all duration-200 ${
                activeProvider === provider
                  ? 'ring-2 ring-purple-500 border-purple-500'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setActiveProvider(provider)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  {getProviderIcon(provider)}
                  <div className="flex-1">
                    <h3 className="font-semibold capitalize">
                      {provider.replace('_', ' ')}
                    </h3>
                    <Badge
                      variant={status.color === 'green' ? 'default' : status.color === 'yellow' ? 'secondary' : 'outline'}
                      className="text-xs mt-1"
                    >
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getProviderIcon(activeProvider)}
              <div>
                <CardTitle className="capitalize">
                  {activeProvider.replace('_', ' ')} Configuration
                </CardTitle>
                <CardDescription>
                  Configure API credentials and features for {activeProvider.replace('_', ' ')}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testConnectionMutation.mutate(activeProvider)}
              disabled={testConnectionMutation.isPending}
              className="flex items-center space-x-2"
            >
              <TestTube className="w-4 h-4" />
              <span>Test Connection</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>API Credentials</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter Client ID" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="clientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Secret</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showSecrets.clientSecret ? "text" : "password"}
                              placeholder="Enter Client Secret"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              onClick={() => toggleShowSecret('clientSecret')}
                            >
                              {showSecrets.clientSecret ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Provider-specific fields */}
                {activeProvider === 'zoom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showSecrets.apiKey ? "text" : "password"}
                                placeholder="Enter API Key"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                onClick={() => toggleShowSecret('apiKey')}
                              >
                                {showSecrets.apiKey ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter Account ID" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {activeProvider === 'zoho' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="region"
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
                              <SelectItem value="com">US (.com)</SelectItem>
                              <SelectItem value="eu">Europe (.eu)</SelectItem>
                              <SelectItem value="in">India (.in)</SelectItem>
                              <SelectItem value="com.au">Australia (.com.au)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dataCenter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Center</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter Data Center" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="redirectUri"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Redirect URI</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://your-domain.com/api/callback" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Features Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Features & Settings</span>
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="features.recording"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Recording</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="features.waiting_room"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Waiting Room</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="features.chat"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Chat</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="features.polls"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Polls</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Activation */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div>
                        <FormLabel>Activate Provider</FormLabel>
                        <p className="text-sm text-gray-600">
                          Enable this provider for creating live sessions
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="submit"
                  disabled={saveConfigMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5" />
            <span>Setup Documentation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Google Meet Setup</h4>
              <p className="text-sm text-gray-600">
                Create credentials in Google Cloud Console and enable Calendar API
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Google Cloud Console
                </a>
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Zoom Setup</h4>
              <p className="text-sm text-gray-600">
                Create a Server-to-Server OAuth app in Zoom Marketplace
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Zoom Marketplace
                </a>
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Zoho Meeting Setup</h4>
              <p className="text-sm text-gray-600">
                Register your application in Zoho API Console
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://api-console.zoho.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Zoho API Console
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}