import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import useAuth from "@/hooks/useAuth";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  thumbnail: z.string().optional(),
  price: z.string().transform((val) => (val === "" ? "0" : val)),
  isPublished: z.boolean().default(false),
  category: z.string().optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreateCourse = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail: "",
      price: "0",
      isPublished: false,
      category: "",
      tags: undefined,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/courses", values);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create course");
      }
      
      const courseData = await response.json();
      
      toast({
        title: "Course created successfully!",
        description: "You can now add modules and lessons to your course.",
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      
      // Navigate to the course edit page
      navigate(`/courses/${courseData.id}`);
    } catch (error: any) {
      toast({
        title: "Failed to create course",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "sql", label: "SQL" },
    { value: "web", label: "Web Development" },
    { value: "data", label: "Data Science" },
    { value: "mobile", label: "Mobile Development" },
    { value: "design", label: "Design" },
    { value: "marketing", label: "Marketing" },
    { value: "business", label: "Business" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Create a New Course</h1>
          <p className="text-gray-500">Fill in the details to create your course</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/courses")}>Cancel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                <TabsContent value="basic" className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Complete JavaScript Course 2025" {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear, specific title performs better
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Description*</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What your students will learn in this course..."
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed descriptions help with discoverability
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Categorizing your course helps with discoverability
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="web,javascript,beginners"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated tags (e.g. web,javascript,beginners)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="thumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL to your course thumbnail image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Set to 0 for a free course
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-2">Pricing Strategy</h3>
                  <p className="text-gray-500 mb-4">
                    Consider your pricing carefully. Premium pricing signals quality,
                    but lower prices may attract more students.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="text-blue-700 font-medium">Pricing Tips</h4>
                    <ul className="text-blue-600 text-sm space-y-1 mt-1">
                      <li>• Research competitor pricing for similar courses</li>
                      <li>• Consider your target audience's purchasing power</li>
                      <li>• You can adjust pricing later as needed</li>
                      <li>• Free courses can help build your audience</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-6">
                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Publish Course
                        </FormLabel>
                        <FormDescription>
                          When published, your course will be visible to students
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
                
                <Separator />
                
                <div className="bg-yellow-50 p-4 rounded-md">
                  <h4 className="text-yellow-700 font-medium">Course Creation Tips</h4>
                  <ul className="text-yellow-600 text-sm space-y-1 mt-1">
                    <li>• You can save as draft and publish later</li>
                    <li>• After creating, you'll be able to add modules and lessons</li>
                    <li>• Organize your content logically for better learning outcomes</li>
                    <li>• Include a mix of content types (videos, text, quizzes, etc.)</li>
                  </ul>
                </div>
              </TabsContent>
              
              <div className="pt-4 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/courses")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span> 
                      Creating...
                    </>
                  ) : "Create Course"}
                </Button>
              </div>
            </form>
          </Form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCourse;