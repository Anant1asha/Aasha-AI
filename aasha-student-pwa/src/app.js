import { TIER1_STORE_CATALOG, computeBadges, awardChapterPassReward, redeemStoreItem } from './rewards.js';
import { enqueueSyncEvent, syncNowWithServer } from './sync.js';

export const PWA_TABS = [
  ['home', '🏠', 'Home'],
  ['learn', '📚', 'Learn'],
  ['practice', '🎯', 'Practice'],
  ['rewards', '🏆', 'Rewards'],
  ['store', '🏪', 'Store']
];

export function renderStore(state) {
  const coins = Number(state.coins || 0);
  const outboxCount = Array.isArray(state.syncOutbox) ? state.syncOutbox.length : 0;
  const cards = TIER1_STORE_CATALOG.map(item => {
    const canAfford = coins >= item.costCoins;
    return `
      <div class="store-card" data-item-id="${item.id}">
        <div class="store-icon">${item.icon}</div>
        <div class="store-title-en">${item.titleEn}</div>
        <div class="store-title-hi">${item.titleHi}</div>
        <div class="store-cost">🪙 ${item.costCoins} Coins</div>
        <button class="btn-redeem" data-item-id="${item.id}" ${canAfford ? '' : 'disabled'}>
          ${canAfford ? 'Redeem with Staff PIN / प्राप्त करें' : 'Keep Learning / और सिक्के कमाएँ'}
        </button>
      </div>
    `;
  }).join('');

  return `
    <section class="store-view">
      <header class="store-header">
        <h2>🏪 Aasha Tier-1 Centre Store / आशा केंद्र स्टोर</h2>
        <div class="coin-pill">🪙 ${coins} Aasha Coins</div>
        <button id="btn-sync-outbox" class="btn-sync">🔄 Sync Outbox (${outboxCount})</button>
      </header>
      <div class="store-grid">${cards}</div>
    </section>
  `;
}

export { computeBadges, awardChapterPassReward, redeemStoreItem, enqueueSyncEvent, syncNowWithServer };

export function renderTeacherCohortDashboard(cohortSummary = {}) {
  const {
    totalStudents = 0,
    avgMasteryPct = 0,
    totalTokensMinted = 0,
    pendingRedemptions = 0,
    lowStockAlerts = [],
    students = []
  } = cohortSummary;
  const alertsHtml = lowStockAlerts.length > 0
    ? `<div class="low-stock-banner" role="status" style="min-height:44px;padding:12px;background:#fef3c7;border-left:4px solid #d97706;margin-bottom:12px;">
         <strong>⚠️ Low Stock Alert / कम स्टॉक:</strong> ${lowStockAlerts.map(i => `${i.titleHi || i.title} (${i.stock} left)`).join(", ")}
       </div>`
    : `<div class="stock-ok-banner" style="min-height:44px;padding:12px;background:#dcfce7;border-left:4px solid #16a34a;margin-bottom:12px;">
         <strong>✅ Store Inventory Healthy / सभी वस्तुएं उपलब्ध हैं</strong>
       </div>`;
  const rowsHtml = students.map(s => `
    <tr data-student-id="${s.studentId}" style="height:48px;">
      <td>${s.name || s.studentId}</td>
      <td>${Number(s.masteryPct || 0).toFixed(1)}%</td>
      <td>🪙 ${Number(s.tokenBalance || 0)}</td>
      <td>
        <button class="teacher-action-btn" data-action="inspect-student" data-student-id="${s.studentId}"
                style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:8px;cursor:pointer;">
          View / देखें
        </button>
      </td>
    </tr>
  `).join("");
  return `
    <section id="teacher-cohort-dashboard" aria-label="Centre Facilitator Cohort & Store Inventory Dashboard"
             style="padding:16px;padding-bottom:calc(96px + env(safe-area-inset-bottom, 16px));">
      <header style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <h2 style="margin:0;">🏫 Centre Cohort & Store Dashboard / केंद्र डैशबोर्ड</h2>
        <button id="btn-teacher-restock-modal" class="teacher-restock-btn"
                style="min-width:44px;min-height:44px;padding:10px 16px;border-radius:8px;font-weight:600;cursor:pointer;">
          📦 Restock Inventory (Staff PIN)
        </button>
      </header>
      ${alertsHtml}
      <div class="kpi-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px;">
        <div class="kpi-card" style="padding:12px;border-radius:10px;background:#f8fafc;">
          <div>👧👦 Students</div><strong>${totalStudents}</strong>
        </div>
        <div class="kpi-card" style="padding:12px;border-radius:10px;background:#f8fafc;">
          <div>📈 Avg Mastery</div><strong>${Number(avgMasteryPct).toFixed(1)}%</strong>
        </div>
        <div class="kpi-card" style="padding:12px;border-radius:10px;background:#f8fafc;">
          <div>🪙 Tokens Minted</div><strong>${totalTokensMinted}</strong>
        </div>
        <div class="kpi-card" style="padding:12px;border-radius:10px;background:#f8fafc;">
          <div>🛍️ Pending Orders</div><strong>${pendingRedemptions}</strong>
        </div>
      </div>
      <table class="cohort-table" style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="text-align:left;border-bottom:2px solid #e2e8f0;">
            <th>Student / विद्यार्थी</th><th>Mastery / दक्षता</th><th>Tokens / टोकन</th><th>Action</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      ${renderMisconceptionHeatmapCard(cohortSummary.misconceptions || [])}
    </section>
  `.trim();
}

