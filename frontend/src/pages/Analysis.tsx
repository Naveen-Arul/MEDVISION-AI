import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Activity, 
  Download,
  Eye,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { aiService } from "@/lib/services";

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      loadAnalyses();
    }
  }, [isAuthenticated, navigate]);

  const loadAnalyses = async () => {
    try {
      setIsLoading(true);
      const response = await aiService.getAnalyses(1, 20);
      
      if (response.success && response.data?.analyses) {
        setAnalyses(response.data.analyses);
      }
    } catch (error) {
      console.error('Error loading analyses:', error);
      toast({
        title: "Error",
        description: "Failed to load analysis history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const response = await aiService.analyzeImage(file, 'chest_xray');
      
      if (response.success) {
        toast({
          title: "Analysis Started",
          description: "Your medical image is being analyzed. Results will appear shortly.",
        });
        loadAnalyses(); // Refresh the list
        setSelectedFile(null);
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload and analyze the image.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Activity className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
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
              <h1 className="text-3xl font-bold">Health Analysis</h1>
              <p className="text-muted-foreground">AI-powered medical image analysis</p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Medical Image
            </CardTitle>
            <CardDescription>
              Upload chest X-rays, blood test results, or ECG reports for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Drop your files here</h3>
                <p className="text-muted-foreground mb-4">
                  Or click to browse (JPG, PNG, PDF up to 10MB)
                </p>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button className="cursor-pointer" asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
                
                {selectedFile && (
                  <div className="mt-4 p-4 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">{selectedFile.name}</span>
                        <Badge variant="secondary">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handleFileUpload(selectedFile)}
                        disabled={isUploading}
                        className="gradient-primary"
                      >
                        {isUploading ? (
                          <>
                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Analyze
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Analysis History
            </CardTitle>
            <CardDescription>
              Your previous medical image analyses and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No analyses yet</p>
                <p className="text-sm mt-2">Upload your first medical image to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analyses.map((analysis: any) => (
                  <div key={analysis._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(analysis.status)}
                        <div>
                          <h4 className="font-semibold">
                            {analysis.analysisType?.replace('_', ' ').toUpperCase()}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(analysis.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {analysis.riskLevel && (
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getRiskColor(analysis.riskLevel)}`}></div>
                            <span className="text-sm capitalize">{analysis.riskLevel} Risk</span>
                          </div>
                        )}
                        
                        <Badge 
                          variant={analysis.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {analysis.status}
                        </Badge>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {analysis.result && (
                      <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                        <h5 className="font-medium mb-2">Analysis Result:</h5>
                        <p className="text-sm">{analysis.result.diagnosis}</p>
                        {analysis.result.confidence && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-muted-foreground">Confidence:</span>
                            <Badge variant="outline">
                              {Math.round(analysis.result.confidence * 100)}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}