import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CourseDeleteDialogProps {
  course: {
    id: number;
    title: string;
    isPublished: boolean;
    enrollmentCount?: number;
  };
  onDeleteSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CourseDeleteDialog({ 
  course, 
  onDeleteSuccess, 
  trigger 
}: CourseDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/courses/${course.id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete course");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Course deleted successfully",
        description: "The course and all its content have been permanently removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/courses"] });
      setIsOpen(false);
      setConfirmText("");
      onDeleteSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete course",
        description: error.message || "An error occurred while deleting the course.",
        variant: "destructive",
      });
    },
  });

  const canDelete = !course.isPublished || (course.enrollmentCount || 0) === 0;
  const isConfirmTextCorrect = confirmText.toLowerCase() === course.title.toLowerCase();

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button 
            variant="destructive" 
            size="sm"
            disabled={!canDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Course
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Delete Course
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              You are about to permanently delete the course:
            </div>
            <div className="font-semibold text-foreground">
              "{course.title}"
            </div>
            
            {!canDelete ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-700 font-medium">Cannot delete this course</p>
                <p className="text-red-600 text-sm mt-1">
                  {course.isPublished && (course.enrollmentCount || 0) > 0
                    ? `This course has ${course.enrollmentCount} enrolled students. You must unpublish it and wait for all enrollments to be removed before deletion.`
                    : "Published courses must be unpublished before deletion."
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-yellow-700 font-medium">This action cannot be undone</p>
                  <ul className="text-yellow-600 text-sm mt-1 space-y-1">
                    <li>• All course modules and lessons will be deleted</li>
                    <li>• All uploaded content and resources will be removed</li>
                    <li>• Course statistics and analytics will be lost</li>
                  </ul>
                </div>
                
                <div>
                  <Label htmlFor="confirmText">
                    Type the course title to confirm deletion:
                  </Label>
                  <Input
                    id="confirmText"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={course.title}
                    className="mt-2"
                  />
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>
            Cancel
          </AlertDialogCancel>
          {canDelete && (
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={!isConfirmTextCorrect || deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Deleting...
                </>
              ) : (
                "Delete Course"
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}