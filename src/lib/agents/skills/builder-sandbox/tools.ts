import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Sandbox } from "@e2b/code-interpreter";

const SANDBOX_ROOT = "/home/user/app";

/** Validate that a path is within the sandbox root. */
function validatePath(path: string): string | null {
  // Reject shell metacharacters
  if (/[;&|`$(){}!#]/.test(path)) return null;
  // Normalize away relative segments
  const segments = path.split("/").filter(Boolean);
  const resolved: string[] = [];
  for (const seg of segments) {
    if (seg === "..") resolved.pop();
    else if (seg !== ".") resolved.push(seg);
  }
  const normalized = "/" + resolved.join("/");
  if (normalized !== SANDBOX_ROOT && !normalized.startsWith(SANDBOX_ROOT + "/"))
    return null;
  return normalized;
}

/** Shell-escape a string for safe use inside double quotes. */
function shellEscape(s: string): string {
  return s.replace(/["\\$`!]/g, "\\$&");
}

/**
 * Creates builder sandbox tools bound to a specific sandbox instance.
 * Each tool receives the sandbox via closure (not from agent input).
 */
export function createBuilderTools(sandbox: Sandbox) {
  return [
    betaZodTool({
      name: "read_file",
      description: "Read the contents of a file at the given path in the sandbox.",
      inputSchema: z.object({
        path: z.string().describe("Absolute file path to read"),
      }),
      run: async (input) => {
        try {
          const content = await sandbox.files.read(input.path);
          return content;
        } catch (err) {
          return `Error reading file: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }),

    betaZodTool({
      name: "write_file",
      description:
        "Write content to a file. Creates the file if it doesn't exist, creates parent directories automatically.",
      inputSchema: z.object({
        path: z.string().describe("Absolute file path to write"),
        content: z.string().describe("The content to write to the file"),
      }),
      run: async (input) => {
        try {
          const safePath = validatePath(input.path);
          if (!safePath) return `Error: path must be within ${SANDBOX_ROOT}`;
          const dir = safePath.substring(0, safePath.lastIndexOf("/"));
          if (dir) await sandbox.commands.run(`mkdir -p "${shellEscape(dir)}"`);
          await sandbox.files.write(safePath, input.content);
          return `File written: ${safePath}`;
        } catch (err) {
          return `Error writing file: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }),

    betaZodTool({
      name: "edit_file",
      description:
        "Make surgical edits to an existing file by replacing all occurrences of a specific string with a new string. Preferred over write_file for modifying existing files.",
      inputSchema: z.object({
        path: z.string().describe("Absolute file path to edit"),
        old_string: z.string().describe("The exact string to find and replace"),
        new_string: z.string().describe("The replacement string"),
      }),
      run: async (input) => {
        try {
          const safePath = validatePath(input.path);
          if (!safePath) return `Error: path must be within ${SANDBOX_ROOT}`;
          const content = await sandbox.files.read(safePath);
          if (!content.includes(input.old_string)) {
            return `Error: old_string not found in ${safePath}. Read the file first to see its contents.`;
          }
          const updated = content.replaceAll(input.old_string, input.new_string);
          await sandbox.files.write(safePath, updated);
          return `File edited: ${safePath}`;
        } catch (err) {
          return `Error editing file: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }),

    betaZodTool({
      name: "create_directory",
      description: "Create a directory and any necessary parent directories.",
      inputSchema: z.object({
        path: z.string().describe("Absolute directory path to create"),
      }),
      run: async (input) => {
        try {
          const safePath = validatePath(input.path);
          if (!safePath) return `Error: path must be within ${SANDBOX_ROOT}`;
          await sandbox.commands.run(`mkdir -p "${shellEscape(safePath)}"`);
          return `Directory created: ${safePath}`;
        } catch (err) {
          return `Error creating directory: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }),

    betaZodTool({
      name: "list_directory",
      description: "List files and directories at the given path.",
      inputSchema: z.object({
        path: z.string().describe("Absolute directory path to list"),
      }),
      run: async (input) => {
        try {
          const entries = await sandbox.files.list(input.path);
          return entries
            .map((e) => `${e.type === "dir" ? "📁" : "📄"} ${e.name}`)
            .join("\n");
        } catch (err) {
          return `Error listing directory: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }),

    betaZodTool({
      name: "delete_path",
      description: "Delete a file or directory (recursively).",
      inputSchema: z.object({
        path: z.string().describe("Absolute path to delete"),
      }),
      run: async (input) => {
        try {
          const safePath = validatePath(input.path);
          if (!safePath) return `Error: path must be within ${SANDBOX_ROOT}`;
          if (safePath === SANDBOX_ROOT)
            return "Error: cannot delete the project root directory";
          await sandbox.commands.run(`rm -rf "${shellEscape(safePath)}"`);
          return `Deleted: ${safePath}`;
        } catch (err) {
          return `Error deleting: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }),

    betaZodTool({
      name: "run_command",
      description:
        "Execute a shell command in the sandbox. Use for installing packages, running scripts, starting servers, etc.",
      inputSchema: z.object({
        command: z.string().describe("The shell command to execute"),
        cwd: z
          .string()
          .optional()
          .describe("Working directory (defaults to /home/user/app)"),
      }),
      run: async (input) => {
        try {
          const result = await sandbox.commands.run(input.command, {
            cwd: input.cwd ?? "/home/user/app",
            timeoutMs: 60_000,
          });
          const output = [result.stdout, result.stderr]
            .filter(Boolean)
            .join("\n");
          return `Exit code: ${result.exitCode}\n${output}`.slice(0, 10_000);
        } catch (err) {
          return `Error running command: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }),

    betaZodTool({
      name: "search_files",
      description:
        "Search for files matching a glob pattern (e.g., '*.ts', '*.py').",
      inputSchema: z.object({
        pattern: z.string().describe("Glob pattern to search for"),
        directory: z
          .string()
          .optional()
          .describe("Directory to search in (defaults to /home/user/app)"),
      }),
      run: async (input) => {
        try {
          const cwd = input.directory ?? SANDBOX_ROOT;
          const safeCwd = validatePath(cwd);
          if (!safeCwd) return `Error: directory must be within ${SANDBOX_ROOT}`;
          // Sanitize pattern: only allow alphanumeric, dots, asterisks, hyphens, underscores
          const safePattern = input.pattern.replace(/[^a-zA-Z0-9.*_-]/g, "");
          const result = await sandbox.commands.run(
            `find "${shellEscape(safeCwd)}" -type f -name "${safePattern}" | head -50`
          );
          return result.stdout || "No files found.";
        } catch (err) {
          return `Error searching: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }),
  ];
}
