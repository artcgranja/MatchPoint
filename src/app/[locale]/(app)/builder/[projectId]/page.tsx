import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkspaceLayout } from "@/components/builder/workspace/workspace-layout";
import type { BuilderProject } from "@/types/builder";

export default async function BuilderProjectPage({
  params,
}: {
  params: Promise<{ projectId: string; locale: string }>;
}) {
  const { projectId } = await params;
  const auth = await getAuthUser();
  if (!auth) redirect("/");

  const project = await prisma.builderProject.findUnique({
    where: { id: projectId },
  });

  if (!project || project.userId !== auth.userId) {
    redirect("/builder");
  }

  const serialized: BuilderProject = {
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    template: project.template,
    sandboxId: project.sandboxId,
    githubRepoUrl: project.githubRepoUrl,
    githubRepoName: project.githubRepoName,
    status: project.status,
    lastOpenedAt: project.lastOpenedAt.toISOString(),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };

  return <WorkspaceLayout project={serialized} />;
}
