import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Upload, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Image, 
  FileText, 
  Settings,
  CheckCircle,
  XCircle,
  Copy
} from 'lucide-react';

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  courseId: z.string().optional(),
  credentialType: z.enum(["completion", "achievement", "mastery"]).default("completion"),
  minPassingGrade: z.string().default("70"),
  validityPeriod: z.string().optional(),
  backgroundImage: z.string().optional(),
  logoUrl: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface CertificateTemplate {
  id: number;
  name: string;
  description?: string;
  courseId?: number;
  courseName?: string;
  credentialType: string;
  minPassingGrade: number;
  validityPeriod?: number;
  backgroundImage?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CertificateTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ background?: File; logo?: File }>({});

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      courseId: "",
      credentialType: "completion",
      minPassingGrade: "70",
      validityPeriod: "",
      backgroundImage: "",
      logoUrl: "",
    },
  });

  // Fetch certificate templates
  const { data: templates = [], isLoading: isLoadingTemplates, refetch } = useQuery({
    queryKey: ['/api/certificate-templates'],
  });

  // Fetch courses for template assignment
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses/basic'],
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          formData.append(key, value.toString());
        }
      });

      if (uploadedFiles.background) {
        formData.append('backgroundImage', uploadedFiles.background);
      }
      if (uploadedFiles.logo) {
        formData.append('logoImage', uploadedFiles.logo);
      }

      const response = await fetch('/api/certificate-templates', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certificate template created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
      setIsCreating(false);
      form.reset();
      setUploadedFiles({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TemplateFormData }) => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          formData.append(key, value.toString());
        }
      });

      if (uploadedFiles.background) {
        formData.append('backgroundImage', uploadedFiles.background);
      }
      if (uploadedFiles.logo) {
        formData.append('logoImage', uploadedFiles.logo);
      }

      const response = await fetch(`/api/certificate-templates/${id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certificate template updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
      setIsEditing(false);
      setSelectedTemplate(null);
      form.reset();
      setUploadedFiles({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/certificate-templates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certificate template deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  // Toggle template status mutation
  const toggleTemplateMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/certificate-templates/${id}/toggle`, {
        isActive: !isActive
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificate-templates'] });
    },
  });

  // Background image dropzone
  const onDropBackground = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, background: file }));
      form.setValue('backgroundImage', file.name);
    }
  }, [form]);

  const { getRootProps: getBackgroundRootProps, getInputProps: getBackgroundInputProps, isDragActive: isBackgroundDragActive } = useDropzone({
    onDrop: onDropBackground,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    maxFiles: 1,
  });

  // Logo dropzone
  const onDropLogo = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, logo: file }));
      form.setValue('logoUrl', file.name);
    }
  }, [form]);

  const { getRootProps: getLogoRootProps, getInputProps: getLogoInputProps, isDragActive: isLogoDragActive } = useDropzone({
    onDrop: onDropLogo,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    maxFiles: 1,
  });

  const onSubmit = (data: TemplateFormData) => {
    if (isEditing && selectedTemplate) {
      updateTemplateMutation.mutate({ id: selectedTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const startEdit = (template: CertificateTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
    form.reset({
      name: template.name,
      description: template.description || "",
      courseId: template.courseId?.toString() || "",
      credentialType: template.credentialType as any,
      minPassingGrade: template.minPassingGrade.toString(),
      validityPeriod: template.validityPeriod?.toString() || "",
      backgroundImage: template.backgroundImage || "",
      logoUrl: template.logoUrl || "",
    });
  };

  const duplicateTemplate = async (template: CertificateTemplate) => {
    const duplicateData = {
      name: `${template.name} (Copy)`,
      description: template.description,
      courseId: template.courseId?.toString() || "",
      credentialType: template.credentialType as any,
      minPassingGrade: template.minPassingGrade.toString(),
      validityPeriod: template.validityPeriod?.toString() || "",
      backgroundImage: template.backgroundImage || "",
      logoUrl: template.logoUrl || "",
    };
    
    createTemplateMutation.mutate(duplicateData);
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Certificate Templates</h2>
          <p className="text-muted-foreground">Manage and customize certificate templates for your courses</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setIsCreating(true);
              setIsEditing(false);
              form.reset();
              setUploadedFiles({});
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Course Completion Certificate" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign to Course (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">All Courses</SelectItem>
                            {(courses as any[]).map((course: any) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of when this template should be used..."
                          className="min-h-[60px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="credentialType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credential Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="completion">Completion</SelectItem>
                            <SelectItem value="achievement">Achievement</SelectItem>
                            <SelectItem value="mastery">Mastery</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minPassingGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min. Passing Grade (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="validityPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validity (Months)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="Leave empty for no expiry"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* File Upload Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Background Image</label>
                    <div
                      {...getBackgroundRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isBackgroundDragActive 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted-foreground/25 hover:border-primary'
                      }`}
                    >
                      <input {...getBackgroundInputProps()} />
                      <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      {uploadedFiles.background ? (
                        <p className="text-sm text-green-600">
                          Selected: {uploadedFiles.background.name}
                        </p>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Drop background image here or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, JPEG up to 10MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo Image</label>
                    <div
                      {...getLogoRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isLogoDragActive 
                          ? 'border-primary bg-primary/10' 
                          : 'border-muted-foreground/25 hover:border-primary'
                      }`}
                    >
                      <input {...getLogoInputProps()} />
                      <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      {uploadedFiles.logo ? (
                        <p className="text-sm text-green-600">
                          Selected: {uploadedFiles.logo.name}
                        </p>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Drop logo here or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, JPEG, SVG up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      form.reset();
                      setUploadedFiles({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                  >
                    {createTemplateMutation.isPending || updateTemplateMutation.isPending ? 'Saving...' : (isEditing ? 'Update Template' : 'Create Template')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTemplates ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">No Templates Found</h3>
              <p className="text-muted-foreground max-w-md mt-2">
                Create your first certificate template to get started with automated certificate generation.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Course Assignment</TableHead>
                    <TableHead>Credential Type</TableHead>
                    <TableHead>Min. Grade</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(templates as CertificateTemplate[]).map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <p>{template.name}</p>
                          {template.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.courseName ? (
                          <Badge variant="outline">{template.courseName}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">All Courses</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {template.credentialType}
                        </Badge>
                      </TableCell>
                      <TableCell>{template.minPassingGrade}%</TableCell>
                      <TableCell>
                        {new Date(template.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateTemplate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTemplateMutation.mutate({ 
                              id: template.id, 
                              isActive: template.isActive 
                            })}
                          >
                            {template.isActive ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this template?')) {
                                deleteTemplateMutation.mutate(template.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => {
        if (!open) {
          setIsEditing(false);
          setSelectedTemplate(null);
          form.reset();
          setUploadedFiles({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Course Completion Certificate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Course (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Courses</SelectItem>
                          {(courses as any[]).map((course: any) => (
                            <SelectItem key={course.id} value={course.id.toString()}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of when this template should be used..."
                        className="min-h-[60px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="credentialType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credential Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="completion">Completion</SelectItem>
                          <SelectItem value="achievement">Achievement</SelectItem>
                          <SelectItem value="mastery">Mastery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minPassingGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min. Passing Grade (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validityPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity (Months)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="Leave empty for no expiry"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* File Upload Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Background Image</label>
                  <div
                    {...getBackgroundRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isBackgroundDragActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted-foreground/25 hover:border-primary'
                    }`}
                  >
                    <input {...getBackgroundInputProps()} />
                    <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    {uploadedFiles.background ? (
                      <p className="text-sm text-green-600">
                        Selected: {uploadedFiles.background.name}
                      </p>
                    ) : selectedTemplate?.backgroundImage ? (
                      <p className="text-sm text-blue-600">
                        Current: {selectedTemplate.backgroundImage}
                      </p>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Drop background image here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, JPEG up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Logo Image</label>
                  <div
                    {...getLogoRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isLogoDragActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted-foreground/25 hover:border-primary'
                    }`}
                  >
                    <input {...getLogoInputProps()} />
                    <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    {uploadedFiles.logo ? (
                      <p className="text-sm text-green-600">
                        Selected: {uploadedFiles.logo.name}
                      </p>
                    ) : selectedTemplate?.logoUrl ? (
                      <p className="text-sm text-blue-600">
                        Current: {selectedTemplate.logoUrl}
                      </p>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Drop logo here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, JPEG, SVG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedTemplate(null);
                    form.reset();
                    setUploadedFiles({});
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending ? 'Updating...' : 'Update Template'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificateTemplateManager;