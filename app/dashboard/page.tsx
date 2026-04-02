import { AuthGate } from "@/components/auth/AuthGate";
import { DashboardContent } from "./dashboard-content";

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}
