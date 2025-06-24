import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import useAuth from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, X, Edit2, Eye, ArrowLeft } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  thumbnail: z.string().optional(),
  price: z.string().transform((val) => (val === "" ? "0" : val)),
  isPublished: z.boolean().default(false),
  category: z.string().optional(),
  tags: z.string().optional(),
  estimatedDuration: z.string().optional(),
  skillLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  isPaid: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

const CreateCourse = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  
  // Extract course ID from URL for edit mode
  const pathSegments = location.split('/');
  const courseId = pathSegments[2] && pathSegments[3] === 'edit' ? pathSegments[2] : null;
  const isEditMode = courseId !== null;
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categories, setCategories] = useState([
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
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing course data if in edit mode
  const { data: existingCourse } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: isEditMode && !!courseId,
  });

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
      tags: "",
    },
  });

  // Update form when existing course data loads
  useEffect(() => {
    if (existingCourse && isEditMode) {
      form.reset({
        title: (existingCourse as any).title || "",
        description: (existingCourse as any).description || "",
        thumbnail: (existingCourse as any).thumbnail || "",
        price: (existingCourse as any).price?.toString() || "0",
        isPublished: (existingCourse as any).isPublished || false,
        category: (existingCourse as any).category || "",
        tags: Array.isArray((existingCourse as any).tags) ? (existingCourse as any).tags.join(", ") : "",
        estimatedDuration: (existingCourse as any).estimatedDuration || "",
        skillLevel: (existingCourse as any).skillLevel || undefined,
        isPaid: (existingCourse as any).price > 0 || false,
      });
      if ((existingCourse as any).thumbnail) {
        setUploadedImage((existingCourse as any).thumbnail);
      }
    }
  }, [existingCourse, isEditMode, form]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/course-image', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include session cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to upload image' }));
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      setUploadedImage(data.url);
      form.setValue('thumbnail', data.url);
      
      toast({
        title: "Image uploaded successfully!",
        description: "Your course image has been uploaded.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image. Please try again.";
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      setIsAddingCategory(true);
      const categoryValue = newCategory.toLowerCase().replace(/\s+/g, '-');
      const categoryLabel = newCategory.trim();
      
      // Add to local state
      const newCategoryItem = { value: categoryValue, label: categoryLabel };
      setCategories(prev => [...prev, newCategoryItem]);
      
      // Save to backend
      await apiRequest("POST", "/api/categories", {
        value: categoryValue,
        label: categoryLabel
      });
      
      setNewCategory("");
      setIsAddingCategory(false); // Close the popup
      
      // Update the form with the new category
      form.setValue("category", categoryValue);
      
      toast({
        title: "Category added!",
        description: `"${categoryLabel}" has been added to the categories.`,
      });
    } catch (error) {
      toast({
        title: "Failed to add category",
        description: "Could not add the new category. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingCategory(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Use uploaded image if available and process tags
      const finalValues = {
        ...values,
        thumbnail: uploadedImage || values.thumbnail,
        tags: values.tags ? values.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : []
      };
      
      const url = isEditMode ? `/api/courses/${courseId}` : "/api/courses";
      const method = isEditMode ? "PUT" : "POST";
      const response = await apiRequest(method, url, finalValues);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} course`);
      }
      
      const courseData = await response.json();
      
      toast({
        title: isEditMode ? "Your course looks amazing! ✨" : "Congratulations! Your course is ready! 🎉",
        description: isEditMode ? "All your changes have been saved. Students will see the updates immediately." : "You've created something special! Now you can start adding modules and lessons to help students learn.",
      });
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/courses"] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      }
      
      // For new courses, redirect to curriculum management for immediate content creation
      // For edited courses, stay on the course detail page
      const targetCourseId = courseData.id || courseId;
      if (isEditMode) {
        navigate(`/courses/${targetCourseId}/manage`);
      } else {
        // New course created - go directly to curriculum management for content creation
        navigate(`/courses/${targetCourseId}/curriculum`);
      }
    } catch (error: any) {
      toast({
        title: isEditMode ? "Couldn't save your changes" : "Course creation hit a snag",
        description: "Something went wrong on our end. Please check your details and try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Course' : 'Create a New Course'}</h1>
          <p className="text-gray-500">{isEditMode ? 'Update your course details' : 'Fill in the details to create your course'}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/my-courses")}>Cancel</Button>
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
                      <FormLabel className="flex items-center justify-between">
                        Category
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="h-auto p-1 text-purple-600 hover:text-purple-700">
                              <Plus className="h-4 w-4 mr-1" />
                              Add New
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Category</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="newCategory">Category Name</Label>
                                <Input
                                  id="newCategory"
                                  value={newCategory}
                                  onChange={(e) => setNewCategory(e.target.value)}
                                  placeholder="e.g. Machine Learning"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <DialogTrigger asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogTrigger>
                                <Button 
                                  onClick={handleAddCategory}
                                  disabled={isAddingCategory || !newCategory.trim()}
                                >
                                  {isAddingCategory ? "Adding..." : "Add Category"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </FormLabel>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="skillLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Level*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select skill level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Who is this course designed for?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estimatedDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Duration</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 4 weeks, 20 hours" {...field} />
                        </FormControl>
                        <FormDescription>
                          How long will it take to complete?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                      <FormLabel>Course Image</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          {/* Image Preview */}
                          {(uploadedImage || field.value) && (
                            <div className="relative inline-block">
                              <img
                                src={uploadedImage || field.value}
                                alt="Course thumbnail"
                                className="w-32 h-20 object-cover rounded-lg border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={() => {
                                  setUploadedImage(null);
                                  field.onChange("");
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          
                          {/* Upload Section */}
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="flex-1"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploading ? "Uploading..." : "Upload Image"}
                            </Button>
                            
                            <div className="flex-1">
                              <Input
                                placeholder="Or paste image URL"
                                value={field.value || ""}
                                onChange={field.onChange}
                                disabled={!!uploadedImage}
                              />
                            </div>
                          </div>
                          
                          {/* Hidden File Input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload an image or provide a URL for your course thumbnail (max 5MB)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-6">
                <FormField
                  control={form.control}
                  name="isPaid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Type</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-4">
                          <div 
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              !field.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              field.onChange(false);
                              form.setValue('price', '0');
                            }}
                          >
                            <h3 className="font-medium">Free Course</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Build your audience and establish credibility
                            </p>
                          </div>
                          <div 
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              field.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => field.onChange(true)}
                          >
                            <h3 className="font-medium">Paid Course</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Generate revenue from your expertise
                            </p>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('isPaid') && (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Price (₦)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="5000"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Set a competitive price for your course content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
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
              
              <div className="pt-4 flex flex-col sm:flex-row justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/my-courses")}
                  className="order-1 sm:order-none"
                >
                  Cancel
                </Button>
                
                <div className="flex flex-col sm:flex-row gap-2 order-2 sm:order-none">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      const values = form.getValues();
                      const draftValues = { ...values, isPublished: false };
                      
                      try {
                        setIsSubmitting(true);
                        const finalValues = {
                          ...draftValues,
                          thumbnail: uploadedImage || values.thumbnail,
                          tags: values.tags ? values.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0) : []
                        };
                        
                        const url = isEditMode ? `/api/courses/${courseId}` : "/api/courses";
                        const method = isEditMode ? "PUT" : "POST";
                        const response = await apiRequest(method, url, finalValues);
                        
                        if (!response.ok) {
                          throw new Error(`Failed to save draft`);
                        }
                        
                        toast({
                          title: "Draft saved successfully!",
                          description: "Your course has been saved as a draft. You can continue editing anytime.",
                        });
                        
                        queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/mentor/courses"] });
                        navigate("/my-courses");
                      } catch (error: any) {
                        toast({
                          title: "Failed to save draft",
                          description: "Please check your details and try again.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    Save as Draft
                  </Button>
                  
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span> 
                        {isEditMode ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        {isEditMode ? "Update & Continue" : "Create & Add Modules"}
                      </>
                    )}
                  </Button>
                </div>
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