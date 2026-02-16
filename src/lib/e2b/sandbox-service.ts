import type { Sandbox } from "@e2b/code-interpreter";
import type { FileNode } from "@/types/builder";

export async function readFile(
  sandbox: Sandbox,
  path: string
): Promise<string> {
  const content = await sandbox.files.read(path);
  return content;
}

export async function writeFile(
  sandbox: Sandbox,
  path: string,
  content: string
): Promise<void> {
  await sandbox.files.write(path, content);
}

export async function listDir(
  sandbox: Sandbox,
  path: string
): Promise<FileNode[]> {
  const entries = await sandbox.files.list(path);
  return entries.map((entry) => ({
    name: entry.name,
    path: entry.path,
    type: entry.type === "dir" ? "directory" : "file",
  }));
}

export async function runCommand(
  sandbox: Sandbox,
  command: string,
  cwd?: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const result = await sandbox.commands.run(command, { cwd });
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}

export async function createDirectory(
  sandbox: Sandbox,
  path: string
): Promise<void> {
  await sandbox.commands.run(`mkdir -p "${path.replace(/["\\$`!]/g, "\\$&")}"`);
}

export async function deletePath(
  sandbox: Sandbox,
  path: string
): Promise<void> {
  await sandbox.commands.run(`rm -rf "${path.replace(/["\\$`!]/g, "\\$&")}"`);
}

export async function searchFiles(
  sandbox: Sandbox,
  pattern: string,
  directory?: string
): Promise<string[]> {
  const cwd = directory ?? "/home/user";
  const safePattern = pattern.replace(/[^a-zA-Z0-9.*_-]/g, "");
  const safeCwd = cwd.replace(/["\\$`!]/g, "\\$&");
  const result = await sandbox.commands.run(
    `find "${safeCwd}" -type f -name "${safePattern}" | head -50`
  );
  return result.stdout
    .split("\n")
    .filter((line) => line.trim().length > 0);
}

export function getPreviewUrl(sandbox: Sandbox, port: number): string {
  return sandbox.getHost(port);
}
