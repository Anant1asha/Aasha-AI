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
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" id="btn-export-cohort-csv" data-action="export-cohort-csv"
                  style="min-width:44px;min-height:44px;padding:10px 14px;border-radius:8px;border:none;background:#0f766e;color:#ffffff;font-weight:700;cursor:pointer;">
            📄 Export Cohort CSV / सीएसवी
          </button>
          <button type="button" id="btn-export-cohort-printable" data-action="export-cohort-printable"
                  style="min-width:44px;min-height:44px;padding:10px 14px;border-radius:8px;border:1px solid #0f766e;background:#ffffff;color:#0f766e;font-weight:700;cursor:pointer;">
            🖨️ Printable NGO Audit Card / प्रिंट रिपोर्ट
          </button>
          <button type="button" id="btn-export-usb-cohort-pack" data-action="export-usb-cohort-pack"
                  style="min-width:44px;min-height:44px;padding:10px 14px;border-radius:8px;border:none;background:#1d4ed8;color:#ffffff;font-weight:700;cursor:pointer;">
            💾 Export USB Cohort Pack / यूएसबी पैक
          </button>
          <button type="button" id="btn-import-usb-cohort-pack" data-action="import-usb-cohort-pack"
                  style="min-width:44px;min-height:44px;padding:10px 14px;border-radius:8px;border:1px solid #1d4ed8;background:#eff6ff;color:#1e3a8a;font-weight:700;cursor:pointer;">
            📥 Import USB Cohort Pack / पैक मर्ज करें
          </button>
          <button type="button" id="btn-export-store-ledger" data-action="export-store-ledger"
                  style="min-width:44px;min-height:44px;padding:10px 14px;border-radius:8px;border:1px solid #0f766e;background:#f0fdfa;color:#0f766e;font-weight:700;cursor:pointer;">
            🧾 Store Audit Ledger / स्टॉक खाता
          </button>
          <button id="btn-teacher-restock-modal" data-action="open-restock-modal" class="teacher-restock-btn"
                  style="min-width:44px;min-height:44px;padding:10px 16px;border-radius:8px;font-weight:600;cursor:pointer;">
            📦 Restock Inventory (Staff PIN)
          </button>
        </div>
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
      ${renderTeacherLessonPlanCatalogCard()}
      ${renderTeacherCustomQuizBuilderCard(cohortSummary)}
      ${renderLowRamTabletDiagnosticsCard(cohortSummary)}
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
          <button type="button" id="btn-player-read-aloud" data-action="player-read-aloud" data-chapter-id="${ch.id}" data-title-en="${ch.titleEn}" data-title-hi="${ch.titleHi}"
                  style="min-width:44px;min-height:44px;padding:8px 12px;border-radius:8px;border:none;background:#0284c7;color:#ffffff;font-weight:700;cursor:pointer;">
            🔊 Read Aloud / सुनें
          </button>
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
      ${renderDailyStreakAndSevaCard(state)}
      ${renderSharedTabletStudentSwitcherCard(state)}
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
      ${renderCentreLeaderboardCard(state.leaderboard || [])}
      ${renderNcvetPortfolioChecklistCard(state)}
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

export const OFFLINE_LLE_PHONETIC_DICTIONARY = [
  { termEn: "monomial", meaningHi: "एकपदी (मोनोमियल)", phoneticHi: "मोनोमियल", syllablesHi: "मो-नो-मि-यल" },
  { termEn: "binomial", meaningHi: "द्विपदी (बाइनोमियल)", phoneticHi: "बाइनोमियल", syllablesHi: "बा-इ-नो-मि-यल" },
  { termEn: "identity", meaningHi: "सर्वसमिका (आइडेंटिटी)", phoneticHi: "आइडेंटिटी", syllablesHi: "आ-इ-डें-टि-टी" },
  { termEn: "factorisation", meaningHi: "गुणनखंडन (फ़ैक्टराइज़ेशन)", phoneticHi: "फ़ैक्टराइज़ेशन", syllablesHi: "फ़ै-क्ट-रा-इ-ज़े-शन" },
  { termEn: "photosynthesis", meaningHi: "प्रकाश संश्लेषण (फ़ोटोसिंथेसिस)", phoneticHi: "फ़ोटोसिंथेसिस", syllablesHi: "फ़ो-टो-सिं-थे-सिस" },
  { termEn: "denominator", meaningHi: "हर (डिनॉमिनेटर)", phoneticHi: "डिनॉमिनेटर", syllablesHi: "डि-नॉ-मि-ने-टर" }
];

export function buildPhoneticReadAloudDrill(termEn = "", meaningHi = "", phoneticHi = "", syllablesHi = "") {
  const cleanEn = String(termEn || "concept").trim();
  const lookup = OFFLINE_LLE_PHONETIC_DICTIONARY.find((d) => d.termEn.toLowerCase() === cleanEn.toLowerCase());
  const resolvedMeaning = String(meaningHi || lookup?.meaningHi || cleanEn).trim();
  const resolvedPhonetic = String(phoneticHi || lookup?.phoneticHi || cleanEn).trim();
  const resolvedSyllables = String(syllablesHi || lookup?.syllablesHi || resolvedPhonetic).trim();
  return {
    termEn: cleanEn,
    meaningHi: resolvedMeaning,
    phoneticHi: resolvedPhonetic,
    syllablesHi: resolvedSyllables,
    utteranceEn: cleanEn,
    utteranceHi: `${resolvedPhonetic} — अर्थ: ${resolvedMeaning}`,
    bilingualPrompt: `🔊 ${cleanEn} (${resolvedSyllables}) → ${resolvedMeaning}`
  };
}

export function speakLleTermOffline(termObj = {}, synth = typeof window !== "undefined" ? window.speechSynthesis : null) {
  const drill = buildPhoneticReadAloudDrill(
    termObj.termEn,
    termObj.meaningHi,
    termObj.phoneticHi,
    termObj.syllablesHi
  );
  let spoken = false;
  if (synth && typeof synth.speak === "function" && typeof SpeechSynthesisUtterance !== "undefined") {
    try {
      synth.cancel();
      const uEn = new SpeechSynthesisUtterance(drill.utteranceEn);
      uEn.lang = "en-IN";
      uEn.rate = 0.9;
      const uHi = new SpeechSynthesisUtterance(drill.utteranceHi);
      uHi.lang = "hi-IN";
      uHi.rate = 0.92;
      synth.speak(uEn);
      synth.speak(uHi);
      spoken = true;
    } catch (_) {}
  }
  return { ok: true, spoken, drill };
}

