import SettingsManagement from "@/components/settings/SettingsManagement";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Settings | Dubai Filmmaker CMS",
  description: "Manage website settings and configuration",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  // Only admins can access settings
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Website Settings
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage about content, contact information, and header configuration
          </p>
        </div>
        <SettingsManagement />
      </div>
    </div>
  );
}
