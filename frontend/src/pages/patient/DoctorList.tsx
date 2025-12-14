import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Star, Stethoscope, Search, Loader2 } from "lucide-react";
import PatientLayout from "@/components/patient/PatientLayout";
import { consultationService } from "@/lib/services";
import { User } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const DoctorList = () => {
  const [doctors, setDoctors] = useState<User[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ((doctor as any).specialization && (doctor as any).specialization.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredDoctors(filtered);
    }
  }, [searchQuery, doctors]);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await consultationService.getDoctors();

      if (response.success && response.data) {
        setDoctors(response.data);
        setFilteredDoctors(response.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch doctors:", error);
      toast({
        title: "Error",
        description: "Failed to load doctors list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSpecializationBadge = (specialization?: string) => {
    const colors: Record<string, string> = {
      pulmonology: "bg-blue-100 text-blue-800",
      radiology: "bg-purple-100 text-purple-800",
      cardiology: "bg-red-100 text-red-800",
      oncology: "bg-orange-100 text-orange-800",
      general: "bg-green-100 text-green-800",
    };
    return colors[specialization?.toLowerCase() || "general"] || "bg-gray-100 text-gray-800";
  };

  return (
    <PatientLayout>
      <div className="bg-gradient-subtle py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Book a Consultation</h1>
            <p className="text-muted-foreground">
              Connect with experienced doctors for professional medical advice
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by doctor name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Doctors Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredDoctors.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Stethoscope className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No doctors found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search criteria"
                    : "No doctors are currently available"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Stethoscope className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{doctor.name}</CardTitle>
                          <Badge
                            className={`mt-1 ${getSpecializationBadge((doctor as any).specialization)}`}
                            variant="secondary"
                          >
                            {(doctor as any).specialization || "General"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>4.8 Rating (120+ reviews)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>15+ years experience</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Available today</span>
                      </div>
                    </div>

                    {doctor.email && (
                      <p className="text-xs text-muted-foreground mb-4">{doctor.email}</p>
                    )}

                    <Link to={`/patient/consult/book/${doctor._id}`}>
                      <Button className="w-full">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Appointment
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
};

export default DoctorList;
