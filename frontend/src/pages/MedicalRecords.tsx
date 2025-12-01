import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Search, 
  Filter,
  FileText, 
  Download,
  Eye,
  Calendar,
  Clock,
  User,
  Activity,
  Heart,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { aiService, consultationService } from "@/lib/services";

export default function MedicalRecords() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [analyses, setAnalyses] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("analyses");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      loadMedicalRecords();
    }
  }, [isAuthenticated, navigate]);

  const loadMedicalRecords = async () => {
    try {
      setIsLoading(true);
      
      const [analysesResponse, consultationsResponse] = await Promise.all([
        aiService.getAnalyses(1, 50),
        consultationService.getConsultations()
      ]);
      
      if (analysesResponse.success && analysesResponse.data?.analyses) {
        setAnalyses(analysesResponse.data.analyses);
      }
      
      if (consultationsResponse.success && consultationsResponse.data) {
        setConsultations(consultationsResponse.data);
      }
    } catch (error) {
      console.error('Error loading medical records:', error);
      toast({
        title: "Error",
        description: "Failed to load medical records.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Activity className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'active':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRiskBadgeVariant = (prediction) => {
    if (prediction?.toLowerCase().includes('pneumonia')) {
      return "destructive";
    }
    return "secondary";
  };

  const filteredAnalyses = analyses.filter(analysis =>
    analysis.analysisType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.results?.prediction?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatDate(analysis.createdAt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConsultations = consultations.filter(consultation =>
    consultation.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultation.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultation.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatDate(consultation.scheduledTime).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewAnalysisDetails = (analysis) => {
    setSelectedRecord(analysis);
    setShowDetails(true);
  };

  const downloadReport = async (analysis) => {
    try {
      // Generate and download PDF report
      const reportData = {
        patientName: user?.name,
        analysisId: analysis._id,
        date: formatDate(analysis.createdAt),
        type: analysis.analysisType,
        prediction: analysis.results?.prediction,
        confidence: analysis.results?.confidence,
        recommendations: analysis.results?.recommendations,
        detailedAnalysis: analysis.results?.detailedAnalysis
      };
      
      // Create a simple report (in production, you'd use a PDF library)
      const reportContent = `
MedVision AI - Medical Analysis Report
=====================================

Patient: ${reportData.patientName}
Analysis ID: ${reportData.analysisId}
Date: ${reportData.date}
Type: ${reportData.type}

Results:
--------
Prediction: ${reportData.prediction}
Confidence: ${(reportData.confidence * 100).toFixed(1)}%

Recommendations:
${reportData.recommendations?.map(rec => `• ${rec}`).join('\n') || 'No recommendations available'}

Technical Analysis:
${JSON.stringify(reportData.detailedAnalysis, null, 2)}

Note: This report is generated by AI and should be reviewed by a qualified healthcare provider.
      `;
      
      // Create and download the file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medvision-report-${analysis._id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Report Downloaded",
        description: "Medical report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the report.",
        variant: "destructive",
      });
    }
  };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Medical Records</h1>
              <p className="text-muted-foreground">
                View and manage your medical history and reports
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Records Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="analyses">AI Analyses ({analyses.length})</TabsTrigger>
            <TabsTrigger value="consultations">Consultations ({consultations.length})</TabsTrigger>
          </TabsList>

          {/* AI Analyses Tab */}
          <TabsContent value="analyses" className="space-y-4">
            {filteredAnalyses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Stethoscope className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No AI Analyses Found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    You haven't performed any AI analyses yet.
                  </p>
                  <Button onClick={() => navigate("/analysis")}>
                    Upload First X-Ray
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredAnalyses.map((analysis) => (
                  <Card key={analysis._id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(analysis.status)}
                          <div>
                            <CardTitle className="text-lg">
                              {analysis.analysisType === 'pneumonia_detection' ? 'Pneumonia Detection' : analysis.analysisType}
                            </CardTitle>
                            <CardDescription>
                              {formatDate(analysis.createdAt)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {analysis.results?.prediction && (
                            <Badge variant={getRiskBadgeVariant(analysis.results.prediction)}>
                              {analysis.results.prediction}
                            </Badge>
                          )}
                          {analysis.results?.confidence && (
                            <Badge variant="outline">
                              {(analysis.results.confidence * 100).toFixed(1)}% confidence
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          {analysis.results?.recommendations?.slice(0, 2).map((rec, idx) => (
                            <p key={idx} className="text-sm text-muted-foreground">
                              • {rec}
                            </p>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewAnalysisDetails(analysis)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(analysis)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Consultations Tab */}
          <TabsContent value="consultations" className="space-y-4">
            {filteredConsultations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <User className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Consultations Found</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    You haven't scheduled any consultations yet.
                  </p>
                  <Button onClick={() => navigate("/consultations")}>
                    Book Consultation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredConsultations.map((consultation) => (
                  <Card key={consultation._id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(consultation.status)}
                          <div>
                            <CardTitle className="text-lg">
                              Dr. {consultation.doctor?.name}
                            </CardTitle>
                            <CardDescription>
                              {consultation.type} • {formatDate(consultation.scheduledTime)}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={consultation.status === 'completed' ? 'secondary' : 'outline'}>
                          {consultation.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Duration: {consultation.duration || 30} minutes
                          </p>
                          {consultation.notes && (
                            <p className="text-sm text-muted-foreground">
                              Notes: {consultation.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/consultations/${consultation._id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Analysis Details Modal */}
        {showDetails && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Analysis Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDetails(false)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Analysis Type</p>
                    <p className="font-semibold">{selectedRecord.analysisType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{formatDate(selectedRecord.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prediction</p>
                    <p className="font-semibold">{selectedRecord.results?.prediction}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <p className="font-semibold">
                      {selectedRecord.results?.confidence && 
                        `${(selectedRecord.results.confidence * 100).toFixed(1)}%`
                      }
                    </p>
                  </div>
                </div>
                
                {selectedRecord.results?.recommendations && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Recommendations</p>
                    <ul className="space-y-1">
                      {selectedRecord.results.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedRecord.results?.detailedAnalysis && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Technical Analysis</p>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedRecord.results.detailedAnalysis, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button onClick={() => downloadReport(selectedRecord)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}