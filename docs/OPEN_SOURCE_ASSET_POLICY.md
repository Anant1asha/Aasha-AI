# Open-Source Asset + Simulation Policy

Reuse before build is a standing engineering principle.

Every adopted asset must record: asset_id, source/project, source_url, license, attribution, version/commit, adapter version, offline status, modification/use status, fallback status and validation status.

Assets without a recorded license/provenance record are not promoted to production content.

External simulations are wrapped behind a stable Aasha adapter so chapter content does not depend on a vendor-specific API.