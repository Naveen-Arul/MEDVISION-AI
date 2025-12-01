import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MessageCircle, 
  FileText, 
  TrendingUp,
  Users,
  Clock,
  Activity,
  Heart,
  Stethoscope,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userService, consultationService, aiService } from "@/lib/services";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    upcomingConsultations: [],
    recentAnalyses: [],
    stats: {
      totalConsultations: 0,
      totalAnalyses: 0,
      upcomingCount: 0,
      unreadMessages: 3
    }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Load dashboard data
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [dashboardResponse, consultationsResponse, analysesResponse] = await Promise.all([
        userService.getDashboard(),
        consultationService.getUpcoming(),
        aiService.getAnalyses(1, 5)
      ]);

      if (dashboardResponse.success && dashboardResponse.data) {
        setDashboardData(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            ...dashboardResponse.data?.stats
          }
        }));
      }

      if (consultationsResponse.success && consultationsResponse.data) {
        setDashboardData(prev => ({
          ...prev,
          upcomingConsultations: consultationsResponse.data || []
        }));
      }

      if (analysesResponse.success && analysesResponse.data?.analyses) {
        setDashboardData(prev => ({
          ...prev,
          recentAnalyses: analysesResponse.data?.analyses || []
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Book Consultation",
      description: "Schedule a video call with a doctor",
      icon: Calendar,
      action: () => navigate("/consultations"),
      color: "bg-blue-500"
    },
    {
      title: "Start Chat",
      description: "Message your healthcare providers",
      icon: MessageCircle,
      action: () => navigate("/chat"),
      color: "bg-green-500",
      badge: dashboardData.stats.unreadMessages
    },
    {
      title: "Upload Report",
      description: "Get AI analysis of medical images",
      icon: FileText,
      action: () => navigate("/analysis"),
      color: "bg-purple-500"
    },
    {
      title: "Health Records",
      description: "View your medical history",
      icon: Stethoscope,
      action: () => navigate("/records"),
      color: "bg-orange-500"
    }
  ];

  const statsCards = [
    {
      title: "Upcoming Consultations",
      value: dashboardData.stats.upcomingCount,
      icon: Calendar,
      color: "text-blue-600",
      description: "Scheduled appointments"
    },
    {
      title: "Total Analyses",
      value: dashboardData.stats.totalAnalyses,
      icon: Activity,
      color: "text-green-600", 
      description: "AI health scans completed"
    },
    {
      title: "Unread Messages",
      value: dashboardData.stats.unreadMessages,
      icon: MessageCircle,
      color: "text-purple-600",
      description: "New messages from doctors"
    },
    {
      title: "Health Score",
      value: "85%",
      icon: Heart,
      color: "text-red-600",
      description: "Overall health rating"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64 p-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your health today
            </p>
          </div>
          <Button className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks and features to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card 
                    key={action.title}
                    className="cursor-pointer hover:shadow-md transition-all hover:scale-105"
                    onClick={action.action}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {action.badge && (
                          <Badge variant="secondary">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Consultations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Consultations
                </CardTitle>
                <CardDescription>Your scheduled appointments</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/consultations")}>
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              {dashboardData.upcomingConsultations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming consultations</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/consultations")}>
                    Book Consultation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.upcomingConsultations.slice(0, 3).map((consultation: any) => (
                    <div key={consultation._id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <div>
                          <p className="font-medium">Dr. {consultation.doctor?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(consultation.scheduledDateTime).toLocaleDateString()} at{' '}
                            {new Date(consultation.scheduledDateTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{consultation.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Health Analysis */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Analysis
                </CardTitle>
                <CardDescription>AI health scan results</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/analysis")}>
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              {dashboardData.recentAnalyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent analyses</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/analysis")}>
                    Upload Report
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentAnalyses.slice(0, 3).map((analysis: any) => (
                    <div key={analysis._id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {analysis.result?.diagnosis?.includes('Normal') ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium">{analysis.analysisType?.replace('_', ' ').toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(analysis.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={analysis.result?.diagnosis?.includes('Normal') ? "secondary" : "destructive"}
                      >
                        {analysis.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Health Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Health Tips & Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Stay Hydrated</h4>
                <p className="text-sm text-blue-700">Drink at least 8 glasses of water daily for optimal health.</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">Regular Exercise</h4>
                <p className="text-sm text-green-700">30 minutes of moderate exercise 5 days a week keeps you healthy.</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Sleep Well</h4>
                <p className="text-sm text-purple-700">Aim for 7-9 hours of quality sleep each night.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}