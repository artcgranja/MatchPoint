export interface TemplateConfig {
  name: string;
  description: string;
  setupCommands: string[];
  defaultPort: number | null;
  startCommand: string | null;
  workDir: string;
}

export const TEMPLATES: Record<string, TemplateConfig> = {
  nextjs_webapp: {
    name: "Next.js Web App",
    description: "Full-stack web application with Next.js, React, and Tailwind CSS",
    setupCommands: [
      "npx --yes create-next-app@latest app --typescript --tailwind --eslint --app --src-dir --no-import-alias --yes",
      "cd /home/user/app && npm install",
    ],
    defaultPort: 3000,
    startCommand: "cd /home/user/app && npm run dev",
    workDir: "/home/user/app",
  },
  python_fastapi: {
    name: "Python FastAPI",
    description: "Python backend with FastAPI, uvicorn, and Pydantic",
    setupCommands: [
      "mkdir -p /home/user/app",
      "pip install fastapi uvicorn pydantic python-dotenv",
    ],
    defaultPort: 8000,
    startCommand: "cd /home/user/app && uvicorn main:app --host 0.0.0.0 --port 8000 --reload",
    workDir: "/home/user/app",
  },
  agent_workflow: {
    name: "AI Agent Workflow",
    description: "Python agent workflow using the Anthropic SDK",
    setupCommands: [
      "mkdir -p /home/user/app",
      "pip install anthropic python-dotenv",
    ],
    defaultPort: null,
    startCommand: null,
    workDir: "/home/user/app",
  },
  blank: {
    name: "Blank Project",
    description: "Empty sandbox with Node.js and Python pre-installed",
    setupCommands: ["mkdir -p /home/user/app"],
    defaultPort: null,
    startCommand: null,
    workDir: "/home/user/app",
  },
};
