import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Play,
  Eye,
  Edit,
  Globe
} from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import { formatCurrency } from "@/lib/currencyUtils";

export default function CoursePreview() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: course } = useQuery({
    queryKey: [`/api/courses/${id}`],
  });

  const { data: modules } = useQuery({
    queryKey: [`/api/courses/${id}/modules`],
  });

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading course preview...</p>
        </div>
      </div>
    );
  }

  const totalLessons = modules?.reduce((acc: number, module: any) => 
    acc + (module.lessons?.length || 0), 0) || 0;
  
  const totalDuration = modules?.reduce((acc: number, module: any) => 
    acc + (module.lessons?.reduce((lessonAcc: number, lesson: any) => 
      lessonAcc + (lesson.duration || 0), 0) || 0), 0) || 0;

  const previewLesson = modules?.[0]?.lessons?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation(`/courses/${id}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Button>
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h1 className="text-xl font-semibold">Course Preview</h1>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {course.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setLocation(`/create-course?edit=${id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Course
              </Button>
              {course.status === 'published' && (
                <Button onClick={() => window.open(`/courses/${id}`, '_blank')}>
                  <Globe className="w-4 h-4 mr-2" />
                  View Live
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {course.thumbnail && (
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                    <p className="text-gray-600 mb-4">{course.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {totalLessons} lessons
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {course.enrollmentCount || 0} students
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        4.8 (124 reviews)
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Video */}
            {previewLesson?.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Play className="w-5 h-5 mr-2" />
                    Course Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VideoPlayer 
                    src={previewLesson.videoUrl}
                    title={`${course.title} - ${previewLesson.title}`}
                    thumbnail={course.thumbnail}
                    className="h-64 md:h-80"
                  />
                  <p className="mt-3 text-sm text-gray-600">
                    Preview from: {previewLesson.title}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Course Content */}
            <Tabs defaultValue="curriculum" className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="curriculum">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Curriculum</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {modules && modules.length > 0 ? (
                      <div className="space-y-4">
                        {modules.map((module: any, index: number) => (
                          <div key={module.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  Module {index + 1}: {module.title}
                                </h3>
                                <p className="text-gray-600 text-sm mt-1">
                                  {module.description}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {module.lessons?.length || 0} lessons
                              </Badge>
                            </div>
                            
                            {module.lessons && module.lessons.length > 0 && (
                              <div className="space-y-2 mt-4">
                                {module.lessons.map((lesson: any, lessonIndex: number) => (
                                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <div className="flex items-center space-x-3">
                                      <span className="text-sm text-gray-500 w-6">
                                        {lessonIndex + 1}.
                                      </span>
                                      <Play className="w-4 h-4 text-gray-400" />
                                      <div>
                                        <p className="font-medium text-sm">{lesson.title}</p>
                                        <p className="text-xs text-gray-500">
                                          {lesson.type} • {lesson.duration}min
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      Preview
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No curriculum content yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="description">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Course</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {course.description || "No detailed description available."}
                      </p>
                      
                      {course.tags && course.tags.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-semibold mb-3">What you'll learn:</h4>
                          <div className="flex flex-wrap gap-2">
                            {course.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No reviews yet</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Reviews will appear here once students enroll and complete lessons
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Enrollment Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {formatCurrency(course.price, 'NGN')}
                    </div>
                    <p className="text-gray-500 mb-4">One-time payment</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center text-sm">
                        <span>Total lessons:</span>
                        <span className="font-medium">{totalLessons}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Total duration:</span>
                        <span className="font-medium">
                          {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Skill level:</span>
                        <span className="font-medium">Beginner</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Language:</span>
                        <span className="font-medium">English</span>
                      </div>
                    </div>

                    <Button className="w-full" size="lg">
                      Enroll Now
                    </Button>
                    
                    <p className="text-xs text-gray-500 mt-3">
                      30-day money-back guarantee
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Course Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">This course includes:</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Play className="w-4 h-4 text-green-600" />
                      <span>{totalLessons} video lessons</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-green-600" />
                      <span>Downloadable resources</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span>Certificate of completion</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}