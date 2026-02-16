import { prisma } from "@/lib/db";
import { connectToSandbox } from "@/lib/e2b/client";
import { BuilderAgent } from "@/lib/agents/builder-agent";
import { createBuilderTools } from "@/lib/agents/skills/builder-sandbox";
import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta";
import type { BuilderSsePayload } from "./events";

const builderAgent = new BuilderAgent();

export async function* handleBuilderMessage(
  projectId: string,
  message: string,
  userId: string
): AsyncGenerator<BuilderSsePayload> {
  // 1. Load project
  const project = await prisma.builderProject.findUnique({
    where: { id: projectId },
  });

  if (!project || project.userId !== userId) {
    yield { type: "error", message: "Project not found" };
    return;
  }

  // 2. Connect to sandbox
  if (!project.sandboxId) {
    yield { type: "error", message: "No sandbox available. Please reconnect." };
    return;
  }

  let sandbox;
  try {
    sandbox = await connectToSandbox(project.sandboxId);
  } catch {
    yield { type: "error", message: "Failed to connect to sandbox. It may have expired." };
    return;
  }

  // 3. Save user message to DB
  await prisma.builderMessage.create({
    data: {
      projectId,
      role: "user",
      content: message,
    },
  });

  // 4. Load conversation history
  const dbMessages = await prisma.builderMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const historyMessages: BetaMessageParam[] = dbMessages
    .reverse()
    .filter((m) => m.content.trim().length > 0)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // 5. Create tools bound to this sandbox
  const tools = createBuilderTools(sandbox);

  // 6. Stream response from builder agent
  let assistantText = "";
  const fileChanges: string[] = [];
  // Map tool_use IDs to tool names (BaseAgent yields empty name in tool_result)
  const toolNames = new Map<string, string>();

  try {
    for await (const event of builderAgent.chat(
      historyMessages,
      tools,
      project.template as "nextjs_webapp" | "python_fastapi" | "agent_workflow" | "blank"
    )) {
      switch (event.type) {
        case "text": {
          assistantText += event.text;
          yield { type: "text", text: event.text };
          break;
        }

        case "tool_start": {
          toolNames.set(event.id, event.name);
          yield { type: "tool_start", tool: event.name, id: event.id };
          break;
        }

        case "tool_call": {
          // Detect file changes
          if (event.name === "write_file" || event.name === "edit_file") {
            const path = (event.input as { path?: string }).path ?? "";
            const action = event.name === "write_file" ? "created" : "modified";
            fileChanges.push(path);
            yield {
              type: "file_changed",
              path,
              action: action as "created" | "modified",
            };
          } else if (event.name === "delete_path") {
            const path = (event.input as { path?: string }).path ?? "";
            yield { type: "file_changed", path, action: "deleted" };
          }
          break;
        }

        case "tool_result": {
          // Resolve tool name from the map (BaseAgent yields empty name for tool_result)
          const toolName = toolNames.get(event.id) || event.name;
          const output = typeof event.result === "string"
            ? event.result
            : JSON.stringify(event.result);

          yield {
            type: "tool_result",
            tool: toolName,
            id: event.id,
            output: output.slice(0, 5000),
          };

          // Check for command output
          if (toolName === "run_command" && output.length > 0) {
            yield {
              type: "command_output",
              output: output.slice(0, 3000),
            };
          }

          // Check for preview URL (dev server started)
          if (
            toolName === "run_command" &&
            output.includes("ready") &&
            project.template === "nextjs_webapp"
          ) {
            try {
              const host = sandbox.getHost(3000);
              yield {
                type: "preview_ready",
                url: `https://${host}`,
                port: 3000,
              };
            } catch {
              // No preview available
            }
          }
          break;
        }
      }
    }
  } catch (error) {
    yield {
      type: "error",
      message: error instanceof Error ? error.message : "Internal error",
    };
  }

  // 7. Save assistant message to DB
  if (assistantText) {
    await prisma.builderMessage.create({
      data: {
        projectId,
        role: "assistant",
        content: assistantText,
        metadata: fileChanges.length > 0
          ? (JSON.parse(JSON.stringify({ fileChanges })) as never)
          : undefined,
      },
    });
  }

  yield { type: "done" };
}
