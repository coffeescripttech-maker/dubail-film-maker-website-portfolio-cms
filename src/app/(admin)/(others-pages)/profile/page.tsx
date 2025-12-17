import UserProfileCard from "@/components/user-profile/UserProfileCard";
import { Metadata } from "next";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/d1-users";

export const metadata: Metadata = {
  title: "Profile | Dubai Filmmaker CMS",
  description: "User profile and account settings",
};

export default async function Profile() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/signin');
  }

  // Fetch user data from D1 database
  const user = await getUserById(session.user.id);

  if (!user) {
    redirect('/signin');
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <UserProfileCard user={user} />
      </div>
    </div>
  );
}
