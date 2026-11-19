// POC fault injection: the first commit deliberately collapses A/B runs.
// The fixed contract is three runs across 18 pinned r228 observations.
export function summarize(ids) {
  if (!Array.isArray(ids) || ids.some(id => !/^r\d+\/[A-Z]\/\d+$/.test(id))) throw new Error('Invalid sample ID');
  return { frames: ids.length, independentRuns: new Set(ids.map(id => id.split('/').slice(0, 2).join('/'))).size };
}
