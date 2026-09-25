# Claude Fable 5.1

API id `claude-fable-5-1` (also covers Mythos 5.1). Built from [Prompting Claude Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1) and, where the 5.1 page doesn't repeat or retract it, [Prompting Claude Fable 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5), whose prompts work on 5.1 unchanged. Fetched 2026-09-24; append `.md` to a URL to re-fetch it. Items marked _(Fable 5)_ were measured on Fable 5.

Snippets are Anthropic's tested wording. Pick the sections that match the prompt's job; a prompt rarely needs more than two or three of them.

## Contents

1. Effort and thinking
2. Chat and app system prompts
3. Autonomous agents
4. Coding
5. Writing and reports
6. Tools, search and subagents
7. Vision and frontend
8. Refusals
9. Harness, not prompt

## 1. Effort and thinking

- Thinking is always on and adaptive; `effort` is the main control. Default `high`. `medium` roughly matches Fable 5 at lower cost; `low` competes with Opus and Sonnet on cost per task. Effort names don't mean the same amount of thinking across models, so test rather than carry a setting over.
- Don't ask it to reproduce its reasoning in the reply (`reasoning_extraction` refusals).
- Turns run long on hard tasks: minutes per request, hours per autonomous run. _(Fable 5)_ To stop overplanning when the task is ambiguous:

```text
When you have enough information to act, act. Do not re-derive facts already established in the conversation, re-litigate a decision the user has already made, or narrate options you will not pursue in user-facing messages. If you are weighing a choice, give a recommendation, not an exhaustive survey. This does not apply to thinking blocks.
```

- At `xhigh` and `max` it may draft a long deliverable in thinking and then write it again. Run long deliverables at `high`, or set `max_tokens` with room for both and append to the user message (replace `[max_tokens]`):

```text
Everything produced in one reply, including any reasoning or drafting done before the reply, counts toward a single limit of about [max_tokens] tokens. If that limit is reached before the reply is finished, the person receives a cut-off response and has to start over. Composing an entire output or deliverable in full as reasoning and then again as a reply would double the length of the turn without improving the result, so don't do that.

Instead, when the person has asked for a long or effort-intensive deliverable such as a multi-section document, a large table or dataset, or a complete code file, spend extra effort on understanding the request, checking the inputs the answer depends on, settling the structure and other difficult decisions, and otherwise using the reasoning space to reason and the output space to write an output. Usually it is not needed to draft an output multiple times.
```

## 2. Chat and app system prompts

- **Formatting.** It uses bold, headers and lists less than earlier models. Remove anti-markdown blocks written for them (they starve content of structure it needs). If formatting needs a rule, say when it's appropriate:

```text
Use lists and bullet points when asked to, or when the content is multifaceted enough that they help with clarity. If the person explicitly requests minimal formatting, always format your responses without bullet points, headers, lists, or bold emphasis, as requested. In conversational, personal, or emotional exchanges, keep to plain prose.
```

