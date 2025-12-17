import UserManagement from "@/components/users/UserManagement";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "User Management | Dubai Filmmaker CMS",
  description: "Manage system users and permissions",
};

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  // Only admins can access user management
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            User Management
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage system users, roles, and permissions
          </p>
        </div>
        <UserManagement />
      </div>
    </div>
  );
}
