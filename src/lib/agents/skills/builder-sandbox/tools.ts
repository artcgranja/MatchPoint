import { z } from "zod";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Sandbox } from "@e2b/code-interpreter";

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
          // Ensure parent directory exists
          const dir = input.path.substring(0, input.path.lastIndexOf("/"));
          if (dir) await sandbox.commands.run(`mkdir -p "${dir}"`);
          await sandbox.files.write(input.path, input.content);
          return `File written: ${input.path}`;
        } catch (err) {
          return `Error writing file: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }),

    betaZodTool({
      name: "edit_file",
      description:
        "Make surgical edits to an existing file by replacing a specific string with a new string. Preferred over write_file for modifying existing files.",
      inputSchema: z.object({
        path: z.string().describe("Absolute file path to edit"),
        old_string: z.string().describe("The exact string to find and replace"),
        new_string: z.string().describe("The replacement string"),
      }),
      run: async (input) => {
        try {
          const content = await sandbox.files.read(input.path);
          if (!content.includes(input.old_string)) {
            return `Error: old_string not found in ${input.path}. Read the file first to see its contents.`;
          }
          const updated = content.replace(input.old_string, input.new_string);
          await sandbox.files.write(input.path, updated);
          return `File edited: ${input.path}`;
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
          await sandbox.commands.run(`mkdir -p "${input.path}"`);
          return `Directory created: ${input.path}`;
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
          await sandbox.commands.run(`rm -rf "${input.path}"`);
          return `Deleted: ${input.path}`;
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
          const cwd = input.directory ?? "/home/user/app";
          const result = await sandbox.commands.run(
            `find "${cwd}" -type f -name "${input.pattern}" | head -50`
          );
          return result.stdout || "No files found.";
        } catch (err) {
          return `Error searching: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }),
  ];
}
