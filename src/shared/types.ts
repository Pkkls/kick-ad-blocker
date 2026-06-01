export interface BlockStats {
  networkBlocked: number;
  domHidden: number;
  sessionStart: number;
  todayKey: string; // YYYY-MM-DD
}

export function emptyStats(): BlockStats {
  return {
    networkBlocked: 0,
    domHidden: 0,
    sessionStart: Date.now(),
    todayKey: new Date().toISOString().slice(0, 10),
  };
}
