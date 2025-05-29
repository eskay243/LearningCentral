import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
  SortableContext as SortableContextType,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserPlus,
  GraduationCap,
  Clock,
  Star,
  Activity,
  Calendar,
  Settings,
  Save,
  RotateCcw,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";

// Widget types
interface Widget {
  id: string;
  type: string;
  title: string;
  size: "small" | "medium" | "large";
  position: { x: number; y: number };
  visible: boolean;
}

interface DashboardLayout {
  id: string;
  name: string;
  widgets: Widget[];
  isDefault: boolean;
}

// Sortable Widget Component
function SortableWidget({
  widget,
  data,
  onToggleVisibility,
}: {
  widget: Widget;
  data: any;
  onToggleVisibility: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!widget.visible) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${
        widget.size === "large"
          ? "col-span-2"
          : widget.size === "medium"
          ? "col-span-1"
          : "col-span-1"
      } ${isDragging ? "z-50" : ""}`}
    >
      <Card className="h-full relative group hover:shadow-lg transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleVisibility(widget.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
            <div
              {...attributes}
              {...listeners}
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderWidgetContent(widget.type, data)}
        </CardContent>
      </Card>
    </div>
  );
}

// Widget content renderer
function renderWidgetContent(type: string, data: any) {
  switch (type) {
    case "revenue_overview":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-green-600">
              ₦{data?.dashboardStats?.revenue?.platformEarnings?.toLocaleString() || "0"}
            </span>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-sm text-muted-foreground">Platform Earnings</p>
        </div>
      );

    case "total_users":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-600">
              {data?.dashboardStats?.userMetrics?.totalUsers || data?.users?.length || 0}
            </span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </div>
      );

    case "total_courses":
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-purple-600">
              {data?.dashboardStats?.contentMetrics?.totalCourses || data?.courseOverview?.length || 0}
            </span>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-sm text-muted-foreground">Active Courses</p>
        </div>
      );

    case "recent_enrollments":
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {data?.dashboardStats?.contentMetrics?.totalEnrollments || 0}
            </span>
            <UserPlus className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-sm text-muted-foreground">Total Enrollments</p>
          <div className="text-xs text-muted-foreground">
            {data?.dashboardStats?.userMetrics?.newUsersThisWeek || 0} new this week
          </div>
        </div>
      );

    case "student_performance":
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {data?.dashboardStats?.users?.totalStudents || data?.students?.length || 0}
            </span>
            <Star className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-sm text-muted-foreground">Total Students</p>
          <div className="text-xs text-muted-foreground">
            {Math.round(((data?.dashboardStats?.enrollments?.averageProgress || 0) * 100) / 100)}% avg progress
          </div>
        </div>
      );

    case "mentor_activity":
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {data?.dashboardStats?.userMetrics?.mentors || 0}
            </span>
            <GraduationCap className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-sm text-muted-foreground">Active Mentors</p>
        </div>
      );

    case "recent_activity":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-600" />
            <span className="text-sm">Recent Activity</span>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>• {data?.dashboardStats?.users?.newUsersThisMonth || 0} new users this month</div>
            <div>• {data?.dashboardStats?.content?.totalCourses || 0} courses available</div>
            <div>• {data?.dashboardStats?.enrollments?.totalEnrollments || 0} total enrollments</div>
          </div>
        </div>
      );

    case "upcoming_sessions":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-600" />
            <span className="text-sm">Upcoming Sessions</span>
          </div>
          <div className="text-xs text-muted-foreground">
            No sessions scheduled
          </div>
        </div>
      );

    case "revenue_chart":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                ₦{data?.dashboardStats?.revenue?.platformEarnings?.toLocaleString() || "0"}
              </div>
              <div className="text-xs text-muted-foreground">Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                ₦{data?.dashboardStats?.revenue?.mentorEarnings?.toLocaleString() || "0"}
              </div>
              <div className="text-xs text-muted-foreground">Payouts</div>
            </div>
          </div>
          <div className="h-20 bg-gradient-to-r from-green-100 to-blue-100 rounded flex items-end justify-around p-2">
            <div className="w-4 bg-green-500 rounded-t" style={{ height: "60%" }}></div>
            <div className="w-4 bg-green-500 rounded-t" style={{ height: "80%" }}></div>
            <div className="w-4 bg-green-500 rounded-t" style={{ height: "40%" }}></div>
            <div className="w-4 bg-green-500 rounded-t" style={{ height: "90%" }}></div>
            <div className="w-4 bg-green-500 rounded-t" style={{ height: "70%" }}></div>
          </div>
        </div>
      );

    default:
      return <div className="text-sm text-muted-foreground">Widget content</div>;
  }
}

// Default widget configurations
const defaultWidgets: Widget[] = [
  {
    id: "revenue_overview",
    type: "revenue_overview",
    title: "Revenue Overview",
    size: "small",
    position: { x: 0, y: 0 },
    visible: true,
  },
  {
    id: "total_users",
    type: "total_users",
    title: "Total Users",
    size: "small",
    position: { x: 1, y: 0 },
    visible: true,
  },
  {
    id: "total_courses",
    type: "total_courses",
    title: "Total Courses",
    size: "small",
    position: { x: 2, y: 0 },
    visible: true,
  },
  {
    id: "recent_enrollments",
    type: "recent_enrollments",
    title: "Recent Enrollments",
    size: "small",
    position: { x: 3, y: 0 },
    visible: true,
  },
  {
    id: "revenue_chart",
    type: "revenue_chart",
    title: "Revenue Chart",
    size: "large",
    position: { x: 0, y: 1 },
    visible: true,
  },
  {
    id: "student_performance",
    type: "student_performance",
    title: "Student Performance",
    size: "medium",
    position: { x: 2, y: 1 },
    visible: true,
  },
  {
    id: "mentor_activity",
    type: "mentor_activity",
    title: "Mentor Activity",
    size: "small",
    position: { x: 0, y: 2 },
    visible: true,
  },
  {
    id: "recent_activity",
    type: "recent_activity",
    title: "Recent Activity",
    size: "medium",
    position: { x: 1, y: 2 },
    visible: true,
  },
  {
    id: "upcoming_sessions",
    type: "upcoming_sessions",
    title: "Upcoming Sessions",
    size: "small",
    position: { x: 3, y: 2 },
    visible: true,
  },
];

export default function CustomizableDashboard() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [isEditMode, setIsEditMode] = useState(false);
  const [layouts, setLayouts] = useState<DashboardLayout[]>([
    {
      id: "default",
      name: "Default Layout",
      widgets: defaultWidgets,
      isDefault: true,
    },
  ]);
  const [currentLayoutId, setCurrentLayoutId] = useState("default");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch dashboard data - exactly same as main dashboard
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/admin/dashboard-stats"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: courseOverview } = useQuery({
    queryKey: ["/api/admin/course-overview"],
  });

  const { data: students } = useQuery({
    queryKey: ["/api/admin/students"],
  });

  const data = {
    dashboardStats,
    users,
    courseOverview,
    students,
    revenue: dashboardStats?.revenue,
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleToggleVisibility(widgetId: string) {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === widgetId
          ? { ...widget, visible: !widget.visible }
          : widget
      )
    );
  }

  function handleSaveLayout() {
    const currentLayout = layouts.find((l) => l.id === currentLayoutId);
    if (currentLayout) {
      const updatedLayouts = layouts.map((layout) =>
        layout.id === currentLayoutId
          ? { ...layout, widgets: [...widgets] }
          : layout
      );
      setLayouts(updatedLayouts);
      localStorage.setItem("dashboardLayouts", JSON.stringify(updatedLayouts));
    }
    setIsEditMode(false);
  }

  function handleResetLayout() {
    setWidgets([...defaultWidgets]);
  }

  function handleLayoutChange(layoutId: string) {
    const layout = layouts.find((l) => l.id === layoutId);
    if (layout) {
      setWidgets([...layout.widgets]);
      setCurrentLayoutId(layoutId);
    }
  }

  // Load saved layouts on component mount
  useEffect(() => {
    const savedLayouts = localStorage.getItem("dashboardLayouts");
    if (savedLayouts) {
      const parsedLayouts = JSON.parse(savedLayouts);
      setLayouts(parsedLayouts);
      const currentLayout = parsedLayouts.find((l: DashboardLayout) => l.id === currentLayoutId);
      if (currentLayout) {
        setWidgets([...currentLayout.widgets]);
      }
    }
  }, [currentLayoutId]);

  const visibleWidgets = widgets.filter((widget) => widget.visible);
  const hiddenWidgets = widgets.filter((widget) => !widget.visible);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customizable Dashboard</h1>
          <p className="text-gray-600">Drag and drop widgets to customize your layout</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={currentLayoutId} onValueChange={handleLayoutChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              {layouts.map((layout) => (
                <SelectItem key={layout.id} value={layout.id}>
                  {layout.name} {layout.isDefault && "(Default)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button onClick={handleSaveLayout} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Layout
                </Button>
                <Button
                  onClick={handleResetLayout}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={() => setIsEditMode(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditMode(true)} size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Customize
              </Button>
            )}
          </div>
        </div>
      </div>

      {isEditMode && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Edit Mode Active</span>
          </div>
          <p className="text-sm text-blue-700 mb-4">
            Drag widgets to reorder them. Click the eye icon to hide widgets.
          </p>
          
          {hiddenWidgets.length > 0 && (
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Hidden Widgets:</h4>
              <div className="flex flex-wrap gap-2">
                {hiddenWidgets.map((widget) => (
                  <Badge
                    key={widget.id}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleToggleVisibility(widget.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {widget.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Dashboard Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-4 gap-6">
            {visibleWidgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                data={data}
                onToggleVisibility={handleToggleVisibility}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {visibleWidgets.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No widgets visible</h3>
            <p className="text-sm">
              Click "Customize" to add widgets to your dashboard
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}