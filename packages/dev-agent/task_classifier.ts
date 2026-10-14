/**
 * AASHA AIOS Development Agent — Task Classifier & Intake Engine
 * Authority: Canonical Governance AGENTS.md & SUPER_ADMIN_AIOS_V2.md
 * Phase: Phase 1 Safe Governed Prototype
 */

export type TaskClassification = 
  | 'AUDIT_ONLY'
  | 'PLAN_ONLY'
  | 'TEST_ONLY'
  | 'IMPLEMENTATION'
  | 'SECURITY_REVIEW'
  | 'DOCUMENTATION'
  | 'BLOCKED';

export type RiskClassification = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskIntakePayload {
  taskId: string;
  correlationId?: string;
  userObjective: string;
  repository: string;
  targetCommit: string;
  allowedScope: string[];
  expectedOutcome: string;
  riskClassification?: RiskClassification;
  requiredChecks?: string[];
  authorizationState?: {
    isAuthorized: boolean;
    authorizedBy?: string;
    authScope?: string[];
    signature?: string;
    expiresAt?: string;
  };
}

export interface TaskClassificationResult {
  taskId: string;
  classification: TaskClassification;
  effectiveScope: string[];
  risk: RiskClassification;
  requiresHumanApproval: boolean;
  canExecuteCode: boolean;
  reasons: string[];
  evidenceExcerpt: string;
}

export class TaskClassifier {
  /**
   * Deterministically classifies an intake request based on objective keywords,
   * scope definitions, and explicit authorization state.
   * Default rule: Ambiguous authorization ALWAYS defaults to AUDIT_ONLY.
   */
  public static classify(payload: TaskIntakePayload): TaskClassificationResult {
    const reasons: string[] = [];
    const objectiveLower = (payload.userObjective || '').toLowerCase();
    
    // Safety check 1: Target commit and repository must be specified
    if (!payload.repository || !payload.targetCommit) {
      return {
        taskId: payload.taskId,
        classification: 'BLOCKED',
        effectiveScope: [],
        risk: 'HIGH',
        requiresHumanApproval: true,
        canExecuteCode: false,
        reasons: ['Missing mandatory repository or targetCommit identifier'],
        evidenceExcerpt: `repo: ${payload.repository}, commit: ${payload.targetCommit}`,
      };
    }

    // Safety check 2: Check for prompt injection keywords attempting policy override
    const injectionPatterns = [
      /ignore\s+(all\s+)?(rules|invariants|policy|contracts)/i,
      /bypass\s+(authorization|gates|approval)/i,
      /grant\s+(root|admin|all)\s+permissions/i,
      /elevate\s+privilege/i,
    ];
    for (const pattern of injectionPatterns) {
      if (pattern.test(payload.userObjective)) {
        return {
          taskId: payload.taskId,
          classification: 'BLOCKED',
          effectiveScope: [],
          risk: 'CRITICAL',
          requiresHumanApproval: true,
          canExecuteCode: false,
          reasons: ['Suspicious prompt injection pattern detected in objective'],
          evidenceExcerpt: payload.userObjective.slice(0, 100),
        };
      }
    }

    // Security Review detection
    if (objectiveLower.includes('secret') || objectiveLower.includes('audit security') || objectiveLower.includes('threat model') || objectiveLower.includes('vulnerability')) {
      reasons.push('Security audit keywords detected in user objective');
      return {
        taskId: payload.taskId,
        classification: 'SECURITY_REVIEW',
        effectiveScope: payload.allowedScope || [],
        risk: 'HIGH',
        requiresHumanApproval: false,
        canExecuteCode: false,
        reasons,
        evidenceExcerpt: payload.userObjective.slice(0, 120),
      };
    }

    // Documentation detection
    if (objectiveLower.includes('document') || objectiveLower.includes('readme') || objectiveLower.includes('glossary') || objectiveLower.includes('spec only')) {
      reasons.push('Documentation keywords matched without application code scope');
      return {
        taskId: payload.taskId,
        classification: 'DOCUMENTATION',
        effectiveScope: payload.allowedScope || [],
        risk: 'LOW',
        requiresHumanApproval: false,
        canExecuteCode: false,
        reasons,
        evidenceExcerpt: payload.userObjective.slice(0, 120),
      };
    }

    // Test-Only detection
    if (objectiveLower.includes('run test') || objectiveLower.includes('verify benchmark') || objectiveLower.includes('execute suite')) {
      reasons.push('Test execution requested without code modification');
      return {
        taskId: payload.taskId,
        classification: 'TEST_ONLY',
        effectiveScope: payload.allowedScope || [],
        risk: 'LOW',
        requiresHumanApproval: false,
        canExecuteCode: false, // Reads/runs approved tests only
        reasons,
        evidenceExcerpt: payload.userObjective.slice(0, 120),
      };
    }

    // Plan-Only detection
    if (objectiveLower.includes('plan') || objectiveLower.includes('architect') || objectiveLower.includes('design spec')) {
      reasons.push('Planning or architectural design requested');
      return {
        taskId: payload.taskId,
        classification: 'PLAN_ONLY',
        effectiveScope: payload.allowedScope || [],
        risk: 'LOW',
        requiresHumanApproval: false,
        canExecuteCode: false,
        reasons,
        evidenceExcerpt: payload.userObjective.slice(0, 120),
      };
    }

    // Implementation detection: REQUIRES verified authorization
    const isImplementationKeyword = objectiveLower.includes('build') || 
                                    objectiveLower.includes('implement') || 
                                    objectiveLower.includes('modify') || 
                                    objectiveLower.includes('refactor') || 
                                    objectiveLower.includes('fix') || 
                                    objectiveLower.includes('code');

    if (isImplementationKeyword) {
      const isAuthValid = payload.authorizationState?.isAuthorized === true && 
                          !!payload.authorizationState?.authorizedBy && 
                          payload.authorizationState.authorizedBy !== 'LLM' &&
                          payload.authorizationState.authorizedBy !== 'Agent';

      if (!isAuthValid) {
        reasons.push('Implementation requested but authorization is ambiguous or missing trusted human signer. Defaulting to AUDIT_ONLY.');
        return {
          taskId: payload.taskId,
          classification: 'AUDIT_ONLY',
          effectiveScope: payload.allowedScope || [],
          risk: 'MEDIUM',
          requiresHumanApproval: true,
          canExecuteCode: false,
          reasons,
          evidenceExcerpt: payload.userObjective.slice(0, 120),
        };
      }

      reasons.push('Implementation requested with verified human authorization');
      return {
        taskId: payload.taskId,
        classification: 'IMPLEMENTATION',
        effectiveScope: payload.allowedScope || [],
        risk: payload.riskClassification || 'MEDIUM',
        requiresHumanApproval: true,
        canExecuteCode: true,
        reasons,
        evidenceExcerpt: payload.userObjective.slice(0, 120),
      };
    }

    // Default catch-all rule: AUDIT_ONLY
    reasons.push('Default safe classification applied (no destructive rights)');
    return {
      taskId: payload.taskId,
      classification: 'AUDIT_ONLY',
      effectiveScope: payload.allowedScope || [],
      risk: 'LOW',
      requiresHumanApproval: false,
      canExecuteCode: false,
      reasons,
      evidenceExcerpt: payload.userObjective.slice(0, 120),
    };
  }
}
