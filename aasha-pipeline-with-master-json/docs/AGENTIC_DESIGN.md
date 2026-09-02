# Agentic AI Design — How the Multi-Agent System Works

## Design Philosophy

This pipeline uses a **multi-agent architecture** rather than a monolithic LLM
call. Each agent is a specialized AI worker with a narrow, well-defined
responsibility. This approach provides:

1. **Separation of concerns** — each agent has one job, with clear input/output
2. **Independent testability** — agents can be tested in isolation with mocks
3. **Resumability** — if one agent's output is wrong, you edit the intermediate
   JSON and re-run from that stage without paying LLM costs for earlier stages
4. **Provider independence** — the LLM adapter abstracts away provider
   differences; any agent works with any provider
5. **Cost control** — caching is built into the adapter layer; re-runs with
   the same inputs cost $0

## Agent Interface

Every agent inherits from `BaseAgent` and implements:

```python
def run(self, work_dir: Path, context: dict) -> dict:
    """Execute this agent's stage.
    
    Args:
        work_dir: Job's work directory with intermediate files
        context: Pipeline context (subject, grade, provider, etc.)
    
    Returns:
        Dict with 'output_file' and stage-specific metadata
    """
```

Agents communicate **only through files on disk**. There is no in-memory
state passing between agents. This means:
- Any intermediate can be inspected, edited, or replaced
- The pipeline can resume from any stage
- A human can override any agent's output by editing the JSON

## Agent Specialization

### Why separate Analysis and Design?

These could be one LLM call, but splitting them:
- Reduces prompt complexity (each agent gets a simpler task)
- Allows re-designing the chapter structure without re-analyzing the PDF
- Makes the content map reusable if you want to try different structures

### Why separate Assessment generation?

Assessment generation is the highest-risk content quality area:
- Misconceptions must not leak the correct answer
- WE checks must be specific to their step's concept
- Options must be plausible distractors

By isolating this in its own agent, we can:
- Run dedicated post-processing (substring leakage scan)
- Batch assessments efficiently (group by node)
- Regenerate individual assessments if they fail QA

### Why is LLE separate?

The LLE stage has different requirements:
- Temperature 0.2 (not 0) for natural Hindi phrasing
- Heavy dictionary reuse (296 WM + 46 CONN baseline entries)
- Fallback behavior (missing words get a standard message, not a failure)
- Different cost profile (many small calls, batched)

## LLM Caching Strategy

The cache key is `SHA-256(system_prompt + user_prompt + model)`. This means:
- Same PDF + same provider + same model = $0 on re-run
- Changing the provider or model invalidates the cache (intentional)
- Editing an intermediate JSON and resuming from that stage = $0 for earlier
  stages (cache hits) + cost only for the changed stage

## Error Handling and Graceful Degradation

| Failure | Behavior |
|---------|----------|
| PDF is scanned (no text) | Mark job failed, suggest OCR (post-MVP) |
| LLM call fails after 3 retries | Mark stage failed, chapter fails with reason |
| LLM returns malformed JSON | One repair retry with a "fix this JSON" prompt, then fail |
| Assessment missing correct option | Regenerate that assessment once, then fail |
| Misconception contains correct answer | Flag for review, can be auto-regenerated |
| Net-new LLE word generation fails | Word gets fallback string, chapter still passes |
| QA harness fails | Chapter marked failed, failure list surfaced |
| Node.js not available | Python fallback QA runs (fewer checks, still useful) |

## Cost Estimation

Per the PRD, the target is <$0.50 per chapter. The adapter tracks estimated
cost per call based on approximate token counts and provider pricing:

| Provider | Input cost | Output cost |
|----------|-----------|-------------|
| OpenAI GPT-4o-mini | $0.15/1M | $0.60/1M |
| Gemini 1.5 Flash | $0.075/1M | $0.30/1M |
| Claude 3 Haiku | $0.25/1M | $1.25/1M |

Typical chapter: ~5 LLM calls (analyze, design, 1-3 assessment batches, 1-3
LLE batches) ≈ $0.10–$0.30 with GPT-4o-mini.

## Extending the System

### Adding a new LLM provider
1. Add a `_call_<provider>()` method to `LLMAdapter`
2. Add the provider to `Config.get_api_key()`
3. Add the provider to `config.yaml`

### Adding a new agent
1. Create a new agent class inheriting from `BaseAgent`
2. Implement the `run()` method
3. Add the stage to `STAGE_ORDER` in schemas
4. Wire it into the orchestrator's `run_pipeline()` method

### Adding a new step type
1. Add the type to the `Step` Pydantic model's `Literal` union
2. Add it to `schema/chapter_spec.schema.json`
3. Add a render branch in the v5 template's `App.render()`
4. Add a QA check for the new type in `qa/run_qa.js`
