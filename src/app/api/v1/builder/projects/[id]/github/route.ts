import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { decryptToken } from "@/lib/github/crypto";
import { createRepository, pushFiles } from "@/lib/github/octokit-service";
import { connectToSandbox } from "@/lib/e2b/client";

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
  const { repoName, description = "", isPrivate = true } = body;

  if (!repoName) {
    return NextResponse.json({ error: "repoName is required" }, { status: 400 });
  }

  const project = await prisma.builderProject.findUnique({
    where: { id },
  });

  if (!project || project.userId !== auth.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get GitHub access token
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { githubAccessToken: true },
  });

  if (!user?.githubAccessToken) {
    return NextResponse.json(
      { error: "GitHub not connected. Please re-authenticate with GitHub." },
      { status: 400 }
    );
  }

  const accessToken = decryptToken(user.githubAccessToken);

  try {
    // Create the repo
    const repo = await createRepository(accessToken, repoName, description, isPrivate);

    // Get files from sandbox and push
    if (project.sandboxId) {
      const sandbox = await connectToSandbox(project.sandboxId);
      const result = await sandbox.commands.run(
        "find /home/user/app -type f -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/__pycache__/*' -not -path '*/.git/*' | head -100"
      );

      const filePaths = result.stdout.split("\n").filter(Boolean);
      const files = await Promise.all(
        filePaths.map(async (absPath) => {
          const content = await sandbox.files.read(absPath);
          return {
            path: absPath.replace("/home/user/app/", ""),
            content,
          };
        })
      );

      if (files.length > 0) {
        await pushFiles(accessToken, repo.full_name, files);
      }
    }

    // Update project with GitHub info
    await prisma.builderProject.update({
      where: { id },
      data: {
        githubRepoUrl: repo.html_url,
        githubRepoName: repo.full_name,
      },
    });

    return NextResponse.json({
      repoUrl: repo.html_url,
      repoName: repo.full_name,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create repository",
      },
      { status: 500 }
    );
  }
}
