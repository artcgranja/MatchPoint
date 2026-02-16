import { Sandbox } from "@e2b/code-interpreter";

let apiKey: string | undefined;

function getApiKey(): string {
  if (!apiKey) {
    apiKey = process.env.E2B_API_KEY;
    if (!apiKey) throw new Error("E2B_API_KEY is not set");
  }
  return apiKey;
}

export async function createSandbox(
  template?: string
): Promise<Sandbox> {
  const sandbox = await Sandbox.create({
    apiKey: getApiKey(),
    ...(template && { template }),
  });
  return sandbox;
}

export async function connectToSandbox(sandboxId: string): Promise<Sandbox> {
  const sandbox = await Sandbox.connect(sandboxId, {
    apiKey: getApiKey(),
  });
  return sandbox;
}

export async function destroySandbox(sandboxId: string): Promise<void> {
  try {
    const sandbox = await connectToSandbox(sandboxId);
    await sandbox.kill();
  } catch {
    // Sandbox may already be expired
  }
}
