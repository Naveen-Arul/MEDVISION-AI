import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, FileImage, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import PatientLayout from "@/components/patient/PatientLayout";

interface DiagnosisResult {
  prediction: string;
  confidence: number;
  severity: "low" | "medium" | "high";
  recommendation: string;
}

const PatientUpload = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResult(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select an X-ray image first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    // Simulate AI analysis
    setTimeout(() => {
      const mockResult: DiagnosisResult = {
        prediction: "Pneumonia Detected",
        confidence: 87.5,
        severity: "medium",
        recommendation: "Consult with a pulmonologist for further evaluation. Antibiotic treatment may be required.",
      };
      setResult(mockResult);
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: "Your X-ray has been analyzed successfully",
      });
    }, 3000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
        <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload X-Ray for Analysis</h1>
          <p className="text-muted-foreground">Upload a chest X-ray image for AI-powered diagnosis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                {preview ? (
                  <div className="space-y-4">
                    <img
                      src={preview}
                      alt="X-ray preview"
                      className="mx-auto max-h-64 rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">{file?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto rounded-full bg-medical-blue-light p-4 w-fit">
                      <FileImage className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Drop your X-ray here or click to browse</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supports: JPG, PNG (Max 10MB)
                      </p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
              </div>

              <label htmlFor="file-upload">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    {preview ? "Change Image" : "Select Image"}
                  </span>
                </Button>
              </label>

              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={!file || isAnalyzing}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze X-Ray"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle>Diagnosis Result</CardTitle>
            </CardHeader>
            <CardContent>
              {!result && !isAnalyzing && (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Upload and analyze an X-ray to see results</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
                  <p className="text-muted-foreground">Analyzing X-ray with AI...</p>
                </div>
              )}

              {result && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-semibold">Analysis Complete</span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground mb-1">Prediction</p>
                      <p className="font-bold text-lg">{result.prediction}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                      <p className="font-bold text-lg">{result.confidence}%</p>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground mb-2">Severity Level</p>
                      <Badge variant={getSeverityColor(result.severity)} className="text-sm">
                        {result.severity.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="p-4 rounded-lg bg-medical-blue-light/30 border border-primary/20">
                      <p className="text-sm font-medium mb-2">Recommendation</p>
                      <p className="text-sm">{result.recommendation}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1">Save Report</Button>
                    <Link to="/patient/consult" className="flex-1">
                      <Button variant="outline" className="w-full">Consult Doctor</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientUpload;
