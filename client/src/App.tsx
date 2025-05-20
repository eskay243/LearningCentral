import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Courses from "@/pages/Courses";
import CourseView from "@/pages/CourseView";
import CreateCourse from "@/pages/CreateCourse";
import Schedule from "@/pages/Schedule";
import Students from "@/pages/Students";
import Assessments from "@/pages/Assessments";
import Messages from "@/pages/Messages";
import Analytics from "@/pages/Analytics";
import Earnings from "@/pages/Earnings";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import PaymentCallback from "@/pages/PaymentCallback";
import ContentDemo from "@/pages/ContentDemo";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/courses" component={Courses} />
        <Route path="/courses/:id" component={CourseView} />
        <Route path="/create-course" component={CreateCourse} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/students" component={Students} />
        <Route path="/assessments" component={Assessments} />
        <Route path="/messages" component={Messages} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/earnings" component={Earnings} />
        <Route path="/settings" component={Settings} />
        <Route path="/profile" component={Profile} />
        <Route path="/login" component={Login} />
        <Route path="/payment-callback" component={PaymentCallback} />
        <Route path="/content-demo" component={ContentDemo} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
