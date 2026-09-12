import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminBoard, AdminLogin } from "@/components/admin";
import { ADMIN_COOKIE, adminConfigured, isAdminSession } from "@/lib/server/admin-auth";
import { listSubmissions } from "@/lib/server/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "admin · Mac CS 2030",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await isAdminSession(token))) return <AdminLogin configured={adminConfigured()} />;
  return <AdminBoard entries={await listSubmissions()} />;
}
