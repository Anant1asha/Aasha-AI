import { ExperienceCandidate, RegistryIngestionEngine } from './registry_ingestion_engine';

export interface ChapterCertificationEvidence {
  chapterId: string;
  chapterVersion?: string;
  ltruthScore?: number;
  consoleErrors?: number;
  browserSmoke?: string[];
  artifactHash?: string;
}

export interface ComponentCertificationEvidence {
  componentGates: Record<string, 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_APPLICABLE'>;
  evidenceRefs: string[];
  provenanceRefs: string[];
  licenseReviewRef?: string;
  performanceEvidence?: string;
  accessibilityEvidence?: string;
  securityEvidence?: string;
}

export class RegistryCertificationBridge {
  constructor(private readonly registry: RegistryIngestionEngine) {}

  stageAfterChapterCertification(
    candidate: Omit<ExperienceCandidate, 'status' | 'artifact_hash'>,
    componentCode: string,
    chapterEvidence: ChapterCertificationEvidence
  ): ExperienceCandidate {
    if (chapterEvidence.ltruthScore !== undefined &&
        (chapterEvidence.ltruthScore < 100 || (chapterEvidence.consoleErrors ?? 0) !== 0)) {
      throw new Error('CHAPTER_CERTIFICATION_GATE_FAILED');
    }

    return this.registry.stageCandidate({
      metadata: {
        ...candidate,
        status: 'CANDIDATE',
        verification: {
          ...candidate.verification,
          chapter_ltruth: chapterEvidence.ltruthScore ?? null,
          console_errors: chapterEvidence.consoleErrors ?? null,
          evidence_refs: [
            ...(candidate.verification.evidence_refs || []),
            ...chapterEvidence.browserSmoke || [],
            ...(chapterEvidence.artifactHash ? [chapterEvidence.artifactHash] : [])
          ]
        }
      },
      componentCode,
      sourceKind: (candidate.provenance?.[0]?.source_type as any) || 'UNKNOWN'
    });
  }

  certifyAndPromote(
    candidate: ExperienceCandidate,
    evidence: ComponentCertificationEvidence
  ) {
    const updated: ExperienceCandidate = {
      ...candidate,
      verification: {
        ...candidate.verification,
        component_gates: evidence.componentGates,
        evidence_refs: [...new Set([
          ...(candidate.verification.evidence_refs || []),
          ...(evidence.evidenceRefs || []),
          ...(evidence.provenanceRefs || [])
        ])]
      }
    };

    if (evidence.licenseReviewRef) {
      updated.license = {
        ...updated.license,
        review_reference: evidence.licenseReviewRef
      };
    }

    const result = this.registry.promoteCandidate(updated);
    return { ...result, candidate: updated };
  }
}
