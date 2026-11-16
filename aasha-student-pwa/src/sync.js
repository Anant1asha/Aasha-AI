export function enqueueSyncEvent(state, event) {
  state.syncOutbox = Array.isArray(state.syncOutbox) ? state.syncOutbox : [];
  state.syncOutbox.push({
    id: event.id || `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...event,
    queuedAt: new Date().toISOString()
  });
  return state.syncOutbox.length;
}

export async function syncNowWithServer(state, baseUrl = 'http://localhost:3001') {
  const outbox = Array.isArray(state.syncOutbox) ? state.syncOutbox : [];
  if (outbox.length === 0) {
    return { ok: true, synced: 0, remaining: 0 };
  }
  try {
    const res = await fetch(`${baseUrl}/api/sync/quiz-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: state.studentId || 'student_local_01',
        events: outbox
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.syncOutbox = [];
    if (typeof data.balance === 'number') {
      state.coins = Math.max(Number(state.coins || 0), data.balance);
    }
    state.lastSyncAt = new Date().toISOString();
    return { ok: true, synced: data.synced || outbox.length, remaining: 0, serverBalance: data.balance };
  } catch (err) {
    return { ok: false, synced: 0, remaining: outbox.length, error: err.message };
  }
}

export function fnv1aHashHex(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function exportSignedCohortOrderPack(cohortSummary = {}, redemptions = [], centerId = "CENTER-UP-GN-01") {
  const canonicalPayload = {
    schema_version: "1.0.0",
    center_id: String(centerId || "CENTER-UP-GN-01"),
    exported_at_utc: new Date().toISOString(),
    cohort_metrics: {
      total_students: Number(cohortSummary.totalStudents || 0),
      avg_mastery_pct: Number(cohortSummary.avgMasteryPct || 0),
      total_tokens_minted: Number(cohortSummary.totalTokensMinted || 0),
      pending_redemptions: Number(cohortSummary.pendingRedemptions || 0)
    },
    fulfilled_redemptions: Array.isArray(redemptions)
      ? redemptions.map((r) => ({
          order_id: r.orderId || r.id || "ORD-UNKNOWN",
          item_id: r.itemId,
          cost: Number(r.cost || 0),
          status: r.status || "FULFILLED_BY_STAFF"
        }))
      : []
  };
  const serialized = JSON.stringify(canonicalPayload);
  const digest = fnv1aHashHex(serialized + "::AASHA-OFFLINE-ORDER-PACK-V1");
  return {
    ...canonicalPayload,
    integrity_hash: `fnv1a32:${digest}`,
    byte_length: serialized.length
  };
}


export function buildCohortSummary(students = [], redemptions = [], catalogue = []) { const totalStudents = students.length; const avgMasteryPct = totalStudents ? students.reduce((a, s) => a + Number(s.masteryPct || 0), 0) / totalStudents : 0; const totalTokensMinted = students.reduce((a, s) => a + Number(s.tokenBalance || 0), 0); const pendingRedemptions = redemptions.filter(r => r.status === "PENDING_STAFF_PIN").length; const lowStockAlerts = catalogue.filter(i => Number(i.stock ?? 5) <= 3); return { totalStudents, avgMasteryPct, totalTokensMinted, pendingRedemptions, lowStockAlerts, students }; }

export function verifySignedCohortOrderPack(pack = {}) {
  if (!pack || typeof pack !== "object" || typeof pack.integrity_hash !== "string") {
    return { valid: false, reason: "MISSING_INTEGRITY_HASH" };
  }
  const canonicalPayload = {
    schema_version: pack.schema_version || "1.0.0",
    center_id: String(pack.center_id || "CENTER-UP-GN-01"),
    exported_at_utc: pack.exported_at_utc,
    cohort_metrics: {
      total_students: Number(pack.cohort_metrics?.total_students || 0),
      avg_mastery_pct: Number(pack.cohort_metrics?.avg_mastery_pct || 0),
      total_tokens_minted: Number(pack.cohort_metrics?.total_tokens_minted || 0),
      pending_redemptions: Number(pack.cohort_metrics?.pending_redemptions || 0)
    },
    fulfilled_redemptions: Array.isArray(pack.fulfilled_redemptions)
      ? pack.fulfilled_redemptions.map((r) => ({
          order_id: r.order_id || r.orderId || r.id || "ORD-UNKNOWN",
          item_id: r.item_id || r.itemId,
          cost: Number(r.cost || 0),
          status: r.status || "FULFILLED_BY_STAFF"
        }))
      : []
  };
  const serialized = JSON.stringify(canonicalPayload);
  const expectedHash = `fnv1a32:${fnv1aHashHex(serialized + "::AASHA-OFFLINE-ORDER-PACK-V1")}`;
  if (pack.integrity_hash !== expectedHash) {
    return { valid: false, reason: "TAMPERED_INTEGRITY_HASH", expectedHash, actualHash: pack.integrity_hash };
  }
  return { valid: true, integrityHash: expectedHash, canonicalPayload };
}

export function getTeasSqliteCatalogueManifest() {
  return {
    schema_version: "2.0.0",
    artifact: "teas_content.db.gz",
    gzip_bytes: 30874,
    raw_db_bytes: 204800,
    sha256_prefix: "91c89c73e8031707",
    chapters_count: 26,
    tln_nodes_count: 78,
    vocabulary_rows_count: 544,
    under_20mib: true,
    zero_external_urls: true
  };
}

export function aggregateCohortMisconceptions(events = []) {
  const counts = {};
  for (const ev of events) {
    if (!ev || ev.passed || Number(ev.score ?? 100) >= 60) continue;
    const key = `${ev.chapterId || "unknown"}::${ev.conceptCode || ev.nodeId || "general"}`;
    if (!counts[key]) {
      counts[key] = {
        chapterId: ev.chapterId || "unknown",
        conceptCode: ev.conceptCode || ev.nodeId || "general",
        strugglingCount: 0,
        sampleWrongOptions: []
      };
    }
    counts[key].strugglingCount += 1;
    if (ev.selectedOption && !counts[key].sampleWrongOptions.includes(ev.selectedOption)) {
      counts[key].sampleWrongOptions.push(ev.selectedOption);
    }
  }
  return Object.values(counts).sort((a, b) => b.strugglingCount - a.strugglingCount);
}

export function verifySignedStudentSnapshot(snapshot = {}) {
  if (!snapshot || typeof snapshot !== "object" || snapshot.schemaVersion !== "aasha.student.snapshot.v1") {
    return { valid: false, reason: "INVALID_SNAPSHOT_SCHEMA" };
  }
  const canonical = JSON.stringify({
    studentId: String(snapshot.studentId || "student_default"),
    coinsBalance: Number(snapshot.coinsBalance || 0),
    completedChapters: Array.isArray(snapshot.completedChapters) ? [...snapshot.completedChapters].sort() : [],
    streakDays: Number(snapshot.streakDays || 0),
  });
  const expectedChecksum = `fnv1a32:${fnv1aHashHex(canonical)}`;
  if (snapshot.checksum !== expectedChecksum) {
    return { valid: false, reason: "SNAPSHOT_CHECKSUM_MISMATCH", expectedChecksum, actualChecksum: snapshot.checksum };
  }
  return { valid: true, checksum: expectedChecksum };
}
