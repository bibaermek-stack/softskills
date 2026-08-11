/**
 * Тұқымға негізделген араластыру.
 *
 * `Math.random()` рендер кезінде шақырылса, сервер мен клиенттің нәтижесі
 * әртүрлі болып, гидратация сәйкессіздігі шығады. Мұндағы генератор тұқымнан
 * толық анықталады: бір тұқым — әрқашан бір рет.
 */

/** mulberry32 — шағын әрі біркелкі таралатын генератор. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Жолды тұрақты бүтін санға айналдырады (FNV-1a). */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Фишер–Йейтс араластыруы. Бастапқы тізімді өзгертпейді. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const next = mulberry32(seed);
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
