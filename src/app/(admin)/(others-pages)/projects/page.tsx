import type { Metadata } from "next";
import ProjectManagement from "@/components/projects/ProjectManagement";

export const metadata: Metadata = {
  title: "Project Management | TailAdmin - Next.js Dashboard Template",
  description: "Manage your film projects with full CRUD operations",
};

export default function ProjectsPage() {
  return <ProjectManagement />;
}