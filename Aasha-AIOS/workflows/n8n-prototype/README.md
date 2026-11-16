# AASHA n8n → Antigravity AIOS Orchestration Prototype

This is a removable orchestration experiment. **n8n is not an AIOS authority.** It sequences deterministic workflow stages and hands bounded execution to the Antigravity AIOS adapter boundary.

## Default path

`Prototype Trigger → Normalize + Privacy Gate → Route → Antigravity AIOS Adapter (Mock) → Deterministic Validator → HIL / Final State Gate`

The default workflow is deliberately self-contained so repository contract tests do not require an n8n server or external API credentials.

## Expected result

The representative task ends in `HIL_REQUIRED` because the task declares `requires_hil: true`. It must not become `PASS` automatically.

## Real AIOS integration boundary

Replace only the mock adapter implementation with a transport adapter for the real Antigravity AIOS runtime. Preserve the request/response contract and correlation field `task_id`. The transport may later be HTTP, webhook, MCP, CLI bridge, or another repository-approved mechanism; the choice does not change n8n's authority boundary.

## Safety

- No student names, phone numbers, emails, or raw student records belong in n8n payloads.
- n8n does not make learning decisions.
- n8n does not mutate TLN or catalogue authority.
- n8n does not become a student-facing runtime dependency.
- Validation failures stop the success path.

## Repository contract tests

Run:

```bash
python -m pytest Aasha-AIOS/workflows/n8n-prototype/tests -q
```

These tests validate the exported workflow structure and governance contract. They do **not** claim to execute a live n8n instance or a live Antigravity AIOS runtime.