- **Brevity.** _(Fable 5)_ Instruction following is strong enough that one short instruction beats listing every pattern (surveying options it won't pursue, long root-cause explanations, over-structured PR descriptions, comments narrating the next line):

```text
Lead with the outcome. Your first sentence after finishing should answer "what happened" or "what did you find": the thing the user would ask for if they said "just give me the TLDR." Supporting detail and reasoning come after. Being readable and being concise are different things, and readability matters more.

The way to keep output short is to be selective about what you include (drop details that don't change what the reader would do next), not to compress the writing into fragments, abbreviations, arrow chains like A → B → fails, or jargon.
```

- **Prose density.** See §5.
- **Old prompts are often too prescriptive** for this model and can degrade output. _(Fable 5)_ When rewriting, remove instructions whose default behavior is now better than the instruction, and don't replace them with new ones.

## 3. Autonomous agents

**Finishing the whole task.** On complex asynchronous work it sometimes describes the next step instead of doing it ("Next, I'll…") or asks permission for a step the request already covered. Add both blocks to the system prompt; if length is tight, the first alone keeps most of the effect. Keep the opening sentence as written. If the product needs it to stop for specific confirmations, list them after it. This also makes it ask less about ambiguous requests, so check that trade-off. Leave both out of pair-programming products where someone is there to answer.

```text
You are operating autonomously. The user is not watching in real time and cannot answer questions mid-task, so asking 'Want me to…?' or 'Shall I…?' will block the work. For reversible actions that follow from the original request, proceed without asking. Stop only for destructive actions or genuine scope changes the user must decide. Offering follow-ups after the task is done is fine; asking permission before doing the work is not.

Exception: when the user is describing a problem, asking a question, or thinking out loud rather than requesting a change, the deliverable is your assessment. Report your findings and stop. Don't apply a fix until they ask for one.

Before ending your turn, check your last paragraph. If it is a plan, an analysis, a question, a list of next steps, or a promise about work you have not done ('I'll…', 'let me know when…'), do that work now with tool calls. That includes retrying after errors and gathering missing information yourself. Do not stop because the context or session is long. End your turn only when the task is complete or you are blocked on input only the user can provide.

Before running a command that changes system state (such as restarts, deletes, or config edits), check that the evidence actually supports that specific action. A signal that pattern-matches to a known failure may have a different cause.
```

```text
# Delivering work
The user's request — or the plan they approved — sets the scope, and the scope is the deliverable: don't quietly narrow, widen, or swap it. Read ambiguity the way a careful colleague would: make routine judgment calls yourself, and check in only when different readings would lead to materially different work. If you see a real problem with the task as specified, say so in a sentence or two and keep building under stated assumptions; if the user hears the concern and reaffirms, that is their decision, so deliver the full request.

If a question comes up partway, first do everything that doesn't depend on the answer; then state the assumption you made, or — when going ahead on a wrong guess would be unsafe or would make the work useless — put the question at the end of a turn that also delivers that progress. If one part turns out to be blocked, complete every other part in full and say exactly what you left out and why — the whole task is the deliverable, and scaling it down is the user's call, not yours. A step you have decided on is something to run, not to announce: describing the next step and ending the turn leaves it undone until the user replies.

Keep changes to what the request needs. Something else you notice worth doing — cleanup or documentation the task didn't call for, a change to a file the task didn't require — is a suggestion to make at the end, not a change to make; actions clearly beyond what the ask implies, and risky or destructive ones, still need the user's go-ahead.
```

**Checkpoints.** _(Fable 5)_ For human-in-the-loop work where it should pause sometimes, one sentence is enough: `Pause for the user only when the work genuinely requires them: a destructive or irreversible action, a real scope change, or input that only they can provide. If you hit one of these, ask and end the turn, rather than ending on a promise.`

**Grounded progress claims.** _(Fable 5)_ Nearly eliminated fabricated status reports on long runs, even on tasks designed to elicit them:

```text
Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for; if something is not yet verified, say so explicitly. Report outcomes faithfully: if tests fail, say so with the output; if a step was skipped, say that; when something is done and verified, state it plainly without hedging.
```

**Progress updates.** It writes fewer user-facing updates during long tool-calling turns than Fable 5, more so at high effort. First remove lines that suppress narration ("hold all findings for the final response"). Then, for human-in-the-loop work:

```text
Before you start, say in a line what you're about to do; brief updates while you work help the user follow along. Close with a short recap that stands on its own — what you found, what you did, and what's next — so a reader who only sees the last message has the full picture.
```

If the product hides tool output, tell it, or it runs commands to "show" output nobody sees (as a turn-scoped system message): `Only you see that command's output — the user's terminal shows at most a few lines of it. If the user needs to read any of it, put it in your reply.`

**Context-budget worries.** _(Fable 5)_ In very long sessions it may offer to summarize, hand off or trim its work, mostly when the harness shows a remaining-token countdown. Avoid showing one; if you must: `You have ample context remaining. Do not stop, summarize, or suggest a new session on account of context limits. Continue the work.`

**Memory across runs.** _(Fable 5)_ It does particularly well when it can record lessons from previous runs; a Markdown file is enough:

```text
Store one lesson per file with a one-line summary at the top. Record corrections and confirmed approaches alike, including why they mattered. Don't save what the repo or chat history already records; update an existing note rather than creating a duplicate; delete notes that turn out to be wrong.
```

## 4. Coding

**Scope and tests.** On open-ended features it fixes nearby code, extends unrequested behavior and commits extra test files. This dropped both with no change in task success:

```text
If, while working or testing, you find a pre-existing bug, a performance concern, or behavior the task doesn't mention, don't fix, optimize or extend it in this change unless the requested behavior cannot work without it; report it as a follow-up in your summary. Where the task is ambiguous, implement the reading its wording and the surrounding code most directly support, state that assumption in your summary, and don't build for the other readings as well. Verify your work however you like; scratch scripts and quick checks need not be kept. Commit tests only where the task asks for them or this repository already keeps tests for this kind of change, sized like the neighboring test files — roughly one focused test per stated behavior — and don't turn scratch checks into additional permanent test files. This is about extras only: implement every behavior the task asks for, completely.
```

**Overengineering at high effort.** _(Fable 5)_

```text
Don't add features, refactor, or introduce abstractions beyond what the task requires. A bug fix doesn't need surrounding cleanup and a one-shot operation usually doesn't need a helper. Don't design for hypothetical future requirements: do the simplest thing that works well. Avoid premature abstraction and half-finished implementations. Don't add error handling, fallbacks, or validation for scenarios that cannot happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs). Don't use feature flags or backwards-compatibility shims when you can just change the code.
```

**Whole-file rewrites** for small changes cost tokens and time. Append to the system prompt or first user message: `The number of tokens used to edit files is best minimized, all else being equal. Therefore, when it will not affect the end result, try to surgically edit a file rather than rewrite the entire thing.`

**One tool call per turn** in coding and computer-use loops, where the next calls are implied rather than requested. Send after each round of tool results (turn-scoped system message, or text after the `tool_result` blocks): `First privately list what you need next; then request every item that doesn't depend on another's result in this one response.`

**Verification on long builds.** _(Fable 5)_ Fresh-context verifier subagents beat self-critique: `Establish a method for checking your own work at an interval of [X] as you build. Run this every [X interval], verifying your work with subagents against the specification.`

## 5. Writing and reports

**Dense prose.** Few stock phrases, but sentences run longer with fewer paragraph breaks than Fable 5. Define the anti-pattern (user message preferred, system prompt works):

```text
Mannered prose substitutes metaphor and flourish for direct statement. Instead of "a parameter worth varying," the mannered writer produces "a dial worth turning." Instead of "this point still matters," they write "this point earns its keep." The phrases exist to display the writer, not to convey the idea, and readers can tell. That is why mannered prose irritates: it makes the reader work harder so the writer can perform. It is also imprecise. Metaphors drag in connotations the writer did not choose and cannot control. The fix is to say what you mean. When a literal phrase is available, use it.
```

Short version, which also tends to work: `Please remove all mannered prose.`

**Summaries after long agentic work.** _(Fable 5)_ Different problem: arrow-chain shorthand, made-up labels, references to thinking the user never saw.

```text
Terse shorthand is fine between tool calls (that's you thinking out loud, and brevity there is good). Your final summary is different: it's for a reader who didn't see any of that.

If you've been working for a while without the user watching (overnight, across many tool calls, since they last spoke), your final message is their first look at any of it. Write it as a re-grounding, not a continuation of your working thread: the outcome first, then the one or two things you need from them, each explained as if new. The vocabulary you built up while working is yours, not theirs; leave it behind unless you re-introduce it.

When you write the summary at the end, drop the working shorthand. Write complete sentences. Spell out terms. Don't use arrow chains, hyphen-stacked compounds, or labels you made up earlier. When you mention files, commits, flags, or other identifiers, give each one its own plain-language clause. Open with the outcome: one sentence on what happened or what you found. Then the supporting detail. If you have to choose between short and clear, choose clear.
```

**Quoting sources.** When summarizing documents it's likelier than Fable 5 to reproduce passages without marking them as quotations. Add one complete correct example to the system prompt (the request, the response, a rationale), with your own tool's name in place of `web_search`:

```text
<example>
<user>look up how the Riverton Ledger and the Coast Dispatch each covered the Harbor Bridge closure and compare their reporting</user>
<response>
[web_search: Harbor Bridge closure Riverton Ledger]
[web_search: Harbor Bridge closure Coast Dispatch]
Both outlets agree on the basics: the bridge closed on March 3 after inspectors found cracked welds, and the state expects repairs to take about eight months. Where they differ is emphasis. The Ledger treats it as a local-economy story. The Dispatch frames it as a funding failure; its editorial calls the closure "entirely foreseeable." Read together, the Ledger explains who is affected now and the Dispatch explains how it came to this — neither account alone gives the whole picture.
</response>
<rationale>CORRECT: The response is organized around where the two outlets agree and differ, not as a walk through either article. Each outlet's reporting is conveyed in one or two sentences of the assistant's own indirect speech. One short marked phrase from one source; every other claim is reworded. The response is still specific and complete.</rationale>
</example>
```

## 6. Tools, search and subagents

**Search at low effort.** At `low` it searches less and answers from memory. Raise effort for the affected turns, or:

```text
When a query centers on a name you do not confidently recognize, or recognize from a fast-moving area like AI models and developer tools where the landscape shifts within months, the name itself is the thing to verify: search before answering, and include the name as the user wrote it in at least one query alongside any reformulations. This holds even when you have some background on it — partial background is exactly what makes an out-of-date answer sound authoritative, so familiarity is not a reason to skip the search.
```

**Subagents.** _(Fable 5)_ It dispatches and sustains parallel subagents dependably. Use them freely, say when delegation is appropriate, and prefer async communication and long-lived subagents that keep context: `Delegate independent subtasks to subagents and keep working while they run. Intervene if a subagent goes off track or is missing relevant context.`

**Send-to-user tool.** _(Fable 5)_ If the harness has one (see §9), it rarely calls it without an instruction: `Between tool calls, when you have content the user must read verbatim (a partial deliverable, a direct answer to their question), call the send_to_user tool with that content. Use send_to_user only for user-facing content, not for narration or reasoning.`

## 7. Vision and frontend

Strong vision out of the box. On dense charts and images it does its best work when it can crop and zoom: a container with PIL/OpenCV, or a crop tool alone delivers most of the uplift. Frontend: the 5.1 page has no design-specific guidance; use the general approach (a concrete spec, or propose 3–4 directions first).

## 8. Refusals

Safety classifiers can return `stop_reason: "refusal"`; finding vulnerabilities in source code is allowed. Fewer false positives than Fable 5, but three things raise them: compile-check phrasing (ask "Are there any bugs in this program?" instead of "Does this compile?"), lesser-known programming languages (give context or docs), and base64 in tool output (remove it).

## 9. Harness, not prompt

Things a prompt can't fix. Mention them in one line when the user's problem is here.

- **Append-only history.** Send each assistant turn back exactly as returned, thinking blocks included. Editing earlier turns, rewriting `system` or `tools`, or injecting and removing per-turn reminders invalidates later thinking blocks (400, or dropped with `drop_block`) and restarts the prompt cache. Per-turn reminders go in turn-scoped system messages (`clear_at: "next_user_message"`); instruction changes in mid-conversation system messages.
- **Progress updates** arrive as progress-update thinking blocks, empty under the default `thinking.display: "omitted"`. Set `display: "updates"` before adding prompt lines.
- **Client-side compaction.** Tell the summarizer what to keep: problems and how they were handled; options tried or set aside and why; everything asked for, decided or ruled out, stated exactly; where things stand; what's still open; hard-to-reconstruct details kept exactly. Keep the user's words close to verbatim and condense the model's own. Or replace the whole history with one summary message and replay nothing else.
- **Timeouts.** Requests can run for minutes; check on long runs asynchronously rather than blocking.
- **Subagents.** Let the lead keep working while subagents run: the start tool returns at once, results arrive in later user messages, a separate tool waits.
- **Send-to-user tool.** A client-side tool whose `message` input is rendered verbatim lets it deliver a snippet or answer mid-turn without ending it. Declare it from the first request.
