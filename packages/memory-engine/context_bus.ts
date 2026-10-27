import { Memo0DualProvider } from './memo0_dual_provider';
import { SQLiteGraphProvider } from './sqlite_graph_provider';
import { AASHAGatekeeper, GatekeeperResult } from '../aasha-rules/aasha_gatekeeper';
import { verifyApproval } from '../aios/trust_authority';
import * as crypto from 'node:crypto';
import {
  AgentRole,
  ApprovedBuildLesson,
  ApprovedBuildLessonSelection,
  MemoryItem,
  TaskCapabilityProfile,
} from './memory_interface';

const SHA256_RE = /^[a-f0-9]{64}$/i;
const REQUIRED_LESSON_TEXT = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isTextList = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).filter((key) => object[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Digest of all lesson claims/evidence except the signature that approves that digest. */
export function computeApprovedBuildLessonManifestHash(lesson: ApprovedBuildLesson): string {
  const { reviewer_decision: _reviewerDecision, ...manifest } = lesson;
  return crypto.createHash('sha256').update(stableJson(manifest)).digest('hex');
}

/** Fail-closed validation shared by lesson persistence and retrieval. */
export function validateApprovedBuildLesson(
  lesson: ApprovedBuildLesson,
  trustedKeysJson = process.env.AASHA_HIL_TRUSTED_KEYS_JSON,
  options: { verifyApprovalsAtIssuance?: boolean } = {},
): string[] {
  const errors: string[] = [];
  if (!lesson || lesson.schema_version !== '1.0' || !REQUIRED_LESSON_TEXT(lesson.lesson_id)) errors.push('lesson schema or ID is invalid');
  if (!lesson?.task_profile || !REQUIRED_LESSON_TEXT(lesson.task_profile.task_type) || !REQUIRED_LESSON_TEXT(lesson.task_profile.goal)) errors.push('task profile is incomplete');
  if (!Array.isArray(lesson?.task_profile?.capability_tags) || lesson.task_profile.capability_tags.length === 0 || lesson.task_profile.capability_tags.some((tag) => !REQUIRED_LESSON_TEXT(tag))) errors.push('task capability tags are missing or invalid');
  if (lesson?.task_profile?.constraints !== undefined && (!isTextList(lesson.task_profile.constraints) || lesson.task_profile.constraints.some((item) => !REQUIRED_LESSON_TEXT(item)))) errors.push('task constraints are invalid');
  if (!lesson?.artifact || !REQUIRED_LESSON_TEXT(lesson.artifact.artifact_id) || !SHA256_RE.test(lesson.artifact.sha256 || '') || !REQUIRED_LESSON_TEXT(String(lesson.artifact.version ?? ''))) errors.push('artifact identity or SHA-256 is invalid');
  if (!lesson?.lesson || !REQUIRED_LESSON_TEXT(lesson.lesson.reusable_pattern) || !isTextList(lesson.lesson.adaptation_notes) || !isTextList(lesson.lesson.known_limits)) errors.push('reusable lesson or limitations are incomplete');
  if (!Array.isArray(lesson?.source_provenance) || lesson.source_provenance.length === 0 || lesson.source_provenance.some((source) => !REQUIRED_LESSON_TEXT(source?.source_id) || !SHA256_RE.test(source?.sha256 || ''))) errors.push('source provenance is missing or invalid');
  if (!Array.isArray(lesson?.test_evidence) || lesson.test_evidence.length === 0 || lesson.test_evidence.some((test) =>
    !REQUIRED_LESSON_TEXT(test?.test_id) || test.status !== 'PASS' || !REQUIRED_LESSON_TEXT(test.command) ||
    !SHA256_RE.test(test.sha256 || '') || !Number.isFinite(Date.parse(test.run_at)))) errors.push('passing test evidence is missing or invalid');

  if (lesson?.artifact && lesson?.build_approval) {
    const buildApproval = verifyLessonApproval(lesson.build_approval, {
      action: 'APPROVE',
      artifactId: lesson.artifact.artifact_id,
      artifactHash: lesson.artifact.sha256,
      version: lesson.artifact.version,
    }, trustedKeysJson, options.verifyApprovalsAtIssuance === true);
    if (!buildApproval.valid) errors.push(`build approval is not verified (${buildApproval.reason || 'unknown reason'})`);
  } else {
    errors.push('signed build approval is missing');
  }
  if (lesson?.reviewer_decision && lesson?.lesson_id) {
    const reviewerApproval = verifyLessonApproval(lesson.reviewer_decision, {
      action: 'APPROVE',
      artifactId: `approved-build-lesson:${lesson.lesson_id}`,
      artifactHash: computeApprovedBuildLessonManifestHash(lesson),
      version: lesson.schema_version,
    }, trustedKeysJson, options.verifyApprovalsAtIssuance === true);
    if (!reviewerApproval.valid) errors.push(`lesson manifest approval is not verified (${reviewerApproval.reason || 'unknown reason'})`);
  } else {
    errors.push('signed lesson manifest reviewer decision is missing');
  }
  return errors;
}

function verifyLessonApproval(
  record: ApprovedBuildLesson['reviewer_decision'],
  expected: Parameters<typeof verifyApproval>[1],
  trustedKeysJson: string | undefined,
  verifyAtIssuance: boolean,
): ReturnType<typeof verifyApproval> {
  const issuedAt = Date.parse(record?.issued_at || '');
  const verificationTime = verifyAtIssuance && Number.isFinite(issuedAt) ? issuedAt + 1 : Date.now();
  return verifyApproval(record, expected, trustedKeysJson, verificationTime);
}

function normalizeTag(tag: string): string {
  return tag.trim().toLocaleLowerCase('en-US').replace(/\s+/g, '-');
}

function emptySelection(evidenceStatus: ApprovedBuildLessonSelection['evidence_status'] = 'NO_VERIFIED_MATCH'): ApprovedBuildLessonSelection {
  return { strategy: 'NO_APPROVED_LESSON', evidence_status: evidenceStatus, lessons: [] };
}

export interface EnrichedAgentContext {
  agentRole: AgentRole;
  applicableRules: any[];
  prerequisites: any[];
  misconceptions: any[];
  experienceFewShots: MemoryItem[];
  experienceSelection: ApprovedBuildLessonSelection;
  systemContextInjection: string;
}

export class ContextBus {
  private memoryProvider: Memo0DualProvider;
  private graphProvider: SQLiteGraphProvider;
  private trustedKeysJson?: string;

  constructor(memoryProvider?: Memo0DualProvider, graphProvider?: SQLiteGraphProvider, trustedKeysJson = process.env.AASHA_HIL_TRUSTED_KEYS_JSON) {
    this.memoryProvider = memoryProvider || new Memo0DualProvider();
    this.graphProvider = graphProvider || new SQLiteGraphProvider();
    this.trustedKeysJson = trustedKeysJson;
  }

  getMemory(): Memo0DualProvider {
    return this.memoryProvider;
  }

  getGraph(): SQLiteGraphProvider {
    return this.graphProvider;
  }

  /**
   * Enriches an agent turn with relevant curriculum graph nodes, AASHA rules, and experience few-shots.
   */
  async buildAgentContext(agentRole: AgentRole, conceptId: string, topicQuery: string, taskProfile?: TaskCapabilityProfile): Promise<EnrichedAgentContext> {
    const [rules, prereqs, misconceptions, selection] = await Promise.all([
      this.graphProvider.getRulesForAgent(agentRole),
      this.graphProvider.getPrerequisites(conceptId),
      this.graphProvider.getMisconceptions(conceptId),
      taskProfile ? this.selectApprovedBuildLessons(agentRole, taskProfile) : Promise.resolve(emptySelection('UNKNOWN_EVIDENCE')),
    ]);
    const experiences = selection.lessons.map((match) => match.lesson);

    const contextParts: string[] = [];
    contextParts.push(`\n--- [AASHA CONTEXT BUS ENRICHMENT for ${agentRole}] ---`);
    contextParts.push(`Approved build lesson retrieval: ${selection.evidence_status}. No unverified experience is evidence of an approved build.`);

    if (prereqs.length > 0) {
      contextParts.push(`Prerequisites for '${conceptId}':`);
      for (const p of prereqs) {
        contextParts.push(`- [${p.id}] ${p.label}: ${JSON.stringify(p.properties)}`);
      }
    }

    if (misconceptions.length > 0) {
      contextParts.push(`Known Student Misconceptions:`);
      for (const m of misconceptions) {
        contextParts.push(`- [Misconception] ${m.properties.misconception || m.id}`);
      }
    }

    if (experiences.length > 0) {
      contextParts.push(`Verified, task-relevant approved build lessons (${selection.strategy}):`);
      for (const match of selection.lessons) {
        const exp = match.lesson;
        const lesson = exp.metadata?.approved_build_lesson as ApprovedBuildLesson;
        const sourceRefs = lesson.source_provenance.map((source) => `${source.source_id}@${source.sha256}`).join(', ');
        const testRefs = lesson.test_evidence.map((test) => `${test.test_id}@${test.sha256}`).join(', ');
        const adaptation = match.strategy === 'ADAPT' ? ` Adaptation notes: ${lesson.lesson.adaptation_notes.join(' ')}` : '';
        const limits = lesson.lesson.known_limits.length ? ` Known limits: ${lesson.lesson.known_limits.join(' ')}` : '';
        contextParts.push(`- [APPROVED ${match.strategy}; artifact=${lesson.artifact.artifact_id}@${lesson.artifact.sha256}; reviewer=${lesson.reviewer_decision.reviewer_id}; sources=${sourceRefs}; tests=${testRefs}] ${lesson.lesson.reusable_pattern}${adaptation}${limits}`);
      }
    }

    contextParts.push(`----------------------------------------------------\n`);

    return {
      agentRole,
      applicableRules: rules,
      prerequisites: prereqs,
      misconceptions,
      experienceFewShots: experiences,
      experienceSelection: selection,
      systemContextInjection: contextParts.join('\n'),
    };
  }

  /**
   * Validates agent output against AASHA 24 Rules.
   */
  validateOutput(content: string, agentRole: AgentRole): GatekeeperResult {
    return AASHAGatekeeper.auditDeterministic(content, agentRole);
  }

  /**
   * Curates a validated successful generation into the Experience Memory Bank.
   */
  async recordExperience(agentRole: AgentRole, content: string, metadata: Record<string, any>): Promise<MemoryItem> {
    return this.memoryProvider.addMemory({
      agentRole,
      category: 'experience',
      content,
      metadata,
    });
  }

  /** Store an approved build lesson only after its evidence and signed HIL decision verify. */
  async recordApprovedBuildLesson(agentRole: AgentRole, lesson: ApprovedBuildLesson): Promise<MemoryItem> {
    // An exact retry is safe even after the original short-lived HIL approval
    // expires. The original decision must still verify at its issuance time.
    const historicalErrors = validateApprovedBuildLesson(lesson, this.trustedKeysJson, { verifyApprovalsAtIssuance: true });
    if (historicalErrors.length) throw new Error(`Approved build lesson rejected: ${historicalErrors.join('; ')}`);
    const incomingHash = computeApprovedBuildLessonManifestHash(lesson);
    const existingLessons = await this.memoryProvider.getLocalMemoriesByRole(agentRole, 'approved_build_lesson');
    const existing = existingLessons.find(memory =>
      memory.metadata?.approved_build_lesson?.lesson_id === lesson.lesson_id);
    if (existing) {
      const existingLesson = existing.metadata?.approved_build_lesson as ApprovedBuildLesson | undefined;
      if (!existingLesson || validateApprovedBuildLesson(existingLesson, this.trustedKeysJson, { verifyApprovalsAtIssuance: true }).length > 0 ||
          computeApprovedBuildLessonManifestHash(existingLesson) !== incomingHash) {
        throw new Error(`Approved build lesson rejected: lesson ID '${lesson.lesson_id}' already refers to different or invalid evidence`);
      }
      return existing;
    }
    const errors = validateApprovedBuildLesson(lesson, this.trustedKeysJson);
    if (errors.length) throw new Error(`Approved build lesson rejected: ${errors.join('; ')}`);
    return this.memoryProvider.addLocalMemory({
      agentRole,
      category: 'approved_build_lesson',
      content: lesson.lesson.reusable_pattern,
      metadata: { approved_build_lesson: lesson },
    });
  }

  /** Select only locally stored, signature-verified lessons with compatible capabilities and constraints. */
  async selectApprovedBuildLessons(
    agentRole: AgentRole,
    taskProfile: TaskCapabilityProfile,
    limit = 3,
  ): Promise<ApprovedBuildLessonSelection> {
    if (!taskProfile || !REQUIRED_LESSON_TEXT(taskProfile.task_type) || !REQUIRED_LESSON_TEXT(taskProfile.goal) ||
        !Array.isArray(taskProfile.capability_tags) || taskProfile.capability_tags.length === 0 ||
        taskProfile.capability_tags.some((tag) => !REQUIRED_LESSON_TEXT(tag)) ||
        (taskProfile.constraints !== undefined && (!isTextList(taskProfile.constraints) || taskProfile.constraints.some((item) => !REQUIRED_LESSON_TEXT(item))))) {
      return emptySelection('UNKNOWN_EVIDENCE');
    }
    const stored = await this.memoryProvider.getLocalMemoriesByRole(agentRole, 'approved_build_lesson');
    const requiredTags = new Set(taskProfile.capability_tags.map(normalizeTag));
    const requiredConstraints = new Set((taskProfile.constraints || []).map(normalizeTag));
    const matches: ApprovedBuildLessonSelection['lessons'] = [];
    let invalidEvidence = false;

    for (const memory of stored) {
      const lesson = memory.metadata?.approved_build_lesson as ApprovedBuildLesson | undefined;
      if (!lesson || validateApprovedBuildLesson(lesson, this.trustedKeysJson, { verifyApprovalsAtIssuance: true }).length > 0) {
        invalidEvidence = true;
        continue;
      }
      const availableTags = new Set(lesson.task_profile.capability_tags.map(normalizeTag));
      const availableConstraints = new Set((lesson.task_profile.constraints || []).map(normalizeTag));
      if ([...requiredConstraints].some((constraint) => !availableConstraints.has(constraint))) continue;
      const matchedCapabilities = [...requiredTags].filter((tag) => availableTags.has(tag));
      if (matchedCapabilities.length === 0) continue;
      const score = matchedCapabilities.length / requiredTags.size;
      const sameTaskType = normalizeTag(lesson.task_profile.task_type) === normalizeTag(taskProfile.task_type);
      const strategy = score === 1 && sameTaskType ? 'REUSE' : 'ADAPT';
      matches.push({ strategy, lesson: memory, matched_capabilities: matchedCapabilities, score });
    }

    matches.sort((left, right) => right.score - left.score || left.lesson.id.localeCompare(right.lesson.id));
    const chosen = matches.slice(0, Math.max(1, limit));
    if (chosen.length === 0) return emptySelection(invalidEvidence ? 'UNKNOWN_EVIDENCE' : 'NO_VERIFIED_MATCH');
    const strategy = chosen.some((match) => match.strategy === 'REUSE') ? 'REUSE' : 'ADAPT';
    return { strategy, evidence_status: 'VERIFIED_MATCH', lessons: chosen };
  }
}