export function renderFacilitatorPinModal(actionLabel = "Fulfill Store Order", itemId = "") {
  const safeLabel = String(actionLabel || "Facilitator Verification").replace(/[<>]/g, "");
  const safeItem = String(itemId || "").replace(/[<>]/g, "");
  return `
    <div id="facilitator-pin-modal" role="dialog" aria-modal="true" aria-labelledby="pin-modal-title"
         style="position:fixed;inset:0;background:rgba(15,23,42,0.72);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;">
      <div style="background:#ffffff;border-radius:16px;max-width:360px;width:100%;padding:20px;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
        <h3 id="pin-modal-title" style="margin:0 0 8px;font-size:1.1rem;color:#0f172a;">🔐 Staff PIN Required / स्टाफ पिन</h3>
        <p style="margin:0 0 12px;font-size:0.9rem;color:#475569;">Action: <strong>${safeLabel}</strong> ${safeItem ? `(${safeItem})` : ""}</p>
        <input id="facilitator-pin-input" type="password" inputmode="numeric" maxlength="6"
               placeholder="Enter 4-digit Staff PIN"
               style="width:100%;min-height:44px;padding:10px 12px;font-size:1.1rem;letter-spacing:4px;text-align:center;border:2px solid #cbd5e1;border-radius:10px;margin-bottom:14px;" />
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button type="button" data-action="cancel-pin-modal"
                  style="min-width:44px;min-height:44px;padding:10px 16px;border-radius:10px;border:1px solid #cbd5e1;background:#f8fafc;color:#334155;font-weight:600;cursor:pointer;">
            Cancel / रद्द करें
          </button>
          <button type="button" data-action="confirm-pin-modal" data-item-id="${safeItem}"
                  style="min-width:44px;min-height:44px;padding:10px 16px;border-radius:10px;border:none;background:#0f766e;color:#ffffff;font-weight:700;cursor:pointer;">
            Verify PIN / सत्यापित करें
          </button>
        </div>
      </div>
    </div>
  `.trim();
}

export const LEARN_ARENA_13_CATALOGUE = [
  { id: "NCERT-G06-MATH-CH07-FRACTIONS", titleEn: "Class 6 Math Ch 07: Fractions on the Number Line & Equivalent Ratios", titleHi: "संख्या रेखा पर भिन्न और समतुल्य अनुपात", grade: 6, subject: "Mathematics", learnFile: "NCERT-G06-MATH-CH07-FRACTIONS_Learning.html", arenaFile: "NCERT-G06-MATH-CH07-FRACTIONS_Arena.html" },
  { id: "NCERT-G07-MATH-CH11-PERIMETER-AREA", titleEn: "Class 7 Math Ch 11: Perimeter and Area of Polygons & Community Gardens", titleHi: "बहुभुज और सामुदायिक उद्यानों का परिमाप और क्षेत्रफल", grade: 7, subject: "Mathematics", learnFile: "NCERT-G07-MATH-CH11-PERIMETER-AREA_Learning.html", arenaFile: "NCERT-G07-MATH-CH11-PERIMETER-AREA_Arena.html" },
  { id: "NCERT-G08-MATH-CH08-COMPARING-QUANTITIES", titleEn: "Class 8 Math Ch 08: Comparing Quantities, Percentages & Micro-Savings", titleHi: "राशियों की तुलना, प्रतिशत और सहकारी बचत", grade: 8, subject: "Mathematics", learnFile: "NCERT-G08-MATH-CH08-COMPARING-QUANTITIES_Learning.html", arenaFile: "NCERT-G08-MATH-CH08-COMPARING-QUANTITIES_Arena.html" },
  { id: "NCERT-G09-SCI-CH08-FORCE-MOTION", titleEn: "Class 9 Science Ch 08: Force, Newton's Laws of Motion & Momentum", titleHi: "बल, न्यूटन के गति के नियम और संवेग संरक्षण", grade: 9, subject: "Science", learnFile: "NCERT-G09-SCI-CH08-FORCE-MOTION_Learning.html", arenaFile: "NCERT-G09-SCI-CH08-FORCE-MOTION_Arena.html" },
  { id: "NCERT-G09-SCI-CH10-WORK-ENERGY", titleEn: "Class 9 Science Ch 10: Work, Kinetic & Potential Energy in Micro-Grids", titleHi: "नवीकरणीय माइक्रोग्रिड में कार्य, गतिज और स्थितिज ऊर्जा", grade: 9, subject: "Science", learnFile: "NCERT-G09-SCI-CH10-WORK-ENERGY_Learning.html", arenaFile: "NCERT-G09-SCI-CH10-WORK-ENERGY_Arena.html" },
  { id: "NCERT-G10-MATH-CH02-POLYNOMIALS", titleEn: "Class 10 Math Ch 02: Polynomial Zeros, Parabolic Graphs & Modeling", titleHi: "बहुपद के शून्यक, परवलयिक ग्राफ और द्विघात मॉडलिंग", grade: 10, subject: "Mathematics", learnFile: "NCERT-G10-MATH-CH02-POLYNOMIALS_Learning.html", arenaFile: "NCERT-G10-MATH-CH02-POLYNOMIALS_Arena.html" },
  { id: "NCERT-G10-SCI-CH06-LIFE-PROCESSES-PHOTOSYNTHESIS", titleEn: "Class 10 Science Ch 06: Life Processes, Stomatal Transpiration & Nutrition", titleHi: "जैव प्रक्रम, रंध्रीय वाष्पोत्सर्जन और कोशिकीय पोषण", grade: 10, subject: "Science", learnFile: "NCERT-G10-SCI-CH06-LIFE-PROCESSES-PHOTOSYNTHESIS_Learning.html", arenaFile: "NCERT-G10-SCI-CH06-LIFE-PROCESSES-PHOTOSYNTHESIS_Arena.html" },
  { id: "NCERT-G10-SCI-CH12-ELECTRICITY-OHMS-LAW", titleEn: "Class 10 Science Ch 12: Electric Potential, Ohm's Law & Solar Circuits", titleHi: "विद्युत विभव, ओम का नियम और सौर परिपथ", grade: 10, subject: "Science", learnFile: "NCERT-G10-SCI-CH12-ELECTRICITY-OHMS-LAW_Learning.html", arenaFile: "NCERT-G10-SCI-CH12-ELECTRICITY-OHMS-LAW_Arena.html" },
  { id: "NCVET-PSSCIVE-L3-IT-DIGITAL-VILLAGE-LEDGER", titleEn: "NCVET L3 IT: Offline-First Community Data Ledgers & Impact Tables", titleHi: "ऑफ़लाइन-प्रथम सामुदायिक डेटा खाता और सत्यापन योग्य प्रभाव तालिका", grade: 10, subject: "Computer Science", learnFile: "NCVET-PSSCIVE-L3-IT-DIGITAL-VILLAGE-LEDGER_Learning.html", arenaFile: "NCVET-PSSCIVE-L3-IT-DIGITAL-VILLAGE-LEDGER_Arena.html" },
  { id: "NCVET-PSSCIVE-L4-AGRI-PRECISION-DRIP-JAL-SEVA", titleEn: "NCVET L4 Agri: Precision Drip Irrigation Hydraulics & Soil Moisture", titleHi: "सटीक ड्रिप सिंचाई हाइड्रोलिक्स और मृदा नमी बजट", grade: 10, subject: "Science", learnFile: "NCVET-PSSCIVE-L4-AGRI-PRECISION-DRIP-JAL-SEVA_Learning.html", arenaFile: "NCVET-PSSCIVE-L4-AGRI-PRECISION-DRIP-JAL-SEVA_Arena.html" },
  { id: "NCVET_PSSCIVE_L3_IT_DataEntry_v5", titleEn: "NCVET L3 Job Role: Domestic Data Entry & Digital Village Ledger", titleHi: "एनसीवीईटी स्तर 3 — घरेलू डेटा एंट्री और डिजिटल ग्राम बहीखाता", grade: 11, subject: "Computer Science", learnFile: "NCVET_PSSCIVE_L3_IT_DataEntry_Learning.html", arenaFile: "NCVET_PSSCIVE_L3_IT_DataEntry_Arena.html" },
  { id: "NCVET_PSSCIVE_L4_Agri_SolarDrip_v5", titleEn: "NCVET L4 Job Role: Solar Micro-Irrigation & Jal Seva Technician", titleHi: "एनसीवीईटी स्तर 4 — सौर सूक्ष्म सिंचाई और जल सेवा तकनीशियन", grade: 11, subject: "Science", learnFile: "NCVET_PSSCIVE_L4_Agri_SolarDrip_Learning.html", arenaFile: "NCVET_PSSCIVE_L4_Agri_SolarDrip_Arena.html" },
  { id: "NCVET_PSSCIVE_L4_Food_SolarDehydrator_v5", titleEn: "NCVET L4 Job Role: Rural Solar Food Dehydrator Unit Operator", titleHi: "एनसीवीईटी स्तर 4 — ग्रामीण सौर खाद्य निर्जलीकरण इकाई ऑपरेटर", grade: 12, subject: "Science", learnFile: "NCVET_PSSCIVE_L4_Food_SolarDehydrator_Learning.html", arenaFile: "NCVET_PSSCIVE_L4_Food_SolarDehydrator_Arena.html" }
];

