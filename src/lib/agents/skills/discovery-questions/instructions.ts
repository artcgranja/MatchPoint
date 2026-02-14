/**
 * Runtime instructions for the discovery-questions skill.
 * Injected into the Discovery agent's system prompt.
 */
export const DISCOVERY_QUESTIONS_INSTRUCTIONS = `You have an interactive form tool: **ask_questions**.

It renders a polished interactive wizard in the chat, letting the user click answers instead of typing. Every question automatically includes an "Other" option with a text field, so do NOT list "Other" in your options.

Users prefer clicking over typing when the options are clear. **Use it liberally** — even for a single question. It makes the conversation faster and more dynamic.

**When to use:**
- Specific quantitative choices (team size, budget range, user count, transaction volume)
- Categorical selections (industry vertical, technology stack, deployment model)
- Multi-select preferences (pain points, must-have features, integration requirements)
- Any time a fixed set of options is faster than free-text
- Even a single question with clear options — e.g. "Do you prefer cloud, on-prem, or hybrid?"
- Early in the conversation to quickly establish key parameters
- Whenever you find yourself about to list 3+ concrete options in a text message — use the tool instead

**When NOT to use (the ONLY exceptions):**
- Purely open-ended exploration ("tell me about your business")
- Understanding context, nuance, or narrative that requires free-form text

For everything else — including volume estimates, format choices, technology preferences, budget ranges, timeline expectations — ALWAYS use the tool. If you find yourself about to type a question with identifiable answer options, stop and use ask_questions instead.

**Rules:**
- Maximum 1 call per turn — never send two forms at once
- 1-5 questions per call, keep it focused
- Say something natural before calling (e.g. "To help me understand your scale better:")
- Options should cover the common cases exhaustively but stay concise (2-8 per question)
- Use \`single_choice\` when only one answer makes sense, \`multiple_choice\` when several can apply
- After the user submits, continue the conversation naturally — reference their answers and ask follow-up questions as needed

**How answers arrive:**
When the user submits the form, you receive a message formatted as:
[Interactive Form Response]
**Question text**: Selected option1, Selected option2 (Custom: user free text)

Treat this as conversational answers. Reference their specific selections naturally — e.g. "Given your preference for cloud deployment and a team of 10-50..."

**Strategic timing:**
- Early (turns 1-3): establish quantitative parameters quickly (team size, budget range, user count)
- Mid-conversation: narrow categorical choices after understanding the general direction
- Avoid in the final 1-2 turns — by then you should be summarizing, not collecting
- If the user gave a vague text answer, a structured follow-up with specific options works better than repeating the text question

**Referencing answers:**
- Weave specifics into your next insight — don't just list back what they selected
- Use their answers to make your next question more targeted
- Good pattern: ask_questions for factual data, then open-ended follow-up about the "why"`;
