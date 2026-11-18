/**
 * Aasha Student PWA — Offline-First Service Worker (v2.1)
 * FOCUS-UNIT-PHASE-G-003: Pre-caches 5-Tab PWA Shell, teas_content.db.gz, and all 11 Certified HTML5 Chapters.
 */
export const CACHE_VERSION = "aasha-student-pwa-v2.2";

export const LEARN_ARENA_26_BUNDLES = [
  "/chapters/NCERT-G06-MATH-CH07-FRACTIONS_Learning.html",
  "/chapters/NCERT-G06-MATH-CH07-FRACTIONS_Arena.html",
  "/chapters/NCERT-G07-MATH-CH11-PERIMETER-AREA_Learning.html",
  "/chapters/NCERT-G07-MATH-CH11-PERIMETER-AREA_Arena.html",
  "/chapters/NCERT-G08-MATH-CH08-COMPARING-QUANTITIES_Learning.html",
  "/chapters/NCERT-G08-MATH-CH08-COMPARING-QUANTITIES_Arena.html",
  "/chapters/NCERT-G09-SCI-CH08-FORCE-MOTION_Learning.html",
  "/chapters/NCERT-G09-SCI-CH08-FORCE-MOTION_Arena.html",
  "/chapters/NCERT-G09-SCI-CH10-WORK-ENERGY_Learning.html",
  "/chapters/NCERT-G09-SCI-CH10-WORK-ENERGY_Arena.html",
  "/chapters/NCERT-G10-MATH-CH02-POLYNOMIALS_Learning.html",
  "/chapters/NCERT-G10-MATH-CH02-POLYNOMIALS_Arena.html",
  "/chapters/NCERT-G10-SCI-CH06-LIFE-PROCESSES-PHOTOSYNTHESIS_Learning.html",
  "/chapters/NCERT-G10-SCI-CH06-LIFE-PROCESSES-PHOTOSYNTHESIS_Arena.html",
  "/chapters/NCERT-G10-SCI-CH12-ELECTRICITY-OHMS-LAW_Learning.html",
  "/chapters/NCERT-G10-SCI-CH12-ELECTRICITY-OHMS-LAW_Arena.html",
  "/chapters/NCVET-PSSCIVE-L3-IT-DIGITAL-VILLAGE-LEDGER_Learning.html",
  "/chapters/NCVET-PSSCIVE-L3-IT-DIGITAL-VILLAGE-LEDGER_Arena.html",
  "/chapters/NCVET-PSSCIVE-L4-AGRI-PRECISION-DRIP-JAL-SEVA_Learning.html",
  "/chapters/NCVET-PSSCIVE-L4-AGRI-PRECISION-DRIP-JAL-SEVA_Arena.html",
  "/chapters/NCVET_PSSCIVE_L3_IT_DataEntry_Learning.html",
  "/chapters/NCVET_PSSCIVE_L3_IT_DataEntry_Arena.html",
  "/chapters/NCVET_PSSCIVE_L4_Agri_SolarDrip_Learning.html",
  "/chapters/NCVET_PSSCIVE_L4_Agri_SolarDrip_Arena.html",
  "/chapters/NCVET_PSSCIVE_L4_Food_SolarDehydrator_Learning.html",
  "/chapters/NCVET_PSSCIVE_L4_Food_SolarDehydrator_Arena.html"
];

export const CERTIFIED_CHAPTER_BUNDLES = [
  "/chapters/ncert_economics_ch1_modal.html",
  "/chapters/business_studies_class12_ch1_ch2.html",
  "/chapters/Accounting_Class11_OneShot_Master_Interactive.html",
  "/chapters/Quadratic_Equations_Class10_Pro.html",
  "/chapters/Quadratic_Equations_Class10_Gamified.html",
  "/chapters/Class_8_MS_Access_Interactive_Learning.html",
  "/chapters/ComparingQuantities_Percentage_Class8_Gamified_v5.html",
  "/chapters/Fractions_Gamified_v5_3.html",
  "/chapters/Perimeter_Area_Gamified_v5_2.html",
  "/chapters/Polynomials_Class10_Gamified_v5.html",
  "/chapters/Electric_Circuits_Class7_Gamified_v5.html",
  "/chapters/Motion_And_Force_Class9_Gamified_v5.html",
  "/chapters/Chemical_Effects_Of_Current_Class8_Gamified_v5.html",
  "/chapters/Acids_Bases_And_Salts_Class7_Gamified_v5.html",
  "/chapters/Light_Shadows_And_Reflections_Class6_Gamified_v5.html",
  "/chapters/Linear_Equations_Two_Variables_Class9_Gamified_v5.html",
  "/chapters/Mensuration_3D_Solids_Class8_Gamified_v5.html",
  "/chapters/Life_Processes_Human_Heart_Class10_Gamified_v5.html",
  "/chapters/Story_Of_Village_Palampur_Class9_Gamified_v5.html",
  "/chapters/Data_Handling_Mean_Median_Mode_Class7_Gamified_v5.html",
  "/chapters/Force_And_Pressure_Class8_Gamified_v5.html",
  "/chapters/Trigonometry_Heights_And_Distances_Class10_Gamified_v5.html",
  "/chapters/Structure_Of_The_Atom_Bohr_Orbits_Class9_Gamified_v5.html",
  "/chapters/Algebraic_Identities_And_Factorisation_Class8_Gamified_v5.html",
  "/chapters/Heat_Transfer_Conduction_Convection_Radiation_Class7_Gamified_v5.html",
  "/chapters/Magnetic_Effects_Of_Electric_Current_Class10_Gamified_v5.html"
];

export const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/src/app.js",
  "/src/rewards.js",
  "/src/sync.js",
  "/teas_content.db.gz",
  "/api/catalogue/teas-sqlite-manifest",
  "/api/catalogue/learn-arena-modules",
  ...CERTIFIED_CHAPTER_BUNDLES,
  ...LEARN_ARENA_26_BUNDLES
];

if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_ASSETS)).then(() => self.skipWaiting())
    );
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      ).then(() => self.clients.claim())
    );
  });

  self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
            }
            return res;
          })
          .catch(() => cached || caches.match("/index.html"));
        return cached || networkFetch;
      })
    );
  });
}
