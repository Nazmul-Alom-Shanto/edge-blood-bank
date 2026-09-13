import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { Dashboard } from "./Dashboard";

export const metadata = { title: "Dashboard — B24 Blood Bank" };

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) redirect("/login");
  const user = await verifyToken(token);
  if (!user) redirect("/login");

  return <Dashboard userRole={user.role} userName={user.name} />;
}
