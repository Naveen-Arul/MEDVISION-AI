import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Video, FileText, Activity, Stethoscope, Shield } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              AI-Powered Pneumonia Diagnosis + Tele-Consultation
            </h1>
            <p className="mb-8 text-lg text-white/90 sm:text-xl">
              Advanced medical imaging analysis with integrated video consultations.
              Get accurate diagnoses and connect with healthcare professionals instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Login
                </Button>
              </Link>
              <Link to="/signup-patient">
                <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90">
                  Signup as Patient
                </Button>
              </Link>
              <Link to="/signup-doctor">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/80 text-white bg-white/10 hover:bg-white/20">
                  Signup as Doctor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Comprehensive Healthcare Platform
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Combining cutting-edge AI technology with seamless telemedicine capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 shadow-card hover:shadow-elevated transition-all">
              <div className="rounded-full bg-medical-blue-light p-3 w-fit mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Imaging Analysis</h3>
              <p className="text-muted-foreground">
                Advanced neural networks analyze X-rays to detect pneumonia with high accuracy
                and provide detailed diagnostic insights.
              </p>
            </Card>

            <Card className="p-6 shadow-card hover:shadow-elevated transition-all">
              <div className="rounded-full bg-medical-blue-light p-3 w-fit mb-4">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">NLP Severity Detection</h3>
              <p className="text-muted-foreground">
                Natural language processing evaluates condition severity and provides
                risk assessment for better treatment planning.
              </p>
            </Card>

            <Card className="p-6 shadow-card hover:shadow-elevated transition-all">
              <div className="rounded-full bg-medical-blue-light p-3 w-fit mb-4">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">In-App Video Consultation</h3>
              <p className="text-muted-foreground">
                Secure, embedded video calls with healthcare professionals. No external
                apps required - everything within the platform.
              </p>
            </Card>

            <Card className="p-6 shadow-card hover:shadow-elevated transition-all">
              <div className="rounded-full bg-medical-blue-light p-3 w-fit mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Report Management</h3>
              <p className="text-muted-foreground">
                Comprehensive history of all diagnoses and consultations with detailed
                reports accessible anytime.
              </p>
            </Card>

            <Card className="p-6 shadow-card hover:shadow-elevated transition-all">
              <div className="rounded-full bg-medical-blue-light p-3 w-fit mb-4">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Network</h3>
              <p className="text-muted-foreground">
                Connect with verified medical professionals for consultations and
                second opinions on your diagnosis.
              </p>
            </Card>

            <Card className="p-6 shadow-card hover:shadow-elevated transition-all">
              <div className="rounded-full bg-medical-blue-light p-3 w-fit mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                HIPAA-compliant platform with end-to-end encryption ensuring your
                medical data remains confidential.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join thousands of patients and doctors using MedVision AI for better healthcare outcomes
            </p>
            <Link to="/signup-patient">
              <Button size="lg" className="shadow-medical">
                Create Your Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
