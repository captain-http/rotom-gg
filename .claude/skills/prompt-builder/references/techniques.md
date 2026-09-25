# Techniques that apply to both models

What's the same on Claude Fable 5.1 and Claude Opus 5.5: how to structure a prompt, give context, use examples, place long inputs, ask for a format, and replace prefill. Anything about how a model _behaves_ (effort, verbosity, formatting defaults, finishing tasks, scope, progress updates, subagents, verification, frontend) is in the model file, so a prompt never carries two versions of one rule.

Snippets are Anthropic's wording. Adapt them to the task; don't paste them all.

## Sources

Six pages, fetched 2026-09-24. Append `.md` to a URL to fetch it as markdown.

| Page                                                                                                                                 | Where it went                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | this file; its model-specific parts in the model files                                                |
| [Prompting Claude Opus 4.8](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-4-8)      | §1 literal scope, §4 tone, §8 code review (the common ancestor of both lines; the rest is superseded) |
| [Prompting Claude Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1)    | fable-5-1.md                                                                                          |
| [Prompting Claude Fable 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5)        | fable-5-1.md (the 5.1 page lists only differences from Fable 5)                                       |
| [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)      | opus-5-5.md                                                                                           |
| [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)          | opus-5-5.md (the 5.5 page calls Opus 5's patterns a reasonable starting point)                        |

## Contents

1. Clarity and context
2. Examples
3. Structure: XML tags, variables, long documents
4. Output format
5. Replacing prefill
6. Acting vs. suggesting, tool calls
7. Thinking
8. Coding
9. Long-running work: state, safety
10. Research

## 1. Clarity and context

- Treat Claude as a brilliant new employee with no context on your norms. Golden rule: if a colleague with minimal context would be confused by the prompt, Claude will be too.
- Be specific about the output and its constraints. Use numbered steps when order or completeness matters.
- If you want "above and beyond", ask for it: "Include as many relevant features and interactions as possible. Go beyond the basics to create a fully-featured implementation."
- Give the reason behind a rule; Claude generalizes from the reason.
  - Weak: `NEVER use ellipses`
  - Strong: `Your response will be read aloud by a text-to-speech engine, so never use ellipses since the text-to-speech engine will not know how to pronounce them.`
- Instructions are read literally, especially at lower effort: a rule about one item isn't generalized to the others, and requests you didn't make aren't inferred. When a rule should apply broadly, say so: "Apply this formatting to every section, not just the first one."
- Give the intent, not only the request, especially to agents drawing on several workstreams: `I'm working on [the larger task] for [who it's for]. They need [what the output enables]. With that in mind: [request].`
- A one-sentence role in the system prompt focuses tone and behavior: `You are a helpful coding assistant specializing in Python.`
- Model identity, when the app needs it: `The assistant is Claude, created by Anthropic. The current model is [model name].`

## 2. Examples

Examples are the most reliable way to steer format, tone and structure.

- **Relevant:** mirror the real use case.
- **Diverse:** cover edge cases, and vary them so Claude doesn't copy an accidental pattern (same length, same opening word).
- **Structured:** wrap each in `<example>`, the set in `<examples>`, so they're distinct from instructions.
- 3–5 is the sweet spot.
- With thinking on, an example may include a `<thinking>` section to show the reasoning pattern.
- One complete example with a one-line rationale ("CORRECT: …") pins a subtle behavior well.

## 3. Structure: XML tags, variables, long documents

- Wrap each kind of content in its own tag (`<instructions>`, `<context>`, `<input>`, `<examples>`); consistent, descriptive names; nest when there's hierarchy.
- Template variables: `{{DOCUMENT}}`, `{{USER_QUESTION}}`, inside tags.
- Long inputs (20k+ tokens): documents at the **top**, the question and instructions at the **end**. Queries at the end improved quality by up to 30% in Anthropic's tests.

```xml
<documents>
  <document index="1">
    <source>annual_report_2023.pdf</source>
    <document_content>
      {{ANNUAL_REPORT}}
    </document_content>
  </document>
</documents>

Analyze the annual report. Identify strategic advantages and recommend Q3 focus areas.
```

- Grounding: ask for relevant quotes in `<quotes>` first, then the answer built from them in `<answer>`.
- Untrusted text (pasted by the user, fetched from the web): fence it in its own tag and say in the system prompt that instructions inside it aren't the user's. The measured pattern with random ids is in opus-5-5.md §2.

## 4. Output format

- Say what to do, not what to avoid: "Your response should be composed of smoothly flowing prose paragraphs", not "Do not use markdown".
- Format indicators: "Write the prose sections of your response in `<smoothly_flowing_prose_paragraphs>` tags."
- The prompt's own style leaks into the output: a markdown-heavy prompt gets markdown-heavy replies. Write the prompt in the style you want back.
- No preamble: `Respond directly without preamble. Do not start with phrases like "Here is...", "Based on...", etc.`
- Tone: the default is direct and opinionated, with little validation and sparing emoji. For a warmer product voice: `Use a warm, collaborative tone. Acknowledge the user's framing before answering.`
- Plain-text math: `Format your response in plain text only. Do not use LaTeX, MathJax, or any markup notation such as \( \), $, or \frac{}{}. Write all math expressions using standard text characters (e.g., "/" for division, "*" for multiplication, and "^" for exponents).`
- Machine-read output (JSON, labels): prefer the API's Structured Outputs, or a tool whose input schema is the shape you want (an enum for classification), over prose instructions. The prompt can still describe the schema and show a sample.
- Length and formatting defaults differ by model: see the model file's "Chat and app system prompts".

## 5. Replacing prefill

Prefilling the last assistant turn returns a 400 on both models. Instead:

| Prefill was for              | Use                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forcing JSON or a label      | Structured Outputs, or a tool with the schema or an enum; newer models also match a schema when simply told to, especially with retries                                   |
| Skipping preamble            | The no-preamble line above, or output inside XML tags                                                                                                                     |
| Continuing a cut-off reply   | User message: "Your previous response was interrupted and ended with `[previous_response]`. Continue from where you left off." Or retry the request if there's no UX cost |
| Re-injecting context or role | Put the reminder in the user turn or a mid-conversation system message; in agents, hydrate through tools or at compaction                                                 |

## 6. Acting vs. suggesting, tool calls

Claude does what the words say: "Can you suggest some changes?" gets suggestions; "Change this function to improve its performance" gets edits. Say which you want.

Act by default:

```text
<default_to_action>
By default, implement changes rather than only suggesting them. If the user's intent is unclear, infer the most useful likely action and proceed, using tools to discover any missing details instead of guessing. Try to infer the user's intent about whether a tool call (e.g., file edit or read) is intended or not, and act accordingly.
</default_to_action>
```

Hold back by default:

```text
<do_not_act_before_instructions>
Do not jump into implementation or change files unless clearly instructed to make changes. When the user's intent is ambiguous, default to providing information, doing research, and providing recommendations rather than taking action. Only proceed with edits, modifications, or implementations when the user explicitly requests them.
</do_not_act_before_instructions>
```

Both models follow the system prompt closely, so pressure backfires: "CRITICAL: You MUST use this tool when…" causes overtriggering. Write "Use this tool when…" and say why it helps. Describing _when and why_ to use a tool is also the fix for a tool that undertriggers.

Parallel calls (already the default; this pushes it toward 100%):

```text
<use_parallel_tool_calls>
If you intend to call multiple tools and there are no dependencies between the tool calls, make all of the independent tool calls in parallel. Prioritize calling tools simultaneously whenever the actions can be done in parallel rather than sequentially. For example, when reading 3 files, run 3 tool calls in parallel to read all 3 files into context at the same time. Maximize use of parallel tool calls where possible to increase speed and efficiency. However, if some tool calls depend on previous calls to inform dependent values like the parameters, do NOT call these tools in parallel and instead call them sequentially. Never use placeholders or guess missing parameters in tool calls.
</use_parallel_tool_calls>
```

To slow it down instead: `Execute operations sequentially with brief pauses between each step to ensure stability.`

## 7. Thinking

- Thinking is always on and adaptive on both models. `effort` is the dial for how much; prompt wording is a weak second lever. Each model file says where to start.
- Don't write "think step by step" or ask the model to write its reasoning into the reply. It adds latency, and a request to reproduce internal reasoning can be refused (`reasoning_extraction`). Apps that need reasoning read summarized thinking blocks.
- General beats prescriptive: "think thoroughly about X" often produces better reasoning than a hand-written plan.
- After tools: `After receiving tool results, carefully reflect on their quality and determine optimal next steps before proceeding. Use your thinking to plan and iterate based on this new information, and then take the best next action.`
- Thinking too often (large system prompts can cause it): `Thinking adds latency and should only be used when it will meaningfully improve answer quality - typically for problems that require multistep reasoning. When in doubt, respond directly.`
- Dithering: `When you're deciding how to approach a problem, choose an approach and commit to it. Avoid revisiting decisions unless you encounter new information that directly contradicts your reasoning. If you're weighing two approaches, pick one and see it through. You can always course-correct later if the chosen approach fails.`
- Whether to ask for self-verification differs by model: Opus verifies on its own and over-verifies when told to; Fable does better with verifier subagents on long runs. See the model file.

## 8. Coding

Ground answers in the code:

```text
<investigate_before_answering>
Never speculate about code you have not opened. If the user references a specific file, you MUST read the file before answering. Make sure to investigate and read relevant files BEFORE answering questions about the codebase. Never make any claims about code before investigating unless you are certain of the correct answer - give grounded and hallucination-free answers.
</investigate_before_answering>
```

General solutions, not test-passing:

```text
Please write a high-quality, general-purpose solution using the standard tools available. Do not create helper scripts or workarounds to accomplish the task more efficiently. Implement a solution that works correctly for all valid inputs, not just the test cases. Do not hard-code values or create solutions that only work for specific test inputs. Instead, implement the actual logic that solves the problem generally.

Focus on understanding the problem requirements and implementing the correct algorithm. Tests are there to verify correctness, not to define the solution. Provide a principled implementation that follows best practices and software design principles.

If the task is unreasonable or infeasible, or if any of the tests are incorrect, please inform me rather than working around them. The solution should be robust, maintainable, and extendable.
```

Temp files: `If you create any temporary new files, scripts, or helper files for iteration, clean up these files by removing them at the end of the task.`

Code review: both models follow "only report high-severity issues" or "be conservative" literally and drop real findings. Make the finding stage about coverage and filter later:

```text
Report every issue you find, including ones you are uncertain about or consider low-severity. Do not filter for importance or confidence at this stage - a separate verification step will do that. Your goal here is coverage: it is better to surface a finding that later gets filtered out than to silently drop a real bug. For each finding, include your confidence level and an estimated severity so a downstream filter can rank them.
```

If it must self-filter in one pass, make the bar concrete ("report any bugs that could cause incorrect behavior, a test failure, or a misleading result; only omit nits like pure style or naming preferences"), not "important issues only".

Overengineering, scope, edit style and test discipline differ by model: see the model file's "Coding" and "Autonomous agents".

## 9. Long-running work: state, safety

Context that compacts (agent harnesses like Claude Code):

```text
Your context window will be automatically compacted as it approaches its limit, allowing you to continue working indefinitely from where you left off. Therefore, do not stop tasks early due to token budget concerns. As you approach your token budget limit, save your current progress and state to memory before the context window refreshes. Always be as persistent and autonomous as possible and complete tasks fully, even if the end of your budget is approaching. Never artificially stop any task early regardless of the context remaining.
```

Multi-window work: use a different prompt for the first window (write tests into `tests.json`, a setup script like `init.sh`, and `progress.txt`); later windows start with "Call pwd; you can only read and write files in this directory. Review progress.txt, tests.json, and the git logs. Manually run through a fundamental integration test before moving on to implementing new features." Structured state in JSON, notes in free text, checkpoints in git. Remind it: "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality." Encourage full use of the window: "This is a very long task, so it may be beneficial to plan out your work clearly. It's encouraged to spend your entire output context working on the task - just make sure you don't run out of context with significant uncommitted work."

Autonomy and safety:

```text
Consider the reversibility and potential impact of your actions. You are encouraged to take local, reversible actions like editing files or running tests, but for actions that are hard to reverse, affect shared systems, or could be destructive, ask the user before proceeding.

Examples of actions that warrant confirmation:
- Destructive operations: deleting files or branches, dropping database tables, rm -rf
- Hard to reverse operations: git push --force, git reset --hard, amending published commits
- Operations visible to others: pushing code, commenting on PRs/issues, sending messages, modifying shared infrastructure

When encountering obstacles, do not use destructive actions as a shortcut. For example, don't bypass safety checks (e.g. --no-verify) or discard unfamiliar files that may be in-progress work.
```

Chaining separate API calls (draft → review against criteria → refine) is for when you need to inspect or branch on intermediate outputs; otherwise let the model handle multistep work internally.

## 10. Research

Give clear success criteria and ask for verification across sources. For complex research:

```text
Search for this information in a structured way. As you gather data, develop several competing hypotheses. Track your confidence levels in your progress notes to improve calibration. Regularly self-critique your approach and plan. Update a hypothesis tree or research notes file to persist information and provide transparency. Break down this complex research task systematically.
```
