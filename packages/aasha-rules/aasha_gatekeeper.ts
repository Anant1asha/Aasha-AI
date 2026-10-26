import { AASHA_RULES, PROHIBITED_PATTERNS } from './aasha_rules';
import { QuestionSchemaValidator } from './question_schema_validator';

export interface GatekeeperViolation {
  sectionNumber: number;
  ruleTitle: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface GatekeeperResult {
  passed: boolean;
  violations: GatekeeperViolation[];
  repairPrompt?: string;
}

export class AASHAGatekeeper {
  /**
   * Phase 1 Deterministic Audit:
   * Fast, AST/Regex checks that run on every agent output before human review or QA.
   */
  static auditDeterministic(content: string, agentRole: string): GatekeeperResult {
    const violations: GatekeeperViolation[] = [];

    // 1. Check Section 16 & 13: Prohibited Phrases & Childish Slang
    for (const rule of PROHIBITED_PATTERNS) {
      if (rule.pattern.test(content)) {
        violations.push({
          sectionNumber: 16,
          ruleTitle: 'Transformation Safety Matrix',
          severity: 'ERROR',
          message: `Violates Section 16/13: Detected prohibited pattern matching ${rule.pattern}. Reason: ${rule.reason}`,
        });
      }
    }

    // 2. Check Section 15: Formal LaTeX Notation Integrity
    const inlineOpenCount = (content.match(/\\\(/g) || []).length;
    const inlineCloseCount = (content.match(/\\\)/g) || []).length;
    if (inlineOpenCount !== inlineCloseCount) {
      violations.push({
        sectionNumber: 15,
        ruleTitle: 'Formal Notation Rules',
        severity: 'ERROR',
        message: `Mismatched inline LaTeX delimiters: found ${inlineOpenCount} '\\(' vs ${inlineCloseCount} '\\)'`,
      });
    }

    const displayOpenCount = (content.match(/\\\[/g) || []).length;
    const displayCloseCount = (content.match(/\\\]/g) || []).length;
    if (displayOpenCount !== displayCloseCount) {
      violations.push({
        sectionNumber: 15,
        ruleTitle: 'Formal Notation Rules',
        severity: 'ERROR',
        message: `Mismatched display LaTeX delimiters: found ${displayOpenCount} '\\[' vs ${displayCloseCount} '\\]'`,
      });
    }

    // 3. Strict Check Section 11 & 12: Assessment / Exercise Bank Zero-Spoiler & Distractor Validation
    if (agentRole === 'AssessmentAgent' || content.includes('"opts"') || content.includes('"options"') || content.includes('quiz-opt')) {
      try {
        let parsed: any = null;
        try {
          parsed = JSON.parse(content);
        } catch {
          // If pure JSON parse fails, attempt to extract JSON or chapter structure
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        }

        if (parsed) {
          const bank = parsed.assessments || parsed.questions || parsed.exercises || (Array.isArray(parsed) ? parsed : [parsed]);
          const bankResult = QuestionSchemaValidator.validateExerciseBank(bank, agentRole);
          for (const err of bankResult.errors) {
            violations.push({
              sectionNumber: err.ruleId.includes('SPOILER') ? 12 : 11,
              ruleTitle: err.ruleId.includes('SPOILER') ? 'Never Give Away Answer (Anti-Spoiler Rule #1)' : 'Assessment Question Schema & Distractor Quality',
              severity: err.severity,
              message: `${err.ruleId}: ${err.message}`,
            });
          }
          for (const warn of bankResult.warnings) {
            violations.push({
              sectionNumber: 11,
              ruleTitle: 'Feedback Schema Recommendation',
              severity: warn.severity,
              message: `${warn.ruleId}: ${warn.message}`,
            });
          }
        }
      } catch {
        // Fallback for non-JSON content
      }
    }

    // 4. Check Section 24: Open-Source Cleanroom Reuse & GPL-3.0 License Isolation
    if (/GNU GENERAL PUBLIC LICENSE|GNU Affero General Public License|\bGPL-3\.0\b|\bGPLv3\b/i.test(content)) {
      violations.push({
        sectionNumber: 24,
        ruleTitle: 'Open-Source Cleanroom Reuse & License Isolation',
        severity: 'ERROR',
        message: 'GPL_COPYLEFT_CONTAGION: Raw GPL-3.0 copyleft license text detected. Foundations with copyleft licenses (such as PhET, Escapp, Code for Life) must strictly use the EXTRACT cleanroom strategy, adapting only mathematical models, parameters, and public mechanics into isolated <aasha-sim> Web Component adapters to prevent copyleft contagion into core MIT chapter files.',
      });
    }

    const passed = violations.filter(v => v.severity === 'ERROR').length === 0;

    let repairPrompt: string | undefined;
    if (!passed) {
      repairPrompt = [
        'AASHA Epistemic Gatekeeper detected rule violations in your output:',
        ...violations.map(v => `- [Section ${v.sectionNumber}: ${v.ruleTitle}] ${v.message}`),
        'Please re-generate and fix all violations above. Adhere strictly to the AASHA Universal Teaching Language System.',
      ].join('\n');
    }

    return {
      passed,
      violations,
      repairPrompt,
    };
  }

  /**
   * Section 24 Automated Contract & Foundation Reuse Enforcement:
   * Verifies that a valid YAML content contract and Resource Match Report exist.
   * If missing, automatically generates the contract and binds the prebuilt foundation
   * so agents never fail or bypass the reuse mandate.
   */
  static async ensureChapterContract(subject: string, classNum: number, topic: string): Promise<any> {
    const { ChapterContractManager } = await import('../chapter-contract-manager');
    const manager = new ChapterContractManager();
    return manager.ensureChapterContract({ subject, classNum, topic });
  }
}