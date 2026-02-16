export const AGENT_WORKFLOW_STARTER_FILES: Record<string, string> = {
  "main.py": `import anthropic
import json
import os
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic()

# Define your tools
tools = [
    {
        "name": "get_weather",
        "description": "Get the current weather for a location.",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "The city and state, e.g. San Francisco, CA",
                }
            },
            "required": ["location"],
        },
    }
]


def execute_tool(name: str, input: dict) -> str:
    """Execute a tool and return the result."""
    if name == "get_weather":
        # Placeholder — replace with real API call
        return json.dumps({
            "location": input["location"],
            "temperature": "72°F",
            "condition": "Sunny",
        })
    return json.dumps({"error": f"Unknown tool: {name}"})


def run_agent(user_message: str) -> str:
    """Run the agent loop with tool use."""
    messages = [{"role": "user", "content": user_message}]

    while True:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            system="You are a helpful assistant with access to tools.",
            tools=tools,
            messages=messages,
        )

        # Check if the model wants to use a tool
        if response.stop_reason == "tool_use":
            # Find tool use blocks
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = execute_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            # Add assistant response and tool results
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})
        else:
            # Final text response
            for block in response.content:
                if hasattr(block, "text"):
                    return block.text
            return ""


if __name__ == "__main__":
    result = run_agent("What's the weather in San Francisco?")
    print(result)
`,
  "requirements.txt": `anthropic>=0.74.0
python-dotenv>=1.0.0
`,
  ".env.example": `# Your Anthropic API key
ANTHROPIC_API_KEY=your_api_key_here
`,
};
