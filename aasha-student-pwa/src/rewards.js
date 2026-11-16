export const TIER1_STORE_CATALOG = [
  { id: 'item_pencil_pack', titleEn: 'Graphite Pencil & Eraser Pack', titleHi: 'पेंसिल और रबर सेट', icon: '✏️', costCoins: 50, tier: 1 },
  { id: 'item_notebook_a4', titleEn: 'Aasha Ruled Notebook (120p)', titleHi: 'आशा रूलदार नोटबुक (120 पेज)', icon: '📓', costCoins: 100, tier: 1 },
  { id: 'item_color_pens', titleEn: 'Bilingual Highlighters & Pens', titleHi: 'रंगीन पेन और हाइलाइटर सेट', icon: '🖍️', costCoins: 150, tier: 1 },
  { id: 'item_geometry_box', titleEn: 'Mathematical Geometry Box', titleHi: 'ज्यामिति बॉक्स (Geometry Box)', icon: '📐', costCoins: 250, tier: 1 }
];

export function computeBadges(state) {
  const completedCount = Object.values(state.progress || {}).filter(p => p.completed).length;
  return [
    { id: 'first_step', name: 'First Step / पहला कदम', icon: '🌱', unlocked: completedCount >= 1 },
    { id: 'three_chapter_streak', name: '3-Chapter Streak / 3 अध्याय स्ट्रीक', icon: '⚡', unlocked: completedCount >= 3 },
    { id: 'five_chapters', name: '5 Chapters / 5 अध्याय', icon: '🔥', unlocked: completedCount >= 5 },
    { id: 'ten_chapter_scholar', name: '10-Chapter Scholar / 10 अध्याय विद्वान', icon: '🎓', unlocked: completedCount >= 10 },
    { id: 'twenty_chapter_champion', name: '20-Chapter Champion / 20 अध्याय चैंपियन', icon: '🏆', unlocked: completedCount >= 20 },
    { id: 'twenty_five_chapter_legend', name: '25-Chapter Legend / 25 अध्याय महारथी', icon: '🌟', unlocked: completedCount >= 25 },
    { id: 'coin_saver', name: '100 Aasha Coins / 100 सिक्के', icon: '🪙', unlocked: (state.coins || 0) >= 100 }
  ];
}

export function awardChapterPassReward(state, chapterId, scorePct = 80) {
  state.coins = Number(state.coins || 0);
  state.rewardedChapters = state.rewardedChapters || {};
  if (state.rewardedChapters[chapterId] || scorePct < 60) {
    return { awarded: 0, totalCoins: state.coins };
  }
  const delta = scorePct >= 85 ? 100 : 50;
  state.coins += delta;
  state.rewardedChapters[chapterId] = { delta, scorePct, awardedAt: new Date().toISOString() };
  return { awarded: delta, totalCoins: state.coins };
}

export function redeemStoreItem(state, itemId, staffPin) {
  if (String(staffPin || '').trim() !== '1080') {
    return { ok: false, error: 'INVALID_PIN', message: 'Enter valid Centre Staff PIN (1080)' };
  }
  const item = TIER1_STORE_CATALOG.find(i => i.id === itemId);
  if (!item) return { ok: false, error: 'NOT_FOUND', message: 'Item not found' };
  const currentCoins = Number(state.coins || 0);
  if (currentCoins < item.costCoins) {
    return { ok: false, error: 'INSUFFICIENT_COINS', message: `Need ${item.costCoins} Aasha Coins` };
  }
  state.coins = currentCoins - item.costCoins;
  state.redemptions = state.redemptions || [];
  const receipt = {
    id: 'RDM-' + Date.now().toString(36).toUpperCase(),
    itemId: item.id,
    titleEn: item.titleEn,
    titleHi: item.titleHi,
    costCoins: item.costCoins,
    redeemedAt: new Date().toISOString()
  };
  state.redemptions.unshift(receipt);
  return { ok: true, receipt, balance: state.coins };
}

export const REWARD_STORE_CATALOGUE = TIER1_STORE_CATALOG;
export function redeemStoreItemWithPin({ studentBalance, itemId, staffPin }) { const st = { coins: studentBalance, redemptions: [] }; const res = redeemStoreItem(st, itemId, staffPin); return { ok: res.ok, newBalance: st.coins, receipt: res.receipt, error: res.error }; }
