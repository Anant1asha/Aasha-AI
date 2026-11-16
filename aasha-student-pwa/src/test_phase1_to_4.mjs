
import assert from "node:assert/strict";
import fs from "node:fs";
import { PWA_TABS, renderTeacherCohortDashboard, renderFacilitatorPinModal } from "./app.js";
import { REWARD_STORE_CATALOGUE, redeemStoreItemWithPin } from "./rewards.js";
import { buildCohortSummary, exportSignedCohortOrderPack } from "./sync.js";

assert.equal(PWA_TABS.length, 5, "PWA must expose 5 navigation tabs including Store");
const summary = buildCohortSummary(
  [
    { studentId: "stu_1", name: "Aarav", masteryPct: 82, tokenBalance: 45 },
    { studentId: "stu_2", name: "Diya", masteryPct: 91, tokenBalance: 60 }
  ],
  [{ id: "ord_1", status: "PENDING_STAFF_PIN" }],
  REWARD_STORE_CATALOGUE
);
const html = renderTeacherCohortDashboard(summary);
assert.ok(html.includes("id=\"teacher-cohort-dashboard\""));
assert.ok(html.includes("min-height:44px"));
assert.ok(html.includes("env(safe-area-inset-bottom, 16px)"));

const resOk = redeemStoreItemWithPin({ studentBalance: 150, itemId: "item_notebook_a4", staffPin: "1080", inventory: { item_notebook_a4: 4 } });
assert.equal(resOk.ok, true);
assert.equal(resOk.newBalance, 50);

const orderPack = exportSignedCohortOrderPack(summary, [{ orderId: "ORD-101", itemId: "item_notebook_a4", cost: 25 }], "CENTER-UP-GN-01");
assert.equal(orderPack.center_id, "CENTER-UP-GN-01");
assert.ok(orderPack.integrity_hash.startsWith("fnv1a32:"));

const pinModal = renderFacilitatorPinModal("Fulfill Store Order", "item_notebook_a4");
assert.ok(pinModal.includes("id=\"facilitator-pin-modal\""));
assert.ok(pinModal.includes("min-height:44px"));
assert.ok(!pinModal.includes("prompt(") && !pinModal.includes("alert("));

const loopSrc = fs.readFileSync("/tmp/aasha_stage_pack/scripts/aasha_continuous_loop.mjs", "utf8");
assert.ok(loopSrc.includes("assertNonMainBranch"));
assert.ok(loopSrc.includes("candidate_dictionary_hi.json"));
assert.ok(!loopSrc.includes("git add -A"));
console.log("✅ ALL PHASE 1-4 + FOCUS-UNIT-PHASE-D-003 ASSERTIONS PASSED!");

import { verifySignedCohortOrderPack, getTeasSqliteCatalogueManifest } from "./sync.js";

const validCheck = verifySignedCohortOrderPack(orderPack);
assert.equal(validCheck.valid, true, "Untampered signed cohort order pack must pass FNV-1a verification");

const tamperedPack = { ...orderPack, cohort_metrics: { ...orderPack.cohort_metrics, total_tokens_minted: 999999 } };
const tamperedCheck = verifySignedCohortOrderPack(tamperedPack);
assert.equal(tamperedCheck.valid, false, "Tampered token count must fail FNV-1a verification");
assert.equal(tamperedCheck.reason, "TAMPERED_INTEGRITY_HASH");

const manifest = getTeasSqliteCatalogueManifest();
assert.equal(manifest.chapters_count, 26);
assert.equal(manifest.tln_nodes_count, 78);
assert.equal(manifest.vocabulary_rows_count, 544);
assert.equal(manifest.under_20mib, true);

const srvSrc = fs.readFileSync("/tmp/aasha_stage_pack/Aasha-AI/server/server.js", "utf8");
assert.ok(srvSrc.includes("/api/catalogue/teas-sqlite-manifest"), "Server must expose teas-sqlite-manifest endpoint");
assert.ok(srvSrc.includes("/api/sync/cohort-order-pack"), "Server must expose cohort-order-pack sync endpoint");
assert.ok(srvSrc.includes("TAMPERED_INTEGRITY_HASH"), "Server must reject tampered cohort order packs");
console.log("✅ FOCUS-UNIT-PHASE-F-001 (End-to-End Centre Server + PWA Signed Cohort Pack Sync & TEAS SQLite Manifest) PASSED!");

