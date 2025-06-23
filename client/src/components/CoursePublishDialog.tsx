import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Calendar as CalendarIcon,
  Globe,
  Users,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CoursePublishDialogProps {
  course: {
    id: number;
    title: string;
    description: string;
    thumbnail?: string;
    modules?: any[];
    isPublished: boolean;
  };
  trigger?: React.ReactNode;
}

export function CoursePublishDialog({ course, trigger }: CoursePublishDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private" | "scheduled">("public");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const { toast } = useToast();

  const publishMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/courses/${course.id}/publish`, {
        visibility,
        scheduledDate: visibility === "scheduled" ? scheduledDate?.toISOString() : null,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to publish course");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Course published successfully!",
        description: visibility === "scheduled" 
          ? `Your course will be published on ${format(scheduledDate!, "PPP")}`
          : "Your course is now live and available to students.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/courses"] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${course.id}`] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to publish course",
        description: error.message || "Please check all requirements and try again.",
        variant: "destructive",
      });
    },
  });

  // Pre-publish validation
  const validations = [
    {
      label: "Course title",
      completed: !!course.title && course.title.length >= 5,
      required: true,
    },
    {
      label: "Course description", 
      completed: !!course.description && course.description.length >= 20,
      required: true,
    },
    {
      label: "Course thumbnail",
      completed: !!course.thumbnail,
      required: false,
    },
    {
      label: "At least one module",
      completed: (course.modules?.length || 0) > 0,
      required: true,
    },
    {
      label: "At least one lesson", 
      completed: course.modules?.some(module => module.lessons?.length > 0) || false,
      required: false,
    },
  ];

  const requiredCompleted = validations.filter(v => v.required && v.completed).length;
  const totalRequired = validations.filter(v => v.required).length;
  const completionPercentage = Math.round((validations.filter(v => v.completed).length / validations.length) * 100);
  const canPublish = requiredCompleted === totalRequired;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button disabled={course.isPublished}>
            <Globe className="w-4 h-4 mr-2" />
            Publish Course
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish Course</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Preview */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              {course.thumbnail && (
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  className="w-16 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium">{course.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{course.modules?.length || 0} modules</Badge>
                  <Badge variant="outline">
                    {course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0} lessons
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Course Readiness</h4>
              <span className="text-sm text-gray-500">{completionPercentage}% complete</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            
            <div className="space-y-2">
              {validations.map((validation, index) => (
                <div key={index} className="flex items-center gap-2">
                  {validation.completed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className={`w-4 h-4 ${validation.required ? 'text-red-500' : 'text-gray-400'}`} />
                  )}
                  <span className={`text-sm ${validation.completed ? 'text-green-700' : validation.required ? 'text-red-600' : 'text-gray-600'}`}>
                    {validation.label}
                    {validation.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Publishing Options */}
          {canPublish && (
            <div className="space-y-4">
              <h4 className="font-medium">Visibility Settings</h4>
              <RadioGroup value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Public - Visible to all students
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Private - Only visible to invited students
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Scheduled - Publish at a specific date
                  </Label>
                </div>
              </RadioGroup>

              {visibility === "scheduled" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}

          {!canPublish && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">Complete Required Items</h4>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Please complete all required items marked with * before publishing your course.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => publishMutation.mutate()}
            disabled={!canPublish || publishMutation.isPending || (visibility === "scheduled" && !scheduledDate)}
          >
            {publishMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Publishing...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                {visibility === "scheduled" ? "Schedule Publication" : "Publish Course"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}