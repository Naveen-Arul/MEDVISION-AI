import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, FileText } from "lucide-react";
import PatientLayout from "@/components/patient/PatientLayout";

const PatientHistory = () => {
  const mockHistory = [
    {
      id: "1",
      date: "2025-01-15",
      result: "Pneumonia Detected",
      severity: "medium",
      confidence: 87.5,
    },
    {
      id: "2",
      date: "2024-12-20",
      result: "Normal",
      severity: "low",
      confidence: 94.2,
    },
    {
      id: "3",
      date: "2024-11-10",
      result: "Mild Infection",
      severity: "low",
      confidence: 81.3,
    },
  ];

  const getSeverityVariant = (severity: string) => {
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
                  {mockHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>{record.result}</TableCell>
                      <TableCell>
                        <Badge variant={getSeverityVariant(record.severity)}>
                          {record.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.confidence}%</TableCell>
                      <TableCell className="text-right">
                        <Link to={`/patient/report/${record.id}`}>
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
          </CardContent>
        </Card>
        </div>
      </div>
    </PatientLayout>
  );
};

export default PatientHistory;
