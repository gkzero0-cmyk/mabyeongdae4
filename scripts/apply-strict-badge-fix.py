from pathlib import Path
import re

path = Path('ranking-overrides.js')
text = path.read_text(encoding='utf-8')
pattern = re.compile(r"  function getMabyeongdaeSeasons\(item\) \{.*?^  \}\n\n  function hasMabyeongdaeSeason", re.S | re.M)
replacement = """  function getMabyeongdaeSeasons(item) {
    const idSeasons = SOOP_SEASON_ID_MAP[normalizeSoopId(item?.userId)] || [];
    // The updated workbook is authoritative whenever a verified SOOP ID exists.
    // Do not merge nickname or self-reported comment history into a verified mapping.
    if (idSeasons.length) return [...idSeasons];

    const commentSeasons = commentHistorySeasons(item?.comment);
    let seasons;
    if (commentSeasons.length) {
      // Explicit self-reported history is more reliable than a possibly reused/decorated nickname.
      seasons = new Set();
    } else {
      seasons = new Set(nameFallbackSeasons(item));
      if (!seasons.size && typeof base.getMabyeongdaeSeasons === 'function') {
        for (const season of base.getMabyeongdaeSeasons(item)) seasons.add(season);
      }
    }

    for (const season of commentSeasons) seasons.add(season);
    return [1, 2, 3].filter(season => seasons.has(season));
  }

  function hasMabyeongdaeSeason"""
updated, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'expected one getMabyeongdaeSeasons block, replaced {count}')
path.write_text(updated, encoding='utf-8')

index = Path('index.html')
html = index.read_text(encoding='utf-8')
old = './ranking-overrides.js?v=20260909d'
new = './ranking-overrides.js?v=20260909e'
if old not in html:
    raise SystemExit('expected ranking-overrides cache-bust token not found')
index.write_text(html.replace(old, new, 1), encoding='utf-8')
