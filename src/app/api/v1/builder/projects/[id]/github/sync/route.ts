import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { decryptToken } from "@/lib/github/crypto";
import { syncToGithub } from "@/lib/github/octokit-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { commitMessage = "Sync from MatchPoint Builder" } = body;

  const project = await prisma.builderProject.findUnique({
    where: { id },
  });

  if (!project || project.userId !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!project.githubRepoName) {
    return NextResponse.json(
      { error: "No GitHub repository connected. Create one first." },
      { status: 400 }
    );
  }

  if (!project.sandboxId) {
    return NextResponse.json(
      { error: "No sandbox available" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { githubAccessToken: true },
  });

  if (!user?.githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub not connected. Please re-authenticate." },
      { status: 400 }
    );
  }

  const accessToken = decryptToken(user.githubAccessToken);

  try {
    const commit = await syncToGithub(
      accessToken,
      project.githubRepoName,
      project.sandboxId,
      commitMessage
    );

    return NextResponse.json({
      commitSha: commit.sha,
      commitUrl: commit.html_url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to sync to GitHub",
      },
      { status: 500 }
    );
  }
}
