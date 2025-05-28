import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, ArrowLeft, Upload, Video, FileText, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function LessonEditor() {
  const { courseId, lessonId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);

  const isNewLesson = lessonId === 'new';

  const { data: lesson } = useQuery({
    queryKey: [`/api/lessons/${lessonId}`],
    enabled: !isNewLesson,
  });

  const { data: modules } = useQuery({
    queryKey: [`/api/courses/${courseId}/modules`],
  });

  const saveLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isNewLesson ? `/api/courses/${courseId}/lessons` : `/api/lessons/${lessonId}`;
      const method = isNewLesson ? "POST" : "PUT";
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Lesson saved successfully!" });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/modules`] });
      setLocation(`/courses/${courseId}`);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save lesson",
        variant: "destructive" 
      });
    },
  });

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setUploadedVideo(result.url);
        toast({ title: "Success", description: "Video uploaded successfully!" });
      }
    } catch (error) {
      toast({ 
        title: "Upload failed", 
        description: "Failed to upload video",
        variant: "destructive" 
      });
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const lessonData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      content: formData.get('content') as string,
      type: formData.get('type') as string,
      duration: parseInt(formData.get('duration') as string) || null,
      moduleId: formData.get('moduleId') ? parseInt(formData.get('moduleId') as string) : null,
      videoUrl: uploadedVideo || formData.get('videoUrl') as string,
      order: parseInt(formData.get('order') as string) || 0,
    };

    saveLessonMutation.mutate(lessonData);
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4" onClick={() => setLocation(`/courses/${courseId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
        <h1 className="text-2xl font-bold">
          {isNewLesson ? 'Create New Lesson' : 'Edit Lesson'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Lesson Title*</Label>
                  <Input 
                    id="title"
                    name="title"
                    defaultValue={lesson?.title} 
                    placeholder="Enter lesson title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description"
                    name="description"
                    defaultValue={lesson?.description}
                    placeholder="Enter lesson description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Lesson Type</Label>
                    <Select name="type" defaultValue={lesson?.type || "video"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lesson type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">
                          <div className="flex items-center">
                            <Video className="w-4 h-4 mr-2" />
                            Video Lesson
                          </div>
                        </SelectItem>
                        <SelectItem value="text">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Text Content
                          </div>
                        </SelectItem>
                        <SelectItem value="code">
                          <div className="flex items-center">
                            <Code className="w-4 h-4 mr-2" />
                            Code Exercise
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input 
                      id="duration"
                      name="duration"
                      type="number"
                      defaultValue={lesson?.duration}
                      placeholder="15"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="moduleId">Module</Label>
                    <Select name="moduleId" defaultValue={lesson?.moduleId?.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select module" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules?.map((module: any) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="order">Lesson Order</Label>
                    <Input 
                      id="order"
                      name="order"
                      type="number"
                      defaultValue={lesson?.order || 0}
                      placeholder="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea 
                    id="content"
                    name="content"
                    defaultValue={lesson?.content}
                    placeholder="Enter lesson content (supports Markdown)"
                    rows={15}
                    className="font-mono"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    You can use Markdown formatting for rich text content
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video">
            <Card>
              <CardHeader>
                <CardTitle>Video Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input 
                    id="videoUrl"
                    name="videoUrl"
                    defaultValue={lesson?.videoUrl}
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Supports YouTube, Vimeo, or direct video URLs
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-2">Upload Video File</h3>
                  <p className="text-gray-500 mb-4">
                    Upload MP4, WebM, or other video formats
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <Button type="button" variant="outline" onClick={() => document.getElementById('video-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Video File
                  </Button>
                  {uploadedVideo && (
                    <p className="text-green-600 mt-2">Video uploaded successfully!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setLocation(`/courses/${courseId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Lesson'}
          </Button>
        </div>
      </form>
    </div>
  );
}