# Deployment & Configuration

This guide details how to deploy the Aasha pipeline locally and configure it for production runs.

## Local Deployment Steps

1. **Clone the Repository:**
   ```bash
   git clone <repo-url> aasha-pipeline
   cd aasha-pipeline
   ```
2. **Setup Python Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -e ".[dev]"
   ```
3. **Install Node.js Dependencies (for QA Harness):**
   ```bash
   npm install jsdom
   ```

## API Key Management

The system relies on LLM providers. Create a `.env` file in the root directory:
```env
# Required for default operation
OPENAI_API_KEY=sk-your-openai-key

# Fallback / Alternative providers
GEMINI_API_KEY=AIza-your-gemini-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Operational Settings
MAX_WORKERS=5
ENVIRONMENT=production
```

## Model Routing Configurations

You can configure which models are used for specific agents to balance cost and performance. This is defined in `config.yaml` or via CLI arguments:

- **Heavy Reasoning (Agent 1 & Agent 2):** Best routed to `gpt-4o` or `gemini-1.5-pro`.
- **Bulk Processing (Agent 3 & Agent 4):** Can be routed to cheaper models like `gpt-4o-mini` or `gemini-1.5-flash` to save costs on large batch jobs.

Example `config.yaml`:
```yaml
routing:
  agent_1: "gpt-4o"
  agent_2: "gpt-4o"
  agent_3: "gpt-4o-mini"
  agent_4: "gpt-4o-mini"
```

## QA Harness Setup

The QA Agent (Agent 8 in v1, integrated into Agent 4 output in v2) relies on a headless Node.js environment to simulate the DOM.
1. Ensure `node` is available in your PATH.
2. The pipeline invokes `qa/run_qa.js`.
3. If Node is not found, the system gracefully falls back to a Python-based structural check (Regex/JSON-schema based), but you lose interactive DOM validation. For production deployment, Node.js + jsdom is **mandatory**.