export const OFFLINE_CHAPTER_CATALOGUE = [
  { id: "ch_econ_01", titleEn: "NCERT Economics Ch 1: Story of Village Palampur", titleHi: "अर्थशास्त्र अध्याय 1: पालमपुर गाँव की कहानी", grade: 9, subject: "Economics", bundleFile: "ncert_economics_ch1_modal.html" },
  { id: "ch_bst_12", titleEn: "Business Studies Class 12: Nature & Principles of Management", titleHi: "व्यवसाय अध्ययन: प्रबंध की प्रकृति और सिद्धांत", grade: 12, subject: "Commerce", bundleFile: "business_studies_class12_ch1_ch2.html" },
  { id: "ch_acct_11", titleEn: "Accounting Class 11: One-Shot Master Interactive", titleHi: "लेखांकन कक्षा 11: संपूर्ण संवादात्मक अध्याय", grade: 11, subject: "Accountancy", bundleFile: "Accounting_Class11_OneShot_Master_Interactive.html" },
  { id: "ch_quad_pro", titleEn: "Class 10 Math: Quadratic Equations Pro", titleHi: "द्विघात समीकरण (प्रो संस्करण)", grade: 10, subject: "Mathematics", bundleFile: "Quadratic_Equations_Class10_Pro.html" },
  { id: "ch_quad_gamified", titleEn: "Class 10 Math: Quadratic Equations Gamified", titleHi: "द्विघात समीकरण (गेमिफाइड)", grade: 10, subject: "Mathematics", bundleFile: "Quadratic_Equations_Class10_Gamified.html" },
  { id: "ch_ms_access", titleEn: "Class 8 CS: MS Access Database Interactive", titleHi: "कंप्यूटर विज्ञान: एमएस एक्सेस डेटाबेस", grade: 8, subject: "Computer Science", bundleFile: "Class_8_MS_Access_Interactive_Learning.html" },
  { id: "ch_comp_qty", titleEn: "Class 8 Math: Comparing Quantities & Percentage", titleHi: "राशियों की तुलना और प्रतिशत", grade: 8, subject: "Mathematics", bundleFile: "ComparingQuantities_Percentage_Class8_Gamified_v5.html" },
  { id: "ch_fractions", titleEn: "Class 6 Math: Fractions Gamified v5.3", titleHi: "भिन्न (Fractions) संवादात्मक", grade: 6, subject: "Mathematics", bundleFile: "Fractions_Gamified_v5_3.html" },
  { id: "ch_perim_area", titleEn: "Class 7 Math: Perimeter & Area Gamified v5.2", titleHi: "परिमाप और क्षेत्रफल", grade: 7, subject: "Mathematics", bundleFile: "Perimeter_Area_Gamified_v5_2.html" },
  { id: "ch_poly_10", titleEn: "Class 10 Math: Polynomials Gamified v5", titleHi: "बहुपद (Polynomials)", grade: 10, subject: "Mathematics", bundleFile: "Polynomials_Class10_Gamified_v5.html" },
  { id: "ncert_science_class7_ch14_electric_circuits", titleEn: "Class 7 Science Ch 14: Electric Current & Its Effects", titleHi: "विज्ञान अध्याय 14: विद्युत धारा और इसके प्रभाव", grade: 7, subject: "Science", bundleFile: "Electric_Circuits_Class7_Gamified_v5.html" },
  { id: "ncert_science_class9_ch9_force_and_motion", titleEn: "Class 9 Science Ch 9: Force and Laws of Motion", titleHi: "विज्ञान अध्याय 9: बल तथा गति के नियम", grade: 9, subject: "Science", bundleFile: "Motion_And_Force_Class9_Gamified_v5.html" },
  { id: "ncert_science_class8_ch14_chemical_effects_of_current", titleEn: "Class 8 Science Ch 14: Chemical Effects of Electric Current", titleHi: "विज्ञान अध्याय 14: विद्युत धारा के रासायनिक प्रभाव", grade: 8, subject: "Science", bundleFile: "Chemical_Effects_Of_Current_Class8_Gamified_v5.html" },
  { id: "ncert_science_class7_ch5_acids_bases_and_salts", titleEn: "Class 7 Science Ch 5: Acids, Bases and Salts", titleHi: "विज्ञान अध्याय 5: अम्ल, क्षारक और लवण", grade: 7, subject: "Science", bundleFile: "Acids_Bases_And_Salts_Class7_Gamified_v5.html" },
  { id: "ncert_science_class6_ch11_light_shadows_and_reflections", titleEn: "Class 6 Science Ch 11: Light, Shadows and Reflections", titleHi: "विज्ञान अध्याय 11: प्रकाश — छायाएँ एवं परावर्तन", grade: 6, subject: "Science", bundleFile: "Light_Shadows_And_Reflections_Class6_Gamified_v5.html" },
  { id: "ncert_math_class9_ch4_linear_equations_two_variables", titleEn: "Class 9 Math Ch 4: Linear Equations in Two Variables", titleHi: "गणित अध्याय 4: दो चरों वाले रैखिक समीकरण", grade: 9, subject: "Mathematics", bundleFile: "Linear_Equations_Two_Variables_Class9_Gamified_v5.html" },
  { id: "ncert_math_class8_ch9_mensuration_3d_solids", titleEn: "Class 8 Math Ch 9: Mensuration 3D Solids", titleHi: "गणित अध्याय 9: क्षेत्रमिति — घन, घनाभ और बेलन", grade: 8, subject: "Mathematics", bundleFile: "Mensuration_3D_Solids_Class8_Gamified_v5.html" },
  { id: "ncert_sci_class10_ch5_life_processes_heart", titleEn: "Class 10 Science Ch 5: Life Processes — Human Heart", titleHi: "विज्ञान अध्याय 5: जैव प्रक्रम — मानव हृदय और दोहरा परिसंचरण", grade: 10, subject: "Science", bundleFile: "Life_Processes_Human_Heart_Class10_Gamified_v5.html" },
  { id: "ncert_econ_class9_ch1_village_palampur", titleEn: "Class 9 Economics Ch 1: Story of Village Palampur", titleHi: "अर्थशास्त्र अध्याय 1: पालमपुर गाँव की कहानी — उत्पादन के कारक", grade: 9, subject: "Economics", bundleFile: "Story_Of_Village_Palampur_Class9_Gamified_v5.html" },
  { id: "ncert_math_class7_ch3_data_handling", titleEn: "Class 7 Math Ch 3: Data Handling (Mean, Median & Mode)", titleHi: "गणित अध्याय 3: आँकड़ों का प्रबंधन — माध्य, माध्यिका और बहुलक", grade: 7, subject: "Mathematics", bundleFile: "Data_Handling_Mean_Median_Mode_Class7_Gamified_v5.html" },
  { id: "ncert_sci_class8_ch8_force_and_pressure", titleEn: "Class 8 Science Ch 8: Force and Pressure", titleHi: "विज्ञान अध्याय 8: बल तथा दाब — संपर्क और द्रव दाब", grade: 8, subject: "Science", bundleFile: "Force_And_Pressure_Class8_Gamified_v5.html" },
  { id: "ncert_math_class10_ch9_trigonometry_heights", titleEn: "Class 10 Math Ch 9: Trigonometry — Heights & Distances", titleHi: "गणित अध्याय 9: त्रिकोणमिति — ऊँचाई और दूरी", grade: 10, subject: "Mathematics", bundleFile: "Trigonometry_Heights_And_Distances_Class10_Gamified_v5.html" },
  { id: "ncert_sci_class9_ch4_structure_of_atom", titleEn: "Class 9 Science Ch 4: Structure of the Atom (Bohr Shells)", titleHi: "विज्ञान अध्याय 4: परमाणु की संरचना — बोर मॉडल और संयोजकता", grade: 9, subject: "Science", bundleFile: "Structure_Of_The_Atom_Bohr_Orbits_Class9_Gamified_v5.html" },
  { id: "ncert_math_class8_ch8_algebraic_identities_factorisation", titleEn: "Class 8 Math Ch 8 & 12: Algebraic Identities & Factorisation", titleHi: "गणित अध्याय 8 व 12: बीजीय सर्वसमिकाएँ और गुणनखंडन", grade: 8, subject: "Mathematics", bundleFile: "Algebraic_Identities_And_Factorisation_Class8_Gamified_v5.html" },
  { id: "ncert_sci_class7_ch3_heat_transfer", titleEn: "Class 7 Science Ch 3: Heat — Conduction, Convection & Radiation", titleHi: "विज्ञान अध्याय 3: ऊष्मा — चालन, संवहन और विकिरण", grade: 7, subject: "Science", bundleFile: "Heat_Transfer_Conduction_Convection_Radiation_Class7_Gamified_v5.html" },
  { id: "ncert_sci_class10_ch12_magnetic_effects_current", titleEn: "Class 10 Science Ch 12: Magnetic Effects of Electric Current", titleHi: "विज्ञान अध्याय 12: विद्युत धारा के चुंबकीय प्रभाव", grade: 10, subject: "Science", bundleFile: "Magnetic_Effects_Of_Electric_Current_Class10_Gamified_v5.html" }
];

