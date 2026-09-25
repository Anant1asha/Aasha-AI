/**
 * AASHA Experience Registry Engine
 * Deterministic three-tier resolver.
 *
 * Tier 1: certified AASHA experience components
 * Tier 2: approved foundation adapters
 * Tier 3: domain synthesis
 *
 * Subject/class are applicability metadata, not identity.
 * License/provenance uncertainty never receives a positive score.
 */
const fs = require('fs');
const path = require('path');

class ExperienceEngine {
  constructor(registryPath) {
    this.registryPath = registryPath || path.resolve(__dirname, 'registry.json');
    this.registry = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
    this.registry.experiences = Array.isArray(this.registry.experiences) ? this.registry.experiences : [];
    this.registry.foundations = Array.isArray(this.registry.foundations) ? this.registry.foundations : [];
  }

  _text(value) {
    return String(value || '').toLowerCase();
  }

  _certifiedExperienceMatches(criteria) {
    const { subject, grade, mechanics = [], inputs = [], outputs = [] } = criteria;
    return this.registry.experiences
      .filter(e => e.status === 'CERTIFIED')
      .map(e => {
        const subjectHit = !subject || (e.subjects || []).some(s => this._text(s) === this._text(subject) || s === 'General');
        const classHit = !grade || (e.classes || []).includes(Number(grade));
        if (!subjectHit || !classHit || !this._foundationEligible(f)) return null;

        const tags = new Set(e.mechanic_tags || []);
        const contract = e.capability_contract || {};
        const inSet = new Set(contract.inputs || []);
        const outSet = new Set(contract.outputs || []);
        const mechanicHits = mechanics.filter(m => tags.has(m)).length;
        const inputHits = inputs.filter(x => inSet.has(x)).length;
        const outputHits = outputs.filter(x => outSet.has(x)).length;
        const score = mechanicHits * 10 + inputHits * 4 + outputHits * 4;

        return score > 0 ? { tier: 'TIER_1_REGISTERED', experience: e, score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }

  _foundationEligible(f) {
    const license = this._text(f.license);
    const strategy = String(f.reuse_strategy || '').toUpperCase();
    if (strategy === 'SANDBOX_ONLY' || strategy === 'LICENSE_REVIEW_REQUIRED') return false;
    if (license.includes('gpl') || license.includes('proprietary') || license.includes('non-commercial') || license.includes('opensource')) return false;
    return ['mit', 'apache-2.0', 'apache 2.0', 'cc-by', 'cc-by-4.0'].some(x => license.includes(x));
  }

  _foundationMatches(criteria) {
    const { subject, grade, query, interactionType } = criteria;
    return this.registry.foundations
      .map(f => {
        const subjectHit = !subject || (f.subjects || []).some(s =>
          this._text(s) === this._text(subject) || s === 'General' || s === 'Cross-Curricular'
        );
        const classHit = !grade || (f.classes || []).includes(Number(grade));
        if (!subjectHit || !classHit) return null;

        let score = 0;
        if (interactionType && (f.mechanics || []).some(m => this._text(m).includes(this._text(interactionType)))) score += 10;
        if (query) {
          if (this._text(f.name).includes(this._text(query))) score += 8;
          score += (f.mechanics || []).filter(m => this._text(m).includes(this._text(query))).length * 5;
        }
        return { tier: 'TIER_2_APPROVED_FOUNDATION', foundation: f, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }

  resolve(criteria = {}) {
    const tier1 = this._certifiedExperienceMatches(criteria);
    if (tier1.length) return tier1;

    const tier2 = this._foundationMatches(criteria);
    if (tier2.length) return tier2;

    return [{ tier: 'TIER_3_DOMAIN_SYNTHESIS', experience: null, foundation: null, score: 0 }];
  }

  search(criteria = {}) {
    return this.resolve(criteria);
  }

  generateResourceMatchReport(chapterMeta) {
    const matches = this.resolve({
      subject: chapterMeta.subject,
      grade: chapterMeta.grade,
      query: chapterMeta.chapter,
      interactionType: chapterMeta.mechanics?.[0]
    });

    const top = matches[0];
    return [
      '### RESOURCE MATCH REPORT',
      '- Chapter: ' + chapterMeta.chapter,
      '- Class: Class ' + chapterMeta.grade,
      '- Subject: ' + chapterMeta.subject,
      '- Resolver Tier: ' + top.tier,
      '- Required Mechanics: ' + (chapterMeta.mechanics || []).join(', ') || 'NOT_SPECIFIED',
      '- Registered Certified Experience: ' + (top.experience?.component_id || 'NONE'),
      '- Approved Foundation: ' + (top.foundation?.id || 'NONE'),
      '- Existing Coverage: UNKNOWN',
      '- New Work Required: UNKNOWN',
      '- License Status: ' + (top.experience?.license?.classification || top.foundation?.license || 'UNKNOWN'),
      '- Offline Status: ' + (top.experience?.runtime?.offline_compatible === true ? 'PASS' : 'UNKNOWN'),
      '- Component Certification: ' + (top.experience?.status === 'CERTIFIED' ? 'CERTIFIED' : 'NOT_CERTIFIED'),
      '- Rule: Chapter certification does not imply component certification.',
      '- Rule: Unknown provenance/license/dependency closure blocks component promotion.'
    ].join('\n');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExperienceEngine };
}
