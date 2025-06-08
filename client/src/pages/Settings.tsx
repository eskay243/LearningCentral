import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle, DollarSign, PoundSterling, Receipt, Download, Eye, Calendar, Filter } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useAuth from "@/hooks/useAuth";
import AdminRoleSwitcherSettings from "@/components/AdminRoleSwitcherSettings";

// Type definitions for user profile, notification settings, and currency settings
interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
  profileImageUrl?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  classReminders: boolean;
  assignmentReminders: boolean;
  messageNotifications: boolean;
  announcementNotifications: boolean;
}

interface CurrencySettings {
  defaultCurrency: string;
  exchangeRates: Record<string, number>;
}

// Profile settings form schema
const profileFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters" }).optional(),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters" }).optional(),
  email: z.string().email({ message: "Please enter a valid email address" }),
  bio: z.string().max(500, { message: "Bio must be less than 500 characters" }).optional(),
});

// Notification settings form schema
const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  classReminders: z.boolean().default(true),
  assignmentReminders: z.boolean().default(true),
  messageNotifications: z.boolean().default(true),
  announcementNotifications: z.boolean().default(true),
});

// Currency settings form schema (admin only)
const currencyFormSchema = z.object({
  defaultCurrency: z.enum(["USD", "NGN", "GBP"]).default("NGN"),
  exchangeRates: z.record(z.number().positive()),
});

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const isAdmin = user?.role === "admin";

  // Fetch user profile
  const { data: profile, isLoading: isProfileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users/profile"],
    enabled: !!user,
  });

  // Fetch notification settings
  const { data: notificationSettings, isLoading: isNotificationsLoading } = useQuery<NotificationSettings>({
    queryKey: ["/api/users/notification-settings"],
    enabled: !!user,
  });
  
  // Fetch currency settings (admin only)
  const { data: currencySettings, isLoading: isCurrencyLoading } = useQuery({
    queryKey: ["/api/settings/system", "currency"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings/system?category=currency");
      const data = await response.json();
      return {
        defaultCurrency: data.find((s: any) => s.key === "defaultCurrency")?.value || "NGN",
        exchangeRates: JSON.parse(data.find((s: any) => s.key === "exchangeRates")?.value || '{"NGN": 1500, "GBP": 0.79}')
      };
    }
  });

  // Fetch user invoices
  const { data: invoices = [], isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: !!user,
  });

  // Invoice filter state
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");

  // Default profile values
  const defaultProfile: z.infer<typeof profileFormSchema> = {
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
  };
  
  // Default currency settings
  const defaultCurrency: z.infer<typeof currencyFormSchema> = {
    defaultCurrency: "NGN",
    exchangeRates: {
      NGN: 1500,
      GBP: 0.79,
    }
  };

  // Default notification values
  const defaultNotifications: z.infer<typeof notificationFormSchema> = {
    emailNotifications: true,
    smsNotifications: false,
    classReminders: true,
    assignmentReminders: true, 
    messageNotifications: true,
    announcementNotifications: true,
  };

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaultProfile,
  });
  
  // Currency form (admin only)
  const currencyForm = useForm<z.infer<typeof currencyFormSchema>>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: defaultCurrency,
  });

  // Update when profile data is loaded
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        bio: profile.bio || "",
      });
    }
  }, [profile, profileForm]);

  // Notification form
  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: defaultNotifications,
  });

  // Update when notification settings are loaded
  useEffect(() => {
    if (notificationSettings) {
      notificationForm.reset({
        emailNotifications: notificationSettings.emailNotifications || true,
        smsNotifications: notificationSettings.smsNotifications || false,
        classReminders: notificationSettings.classReminders || true,
        assignmentReminders: notificationSettings.assignmentReminders || true,
        messageNotifications: notificationSettings.messageNotifications || true,
        announcementNotifications: notificationSettings.announcementNotifications || true,
      });
    }
  }, [notificationSettings, notificationForm]);
  
  // Update when currency settings are loaded (admin only)
  useEffect(() => {
    if (currencySettings && isAdmin) {
      currencyForm.reset({
        defaultCurrency: currencySettings.defaultCurrency,
        exchangeRates: currencySettings.exchangeRates
      });
    }
  }, [currencySettings, currencyForm, isAdmin]);

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: (values: z.infer<typeof profileFormSchema>) => {
      return apiRequest("PATCH", "/api/users/profile", values);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error.message || "An error occurred while updating your profile",
        variant: "destructive",
      });
    },
  });

  // Notification settings mutation
  const notificationMutation = useMutation({
    mutationFn: (values: z.infer<typeof notificationFormSchema>) => {
      return apiRequest("PATCH", "/api/users/notification-settings", values);
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/notification-settings"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "An error occurred while updating your notification settings",
        variant: "destructive",
      });
    },
  });
  
  // Currency settings mutation (admin only)
  const currencyMutation = useMutation({
    mutationFn: (values: z.infer<typeof currencyFormSchema>) => {
      // Update multiple system settings at once
      return apiRequest("POST", "/api/settings/system/batch", {
        settings: [
          {
            key: "defaultCurrency",
            value: values.defaultCurrency,
            category: "currency"
          },
          {
            key: "exchangeRates",
            value: JSON.stringify(values.exchangeRates),
            category: "currency"
          }
        ]
      });
    },
    onSuccess: () => {
      toast({
        title: "Currency settings updated",
        description: "The platform currency settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/system", "currency"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update currency settings",
        description: error.message || "An error occurred while updating currency settings",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onProfileSubmit = (values: z.infer<typeof profileFormSchema>) => {
    profileMutation.mutate(values);
  };

  const onNotificationSubmit = (values: z.infer<typeof notificationFormSchema>) => {
    notificationMutation.mutate(values);
  };
  
  const onCurrencySubmit = (values: z.infer<typeof currencyFormSchema>) => {
    currencyMutation.mutate(values);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-800">Settings</h1>
        <p className="mt-1 text-gray-500">Manage your account settings and preferences</p>
      </div>

      <div className="flex flex-col gap-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            {isAdmin ? (
              <TabsTrigger value="system">System</TabsTrigger>
            ) : (
              <TabsTrigger value="payment">Payment Methods</TabsTrigger>
            )}
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your personal information and public profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            This email will be used for account notifications and communications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <textarea
                              className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Tell others about yourself"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description visible to other users (max 500 characters)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Profile Picture</h3>
                      <div className="flex items-center gap-4">
                        <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {profile && profile.profileImageUrl ? (
                            <img
                              src={profile.profileImageUrl}
                              alt="Profile"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="text-4xl text-gray-400 flex items-center justify-center h-full w-full">
                              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Button type="button" variant="outline">
                            Upload New Picture
                          </Button>
                          <p className="text-xs text-gray-500">
                            Recommended size: 400x400px. Max size: 2MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={profileMutation.isPending || !profileForm.formState.isDirty}
                      >
                        {profileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                    <h3 className="text-lg font-medium">Notification Channels</h3>
                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via email
                              </FormDescription>
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
                        control={notificationForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">SMS Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via text message
                              </FormDescription>
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

                    <Separator className="my-6" />

                    <h3 className="text-lg font-medium">Notification Types</h3>
                    <div className="space-y-4">
                      <FormField
                        control={notificationForm.control}
                        name="classReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Class Reminders</FormLabel>
                              <FormDescription>
                                Reminders about upcoming live classes
                              </FormDescription>
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
                        control={notificationForm.control}
                        name="assignmentReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Assignment Reminders</FormLabel>
                              <FormDescription>
                                Reminders about assignment deadlines
                              </FormDescription>
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
                        control={notificationForm.control}
                        name="messageNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Message Notifications</FormLabel>
                              <FormDescription>
                                Notifications for new messages
                              </FormDescription>
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
                        control={notificationForm.control}
                        name="announcementNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Announcement Notifications</FormLabel>
                              <FormDescription>
                                Notifications for course and platform announcements
                              </FormDescription>
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

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={notificationMutation.isPending || !notificationForm.formState.isDirty}
                      >
                        {notificationMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account security and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div></div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button>Update Password</Button>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                  <div className="rounded-lg border p-4">
                    <div className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-base font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="outline">Setup 2FA</Button>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                  <div className="rounded-lg border border-destructive/20 p-4">
                    <div className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-base font-medium">Delete Account</p>
                        <p className="text-sm text-gray-500">
                          Permanently delete your account and all associated data
                        </p>
                      </div>
                      <Button variant="destructive">Delete Account</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  My Invoices
                </CardTitle>
                <CardDescription>
                  View and manage your payment invoices and transaction history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Invoice Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Invoices</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                  </div>

                  {/* Invoice Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Outstanding</p>
                          <p className="text-2xl font-bold text-orange-600">₦125,400</p>
                        </div>
                        <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Receipt className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Paid This Month</p>
                          <p className="text-2xl font-bold text-green-600">₦85,000</p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Overdue Amount</p>
                          <p className="text-2xl font-bold text-red-600">₦25,400</p>
                        </div>
                        <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Invoices Table */}
                  <div className="border rounded-lg">
                    {isInvoicesLoading ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading invoices...</p>
                      </div>
                    ) : invoices.length === 0 ? (
                      <div className="p-8 text-center">
                        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No invoices found</p>
                        <p className="text-sm text-gray-400">Your payment invoices will appear here once created</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((invoice: any) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">#{invoice.invoiceNumber}</TableCell>
                              <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell className="max-w-xs truncate">{invoice.description || 'Course payment'}</TableCell>
                              <TableCell>₦{invoice.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    invoice.status === 'paid' ? 'default' :
                                    invoice.status === 'pending' ? 'secondary' :
                                    invoice.status === 'overdue' ? 'destructive' : 'outline'
                                  }
                                >
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {/* Payment History Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Recent Payment Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Payment Received</p>
                            <p className="text-sm text-gray-500">Invoice #INV-2025-001</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">+₦85,000</p>
                          <p className="text-sm text-gray-500">2 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Invoice Generated</p>
                            <p className="text-sm text-gray-500">Advanced React Course</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₦125,400</p>
                          <p className="text-sm text-gray-500">1 week ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Manage your payment methods and billing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Payment Methods</h3>
                    <Button variant="outline">Add Payment Method</Button>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
                          <i className="ri-visa-line text-2xl text-blue-600"></i>
                        </div>
                        <div>
                          <p className="font-medium">Visa ending in 4242</p>
                          <p className="text-sm text-gray-500">Expires 04/2025</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/90">Remove</Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-100 rounded-md flex items-center justify-center">
                          <i className="ri-bank-line text-2xl text-gray-600"></i>
                        </div>
                        <div>
                          <p className="font-medium">Bank Transfer</p>
                          <p className="text-sm text-gray-500">Default payment method</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Billing Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="billing-name">Name</Label>
                      <Input id="billing-name" defaultValue="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-email">Email</Label>
                      <Input id="billing-email" type="email" defaultValue="john.doe@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-address">Address</Label>
                      <Input id="billing-address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-city">City</Label>
                      <Input id="billing-city" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-state">State/Province</Label>
                      <Input id="billing-state" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-zip">ZIP/Postal Code</Label>
                      <Input id="billing-zip" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-country">Country</Label>
                      <Select defaultValue="us">
                        <SelectTrigger id="billing-country">
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="au">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button>Save Billing Information</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* System Settings (Admin Only) */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure platform-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Currency Settings</h3>
                  <Form {...currencyForm}>
                    <form onSubmit={currencyForm.handleSubmit(onCurrencySubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={currencyForm.control}
                          name="defaultCurrency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Currency</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                The default currency for all transactions on the platform
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-md font-medium">Exchange Rates</h4>
                        <p className="text-sm text-gray-500">Set exchange rates relative to USD</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="ngn-rate" className="w-20">NGN Rate:</Label>
                            <Input 
                              id="ngn-rate"
                              type="number" 
                              step="0.01"
                              value={currencyForm.watch('exchangeRates')?.NGN || 1500}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value > 0) {
                                  const exchangeRates = { ...currencyForm.getValues('exchangeRates'), NGN: value };
                                  currencyForm.setValue('exchangeRates', exchangeRates, { shouldDirty: true });
                                }
                              }}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="gbp-rate" className="w-20">GBP Rate:</Label>
                            <Input 
                              id="gbp-rate"
                              type="number" 
                              step="0.01"
                              value={currencyForm.watch('exchangeRates')?.GBP || 0.79}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value) && value > 0) {
                                  const exchangeRates = { ...currencyForm.getValues('exchangeRates'), GBP: value };
                                  currencyForm.setValue('exchangeRates', exchangeRates, { shouldDirty: true });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={currencyMutation.isPending || !currencyForm.formState.isDirty}
                        >
                          {currencyMutation.isPending ? "Saving..." : "Save Currency Settings"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