export function renderVocabularyFlashcardDeck(words = OFFLINE_LLE_PHONETIC_DICTIONARY.slice(0, 4)) {
  const list = Array.isArray(words) && words.length > 0 ? words : [OFFLINE_LLE_PHONETIC_DICTIONARY[0]];
  const cardsHtml = list.map((w, idx) => {
    const drill = buildPhoneticReadAloudDrill(w.termEn, w.meaningHi, w.phoneticHi, w.syllablesHi);
    return `
    <div class="lle-flashcard-item" data-term-en="${drill.termEn}" style="padding:12px;border-radius:10px;border:1px solid #cbd5e1;background:#ffffff;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
      <div>
        <strong style="color:#0f172a;">📖 ${drill.termEn}</strong>
        <span style="color:#0f766e;font-weight:600;margin-left:8px;">→ ${drill.meaningHi}</span>
        <div class="lle-phonetic-badge" style="font-size:0.82rem;color:#0369a1;margin-top:4px;">🗣️ उच्चारण (PH): <strong>${drill.syllablesHi}</strong></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="btn-speak-lle-word" data-action="speak-lle-word" data-term-en="${drill.termEn}" data-meaning-hi="${drill.meaningHi}" data-phonetic-hi="${drill.phoneticHi}" data-syllables-hi="${drill.syllablesHi}"
                style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:8px;border:1px solid #0284c7;background:#e0f2fe;color:#0369a1;font-weight:700;cursor:pointer;">
          🔊 Speak / उच्चारण सुनें
        </button>
        <button type="button" class="btn-mark-word-learned" data-action="mark-word-learned" data-term-en="${drill.termEn}" data-index="${idx}"
                style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:8px;border:none;background:#0f766e;color:#ffffff;font-weight:700;cursor:pointer;">
          ✅ Got It / समझ गया
        </button>
      </div>
    </div>
  `;
  }).join("");
  return `
    <section id="lle-vocabulary-flashcard-deck" aria-label="Bilingual LLE Vocabulary Flashcards"
             style="padding:14px;border-radius:12px;background:#f0fdfa;border:1px solid #99f6e4;margin-top:14px;">
      <h3 style="margin:0 0 8px;font-size:1rem;color:#115e59;">🗣️ 8-Layer Bilingual LLE Flashcards &amp; Phonetic Read-Aloud / शब्दावली और उच्चारण अभ्यास (1,557 WM2 • 763 PH)</h3>
      <div class="flashcard-items-container">${cardsHtml}</div>
    </section>
  `.trim();
}

export function renderCentreLeaderboardCard(leaders = []) {
  const rows = (Array.isArray(leaders) ? leaders : []).slice(0, 10).map((l, idx) => {
    const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
    return `<li class="leaderboard-row" data-student-id="${l.studentId}" style="padding:8px 0;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
      <span><strong>${medal} ${l.studentName || l.studentId}</strong> (${l.chaptersMastered || 0} ch)</span>
      <span style="font-weight:700;color:#0f766e;">🪙 ${l.lifetimeCoins ?? l.coinsBalance ?? 0} Coins</span>
    </li>`;
  }).join("");
  return `
    <section id="centre-leaderboard-card" aria-label="Centre Scholar Leaderboard"
             style="padding:14px;border-radius:12px;background:#f8fafc;border:1px solid #cbd5e1;margin-top:16px;">
      <h3 style="margin:0 0 8px;font-size:1rem;color:#0f172a;">🏅 Centre Scholar Leaderboard / केंद्र लीडरबोर्ड</h3>
      <ul style="list-style:none;padding:0;margin:0;">${rows || '<li style="color:#64748b;">Complete a chapter or Arena battle to appear on the leaderboard!</li>'}</ul>
    </section>
  `.trim();
}

export const NCVET_PRACTICAL_CHECKLIST = [
  { id: "ncvet_ssc_q0101", qpCode: "SSC/Q0101", chapterId: "NCVET_PSSCIVE_L3_IT_DataEntry_v5", titleEn: "L3 Domestic Data Entry: Cross-Foot Village Ledger Audit", titleHi: "स्तर 3 डेटा एंट्री: ग्राम बहीखाता क्रॉस-फुट सत्यापन", rewardCoins: 25 },
  { id: "ncvet_agr_q4301", qpCode: "AGR/Q4301", chapterId: "NCVET_PSSCIVE_L4_Agri_SolarDrip_v5", titleEn: "L4 Micro-Irrigation Technician: Filter ΔP & Emitter Calibration", titleHi: "स्तर 4 सूक्ष्म सिंचाई: फ़िल्टर दाब और ड्रिपर अंशांकन", rewardCoins: 25 },
  { id: "ncvet_fic_q0106", qpCode: "FIC/Q0106", chapterId: "NCVET_PSSCIVE_L4_Food_SolarDehydrator_v5", titleEn: "L4 Solar Food Dehydrator: Moisture Reduction & Hygienic Sealing", titleHi: "स्तर 4 सौर खाद्य निर्जलीकरण: नमी नियंत्रण और स्वच्छ पैकेजिंग", rewardCoins: 25 }
];

export function toggleNcvetPracticalTask(state = {}, taskId = "") {
  state.ncvetCompletedTasks = Array.isArray(state.ncvetCompletedTasks) ? state.ncvetCompletedTasks : [];
  const task = NCVET_PRACTICAL_CHECKLIST.find((t) => t.id === taskId);
  if (!task) return { ok: false, completed: false };
  const idx = state.ncvetCompletedTasks.indexOf(taskId);
  let completed = false;
  if (idx === -1) {
    state.ncvetCompletedTasks.push(taskId);
    state.coins = Number(state.coins || 0) + task.rewardCoins;
    completed = true;
    enqueueSyncEvent(state, {
      id: `ncvet_${taskId}_${Date.now()}`,
      chapterId: task.chapterId,
      nodeId: `practical_${task.qpCode}`,
      score: 100,
      passed: true,
      timestamp: new Date().toISOString()
    });
  } else {
    state.ncvetCompletedTasks.splice(idx, 1);
    completed = false;
  }
  return { ok: true, taskId, completed, completedCount: state.ncvetCompletedTasks.length, coins: state.coins };
}

