import { HatchableSyncAdapter } from "../adapters/HatchableSyncAdapter.ts";

async function testDeltas() {
  console.log("=== AASHA-AIOS DELTA SYNC VALIDATION ===");
  const adapter = new HatchableSyncAdapter("https://aasha.hatchable.site/api");

  console.log("Fetching deltas for Class 8 Rational Numbers...");
  const deltas = await adapter.fetchDeltas({ chapterId: "math8-rational-numbers" });
  console.log("Deltas received:", deltas.length);
  if (deltas.length > 0 && deltas[0].chapterId === "math8-rational-numbers") {
    console.log("  PASS: Delta fetched successfully. Items count:", deltas[0].deltaItems.length);
    console.log("  Sample item prompt:", deltas[0].deltaItems[0].prompt);
  } else {
    throw new Error("FAIL: No deltas received or mismatch!");
  }
}

testDeltas().catch(err => {
  console.error("Delta test failed:", err);
  process.exit(1);
});
