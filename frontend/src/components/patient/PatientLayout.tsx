import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import PatientSidebar from "./PatientSidebar";

interface PatientLayoutProps {
  children: React.ReactNode;
}

const PatientLayout = ({ children }: PatientLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-[calc(100vh-4rem)] flex w-full">
        <PatientSidebar />
        <main className="flex-1 overflow-auto">
          <div className="md:hidden p-4 border-b border-border">
            <SidebarTrigger />
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default PatientLayout;