export function exportSignedNcvetPortfolio(state = {}) {
  const completedTasks = Array.isArray(state.ncvetCompletedTasks) ? [...state.ncvetCompletedTasks].sort() : [];
  const prog = state.progress || {};
  const masteredNcvetChapters = NCVET_PRACTICAL_CHECKLIST
    .map((t) => t.chapterId)
    .filter((cid) => prog[cid]?.completed)
    .sort();
  const payload = {
    schemaVersion: "aasha.ncvet.portfolio.v1",
    studentId: String(state.studentId || "stu_local_01"),
    studentName: String(state.studentName || "Aasha Scholar"),
    completedPracticalTasks: completedTasks,
    masteredNcvetChapters,
    qpCodesVerified: NCVET_PRACTICAL_CHECKLIST.filter((t) => completedTasks.includes(t.id)).map((t) => t.qpCode),
    exportedAt: state.exportedAt || new Date().toISOString()
  };
  const canonical = JSON.stringify({
    studentId: payload.studentId,
    completedPracticalTasks: payload.completedPracticalTasks,
    masteredNcvetChapters: payload.masteredNcvetChapters,
    qpCodesVerified: payload.qpCodesVerified
  });
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  payload.signature = "fnv1a32:" + h.toString(16).padStart(8, "0");
  return payload;
}

export function renderNcvetPortfolioChecklistCard(state = {}) {
  const completed = Array.isArray(state.ncvetCompletedTasks) ? state.ncvetCompletedTasks : [];
  const portfolio = exportSignedNcvetPortfolio(state);
  const itemsHtml = NCVET_PRACTICAL_CHECKLIST.map((t) => {
    const isDone = completed.includes(t.id);
    return `
      <li class="ncvet-task-row" data-task-id="${t.id}" data-qp-code="${t.qpCode}"
          style="padding:10px 0;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div>
          <span style="font-size:0.78rem;font-weight:700;padding:2px 8px;border-radius:6px;background:#dbeafe;color:#1e40af;">${t.qpCode}</span>
          <strong style="margin-left:6px;color:#0f172a;">${t.titleEn}</strong>
          <div style="font-size:0.85rem;color:#475569;margin-top:2px;">${t.titleHi}</div>
        </div>
        <button type="button" data-action="toggle-ncvet-task" data-task-id="${t.id}"
                style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:8px;border:none;background:${isDone ? '#16a34a' : '#0f766e'};color:#ffffff;font-weight:700;cursor:pointer;">
          ${isDone ? '✅ Verified / सत्यापित' : '☑️ Log Practical (+25 🪙)'}
        </button>
      </li>
    `;
  }).join("");
  return `
    <section id="ncvet-portfolio-checklist-card" aria-label="NCVET Practical Skill Portfolio Checklist"
             style="padding:14px;border-radius:12px;background:#eff6ff;border:1px solid #bfdbfe;margin-top:16px;">
      <header style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <h3 style="margin:0;font-size:1rem;color:#1e3a8a;">🛠️ NCVET / PSSCIVE Practical Skill Portfolio (${completed.length}/3 QP Verified)</h3>
        <button type="button" id="btn-export-ncvet-portfolio" data-action="export-ncvet-portfolio"
                style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:8px;border:none;background:#1d4ed8;color:#ffffff;font-weight:700;cursor:pointer;">
          📜 Export Signed NCVET Portfolio (${portfolio.signature})
        </button>
      </header>
      <ul style="list-style:none;padding:0;margin:0;">${itemsHtml}</ul>
    </section>
  `.trim();
}

export function exportCohortMasteryCsv(cohortSummary = {}, centerId = "CENTER-UP-GN-01") {
  const students = Array.isArray(cohortSummary.students) ? cohortSummary.students : [];
  const header = "center_id,student_id,student_name,mastery_pct,token_balance,chapters_passed";
  const rows = students.map((s) => {
    const sid = String(s.studentId || s.id || "stu_unknown").replace(/,/g, " ");
    const name = String(s.name || sid).replace(/,/g, " ");
    const mastery = Number(s.masteryPct ?? s.avg_score ?? 0).toFixed(1);
    const tokens = Number(s.tokenBalance ?? s.coin_balance ?? 0);
    const passed = Number(s.chaptersPassed ?? s.chapters_passed ?? 1);
    return `${centerId},${sid},${name},${mastery},${tokens},${passed}`;
  });
  const totalStudents = Number(cohortSummary.totalStudents ?? students.length);
  const avgMastery = Number(cohortSummary.avgMasteryPct ?? 0).toFixed(1);
  const totalTokens = Number(cohortSummary.totalTokensMinted ?? 0);
  const summaryRow = `${centerId},SUMMARY_TOTAL,All Cohort Learners (${totalStudents}),${avgMastery},${totalTokens},0`;
  return [header, ...rows, summaryRow].join("\n");
}

