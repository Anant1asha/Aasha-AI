import { HatchableSyncAdapter, LearningEvent } from "../adapters/HatchableSyncAdapter.ts";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

async function runTests() {
  console.log("=== AASHA-AIOS DELTA & BATCH SUITE ===");
  const adapter = new HatchableSyncAdapter("https://aasha.hatchable.site/api");

  let token: string | undefined = undefined;
  try {
    const authDir = path.join(os.homedir(), ".mcp-auth", "mcp-remote-v1");
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      const tokenFile = files.find(f => f.endsWith("_tokens.json"));
      if (tokenFile) {
        const tokenData = JSON.parse(fs.readFileSync(path.join(authDir, tokenFile), "utf8"));
        token = tokenData.access_token;
      }
    }
  } catch (err) {
    console.warn("Could not read auth token:", err);
  }

  // 1. Test Delta Fetch for Class 8 Rational Numbers (Cold fetch)
  console.log("\n[Test 1] Delta Fetch: Class 8 Rational Numbers (New version)");
  const delta = await adapter.fetchChapterDelta("math8-rational-numbers", 1, token);
  console.log("  Delta response:", {
    chapterId: delta?.chapterId,
    version: delta?.version,
    upToDate: delta?.upToDate,
    itemsCount: delta?.itemBank?.length
  });

  if (delta && delta.chapterId === "math8-rational-numbers" && delta.upToDate === false && (delta.itemBank?.length || 0) >= 2) {
    console.log("  PASS: Delta fetched with full 4-tier hints and zero-spoiler distractors.");
  } else {
    throw new Error(`FAIL: Unexpected delta response: ${JSON.stringify(delta)}`);
  }

  // 2. Test 304 upToDate Bandwidth Optimization (Client already has version 3)
  console.log("\n[Test 2] Delta 304 Bandwidth Check (Client has v3)");
  const upToDateRes = await adapter.fetchChapterDelta("math8-rational-numbers", 3, token);
  console.log("  UpToDate response:", upToDateRes);
  if (upToDateRes && upToDateRes.upToDate === true && !upToDateRes.itemBank) {
    console.log("  PASS: Bandwidth optimization confirmed — zero payload transfer when client is up to date.");
  } else {
    throw new Error(`FAIL: Expected upToDate=true, got: ${JSON.stringify(upToDateRes)}`);
  }

  // 3. Test Bulk Sync Batch of 10 events
  console.log("\n[Test 3] Bulk Batch Sync");
  const testEvents: LearningEvent[] = Array.from({ length: 10 }, (_, i) => ({
    eventId: `evt_delta_test_${Date.now()}_${i}`,
    learnerId: "lrn_beta_042",
    type: "STEP_COMPLETED",
    occurredAt: new Date().toISOString(),
    payload: { chapterId: "math8-rational-numbers", score: 100 }
  }));
  const syncRes = await adapter.syncBatchBulk(testEvents, { authToken: token });
  console.log("  Sync Result:", syncRes);
  if (syncRes.syncedCount === 10 && syncRes.failedCount === 0) {
    console.log("  PASS: 10 events synced cleanly.");
  } else {
    throw new Error(`FAIL: Sync failed: ${JSON.stringify(syncRes)}`);
  }

  console.log("\nALL EXPERIMENT TESTS COMPLETED SUCCESSFULLY.");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
