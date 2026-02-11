import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
