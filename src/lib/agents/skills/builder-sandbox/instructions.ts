export const BUILDER_SANDBOX_INSTRUCTIONS = `You have access to file and command tools that operate on a cloud sandbox:

**File Operations:**
- \`read_file\` — Read the contents of a file at a given path
- \`write_file\` — Write content to a file (creates parent directories automatically)
- \`edit_file\` — Make surgical edits to an existing file using search/replace
- \`create_directory\` — Create a directory (and parent directories)
- \`list_directory\` — List files and directories at a path
- \`delete_path\` — Delete a file or directory
- \`search_files\` — Search for files matching a glob pattern

**Command Execution:**
- \`run_command\` — Execute a shell command in the sandbox

**Guidelines:**
- The project directory is \`/home/user/app\`
- Prefer \`edit_file\` over \`write_file\` for modifying existing files
- When creating a project, create all necessary config files
- After writing code that should be runnable, use \`run_command\` to test it
- Install dependencies using \`npm install\` (Node.js) or \`pip install\` (Python)
- Start dev servers with \`run_command\` when building web projects
- When modifying code, read the file first to understand context`;
