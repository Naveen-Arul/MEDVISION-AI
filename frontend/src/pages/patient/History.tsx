import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, FileText, Loader2 } from "lucide-react";
import PatientLayout from "@/components/patient/PatientLayout";
import { useEffect, useState } from "react";
import { aiService } from "@/lib/services";
import { useToast } from "@/hooks/use-toast";
import { AIAnalysis } from "@/lib/api";

const PatientHistory = () => {
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      setIsLoading(true);
      const response = await aiService.getAnalyses(1, 20);
      
      if (response.success && response.data) {
        setAnalyses(response.data.analyses || []);
      }
    } catch (error: any) {
      console.error('Failed to fetch analyses:', error);
      toast({
        title: "Error",
        description: "Failed to load medical history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <PatientLayout>
      <div className="bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Medical History</h1>
            <p className="text-muted-foreground">View all your past diagnoses and reports</p>
          </div>

          <Card className="shadow-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Diagnosis History
                </CardTitle>
                <Link to="/patient/upload">
                  <Button>New Scan</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No medical history found</p>
                  <Link to="/patient/upload">
                    <Button>Upload Your First Scan</Button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyses.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">
                            {new Date(record.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>{record.results?.prediction || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={getSeverityVariant(record.riskLevel || 'low')}>
                              {(record.riskLevel || 'low').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.results?.confidence?.toFixed(1) || 0}%</TableCell>
                          <TableCell className="text-right">
                            <Link to={`/patient/report/${record._id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Report
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientHistory;
