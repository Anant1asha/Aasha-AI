/**
 * Annanth Aasha Foundation - Experience Registry Engine & Matcher
 * Implements Section 16 & Section 22 of the Master Prompt
 */

const fs = require('fs');
const path = require('path');

class ExperienceEngine {
  constructor(registryPath) {
    const defaultPath = registryPath || path.resolve(__dirname, 'registry.json');
    this.registry = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
  }

  search(criteria) {
    const { subject, grade, query, interactionType } = criteria;
    const matches = [];

    for (const f of this.registry.foundations) {
      let score = 0;
      if (subject && f.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()))) score += 20;
      if (grade && f.classes.includes(Number(grade))) score += 15;
      if (interactionType && f.mechanics.some(m => m.toLowerCase().includes(interactionType.toLowerCase()))) score += 25;
      if (query) {
        const q = query.toLowerCase();
        if (f.name.toLowerCase().includes(q)) score += 30;
        if (f.mechanics.some(m => m.toLowerCase().includes(q))) score += 30;
      }
      if (f.license && (f.license.includes('MIT') || f.license.includes('CC-BY'))) score += 10;

      if (score > 0) {
        matches.push({ foundation: f, score });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  generateResourceMatchReport(chapterMeta) {
    const {
      chapter,
      grade,
      subject,
      objectives,
      matchedFoundations,
      mechanics,
      simulations,
      narrativeStructures,
      existingCoveragePct,
      newWorkPct,
      reuseStrategy,
      licenseStatus,
      offline,
      mobile,
      accessibility,
      localization,
      aiIntegration,
      mastery,
      telemetry,
      finalRecommendation
    } = chapterMeta;

    const formattedObjectives = objectives.map((obj, i) => '  ' + (i + 1) + '. ' + obj).join('\n');

    return '### RESOURCE MATCH REPORT\n' +
      '- **Chapter**: ' + chapter + '\n' +
      '- **Class**: Class ' + grade + '\n' +
      '- **Subject**: ' + subject + '\n' +
      '- **Learning Objectives**:\n' + formattedObjectives + '\n' +
      '- **Best Existing Experiences**: ' + matchedFoundations.join(', ') + '\n' +
      '- **Best Reusable Mechanics**: ' + mechanics.join(', ') + '\n' +
      '- **Best Simulations**: ' + simulations.join(', ') + '\n' +
      '- **Best Narrative / Escape Structures**: ' + narrativeStructures.join(', ') + '\n' +
      '- **Existing Coverage**: ' + existingCoveragePct + '%\n' +
      '- **New Work Required**: ' + newWorkPct + '%\n' +
      '- **Reuse Strategy**: ' + reuseStrategy + '\n' +
      '- **License Status**: ' + licenseStatus + '\n' +
      '- **Offline**: ' + offline + '\n' +
      '- **Mobile**: ' + mobile + '\n' +
      '- **Accessibility**: ' + accessibility + '\n' +
      '- **Localization**: ' + localization + '\n' +
      '- **AI Integration**: ' + aiIntegration + '\n' +
      '- **Mastery**: ' + mastery + '\n' +
      '- **Telemetry**: ' + telemetry + '\n' +
      '- **Final Recommendation**: ' + finalRecommendation;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExperienceEngine };
}
