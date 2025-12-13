import type { Metadata } from "next";
import { DashboardSection } from "@/components/admin/dashboard-section";
import { getAnalyticsSummary } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Dashboard · Admin",
};

export default async function DashboardPage() {
  const metrics = await getAnalyticsSummary();
  return <DashboardSection metrics={metrics} loading={false} />;
}
