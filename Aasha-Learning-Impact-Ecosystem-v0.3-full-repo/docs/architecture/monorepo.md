# Monorepo Architecture

The repository is one product with modular packages. Apps compose engines; engines never depend on app UI. Content is data, not executable chapter-specific logic.

```text
Content package
  -> TLN/content schema
  -> Learning runtime
  -> Question engine
  -> Game/simulation/visual engines
  -> Assessment
  -> TEAS (progression authority)
  -> Reward (verified event policy)
  -> Impact (measurement/reporting)
  -> Offline event log
  -> Sync/API when available
```

Provider-specific code belongs in adapters. Core learning packages must not import vendor SDKs.
