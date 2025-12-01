import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Heart, 
  Activity, 
  Apple,
  Dumbbell,
  Brain,
  Shield,
  Search,
  Clock,
  TrendingUp,
  BookOpen,
  Star
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function HealthTipsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const categories = [
    { id: "all", label: "All Tips", icon: BookOpen, color: "bg-blue-500" },
    { id: "nutrition", label: "Nutrition", icon: Apple, color: "bg-green-500" },
    { id: "exercise", label: "Exercise", icon: Dumbbell, color: "bg-orange-500" },
    { id: "mental", label: "Mental Health", icon: Brain, color: "bg-purple-500" },
    { id: "prevention", label: "Prevention", icon: Shield, color: "bg-red-500" },
    { id: "wellness", label: "Wellness", icon: Heart, color: "bg-pink-500" }
  ];

  const healthTips = [
    {
      id: 1,
      title: "Stay Hydrated Throughout the Day",
      description: "Drinking adequate water helps maintain body temperature, joint lubrication, and nutrient transportation.",
      category: "wellness",
      readTime: "2 min read",
      rating: 4.8,
      tips: [
        "Aim for 8-10 glasses of water daily",
        "Start your day with a glass of water",
        "Keep a water bottle nearby as a reminder",
        "Add lemon or cucumber for flavor"
      ]
    },
    {
      id: 2,
      title: "The Power of Regular Exercise",
      description: "Just 30 minutes of moderate exercise daily can significantly improve your cardiovascular health and mood.",
      category: "exercise",
      readTime: "4 min read",
      rating: 4.9,
      tips: [
        "Start with 15-minute walks",
        "Take stairs instead of elevators",
        "Do bodyweight exercises at home",
        "Find activities you enjoy"
      ]
    },
    {
      id: 3,
      title: "Balanced Nutrition for Better Health",
      description: "A well-balanced diet provides essential nutrients your body needs to function effectively.",
      category: "nutrition",
      readTime: "3 min read",
      rating: 4.7,
      tips: [
        "Include 5 servings of fruits and vegetables daily",
        "Choose whole grains over refined grains",
        "Include lean proteins in every meal",
        "Limit processed foods and added sugars"
      ]
    },
    {
      id: 4,
      title: "Managing Stress for Mental Wellbeing",
      description: "Chronic stress can impact both mental and physical health. Learn effective stress management techniques.",
      category: "mental",
      readTime: "5 min read",
      rating: 4.8,
      tips: [
        "Practice deep breathing exercises",
        "Try meditation or mindfulness",
        "Maintain a regular sleep schedule",
        "Connect with friends and family"
      ]
    },
    {
      id: 5,
      title: "Preventive Health Screenings",
      description: "Regular health check-ups can help detect potential health issues early when they're most treatable.",
      category: "prevention",
      readTime: "3 min read",
      rating: 4.6,
      tips: [
        "Schedule annual physical examinations",
        "Keep up with recommended screenings",
        "Monitor your blood pressure regularly",
        "Stay updated on vaccinations"
      ]
    },
    {
      id: 6,
      title: "Quality Sleep for Recovery",
      description: "Good sleep is essential for physical recovery, mental health, and overall well-being.",
      category: "wellness",
      readTime: "4 min read",
      rating: 4.9,
      tips: [
        "Aim for 7-9 hours of sleep nightly",
        "Maintain a consistent sleep schedule",
        "Create a relaxing bedtime routine",
        "Keep your bedroom cool and dark"
      ]
    }
  ];

  const filteredTips = healthTips.filter(tip => {
    const matchesSearch = tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tip.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || tip.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.icon : BookOpen;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Health Tips</h1>
              <p className="text-muted-foreground">Evidence-based health advice for better living</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search health tips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </Button>
            );
          })}
        </div>

        {/* Health Tips Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTips.map((tip) => {
            const Icon = getCategoryIcon(tip.category);
            return (
              <Card key={tip.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getCategoryColor(tip.category)}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tip.title}</CardTitle>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{tip.readTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-muted-foreground">{tip.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {tip.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm mb-4">
                    {tip.description}
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Key Points:</h4>
                    <ul className="space-y-1">
                      {tip.tips.map((point, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="ghost" size="sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTips.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No tips found</h3>
            <p className="text-muted-foreground">Try adjusting your search or category filter</p>
          </div>
        )}

        {/* Daily Tip Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Activity className="w-5 h-5" />
              Today's Health Tip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-600 font-medium mb-2">
              Take a 5-minute breathing break every hour
            </p>
            <p className="text-blue-600/80 text-sm">
              Deep breathing exercises can help reduce stress, lower blood pressure, and improve focus. 
              Try the 4-7-8 technique: inhale for 4 counts, hold for 7, exhale for 8.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}