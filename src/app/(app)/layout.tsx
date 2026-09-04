import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { getHeaderAlerts } from "@/lib/queries/alerts";
import { getCurrentUser, getAssignableUsers } from "@/lib/queries/reference";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [alerts, currentUser, assignableUsers] = await Promise.all([
    getHeaderAlerts(),
    getCurrentUser(),
    getAssignableUsers(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header alerts={alerts} currentUser={currentUser} assignableUsers={assignableUsers} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
