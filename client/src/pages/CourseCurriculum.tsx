import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Book, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CourseCurriculum() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);

  const { data: course } = useQuery({
    queryKey: [`/api/courses/${id}`],
  });

  const { data: modules } = useQuery({
    queryKey: [`/api/courses/${id}/modules`],
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingModule ? `/api/modules/${editingModule.id}` : `/api/courses/${id}/modules`;
      const method = editingModule ? "PUT" : "POST";
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: `Module ${editingModule ? 'updated' : 'created'} successfully!` });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/modules`] });
      setModuleDialogOpen(false);
      setEditingModule(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save module",
        variant: "destructive" 
      });
    },
  });

  const handleModuleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const moduleData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      order: parseInt(formData.get('order') as string) || 0,
    };

    createModuleMutation.mutate(moduleData);
  };

  const openModuleDialog = (module?: any) => {
    setEditingModule(module);
    setModuleDialogOpen(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4" onClick={() => setLocation(`/courses/${id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
        <h1 className="text-2xl font-bold">Course Curriculum</h1>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <p className="text-gray-600">Manage your course modules and lessons</p>
          <p className="text-sm text-gray-500 mt-1">Add modules (chapters) to organize your course content</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={() => setLocation(`/courses/${id}`)} className="w-full sm:w-auto">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Course Details
          </Button>
          <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openModuleDialog()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingModule ? 'Edit Module' : 'Create New Module'}</DialogTitle>
              <DialogDescription>
                {editingModule ? 'Update the module details below.' : 'Create a new module to organize your course content into sections.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleModuleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Module Title*</Label>
                <Input 
                  id="title"
                  name="title"
                  defaultValue={editingModule?.title || ""}
                  placeholder="Enter module title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  name="description"
                  defaultValue={editingModule?.description || ""}
                  placeholder="Enter module description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="order">Module Order</Label>
                <Input 
                  id="order"
                  name="order"
                  type="number"
                  defaultValue={editingModule?.order || "0"}
                  placeholder="1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setModuleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createModuleMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {createModuleMutation.isPending ? 'Saving...' : 'Save Module'}
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        {modules && Array.isArray(modules) && modules.length > 0 ? (
          modules.map((module: any) => (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Book className="w-5 h-5 mr-2" />
                    {module.title}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openModuleDialog(module)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Module
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{module.description}</p>
                {module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0 ? (
                  <div className="space-y-2">
                    {module.lessons.map((lesson: any) => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{lesson.title}</span>
                          <p className="text-sm text-gray-500">{lesson.type} • {lesson.duration} min</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation(`/courses/${id}/lessons/${lesson.id}/edit`)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No lessons in this module yet
                  </div>
                )}
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation(`/courses/${id}/lessons/new/edit?moduleId=${module.id}`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lesson to Module
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="text-center py-12">
              <Book className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-3">Ready to build your course curriculum?</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Organize your course content into modules (chapters) and lessons. Start by creating your first module to structure your teaching material.
              </p>
              <div className="space-y-3">
                <Button onClick={() => openModuleDialog()} size="lg" className="px-8">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Module
                </Button>
                <div className="text-sm text-gray-500">
                  Example: "Introduction to React" or "Getting Started"
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}