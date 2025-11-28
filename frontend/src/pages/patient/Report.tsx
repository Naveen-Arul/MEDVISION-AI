import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText } from "lucide-react";
import PatientLayout from "@/components/patient/PatientLayout";

const PatientReport = () => {
  const { id } = useParams();

  const mockReport = {
    id,
    date: "2025-01-15",
    prediction: "Pneumonia Detected",
    confidence: 87.5,
    severity: "medium",
    recommendation: "Consult with a pulmonologist for further evaluation. Antibiotic treatment may be required.",
    technicalDetails: {
      model: "ResNet-50 CNN",
      processingTime: "2.3s",
      imageQuality: "High",
    },
  };

  return (
    <PatientLayout>
      <div className="bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/patient/history">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </Link>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-medical-blue-light p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Diagnosis Report #{mockReport.id}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(mockReport.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-sm text-muted-foreground mb-1">Diagnosis</p>
                <p className="font-bold text-lg">{mockReport.prediction}</p>
              </div>

              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                <p className="font-bold text-lg">{mockReport.confidence}%</p>
              </div>

              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-sm text-muted-foreground mb-2">Severity</p>
                <Badge variant="warning" className="text-sm">
                  {mockReport.severity.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-medical-blue-light/30 border border-primary/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>📋</span> Medical Recommendation
              </h3>
              <p className="text-sm leading-relaxed">{mockReport.recommendation}</p>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Technical Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">AI Model</p>
                  <p className="font-medium">{mockReport.technicalDetails.model}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Processing Time</p>
                  <p className="font-medium">{mockReport.technicalDetails.processingTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Image Quality</p>
                  <p className="font-medium">{mockReport.technicalDetails.imageQuality}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Report ID</p>
                  <p className="font-medium">#{mockReport.id}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/patient/upload" className="flex-1">
                <Button variant="outline" className="w-full">New Scan</Button>
              </Link>
              <Link to="/patient/consult" className="flex-1">
                <Button className="w-full">Consult Doctor</Button>
              </Link>
          </div>
        </CardContent>
        </Card>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientReport;
