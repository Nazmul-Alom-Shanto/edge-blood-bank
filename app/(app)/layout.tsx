import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { COOKIE_NAME } from "@/lib/constants";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) redirect("/login");

  const user = await verifyToken(token);
  if (!user) redirect("/login");

  return (
    <div className="app-layout">
      <Sidebar user={{ name: user.name, role: user.role }} />
      <main className="main-content">{children}</main>
    </div>
  );
}
