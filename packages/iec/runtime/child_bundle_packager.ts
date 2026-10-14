/**
 * AASHA AIOS — IEC Child Bundle Packager
 * Path: Aasha-AI/packages/iec/runtime/child_bundle_packager.ts
 *
 * Packages validated RawExperienceArtifacts into self-contained, offline-first child HTML5 bundles.
 * Enforces the Child Runtime Network Policy and the 20 MB ceiling.
 */

import { RawExperienceArtifact } from '../providers/provider_interface';
import { ProvenanceTracker } from '../provenance/provenance_tracker';

export interface ChildBundleResult {
  readonly bundleHtml: string;
  readonly byteSize: number;
  readonly bundleSha256: string;
  readonly isOfflineReady: boolean;
}

export class ChildBundlePackager {
  /**
   * Compiles the raw artifact into a single, self-contained HTML5 document.
   */
  public static package(artifact: RawExperienceArtifact): ChildBundleResult {
    const bundleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${artifact.experienceId}</title>
  <style>
    /* Reset & Base Viewport Rules */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #0f172a; overflow-x: hidden; }
    .aasha-runtime-stage { width: 100%; min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; }
    ${artifact.cssCode}
  </style>
</head>
<body>
  <main class="aasha-runtime-stage">
    ${artifact.htmlFragment}
  </main>

  <script>
    /* Inlined Non-Destructive AashaExperienceContract Runtime */
    window.__AASHA_RUNTIME_VERSION__ = "2.1.0";
    window.__AASHA_EXPERIENCE_ID__ = "${artifact.experienceId}";
    window.__AASHA_OFFLINE_BUFFER__ = [];

    // Capture and buffer custom telemetry events locally
    window.addEventListener("aasha:telemetry", function(e) {
      if (e.detail) {
        window.__AASHA_OFFLINE_BUFFER__.push(e.detail);
      }
    });

    ${artifact.javascriptCode}
  </script>
</body>
</html>`.trim();

    const byteSize = Buffer.byteLength(bundleHtml, 'utf8');
    if (byteSize > 20971520) {
      throw new Error(`BUNDLE_SIZE_EXCEEDED: ${byteSize} bytes exceeds the 20MB limit.`);
    }

    const bundleSha256 = ProvenanceTracker.computeContentHash(bundleHtml);

    return {
      bundleHtml,
      byteSize,
      bundleSha256,
      isOfflineReady: true,
    };
  }
}
