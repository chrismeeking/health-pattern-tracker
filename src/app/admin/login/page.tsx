import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/auth-server";
import { isDemoMode } from "@/lib/schedule/service";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }
  if (isDemoMode() && !process.env.ADMIN_PASSWORD) {
    redirect("/admin");
  }

  return (
    <div className="px-5 py-8">
      <AdminLoginForm />
    </div>
  );
}
