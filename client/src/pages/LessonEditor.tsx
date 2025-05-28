import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft } from "lucide-react";

export default function LessonEditor() {
  const { courseId, lessonId } = useParams();

  const { data: lesson } = useQuery({
    queryKey: [`/api/lessons/${lessonId}`],
  });

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Button>
        <h1 className="text-2xl font-bold">Edit Lesson</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input 
              defaultValue={lesson?.title} 
              placeholder="Enter lesson title"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea 
              defaultValue={lesson?.description}
              placeholder="Enter lesson description"
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Content</label>
            <Textarea 
              defaultValue={lesson?.content}
              placeholder="Enter lesson content"
              rows={10}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline">Cancel</Button>
            <Button>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}