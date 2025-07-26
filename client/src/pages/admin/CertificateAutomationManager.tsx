import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Award, 
  Settings, 
  Play, 
  BarChart3, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Zap
} from "lucide-react";

export default function CertificateAutomationManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch automation settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/certificates/automation-settings"],
    queryFn: () => apiRequest("GET", "/api/certificates/automation-settings").then(res => res.json()),
  });

  // Fetch automation statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/certificates/automation-stats"],
    queryFn: () => apiRequest("GET", "/api/certificates/automation-stats").then(res => res.json()),
  });

  // Update automation settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => apiRequest("POST", "/api/certificates/automation-settings", newSettings),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Certificate automation settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/automation-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update automation settings",
        variant: "destructive",
      });
    },
  });

  // Manual certificate generation mutation
  const generateCertificatesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/certificates/auto-generate"),
    onSuccess: () => {
      setIsGenerating(false);
      toast({
        title: "Certificates Generated",
        description: "Automated certificate generation completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates/automation-stats"] });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate certificates",
        variant: "destructive",
      });
    },
  });

  const handleSettingsUpdate = (key: string, value: any) => {
    const updatedSettings = {
      ...settings,
      [key]: value
    };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const handleManualGeneration = () => {
    setIsGenerating(true);
    generateCertificatesMutation.mutate();
  };

  if (settingsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Certificate Automation</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage automated certificate generation and settings</p>
        </div>
        
        <Button 
          onClick={handleManualGeneration} 
          disabled={isGenerating}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Manual Generation
            </>
          )}
        </Button>
      </div>

      {/* Overview Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCertificatesGenerated || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.certificatesThisMonth || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Completions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCertificates || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ready for certificate generation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate || 100}%</div>
              <p className="text-xs text-muted-foreground">
                Automation success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Run</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lastRunTime || "Never"}</div>
              <p className="text-xs text-muted-foreground">
                Last automation run
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Automation Settings</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="history">Generation History</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Certificate Automation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  {/* Enable/Disable Automation */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Automatic Certificate Generation</Label>
                      <div className="text-sm text-gray-600">
                        Automatically generate certificates when students complete courses
                      </div>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => handleSettingsUpdate('enabled', checked)}
                    />
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Generate on Course Completion</Label>
                        <div className="text-sm text-gray-600">
                          Trigger certificate generation immediately when a course is completed
                        </div>
                      </div>
                      <Switch
                        checked={settings.autoGenerateOnCompletion}
                        onCheckedChange={(checked) => handleSettingsUpdate('autoGenerateOnCompletion', checked)}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="minPassingScore" className="text-base">
                        Minimum Passing Score (%)
                      </Label>
                      <div className="text-sm text-gray-600 mb-3">
                        Students must achieve this score to receive a certificate
                      </div>
                      <div className="flex items-center space-x-4">
                        <Input
                          id="minPassingScore"
                          type="number"
                          min="0"
                          max="100"
                          value={settings.minPassingScore || 70}
                          onChange={(e) => handleSettingsUpdate('minPassingScore', parseInt(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm text-gray-600">% minimum score required</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="space-y-4">
                      <Label className="text-base">Automation Status</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${settings.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm">
                            Automation: {settings.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${settings.autoGenerateOnCompletion ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <span className="text-sm">
                            Real-time Generation: {settings.autoGenerateOnCompletion ? 'Active' : 'Manual Only'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          {stats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Certificate Generation Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completion Rate</span>
                          <span>{stats.completionRate || 95}%</span>
                        </div>
                        <Progress value={stats.completionRate || 95} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Success Rate</span>
                          <span>{stats.successRate || 100}%</span>
                        </div>
                        <Progress value={stats.successRate || 100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Processing Speed</span>
                          <span>Excellent</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Generated Today</span>
                        <Badge variant="default">{stats.certificatesToday || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Generated This Week</span>
                        <Badge variant="secondary">{stats.certificatesThisWeek || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Generated This Month</span>
                        <Badge variant="outline">{stats.certificatesThisMonth || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Failed Generations</span>
                        <Badge variant={stats.failedGenerations > 0 ? "destructive" : "default"}>
                          {stats.failedGenerations || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recentActivity?.length > 0 ? (
                      stats.recentActivity.map((activity: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <div>
                              <div className="font-medium">{activity.type}</div>
                              <div className="text-sm text-gray-600">{activity.description}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">{activity.timestamp}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Certificate Generation History</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export History
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.generationHistory?.length > 0 ? (
                  stats.generationHistory.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">
                            {entry.certificatesGenerated || 0} certificates generated
                          </div>
                          <div className="text-sm text-gray-600">
                            {entry.type === 'manual' ? 'Manual generation' : 'Automatic generation'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{entry.timestamp}</div>
                        <div className="text-xs text-gray-500">
                          {entry.duration || 'N/A'} duration
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No generation history available</p>
                    <p className="text-sm">Run your first automated generation to see history here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}