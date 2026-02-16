import { Octokit } from "@octokit/rest";
import { connectToSandbox } from "@/lib/e2b/client";

function createOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

export async function createRepository(
  accessToken: string,
  name: string,
  description: string,
  isPrivate: boolean
) {
  const octokit = createOctokit(accessToken);
  const { data } = await octokit.repos.createForAuthenticatedUser({
    name,
    description,
    private: isPrivate,
    auto_init: false,
  });
  return data;
}

export async function pushFiles(
  accessToken: string,
  repoFullName: string,
  files: Array<{ path: string; content: string }>
) {
  const octokit = createOctokit(accessToken);
  const [owner, repo] = repoFullName.split("/");

  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString("base64"),
        encoding: "base64",
      });
      return { path: file.path, sha: data.sha };
    })
  );

  // Get the default branch ref
  let baseSha: string;
  try {
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: "heads/main",
    });
    baseSha = ref.object.sha;
  } catch {
    // No commits yet — create initial commit
    const { data: tree } = await octokit.git.createTree({
      owner,
      repo,
      tree: blobs.map((b) => ({
        path: b.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: b.sha,
      })),
    });

    const { data: commit } = await octokit.git.createCommit({
      owner,
      repo,
      message: "Initial commit from MatchPoint Builder",
      tree: tree.sha,
    });

    await octokit.git.createRef({
      owner,
      repo,
      ref: "refs/heads/main",
      sha: commit.sha,
    });

    return commit;
  }

  // Get base tree
  const { data: baseCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: baseSha,
  });

  // Create tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.tree.sha,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: b.sha,
    })),
  });

  // Create commit
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: "Update from MatchPoint Builder",
    tree: tree.sha,
    parents: [baseSha],
  });

  // Update ref
  await octokit.git.updateRef({
    owner,
    repo,
    ref: "heads/main",
    sha: commit.sha,
  });

  return commit;
}

export async function syncToGithub(
  accessToken: string,
  repoFullName: string,
  sandboxId: string,
  commitMessage = "Sync from MatchPoint Builder"
) {
  const sandbox = await connectToSandbox(sandboxId);

  // Get all files from sandbox
  const result = await sandbox.commands.run(
    "find /home/user/app -type f -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/__pycache__/*' -not -path '*/.git/*' | head -200"
  );

  const filePaths = result.stdout
    .split("\n")
    .filter((p) => p.trim().length > 0);

  const files = await Promise.all(
    filePaths.map(async (absPath) => {
      const content = await sandbox.files.read(absPath);
      const relativePath = absPath.replace("/home/user/app/", "");
      return { path: relativePath, content };
    })
  );

  const octokit = createOctokit(accessToken);
  const [owner, repo] = repoFullName.split("/");

  // Build blobs
  const blobs = await Promise.all(
    files.map(async (file) => {
      const { data } = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(file.content).toString("base64"),
        encoding: "base64",
      });
      return { path: file.path, sha: data.sha };
    })
  );

  // Get current HEAD
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  });

  const { data: baseCommit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: ref.object.sha,
  });

  // Create tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseCommit.tree.sha,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: b.sha,
    })),
  });

  // Create commit
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: tree.sha,
    parents: [ref.object.sha],
  });

  // Update ref
  await octokit.git.updateRef({
    owner,
    repo,
    ref: "heads/main",
    sha: commit.sha,
  });

  return commit;
}
