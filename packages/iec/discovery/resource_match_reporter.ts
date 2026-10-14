/**
 * AASHA AIOS — IEC Resource Match Reporter
 * Path: Aasha-AI/packages/iec/discovery/resource_match_reporter.ts
 *
 * Mandatory active governance artifact generator.
 * Must be generated BEFORE final strategy selection to document candidate capabilities
 * and justify the recommended implementation strategy.
 */

import { CandidateCapability, ExperienceRequirement } from '../contracts/experience_specification';

export interface ResourceMatchReportData {
  chapter: string;
  classNum: number;
  subject: string;
  requirement: ExperienceRequirement;
  candidates: CandidateCapability[];
  candidateCompositions: string[];
  offlineStatus: string;
  licenseStatus: string;
  mobileStatus: string;
  telemetryCompatibility: string;
  selectionRationale: string;
  rejectedCandidates: Array<{ candidateId: string; reason: string }>;
  timestamp: string;
}

export class ResourceMatchReporter {
  /**
   * Generates structured markdown report documenting discovery and justifying the strategy.
   */
  public static generateMarkdownReport(data: ResourceMatchReportData): string {
    const candidateLines = data.candidates.length > 0
      ? data.candidates.map(c => `  - **${c.name}** (\`${c.candidate_id}\` | Provider: ${c.provider_class} | License: ${c.license})`).join('\n')
      : '  - None found';

    const rejectedLines = data.rejectedCandidates.length > 0
      ? data.rejectedCandidates.map(r => `  - **${r.candidateId}**: ${r.reason}`).join('\n')
      : '  - None rejected';

    return `# MANDATORY RESOURCE MATCH REPORT
**Chapter**: ${data.chapter}  
**Subject**: ${data.subject} | **Class**: ${data.classNum}  
**Experience ID**: \`${data.requirement.experience_id}\`  
**Generated At**: ${data.timestamp}  

---

## 1. Learning & Mechanism Requirements
- **Target Capability**: ${data.requirement.capability_id}
- **Required Interaction**: ${data.requirement.interaction_mechanism}
- **Linked Learning Objectives**: ${data.requirement.learning_objective_ids.join(', ') || 'N/A'}
- **Linked Concepts**: ${data.requirement.concept_ids.join(', ') || 'N/A'}
- **Observable Evidence Signals**: ${data.requirement.evidence_signals.join(', ') || 'N/A'}

---

## 2. Discovered Candidates (Search Sequence Evaluated)
${candidateLines}

---

## 3. Compliance & Runtime Feasibility
- **Offline Fitness**: ${data.offlineStatus}
- **License Integrity**: ${data.licenseStatus}
- **Mobile & Touch Compatibility**: ${data.mobileStatus}
- **AASHA Telemetry Compatibility**: ${data.telemetryCompatibility}

---

## 4. Evaluation & Strategy Justification
- **Recommended Strategy Rationale**:
  ${data.selectionRationale}

## 5. Rejected Candidates & Documented Reasons
${rejectedLines}

---
*Governed by AASHA IEC Capability-First Selection Protocol. Provider name is never a bias factor.*
`;
  }
}