export function renderLearnCatalogue(state = {}) {
  const progress = state.progress || {};
  const activeSubject = state.activeSubject || "ALL";
  const activeGrade = state.activeGrade || "ALL";
  const searchQuery = state.searchQuery || "";
  const filteredChapters = filterOfflineChapters({ query: searchQuery, subject: activeSubject, grade: activeGrade });
  const filterBarHtml = renderLearnSearchAndFilterBar(activeSubject, searchQuery, activeGrade);
  const cardsHtml = filteredChapters.map((ch) => {
    const done = Boolean(progress[ch.id]?.completed);
    const bestScore = Number(progress[ch.id]?.scorePct || 0);
    return `
      <article class="chapter-card" data-chapter-id="${ch.id}" style="padding:14px;border-radius:12px;border:1px solid #cbd5e1;background:#ffffff;margin-bottom:12px;">
        <div style="font-size:0.8rem;color:#0f766e;font-weight:700;">Grade ${ch.grade} • ${ch.subject}</div>
        <h3 style="margin:4px 0;font-size:1rem;color:#0f172a;">${ch.titleEn}</h3>
        <div style="font-size:0.9rem;color:#475569;margin-bottom:10px;">${ch.titleHi}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:0.85rem;font-weight:600;color:${done ? '#15803d' : '#64748b'};">
            ${done ? `✅ Completed (${bestScore}%)` : '📴 Ready Offline (< 20 MiB)'}
          </span>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="btn-launch-chapter" data-action="launch-chapter" data-mode="learn" data-chapter-id="${ch.id}" data-bundle-file="${ch.learnFile || ch.bundleFile}"
                    style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:10px;border:none;background:#0f766e;color:#ffffff;font-weight:700;cursor:pointer;">
              ${done ? '🔄 Replay Learn / पाठ' : '▶️ Aasha Learn / पाठ'}
            </button>
            <button type="button" class="btn-launch-arena" data-action="launch-arena" data-mode="arena" data-chapter-id="${ch.id}" data-bundle-file="${ch.arenaFile || ch.bundleFile}"
                    style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:10px;border:none;background:#7c3aed;color:#ffffff;font-weight:700;cursor:pointer;">
              ⚔️ Aasha Arena / अखाड़ा
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  return `
    <section id="learn-catalogue-view" aria-label="Offline Bilingual Schoolbook Chapters"
             style="padding:16px;padding-bottom:calc(96px + env(safe-area-inset-bottom, 16px));">
      <header style="margin-bottom:16px;">
        <h2 style="margin:0 0 4px;">📚 Schoolbook Chapters / पाठ्यपुस्तक अध्याय (26 Offline)</h2>
        <p style="margin:0;font-size:0.9rem;color:#475569;">60% English / 40% हिन्दी LLE • Earn +50/+100 🪙 Aasha Coins on Mastery</p>
      </header>
      ${filterBarHtml}
      <div class="chapter-list">${cardsHtml}</div>
    </section>
  `.trim();
}

export function renderChapterPlayerModal(chapterId, mode = "learn") {
  const pairMatch = LEARN_ARENA_13_CATALOGUE.find((c) => c.id === chapterId);
  const ch = pairMatch || OFFLINE_CHAPTER_CATALOGUE.find((c) => c.id === chapterId) || OFFLINE_CHAPTER_CATALOGUE[10];
  const activeMode = String(mode || "learn").toLowerCase() === "arena" ? "arena" : "learn";
  const targetFile = activeMode === "arena"
    ? (ch.arenaFile || (ch.bundleFile ? ch.bundleFile.replace(/_Learning\.html$|\.html$/, "_Arena.html") : "NCERT-G06-MATH-CH07-FRACTIONS_Arena.html"))
    : (ch.learnFile || ch.bundleFile || "NCERT-G06-MATH-CH07-FRACTIONS_Learning.html");
  return `
    <div id="chapter-player-modal" data-active-mode="${activeMode}" role="dialog" aria-modal="true" aria-label="${ch.titleEn}"
         style="position:fixed;inset:0;background:#0f172a;display:flex;flex-direction:column;z-index:9998;">
      <header style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 16px;background:#1e293b;color:#f8fafc;">
        <strong>${activeMode === "arena" ? "⚔️" : "📖"} ${ch.titleHi} (${activeMode === "arena" ? "Aasha Arena" : "Aasha Learn"})</strong>
        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" data-action="switch-player-mode" data-chapter-id="${ch.id}" data-mode="${activeMode === 'arena' ? 'learn' : 'arena'}"
                  style="min-width:44px;min-height:44px;padding:8px 12px;border-radius:8px;border:none;background:${activeMode === 'arena' ? '#0f766e' : '#7c3aed'};color:#ffffff;font-weight:700;cursor:pointer;">
            ${activeMode === "arena" ? "📖 Switch to Learn" : "⚔️ Switch to Arena"}
          </button>
          <button type="button" data-action="close-chapter-player"
                  style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:8px;border:none;background:#ef4444;color:#ffffff;font-weight:700;cursor:pointer;">
            ✖ Close / बंद करें
          </button>
        </div>
      </header>
      <iframe id="chapter-player-iframe" src="/chapters/${targetFile}" title="${ch.titleEn}"
              sandbox="allow-scripts allow-same-origin"
              style="flex:1;width:100%;border:none;background:#0f172a;"></iframe>
    </div>
  `.trim();
}

export function handleChapterMasteryMessage(state, payload = {}) {
  if (!payload || payload.type !== "TEAS_CHAPTER_MASTERY" || !payload.chapterId) {
    return { handled: false, awarded: 0 };
  }
  const chapterId = String(payload.chapterId);
  const scorePct = Number(payload.score ?? payload.scorePct ?? 85);
  state.progress = state.progress || {};
  const prevBest = Number(state.progress[chapterId]?.scorePct || 0);
  state.progress[chapterId] = {
    completed: scorePct >= 60,
    scorePct: Math.max(prevBest, scorePct),
    updatedAt: payload.timestamp || new Date().toISOString()
  };
  const rewardRes = awardChapterPassReward(state, chapterId, scorePct);
  const outboxLen = enqueueSyncEvent(state, {
    chapterId,
    nodeId: payload.nodeId || "final_mastery",
    score: scorePct,
    timestamp: payload.timestamp || new Date().toISOString()
  });
  return {
    handled: true,
    chapterId,
    scorePct,
    awarded: rewardRes.awarded,
    totalCoins: rewardRes.totalCoins,
    outboxLength: outboxLen
  };
}

export function computeSubjectMasteryBreakdown(state = {}) {
  const prog = state.progress || {};
  const bySubject = {};
  for (const ch of OFFLINE_CHAPTER_CATALOGUE) {
    if (!bySubject[ch.subject]) {
      bySubject[ch.subject] = { subject: ch.subject, totalChapters: 0, completedChapters: 0, masteryPct: 0 };
    }
    bySubject[ch.subject].totalChapters += 1;
    if (prog[ch.id]?.completed || Number(prog[ch.id]?.scorePct || 0) >= 85) {
      bySubject[ch.subject].completedChapters += 1;
    }
  }
  return Object.values(bySubject).map((row) => ({
    ...row,
    masteryPct: row.totalChapters ? Math.round((row.completedChapters / row.totalChapters) * 100) : 0
  }));
}

export function renderHomeDashboard(state = {}) {
  const coins = Number(state.coins || 0);
  const progress = state.progress || {};
  const completedCount = Object.values(progress).filter((p) => p && p.completed).length;
  const totalChapters = OFFLINE_CHAPTER_CATALOGUE.length;
  const nextChapter = OFFLINE_CHAPTER_CATALOGUE.find((ch) => !progress[ch.id]?.completed) || OFFLINE_CHAPTER_CATALOGUE[0];
  const breakdown = computeSubjectMasteryBreakdown(state);
  const subjectPills = breakdown.map((b) => `
    <span class="subject-mastery-chip" data-subject="${b.subject}" style="padding:6px 10px;border-radius:8px;background:#e2e8f0;color:#0f172a;font-size:0.82rem;font-weight:600;">
      ${b.subject}: ${b.completedChapters}/${b.totalChapters} (${b.masteryPct}%)
    </span>
  `).join("");

  return `
    <section id="home-dashboard-view" aria-label="Student Home Dashboard"
             style="padding:16px;padding-bottom:calc(96px + env(safe-area-inset-bottom, 16px));">
      <header style="background:linear-gradient(135deg,#0f766e,#1e3a8a);color:#ffffff;padding:18px;border-radius:16px;margin-bottom:16px;">
        <h2 style="margin:0 0 6px;">🙏 नमस्ते / Welcome Back, Scholar!</h2>
        <p style="margin:0;font-size:0.95rem;">Progress: <strong>${completedCount}/${totalChapters} Chapters Completed</strong> • Balance: <strong>🪙 ${coins} Aasha Coins</strong></p>
      </header>
      <div class="continue-card" style="padding:16px;border-radius:14px;border:2px solid #0f766e;background:#f0fdfa;margin-bottom:16px;">
        <div style="font-size:0.8rem;font-weight:700;color:#0f766e;">🔥 NEXT RECOMMENDED CHAPTER / अगला अध्याय</div>
        <h3 style="margin:6px 0 4px;color:#0f172a;">${nextChapter.titleEn}</h3>
        <p style="margin:0 0 12px;color:#334155;font-size:0.9rem;">${nextChapter.titleHi}</p>
        <button type="button" data-action="launch-chapter" data-chapter-id="${nextChapter.id}" data-bundle-file="${nextChapter.bundleFile}"
                style="min-width:44px;min-height:44px;padding:10px 18px;border-radius:10px;border:none;background:#0f766e;color:#ffffff;font-weight:700;cursor:pointer;">
          ▶️ Continue Learning / पढ़ाई जारी रखें
        </button>
      </div>
      <div id="subject-mastery-breakdown-card" style="padding:12px;border-radius:12px;background:#f8fafc;border:1px solid #cbd5e1;">
        <div style="font-size:0.82rem;font-weight:700;color:#334155;margin-bottom:8px;">📊 SUBJECT MASTERY BREAKDOWN / विषयवार प्रगति</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">${subjectPills}</div>
      </div>
      ${renderProfileBackupCard(state)}
    </section>
  `.trim();
}

export function buildAdaptivePracticeQueue(state = {}) {
  const prog = state.progress || {};
  return [...OFFLINE_CHAPTER_CATALOGUE].map((ch) => {
    const entry = prog[ch.id];
    const scorePct = entry ? Number(entry.scorePct ?? (entry.completed ? 100 : 0)) : null;
    let priorityTier = 2; // UNATTEMPTED default
    let statusBadge = "🆕 New / नया अध्याय";
    if (scorePct !== null && scorePct < 85) {
      priorityTier = 1; // NEEDS_REMEDIATION highest priority
      statusBadge = `🔥 Revision Needed (${scorePct}%) / पुनरावृत्ति`;
    } else if (scorePct !== null && scorePct >= 85) {
      priorityTier = 3; // MASTERED lowest priority
      statusBadge = `✅ Mastered (${scorePct}%) / महारत`;
    }
    return {
      ...ch,
      priorityTier,
      scorePct: scorePct ?? 0,
      statusBadge
    };
  }).sort((a, b) => {
    if (a.priorityTier !== b.priorityTier) return a.priorityTier - b.priorityTier;
    return a.scorePct - b.scorePct;
  });
}

export function renderPracticeHub(state = {}) {
  const orderedQueue = buildAdaptivePracticeQueue(state);
  const cards = orderedQueue.map((ch) => `
    <div class="practice-card" data-chapter-id="${ch.id}" data-priority-tier="${ch.priorityTier}" style="padding:14px;border-radius:12px;border:1px solid #cbd5e1;background:#ffffff;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
      <div>
        <strong style="color:#0f172a;">🎯 ${ch.titleEn}</strong>
        <div style="font-size:0.85rem;color:#475569;">${ch.titleHi} • ${ch.statusBadge}</div>
      </div>
      <button type="button" data-action="launch-practice" data-chapter-id="${ch.id}" data-bundle-file="${ch.bundleFile}"
              style="min-width:44px;min-height:44px;padding:8px 16px;border-radius:10px;border:none;background:#2563eb;color:#ffffff;font-weight:700;cursor:pointer;">
        ⚡ Practice (+50/100 🪙)
      </button>
    </div>
  `).join("");

  return `
    <section id="practice-hub-view" aria-label="TEAS Gamified Practice Hub"
             style="padding:16px;padding-bottom:calc(96px + env(safe-area-inset-bottom, 16px));">
      <header style="margin-bottom:14px;">
        <h2 style="margin:0 0 4px;">🎯 TEAS Practice Arena / अभ्यास केंद्र</h2>
        <p style="margin:0;font-size:0.9rem;color:#475569;">Score ≥60% for +50 🪙 Coins or ≥85% for +100 🪙 Mastery Coins</p>
      </header>
      <div class="practice-list">${cards}</div>
      ${renderVocabularyFlashcardDeck(state.flashcards)}
    </section>
  `.trim();
}

export function renderRewardsBadges(state = {}) {
  const coins = Number(state.coins || 0);
  const badges = computeBadges(state);
  const redemptions = Array.isArray(state.redemptions) ? state.redemptions : [];

  const badgeCards = badges.map((b) => `
    <div class="badge-card" data-badge-id="${b.id}" style="padding:14px;border-radius:12px;border:1px solid ${b.unlocked ? '#16a34a' : '#cbd5e1'};background:${b.unlocked ? '#f0fdf4' : '#f8fafc'};text-align:center;">
      <div style="font-size:1.8rem;">${b.icon}</div>
      <strong style="display:block;margin-top:6px;color:#0f172a;">${b.name}</strong>
      <span style="font-size:0.8rem;color:${b.unlocked ? '#15803d' : '#64748b'};">${b.unlocked ? '🔓 Unlocked / प्राप्त' : '🔒 Locked / लॉक'}</span>
    </div>
  `).join("");

  const historyHtml = redemptions.length > 0
    ? redemptions.map((r) => `<li style="padding:8px 0;border-bottom:1px solid #e2e8f0;">🧾 <strong>${r.titleHi || r.titleEn}</strong> — 🪙 ${r.costCoins} (${r.id})</li>`).join("")
    : `<li style="padding:8px 0;color:#64748b;">No store redemptions yet / अभी तक कोई वस्तु प्राप्त नहीं की गई</li>`;

  return `
    <section id="rewards-badges-view" aria-label="Student Rewards and Badges"
             style="padding:16px;padding-bottom:calc(96px + env(safe-area-inset-bottom, 16px));">
      <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <h2 style="margin:0;">🏆 My Rewards & Badges / मेरे पुरस्कार</h2>
        <div style="padding:8px 14px;border-radius:999px;background:#fef3c7;color:#92400e;font-weight:700;">🪙 ${coins} Aasha Coins</div>
      </header>
      <div class="badge-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;">
        ${badgeCards}
      </div>
      <h3 style="margin:0 0 8px;font-size:1rem;">🛍️ Redemption Receipts / स्टोर रसीदें</h3>
      <ul style="list-style:none;padding:0;margin:0;">${historyHtml}</ul>
    </section>
  `.trim();
}

export function renderActiveTab(state = {}, activeTab = "home") {
  const tab = String(activeTab || "home").trim().toLowerCase();
  switch (tab) {
    case "home":
      return renderHomeDashboard(state);
    case "learn":
      return renderLearnCatalogue(state);
    case "practice":
      return renderPracticeHub(state);
    case "rewards":
      return renderRewardsBadges(state);
    case "store":
      return renderStore(state);
    case "facilitator":
      return renderTeacherCohortDashboard(state.cohortSummary || {});
    default:
      return renderHomeDashboard(state);
  }
}

export function handlePinModalConfirm(state, itemId, enteredPin) {
  const res = redeemStoreItem(state, itemId, enteredPin);
  if (!res.ok) {
    return {
      ok: false,
      error: res.error,
      toastHtml: `<div id="store-redemption-toast" role="alert" style="min-height:44px;padding:12px;border-radius:10px;background:#fef2f2;color:#991b1b;border-left:4px solid #dc2626;margin-top:12px;">❌ ${res.message}</div>`
    };
  }
  enqueueSyncEvent(state, {
    type: "STORE_REDEMPTION",
    redemptionId: res.receipt.id,
    itemId: res.receipt.itemId,
    costCoins: res.receipt.costCoins,
    timestamp: res.receipt.redeemedAt
  });
  return {
    ok: true,
    receipt: res.receipt,
    balance: res.balance,
    toastHtml: `<div id="store-redemption-toast" role="status" style="min-height:44px;padding:12px;border-radius:10px;background:#dcfce7;color:#166534;border-left:4px solid #16a34a;margin-top:12px;">✅ Redeemed <strong>${res.receipt.titleHi}</strong> (${res.receipt.id})! Remaining: 🪙 ${res.balance}</div>`
  };
}

export function filterOfflineChapters({ query = "", subject = "ALL", grade = "ALL" } = {}) {
  const q = String(query || "").trim().toLowerCase();
  const subj = String(subject || "ALL").trim().toLowerCase();
  const gr = String(grade || "ALL").trim();
  return OFFLINE_CHAPTER_CATALOGUE.filter((ch) => {
    if (subj !== "all" && ch.subject.toLowerCase() !== subj) return false;
    if (gr !== "ALL" && String(ch.grade) !== gr) return false;
    if (!q) return true;
    const haystack = `${ch.titleEn} ${ch.titleHi} ${ch.subject} grade ${ch.grade}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function renderLearnSearchAndFilterBar(activeSubject = "ALL", searchQuery = "", activeGrade = "ALL") {
  const subjects = ["ALL", "Mathematics", "Science", "Economics", "Commerce", "Accountancy", "Computer Science"];
  const grades = ["ALL", "6", "7", "8", "9", "10", "11", "12"];
  const pills = subjects.map((s) => {
    const isSel = s.toLowerCase() === String(activeSubject || "ALL").toLowerCase();
    return `<button type="button" class="subj-filter-pill" data-action="filter-subject" data-subject="${s}"
                    style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:999px;border:1px solid ${isSel ? '#0f766e' : '#cbd5e1'};background:${isSel ? '#0f766e' : '#ffffff'};color:${isSel ? '#ffffff' : '#334155'};font-weight:600;cursor:pointer;">
              ${s === "ALL" ? "All Subjects / सभी विषय (26)" : s}
            </button>`;
  }).join("");
  const gradePills = grades.map((g) => {
    const isGradeSel = String(activeGrade || "ALL") === g;
    return `<button type="button" class="grade-filter-pill" data-action="filter-grade" data-grade="${g}"
                    style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:999px;border:1px solid ${isGradeSel ? '#1d4ed8' : '#cbd5e1'};background:${isGradeSel ? '#1d4ed8' : '#f8fafc'};color:${isGradeSel ? '#ffffff' : '#334155'};font-weight:600;cursor:pointer;">
              ${g === "ALL" ? "All Grades / सभी कक्षाएँ" : `Class ${g} / कक्षा ${g}`}
            </button>`;
  }).join("");
  const safeQ = String(searchQuery || "").replace(/"/g, "&quot;");
  return `
    <div id="learn-search-filter-bar" style="margin-bottom:16px;">
      <input id="learn-chapter-search-input" type="search" value="${safeQ}"
             placeholder="🔍 Search chapter in English or हिन्दी (e.g. भिन्न, Force, Quadratic)..."
             style="width:100%;min-height:44px;padding:10px 14px;border-radius:10px;border:1px solid #cbd5e1;font-size:0.95rem;margin-bottom:10px;" />
      <div class="subject-pills-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">${pills}</div>
      <div class="grade-pills-row" style="display:flex;gap:8px;flex-wrap:wrap;">${gradePills}</div>
    </div>
  `.trim();
}

export function renderMisconceptionHeatmapCard(misconceptions = []) {
  if (!Array.isArray(misconceptions) || misconceptions.length === 0) {
    return `<div id="misconception-heatmap-card" style="padding:12px;border-radius:10px;background:#f0fdf4;border-left:4px solid #16a34a;margin-top:14px;">
              <strong>🎯 Zero Active Cohort Misconceptions / कोई सक्रिय भ्रांति नहीं</strong>
            </div>`;
  }
  const items = misconceptions.map((m) => `
    <li style="padding:8px 0;border-bottom:1px solid #fed7aa;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
      <span>🔥 <strong>${m.chapterId} (${m.conceptCode})</strong> — ${m.strugglingCount} students struggling (Distractors: ${m.sampleWrongOptions.join(", ") || "N/A"})</span>
      <button type="button" data-action="launch-remediation-group" data-chapter-id="${m.chapterId}" data-concept-code="${m.conceptCode}"
              style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:8px;border:none;background:#ea580c;color:#ffffff;font-weight:700;cursor:pointer;">
        🛠️ Reteach / पुनः समझाएँ
      </button>
    </li>
  `).join("");
  return `
    <section id="misconception-heatmap-card" aria-label="Cohort Misconception Heatmap"
             style="padding:14px;border-radius:12px;background:#fff7ed;border-left:4px solid #ea580c;margin-top:14px;">
      <h3 style="margin:0 0 8px;font-size:1rem;color:#9a3412;">🧭 Top Cohort Misconceptions / प्रमुख अवधारणा चुनौतियाँ</h3>
      <ul style="list-style:none;padding:0;margin:0;">${items}</ul>
    </section>
  `.trim();
}

function computeSnapshotChecksum(payloadObj) {
  const canonical = JSON.stringify({
    studentId: String(payloadObj.studentId || "student_default"),
    coinsBalance: Number(payloadObj.coinsBalance || 0),
    completedChapters: Array.isArray(payloadObj.completedChapters) ? [...payloadObj.completedChapters].sort() : [],
    streakDays: Number(payloadObj.streakDays || 0),
  });
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return "fnv1a32:" + hash.toString(16).padStart(8, "0");
}

export function exportStudentProgressSnapshot(state = {}) {
  const completedChapters = Array.isArray(state.completedChapters)
    ? [...new Set(state.completedChapters)]
    : Object.keys(state.masteredChapters || {});
  const snapshot = {
    schemaVersion: "aasha.student.snapshot.v1",
    studentId: String(state.studentId || "student_default"),
    studentName: String(state.studentName || "Aasha Learner"),
    coinsBalance: Number(state.coinsBalance ?? state.coins ?? 0),
    completedChapters,
    streakDays: Number(state.streakDays || 1),
    exportedAt: state.exportedAt || new Date().toISOString(),
  };
  snapshot.checksum = computeSnapshotChecksum(snapshot);
  return snapshot;
}

export function restoreStudentProgressSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object" || snapshot.schemaVersion !== "aasha.student.snapshot.v1") {
    return { ok: false, error: "INVALID_SNAPSHOT_SCHEMA" };
  }
  const expectedChecksum = computeSnapshotChecksum(snapshot);
  if (snapshot.checksum !== expectedChecksum) {
    return { ok: false, error: "SNAPSHOT_CHECKSUM_MISMATCH", expectedChecksum };
  }
  return {
    ok: true,
    restoredState: {
      studentId: snapshot.studentId,
      studentName: snapshot.studentName,
      coinsBalance: Number(snapshot.coinsBalance || 0),
      completedChapters: [...snapshot.completedChapters],
      streakDays: Number(snapshot.streakDays || 1),
    },
  };
}

export function renderProfileBackupCard(state = {}) {
  const snap = exportStudentProgressSnapshot(state);
  return `
    <section id="student-profile-backup-card" aria-label="Shared Tablet Profile Backup"
             style="padding:14px;border-radius:12px;background:#f8fafc;border:1px solid #cbd5e1;margin-top:14px;">
      <h3 style="margin:0 0 6px;font-size:1rem;color:#0f172a;">💾 Shared-Tablet Progress Backup / प्रगति बैकअप (${snap.studentName})</h3>
      <p style="margin:0 0 10px;font-size:0.88rem;color:#475569;">
        Mastered: <strong>${snap.completedChapters.length} chapters</strong> • Coins: <strong>🪙 ${snap.coinsBalance}</strong> • Integrity: <code>${snap.checksum}</code>
      </p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" id="btn-export-student-snapshot" data-action="export-student-snapshot"
                style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:8px;border:none;background:#0f766e;color:#ffffff;font-weight:700;cursor:pointer;">
          ⬇️ Export Backup JSON / बैकअप सेव करें
        </button>
        <button type="button" id="btn-restore-student-snapshot" data-action="restore-student-snapshot"
                style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:8px;border:1px solid #0f766e;background:#ffffff;color:#0f766e;font-weight:700;cursor:pointer;">
          ⬆️ Restore Profile / प्रोफ़ाइल रिस्टोर करें
        </button>
      </div>
    </section>
  `.trim();
}

export function renderVocabularyFlashcardDeck(words = [
  { termEn: "monomial", meaningHi: "एकपदी (मोनोमियल)" },
  { termEn: "binomial", meaningHi: "द्विपदी (बाइनोमियल)" },
  { termEn: "identity", meaningHi: "सर्वसमिका (आइडेंटिटी)" },
  { termEn: "factorisation", meaningHi: "गुणनखंडन (फ़ैक्टराइज़ेशन)" }
]) {
  const list = Array.isArray(words) && words.length > 0 ? words : [
    { termEn: "monomial", meaningHi: "एकपदी (मोनोमियल)" }
  ];
  const cardsHtml = list.map((w, idx) => `
    <div class="lle-flashcard-item" data-term-en="${w.termEn}" style="padding:12px;border-radius:10px;border:1px solid #cbd5e1;background:#ffffff;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
      <div>
        <strong style="color:#0f172a;">📖 ${w.termEn}</strong>
        <span style="color:#0f766e;font-weight:600;margin-left:8px;">→ ${w.meaningHi}</span>
      </div>
      <button type="button" class="btn-mark-word-learned" data-action="mark-word-learned" data-term-en="${w.termEn}" data-index="${idx}"
              style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:8px;border:none;background:#0f766e;color:#ffffff;font-weight:700;cursor:pointer;">
        ✅ Got It / समझ गया
      </button>
    </div>
  `).join("");
  return `
    <section id="lle-vocabulary-flashcard-deck" aria-label="Bilingual LLE Vocabulary Flashcards"
             style="padding:14px;border-radius:12px;background:#f0fdfa;border:1px solid #99f6e4;margin-top:14px;">
      <h3 style="margin:0 0 8px;font-size:1rem;color:#115e59;">🗣️ 8-Layer Bilingual LLE Flashcards / शब्दावली अभ्यास (544 Terms)</h3>
      <div class="flashcard-items-container">${cardsHtml}</div>
    </section>
  `.trim();
}
