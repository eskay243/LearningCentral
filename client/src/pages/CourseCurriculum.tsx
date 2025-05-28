import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Book } from "lucide-react";

export default function CourseCurriculum() {
  const { id } = useParams();

  const { data: course } = useQuery({
    queryKey: [`/api/courses/${id}`],
  });

  const { data: modules } = useQuery({
    queryKey: [`/api/courses/${id}/modules`],
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Course Curriculum</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Module
        </Button>
      </div>

      <div className="space-y-4">
        {modules?.map((module: any) => (
          <Card key={module.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Book className="w-5 h-5 mr-2" />
                  {module.title}
                </span>
                <Button variant="outline" size="sm">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Module
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {module.lessons?.map((lesson: any) => (
                <div key={lesson.id} className="flex items-center justify-between p-2 border rounded mb-2">
                  <span>{lesson.title}</span>
                  <Button variant="ghost" size="sm">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}