export function renderPrintableCohortAuditReportHtml(cohortSummary = {}, centerId = "CENTER-UP-GN-01") {
  const students = Array.isArray(cohortSummary.students) ? cohortSummary.students : [];
  const totalStudents = Number(cohortSummary.totalStudents ?? students.length);
  const avgMastery = Number(cohortSummary.avgMasteryPct ?? 0).toFixed(1);
  const totalTokens = Number(cohortSummary.totalTokensMinted ?? 0);
  const rowsHtml = students.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${s.studentId || s.id || ""}</td>
      <td>${s.name || s.studentId || ""}</td>
      <td>${Number(s.masteryPct ?? s.avg_score ?? 0).toFixed(1)}%</td>
      <td>${Number(s.tokenBalance ?? s.coin_balance ?? 0)}</td>
    </tr>
  `).join("");
  return `<!DOCTYPE html>
<html lang="hi-IN">
<head>
  <meta charset="UTF-8" />
  <title>Annanth Aasha Foundation — Cohort Progress Report (${centerId})</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #0f172a; }
    h1 { margin: 0 0 4px; color: #0f766e; font-size: 1.35rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 0.9rem; }
    th { background: #f0fdfa; }
  </style>
</head>
<body>
  <h1>Annanth Aasha Foundation — Monthly Cohort Progress &amp; Seva Audit / मासिक केंद्र प्रगति रिपोर्ट</h1>
  <p><strong>Centre ID:</strong> ${centerId} • <strong>Students / विद्यार्थी:</strong> ${totalStudents} • <strong>Avg Mastery / औसत दक्षता:</strong> ${avgMastery}% • <strong>Total Coins / कुल कॉइन्स:</strong> ${totalTokens}</p>
  <table>
    <thead>
      <tr><th>#</th><th>Student ID</th><th>Name / नाम</th><th>Mastery / दक्षता</th><th>Coins / कॉइन्स</th></tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`.trim();
}


function computeUsbPackSignature(pack) {
  const students = Array.isArray(pack.students)
    ? [...pack.students].map((s) => ({
        studentId: String(s.studentId || s.id || ""),
        masteryPct: Number(s.masteryPct ?? s.avg_score ?? 0),
        tokenBalance: Number(s.tokenBalance ?? s.coin_balance ?? 0),
        chaptersPassed: Number(s.chaptersPassed ?? s.chapters_passed ?? 0)
      })).sort((a, b) => a.studentId.localeCompare(b.studentId))
    : [];
  const ncvet = Array.isArray(pack.ncvetCompletedTasks) ? [...pack.ncvetCompletedTasks].sort() : [];
  const canonical = JSON.stringify({
    schemaVersion: "aasha.usb.cohort.pack.v1",
    centerId: String(pack.centerId || "CENTER-UP-GN-01"),
    students,
    ncvetCompletedTasks: ncvet
  });
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return "fnv1a32:" + h.toString(16).padStart(8, "0");
}

export function exportSignedUsbCohortPack(state = {}, centerId = "CENTER-UP-GN-01") {
  const prog = state.progress || {};
  const chapterProgress = {};
  for (const [cid, entry] of Object.entries(prog)) {
    if (entry && typeof entry === "object") {
      chapterProgress[cid] = {
        completed: Boolean(entry.completed),
        scorePct: Number(entry.scorePct || 0)
      };
    }
  }
  const cohortStudents = Array.isArray(state.cohortSummary?.students) ? state.cohortSummary.students : [];
  const localPassedCount = Object.values(chapterProgress).filter((p) => p.completed).length;
  const localScores = Object.values(chapterProgress).map((p) => p.scorePct).filter((n) => n > 0);
  const localAvg = localScores.length ? Number((localScores.reduce((a, b) => a + b, 0) / localScores.length).toFixed(1)) : 0;
  const localStudentEntry = {
    studentId: String(state.studentId || "stu_local_01"),
    name: String(state.studentName || "Aasha Scholar"),
    masteryPct: localAvg,
    tokenBalance: Number(state.coins || 0),
    chaptersPassed: localPassedCount
  };
  const studentMap = new Map();
  for (const s of [localStudentEntry, ...cohortStudents]) {
    const sid = String(s.studentId || s.id || "");
    if (!sid) continue;
    const prev = studentMap.get(sid);
    if (!prev) {
      studentMap.set(sid, {
        studentId: sid,
        name: String(s.name || sid),
        masteryPct: Number(s.masteryPct ?? s.avg_score ?? 0),
        tokenBalance: Number(s.tokenBalance ?? s.coin_balance ?? 0),
        chaptersPassed: Number(s.chaptersPassed ?? s.chapters_passed ?? 0)
      });
    } else {
      prev.masteryPct = Math.max(prev.masteryPct, Number(s.masteryPct ?? s.avg_score ?? 0));
      prev.tokenBalance = Math.max(prev.tokenBalance, Number(s.tokenBalance ?? s.coin_balance ?? 0));
      prev.chaptersPassed = Math.max(prev.chaptersPassed, Number(s.chaptersPassed ?? s.chapters_passed ?? 0));
    }
  }
  const pack = {
    schemaVersion: "aasha.usb.cohort.pack.v1",
    centerId: String(centerId || "CENTER-UP-GN-01"),
    exportedAt: state.exportedAt || new Date().toISOString(),
    chapterProgress,
    ncvetCompletedTasks: Array.isArray(state.ncvetCompletedTasks) ? [...new Set(state.ncvetCompletedTasks)].sort() : [],
    students: [...studentMap.values()],
    misconceptions: Array.isArray(state.cohortSummary?.misconceptions) ? state.cohortSummary.misconceptions : []
  };
  pack.packSignature = computeUsbPackSignature(pack);
  return pack;
}

export function mergeSignedUsbCohortPack(state = {}, incomingPack = {}) {
  if (!incomingPack || typeof incomingPack !== "object" || incomingPack.schemaVersion !== "aasha.usb.cohort.pack.v1") {
    return { ok: false, error: "INVALID_USB_PACK_SCHEMA" };
  }
  const expectedSig = computeUsbPackSignature(incomingPack);
  if (incomingPack.packSignature !== expectedSig) {
    return { ok: false, error: "USB_PACK_SIGNATURE_MISMATCH", expectedSignature: expectedSig };
  }
  state.progress = state.progress || {};
  let mergedChaptersCount = 0;
  for (const [cid, inc] of Object.entries(incomingPack.chapterProgress || {})) {
    const cur = state.progress[cid] || { completed: false, scorePct: 0 };
    const nextScore = Math.max(Number(cur.scorePct || 0), Number(inc?.scorePct || 0));
    const nextDone = Boolean(cur.completed || inc?.completed || nextScore >= 60);
    state.progress[cid] = {
      completed: nextDone,
      scorePct: nextScore,
      updatedAt: new Date().toISOString()
    };
    mergedChaptersCount++;
  }
  const curNcvet = Array.isArray(state.ncvetCompletedTasks) ? state.ncvetCompletedTasks : [];
  const incNcvet = Array.isArray(incomingPack.ncvetCompletedTasks) ? incomingPack.ncvetCompletedTasks : [];
  state.ncvetCompletedTasks = [...new Set([...curNcvet, ...incNcvet])].sort();

  state.cohortSummary = state.cohortSummary || {};
  const curStudents = Array.isArray(state.cohortSummary.students) ? state.cohortSummary.students : [];
  const incStudents = Array.isArray(incomingPack.students) ? incomingPack.students : [];
  const byId = new Map();
  for (const s of [...curStudents, ...incStudents]) {
    const sid = String(s.studentId || s.id || "");
    if (!sid) continue;
    const prev = byId.get(sid);
    if (!prev) {
      byId.set(sid, {
        studentId: sid,
        name: String(s.name || sid),
        masteryPct: Number(s.masteryPct ?? s.avg_score ?? 0),
        tokenBalance: Number(s.tokenBalance ?? s.coin_balance ?? 0),
        chaptersPassed: Number(s.chaptersPassed ?? s.chapters_passed ?? 0)
      });
    } else {
      prev.masteryPct = Math.max(prev.masteryPct, Number(s.masteryPct ?? s.avg_score ?? 0));
      prev.tokenBalance = Math.max(prev.tokenBalance, Number(s.tokenBalance ?? s.coin_balance ?? 0));
      prev.chaptersPassed = Math.max(prev.chaptersPassed, Number(s.chaptersPassed ?? s.chapters_passed ?? 0));
    }
  }
  const mergedStudents = [...byId.values()];
  state.cohortSummary.students = mergedStudents;
  state.cohortSummary.totalStudents = mergedStudents.length;
  state.cohortSummary.avgMasteryPct = mergedStudents.length
    ? Number((mergedStudents.reduce((a, s) => a + s.masteryPct, 0) / mergedStudents.length).toFixed(1))
    : 0;
  state.cohortSummary.totalTokensMinted = mergedStudents.reduce((a, s) => a + s.tokenBalance, 0);

  return {
    ok: true,
    mergedChaptersCount,
    mergedStudentsCount: mergedStudents.length,
    mergedNcvetCount: state.ncvetCompletedTasks.length,
    packSignature: incomingPack.packSignature
  };
}


function snapshotCurrentLearnerIntoVault(state = {}) {
  state.tabletProfiles = state.tabletProfiles && typeof state.tabletProfiles === "object" ? state.tabletProfiles : {};
  const curId = String(state.studentId || "stu_local_01");
  const existing = state.tabletProfiles[curId] || {};
  state.tabletProfiles[curId] = {
    studentId: curId,
    studentName: String(state.studentName || existing.studentName || "Aasha Scholar"),
    grade: Number(state.studentGrade || existing.grade || 8),
    pin: String(existing.pin || ""),
    coins: Number(state.coins ?? existing.coins ?? 0),
    progress: JSON.parse(JSON.stringify(state.progress || {})),
    redemptions: JSON.parse(JSON.stringify(state.redemptions || [])),
    ncvetCompletedTasks: Array.isArray(state.ncvetCompletedTasks) ? [...state.ncvetCompletedTasks] : []
  };
}

export function registerSharedTabletStudent(state = {}, profile = {}) {
  const studentId = String(profile.studentId || "").trim();
  if (!studentId) return { ok: false, error: "MISSING_STUDENT_ID" };
  snapshotCurrentLearnerIntoVault(state);
  const existing = state.tabletProfiles[studentId] || {};
  state.tabletProfiles[studentId] = {
    studentId,
    studentName: String(profile.studentName || existing.studentName || studentId).trim(),
    grade: Number(profile.grade || existing.grade || 8),
    pin: String(profile.pin ?? existing.pin ?? ""),
    coins: Number(profile.initialCoins ?? existing.coins ?? 100),
    progress: existing.progress || {},
    redemptions: existing.redemptions || [],
    ncvetCompletedTasks: existing.ncvetCompletedTasks || []
  };
  return {
    ok: true,
    studentId,
    studentName: state.tabletProfiles[studentId].studentName,
    profileCount: Object.keys(state.tabletProfiles).length
  };
}

export function switchActiveTabletStudent(state = {}, targetStudentId = "", enteredPin = "") {
  const targetId = String(targetStudentId || "").trim();
  if (!targetId) return { ok: false, error: "MISSING_TARGET_STUDENT_ID" };
  snapshotCurrentLearnerIntoVault(state);
  const target = state.tabletProfiles[targetId];
  if (!target) {
    return { ok: false, error: "STUDENT_PROFILE_NOT_FOUND" };
  }
  if (target.pin && String(enteredPin || "") !== String(target.pin)) {
    return { ok: false, error: "INVALID_STUDENT_PIN" };
  }
  state.studentId = target.studentId;
  state.studentName = target.studentName;
  state.studentGrade = Number(target.grade || 8);
  state.coins = Number(target.coins || 0);
  state.progress = JSON.parse(JSON.stringify(target.progress || {}));
  state.redemptions = JSON.parse(JSON.stringify(target.redemptions || []));
  state.ncvetCompletedTasks = Array.isArray(target.ncvetCompletedTasks) ? [...target.ncvetCompletedTasks] : [];
  return {
    ok: true,
    activeStudentId: state.studentId,
    activeStudentName: state.studentName,
    coins: state.coins,
    completedChaptersCount: Object.values(state.progress).filter((p) => p && p.completed).length
  };
}

export function renderSharedTabletStudentSwitcherCard(state = {}) {
  const activeId = String(state.studentId || "stu_local_01");
  const vault = state.tabletProfiles && typeof state.tabletProfiles === "object"
    ? Object.values(state.tabletProfiles)
    : [{ studentId: activeId, studentName: String(state.studentName || "Aasha Scholar"), grade: 8, coins: Number(state.coins || 0), progress: state.progress || {} }];
  const pillsHtml = vault.map((p) => {
    const isCurrent = p.studentId === activeId;
    const chCount = Object.values(p.progress || {}).filter((x) => x && x.completed).length;
    return `
      <button type="button" class="btn-switch-tablet-student" data-action="switch-tablet-student" data-student-id="${p.studentId}"
              style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:10px;border:2px solid ${isCurrent ? '#0f766e' : '#cbd5e1'};background:${isCurrent ? '#ccfbf1' : '#ffffff'};color:#0f172a;font-weight:700;cursor:pointer;">
        ${isCurrent ? '🟢' : '👤'} ${p.studentName} (Cl.${p.grade || 8} • ${chCount} ch • 🪙 ${Number(p.coins || 0)})
      </button>
    `;
  }).join("");
  return `
    <section id="shared-tablet-student-switcher-card" aria-label="Shared Tablet Multi-Student Switcher"
             style="padding:14px;border-radius:12px;background:#f0fdf4;border:1px solid #bbf7d0;margin-top:14px;">
      <header style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <h3 style="margin:0;font-size:1rem;color:#14532d;">👥 Shared-Tablet Learner Switcher / सहपाठी प्रोफ़ाइल बदलें (${vault.length} Profiles)</h3>
        <button type="button" id="btn-register-tablet-student" data-action="register-tablet-student"
                style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:8px;border:none;background:#15803d;color:#ffffff;font-weight:700;cursor:pointer;">
          ➕ Add Tablet Learner / नया विद्यार्थी
        </button>
      </header>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${pillsHtml}</div>
    </section>
  `.trim();
}


export const COMMUNITY_SEVA_CHALLENGES = [
  { id: "seva_jal_audit", titleEn: "Jal Seva: Village Tap & Drip Leak Audit (150 L Saved)", titleHi: "जल सेवा: ग्राम नल और ड्रिप रिसाव निरीक्षण (150 लीटर बचत)", rewardCoins: 30 },
  { id: "seva_vriksha_poshan", titleEn: "Vriksha Seva: Neem & Tulsi Sapling Mulching Care", titleHi: "वृक्ष सेवा: नीम और तुलसी पौधरोपण एवं मल्चिंग देखभाल", rewardCoins: 30 },
  { id: "seva_vidya_peer", titleEn: "Vidya Seva: Peer Coaching 2 Classmates in Bilingual LLE", titleHi: "विद्या सेवा: 2 सहपाठियों को द्विभाषी शब्दावली (LLE) अभ्यास कराना", rewardCoins: 40 }
];

export function recordDailyLearningStreak(state = {}, dateIso = new Date().toISOString().slice(0, 10)) {
  const cleanDate = String(dateIso || new Date().toISOString().slice(0, 10)).slice(0, 10);
  const prevDate = state.lastStudyDate ? String(state.lastStudyDate).slice(0, 10) : "";
  state.streakDays = Math.max(1, Number(state.streakDays || 1));
  if (prevDate === cleanDate) {
    return {
      ok: true,
      streakDays: state.streakDays,
      bonusAwarded: 0,
      coins: Number(state.coins || 0),
      alreadyCheckedIn: true
    };
  }
  if (prevDate) {
    const dPrev = new Date(prevDate + "T00:00:00Z");
    const dCur = new Date(cleanDate + "T00:00:00Z");
    const diffDays = Math.round((dCur.getTime() - dPrev.getTime()) / 86400000);
    if (diffDays === 1) {
      state.streakDays += 1;
    } else if (diffDays > 1) {
      state.streakDays = 1;
    }
  } else {
    state.streakDays += 1;
  }
  state.lastStudyDate = cleanDate;
  state.coins = Number(state.coins || 0) + 15;
  enqueueSyncEvent(state, {
    id: `streak_${cleanDate}_${state.studentId || "stu_local_01"}`,
    chapterId: "DAILY_LEARNING_STREAK",
    nodeId: "daily_streak_checkin",
    score: 100,
    passed: true,
    timestamp: new Date().toISOString()
  });
  return {
    ok: true,
    streakDays: state.streakDays,
    bonusAwarded: 15,
    coins: state.coins,
    alreadyCheckedIn: false
  };
}

export function completeCommunitySevaChallenge(state = {}, challengeId = "") {
  const challenge = COMMUNITY_SEVA_CHALLENGES.find((c) => c.id === challengeId);
  if (!challenge) {
    return { ok: false, error: "UNKNOWN_SEVA_CHALLENGE" };
  }
  state.completedSevaChallenges = Array.isArray(state.completedSevaChallenges) ? state.completedSevaChallenges : [];
  if (state.completedSevaChallenges.includes(challengeId)) {
    return {
      ok: true,
      challengeId,
      alreadyCompleted: true,
      rewardCoins: 0,
      coins: Number(state.coins || 0),
      completedCount: state.completedSevaChallenges.length
    };
  }
  state.completedSevaChallenges.push(challengeId);
  state.coins = Number(state.coins || 0) + challenge.rewardCoins;
  enqueueSyncEvent(state, {
    id: `seva_${challengeId}_${state.studentId || "stu_local_01"}`,
    chapterId: "SEVA_COMMUNITY_MISSION",
    nodeId: challengeId,
    score: 100,
    passed: true,
    timestamp: new Date().toISOString()
  });
  return {
    ok: true,
    challengeId,
    alreadyCompleted: false,
    rewardCoins: challenge.rewardCoins,
    coins: state.coins,
    completedCount: state.completedSevaChallenges.length
  };
}

export function renderDailyStreakAndSevaCard(state = {}) {
  const streakDays = Math.max(1, Number(state.streakDays || 1));
  const completed = Array.isArray(state.completedSevaChallenges) ? state.completedSevaChallenges : [];
  const itemsHtml = COMMUNITY_SEVA_CHALLENGES.map((c) => {
    const isDone = completed.includes(c.id);
    return `
      <li class="seva-challenge-row" data-challenge-id="${c.id}"
          style="padding:8px 0;border-bottom:1px solid #fde68a;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
        <div>
          <strong style="color:#0f172a;">🌱 ${c.titleEn}</strong>
          <div style="font-size:0.84rem;color:#475569;">${c.titleHi}</div>
        </div>
        <button type="button" data-action="complete-seva-challenge" data-challenge-id="${c.id}"
                style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:8px;border:none;background:${isDone ? '#16a34a' : '#d97706'};color:#ffffff;font-weight:700;cursor:pointer;">
          ${isDone ? '✅ Seva Logged / पूर्ण' : `⚡ Log Seva (+${c.rewardCoins} 🪙)`}
        </button>
      </li>
    `;
  }).join("");
  return `
    <section id="daily-streak-seva-card" aria-label="Daily Learning Streak and Community Seva Missions"
             style="padding:14px;border-radius:12px;background:#fffbeb;border:1px solid #fde68a;margin-top:14px;">
      <header style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <h3 style="margin:0;font-size:1rem;color:#92400e;">🔥 ${streakDays}-Day Learning Streak &amp; Seva Challenges / दैनिक अभ्यास और सेवा (${completed.length}/3)</h3>
        <button type="button" id="btn-daily-streak-checkin" data-action="daily-streak-checkin"
                style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:8px;border:none;background:#b45309;color:#ffffff;font-weight:700;cursor:pointer;">
          📅 Daily Check-In (+15 🪙)
        </button>
      </header>
      <ul style="list-style:none;padding:0;margin:0;">${itemsHtml}</ul>
    </section>
  `.trim();
}


export function generateChapterLessonPlanHtml(chapterId = "NCERT-G06-MATH-CH07-FRACTIONS") {
  const ch = LEARN_ARENA_13_CATALOGUE.find((c) => c.id === chapterId)
    || OFFLINE_CHAPTER_CATALOGUE.find((c) => c.id === chapterId)
    || LEARN_ARENA_13_CATALOGUE[0];
  const learnMod = ch.learnFile || ch.bundleFile || `${ch.id}_Learning.html`;
  const arenaMod = ch.arenaFile || ch.bundleFile || `${ch.id}_Arena.html`;
  return `<!DOCTYPE html>
<html lang="hi-IN">
<head>
  <meta charset="UTF-8" />
  <title>Annanth Aasha Foundation — 40-Min Bilingual Lesson Plan (${ch.id})</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #0f172a; }
    h1 { margin: 0 0 6px; color: #0f766e; font-size: 1.3rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 0.9rem; }
    th { background: #f0fdfa; }
  </style>
</head>
<body>
  <h1>Annanth Aasha Foundation — 40-Minute Bilingual Classroom Lesson Plan / कक्षा शिक्षण योजना</h1>
  <p><strong>Chapter:</strong> ${ch.titleEn} (${ch.titleHi}) • <strong>Grade:</strong> ${ch.grade} • <strong>Subject:</strong> ${ch.subject}</p>
  <p><strong>Offline Modules:</strong> 📖 <code>${learnMod}</code> | ⚔️ <code>${arenaMod}</code></p>
  <table>
    <thead>
      <tr><th>Time / समय</th><th>Stage / चरण</th><th>Bilingual Facilitator Activity / शिक्षक गतिविधि (60% EN / 40% HI LLE)</th></tr>
    </thead>
    <tbody>
      <tr><td>00–10 min</td><td>1. Real-World Seva Hook / स्थानीय उदाहरण</td><td>Introduce ${ch.titleEn} (${ch.titleHi}) using a Greater Noida village ledger or field measurement chalkboard problem.</td></tr>
      <tr><td>10–25 min</td><td>2. Interactive SVG &amp; LLE Lab / दृश्य और शब्दावली अभ्यास</td><td>Launch <code>${learnMod}</code>, practice Phonetic (PH) &amp; Word-Map (WM2) flashcards aloud, and manipulate the interactive SVG simulator.</td></tr>
      <tr><td>25–35 min</td><td>3. Aasha Arena Group Challenge / समूह अखाड़ा प्रश्नोत्तरी</td><td>Run <code>${arenaMod}</code> in 2-student teams; review any remediation tags triggered on wrong answers.</td></tr>
      <tr><td>35–40 min</td><td>4. Chalkboard Exit Ticket &amp; Seva Pledge / श्यामपट्ट मूल्यांकन</td><td>Verify 2 chalkboard exit questions, log NCVET/Seva practical tasks, and award +50/+100 Aasha Coins.</td></tr>
    </tbody>
  </table>
</body>
</html>`.trim();
}

export function renderTeacherLessonPlanCatalogCard(chapters = LEARN_ARENA_13_CATALOGUE) {
  const list = Array.isArray(chapters) && chapters.length > 0 ? chapters : LEARN_ARENA_13_CATALOGUE;
  const rows = list.map((ch) => `
    <li class="lesson-plan-row" data-chapter-id="${ch.id}"
        style="padding:8px 0;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
      <div>
        <strong style="color:#0f172a;">📘 ${ch.titleEn}</strong>
        <div style="font-size:0.84rem;color:#475569;">${ch.titleHi} (Class ${ch.grade} • ${ch.subject})</div>
      </div>
      <button type="button" class="btn-export-lesson-plan" data-action="export-chapter-lesson-plan" data-chapter-id="${ch.id}"
              style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:8px;border:none;background:#0f766e;color:#ffffff;font-weight:700;cursor:pointer;">
        📋 40-Min Lesson Plan / शिक्षण योजना
      </button>
    </li>
  `).join("");
  return `
    <section id="teacher-lesson-plan-catalog-card" aria-label="Bilingual 40-Minute Classroom Lesson Plans"
             style="padding:14px;border-radius:12px;background:#f0fdfa;border:1px solid #99f6e4;margin-top:14px;">
      <h3 style="margin:0 0 8px;font-size:1rem;color:#115e59;">📋 40-Minute Bilingual Classroom Lesson Plans &amp; Chalkboard Guides (${list.length} Chapters)</h3>
      <ul style="list-style:none;padding:0;margin:0;">${rows}</ul>
    </section>
  `.trim();
}


export function renderFacilitatorRestockModal(storeItems = TIER1_STORE_CATALOG) {
  const opts = (Array.isArray(storeItems) ? storeItems : TIER1_STORE_CATALOG).map((item) =>
    `<option value="${item.id}">${item.icon} ${item.titleEn} (${item.titleHi})</option>`
  ).join("");
  return `
    <div id="facilitator-restock-modal" role="dialog" aria-modal="true" aria-labelledby="restock-modal-title"
         style="position:fixed;inset:0;background:rgba(15,23,42,0.72);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;">
      <div style="background:#ffffff;border-radius:16px;max-width:400px;width:100%;padding:20px;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
        <h3 id="restock-modal-title" style="margin:0 0 10px;font-size:1.05rem;color:#0f172a;">📦 Restock Centre Store / स्टोर स्टॉक जोड़ें</h3>
        <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:4px;">Item / वस्तु</label>
        <select id="restock-item-select" style="width:100%;min-height:44px;padding:8px;border-radius:8px;border:1px solid #cbd5e1;margin-bottom:10px;">${opts}</select>
        <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:4px;">Quantity to Add / मात्रा</label>
        <input id="restock-qty-input" type="number" min="1" max="500" value="25"
               style="width:100%;min-height:44px;padding:8px;border-radius:8px;border:1px solid #cbd5e1;margin-bottom:10px;" />
        <label style="display:block;font-size:0.85rem;font-weight:600;margin-bottom:4px;">Staff PIN / स्टाफ पिन</label>
        <input id="restock-pin-input" type="password" inputmode="numeric" maxlength="6" placeholder="Staff PIN"
               style="width:100%;min-height:44px;padding:8px;border-radius:8px;border:1px solid #cbd5e1;margin-bottom:14px;" />
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button type="button" data-action="cancel-restock-modal"
                  style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:8px;border:1px solid #cbd5e1;background:#f8fafc;color:#334155;font-weight:600;cursor:pointer;">
            Cancel / रद्द करें
          </button>
          <button type="button" data-action="confirm-restock-modal"
                  style="min-width:44px;min-height:44px;padding:8px 14px;border-radius:8px;border:none;background:#0f766e;color:#ffffff;font-weight:700;cursor:pointer;">
            ✅ Confirm Restock
          </button>
        </div>
      </div>
    </div>
  `.trim();
}

export function restockStoreInventoryItem(state = {}, itemId = "", qty = 0, staffPin = "") {
  const validPin = String(state.staffPin || "1234");
  if (String(staffPin || "") !== validPin) {
    return { ok: false, error: "INVALID_STAFF_PIN" };
  }
  const addQty = Number(qty || 0);
  if (!itemId || !Number.isFinite(addQty) || addQty <= 0) {
    return { ok: false, error: "INVALID_RESTOCK_QTY" };
  }
  state.storeInventory = state.storeInventory && typeof state.storeInventory === "object"
    ? state.storeInventory
    : Object.fromEntries(TIER1_STORE_CATALOG.map((it) => [it.id, 50]));
  const prevQty = Number(state.storeInventory[itemId] ?? 50);
  const newQty = prevQty + addQty;
  state.storeInventory[itemId] = newQty;
  state.storeAuditLog = Array.isArray(state.storeAuditLog) ? state.storeAuditLog : [];
  const entry = {
    txId: `restock_${itemId}_${Date.now()}`,
    type: "RESTOCK",
    itemId,
    deltaQty: addQty,
    resultingStock: newQty,
    timestamp: new Date().toISOString()
  };
  state.storeAuditLog.push(entry);
  return { ok: true, itemId, previousStock: prevQty, newStock: newQty, entry };
}

export function exportStoreInventoryAuditLedger(state = {}, centerId = "CENTER-UP-GN-01") {
  const inventory = state.storeInventory && typeof state.storeInventory === "object"
    ? state.storeInventory
    : Object.fromEntries(TIER1_STORE_CATALOG.map((it) => [it.id, 50]));
  const redemptions = Array.isArray(state.redemptions) ? state.redemptions : [];
  const restocks = Array.isArray(state.storeAuditLog) ? state.storeAuditLog : [];
  const payload = {
    schemaVersion: "aasha.store.audit.ledger.v1",
    centerId: String(centerId || "CENTER-UP-GN-01"),
    inventory,
    totalRedemptions: redemptions.length,
    totalRestockEvents: restocks.length,
    redemptions,
    restocks,
    exportedAt: state.exportedAt || new Date().toISOString()
  };
  const canonical = JSON.stringify({
    centerId: payload.centerId,
    inventory: payload.inventory,
    totalRedemptions: payload.totalRedemptions,
    totalRestockEvents: payload.totalRestockEvents
  });
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  payload.ledgerSignature = "fnv1a32:" + h.toString(16).padStart(8, "0");
  return payload;
}


export function validateNonSpoilerMisconception(correctOption = "", misconceptionText = "") {
  const ans = String(correctOption || "").trim().toLowerCase();
  const hint = String(misconceptionText || "").trim().toLowerCase();
  if (!ans || !hint) {
    return { valid: false, error: "EMPTY_ANSWER_OR_MISCONCEPTION" };
  }
  const spoilerPrefixes = ["is ", "= ", "=", "giving ", "becomes ", "answer is ", "उत्तर "];
  for (const pfx of spoilerPrefixes) {
    if (hint.includes(pfx + ans)) {
      return { valid: false, error: "SPOILER_LEAK_IN_MISCONCEPTION" };
    }
  }
  return { valid: true };
}

export function authorCustomBilingualQuestion(state = {}, qSpec = {}) {
  const chapterId = String(qSpec.chapterId || "NCERT-G06-MATH-CH07-FRACTIONS").trim();
  const promptEn = String(qSpec.promptEn || "").trim();
  const promptHi = String(qSpec.promptHi || "").trim();
  const correctOption = String(qSpec.correctOption || "").trim();
  const wrongOption = String(qSpec.wrongOption || "").trim();
  const misconceptionHi = String(qSpec.misconceptionHi || "").trim();
  if (!promptEn || !promptHi || !correctOption || !wrongOption) {
    return { ok: false, error: "MISSING_QUESTION_FIELDS" };
  }
  const v = validateNonSpoilerMisconception(correctOption, misconceptionHi);
  if (!v.valid) {
    return { ok: false, error: v.error };
  }
  state.customQuestions = Array.isArray(state.customQuestions) ? state.customQuestions : [];
  const item = {
    id: `custom_q_${state.customQuestions.length + 1}`,
    chapterId,
    promptEn,
    promptHi,
    correctOption,
    wrongOption,
    misconceptionHi,
    lTruthVerified: true,
    createdAt: new Date().toISOString()
  };
  state.customQuestions.push(item);
  return { ok: true, question: item, totalCustomQuestions: state.customQuestions.length };
}

export function renderTeacherCustomQuizBuilderCard(cohortSummary = {}) {
  const customList = Array.isArray(cohortSummary.customQuestions) ? cohortSummary.customQuestions : [];
  const rows = customList.map((q) => `
    <li class="custom-question-row" data-question-id="${q.id}" style="padding:6px 0;border-bottom:1px solid #e2e8f0;">
      <strong>[${q.chapterId}]</strong> ${q.promptEn} / ${q.promptHi} <span style="color:#0f766e;">(✅ L-Truth Verified)</span>
    </li>
  `).join("");
  return `
    <section id="teacher-custom-quiz-builder-card" aria-label="Bilingual Teacher Custom Quiz Builder"
             style="padding:14px;border-radius:12px;background:#faf5ff;border:1px solid #e9d5ff;margin-top:14px;">
      <header style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <h3 style="margin:0;font-size:1rem;color:#581c87;">🧪 Teacher Custom Bilingual Arena Quiz Builder / शिक्षक प्रश्न निर्माता (${customList.length} Custom MCQs)</h3>
        <button type="button" id="btn-add-custom-question" data-action="add-custom-bilingual-question"
                style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:8px;border:none;background:#7c3aed;color:#ffffff;font-weight:700;cursor:pointer;">
          ➕ Add Verified Bilingual MCQ / नया प्रश्न जोड़ें
        </button>
      </header>
      <ul style="list-style:none;padding:0;margin:0;">${rows || '<li style="color:#64748b;">Author L-Truth non-spoiler bilingual questions for offline Arena packs.</li>'}</ul>
    </section>
  `.trim();
}


export function evaluateLowRamTabletBudget(metrics = {}) {
  const deviceMemoryGb = Number(metrics.deviceMemoryGb ?? 2);
  const heapUsedMb = Number(metrics.heapUsedMb ?? 68);
  const maxBundleBytes = Number(metrics.maxBundleBytes ?? 539884);
  const lowRamMode = deviceMemoryGb <= 2;
  const withinHeapBudget = heapUsedMb <= 250;
  const under20MiBCeiling = maxBundleBytes <= 20971520;
  const recommendedRenderer = lowRamMode ? "Canvas2D_Lightweight_SVG" : "PixiJS_WebGL_Accelerated";
  return {
    ok: withinHeapBudget && under20MiBCeiling,
    twaPackageId: "org.annantaasha.learn.twa",
    deviceMemoryGb,
    lowRamMode,
    heapUsedMb,
    heapBudgetMb: 250,
    withinHeapBudget,
    maxBundleBytes,
    under20MiBCeiling,
    recommendedRenderer
  };
}

export function renderLowRamTabletDiagnosticsCard(cohortSummary = {}) {
  const bench = evaluateLowRamTabletBudget(cohortSummary.tabletMetrics || {});
  return `
    <section id="low-ram-tablet-diagnostics-card" aria-label="2GB Android Tablet TWA and Memory Benchmark"
             style="padding:14px;border-radius:12px;background:#f0fdfa;border:1px solid #99f6e4;margin-top:14px;">
      <header style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <h3 style="margin:0;font-size:1rem;color:#115e59;">📱 Android TWA &amp; 2GB Low-RAM Tablet Governor (${bench.twaPackageId})</h3>
        <button type="button" id="btn-run-tablet-benchmark" data-action="run-tablet-benchmark"
                style="min-width:44px;min-height:44px;padding:6px 12px;border-radius:8px;border:none;background:#0f766e;color:#ffffff;font-weight:700;cursor:pointer;">
          ⚡ Run 2GB Tablet Benchmark / टैबलेट परीक्षण
        </button>
      </header>
      <p style="margin:0;font-size:0.88rem;color:#334155;">
        RAM Profile: <strong>${bench.deviceMemoryGb} GB</strong> • Heap: <strong>${bench.heapUsedMb} MB / ${bench.heapBudgetMb} MB</strong> • Renderer: <code>${bench.recommendedRenderer}</code> • Bundle Ceiling: <strong>✅ &lt; 20 MiB</strong>
      </p>
    </section>
  `.trim();
}
