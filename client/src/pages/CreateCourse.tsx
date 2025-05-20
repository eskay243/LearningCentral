import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useAuth from "@/hooks/useAuth";

// Course creation schema with validations
const courseSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }).max(100),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  thumbnail: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  price: z.coerce.number().min(0, { message: "Price cannot be negative" }),
  category: z.string().min(1, { message: "Please select a category" }),
  tags: z.string().optional(), // Will be split into array
  isPublished: z.boolean().default(false),
});

type CourseFormValues = z.infer<typeof courseSchema>;

const CreateCourse = () => {
  const [, navigate] = useLocation();
  const { isAdmin, isMentor } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail: "",
      price: 0,
      category: "",
      tags: "",
      isPublished: false,
    },
  });

  // Set up course creation mutation
  const createCourseMutation = useMutation({
    mutationFn: (data: CourseFormValues) => {
      // Transform tags from string to array
      const tagsArray = data.tags ? data.tags.split(",").map(tag => tag.trim()) : [];
      
      return apiRequest("POST", "/api/courses", {
        ...data,
        tags: tagsArray,
      });
    },
    onSuccess: async (response) => {
      const courseData = await response.json();
      toast({
        title: "Course created successfully",
        description: "You can now add content to your course.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      navigate(`/courses/${courseData.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to create course",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: CourseFormValues) => {
    if (!isAdmin && !isMentor) {
      toast({
        title: "Permission denied",
        description: "You need to be a mentor or admin to create courses.",
        variant: "destructive",
      });
      return;
    }
    
    createCourseMutation.mutate(data);
  };

  const categories = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "sql", label: "SQL" },
    { value: "web", label: "Web Development" },
    { value: "data", label: "Data Science" },
    { value: "mobile", label: "Mobile Development" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-800">Create New Course</h1>
        <p className="mt-1 text-gray-500">Set up your course details to get started</p>
      </div>
      
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>
            Fill in the basic information about your course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Advanced JavaScript Programming" {...field} />
                    </FormControl>
                    <FormDescription>
                      Choose a clear, specific title that describes what students will learn
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
                        placeholder="Describe your course in detail..." 
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Explain what students will learn, requirements, and target audience
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category*</FormLabel>
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
                        Choose the most relevant category
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
                          placeholder="javascript, web, programming" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated tags to help with discoverability
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/your-image.jpg" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a URL for your course thumbnail image (recommended ratio 16:9)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00" 
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
              
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/courses")}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createCourseMutation.isPending}
                >
                  {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCourse;
