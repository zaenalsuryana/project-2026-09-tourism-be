export type CrowdLevel = 'QUIET' | 'MODERATE' | 'BUSY' | 'VERY_BUSY' | 'FULL';

const LABEL: Record<CrowdLevel, string> = {
  QUIET: 'Sepi',
  MODERATE: 'Sedang',
  BUSY: 'Ramai',
  VERY_BUSY: 'Sangat ramai',
  FULL: 'Penuh',
};

const AUTO_PERCENT: [number, number, number] = [20, 50, 80];

export interface ResolveCrowdInput {
  occupied: number; // Jumlah terisi (sold + reserved)
  limit: number | null; // dailyVisitorLimit atau override tanggal
  referenceCapacity: number | null; // crowdReferenceCapacity (bila limit null)
  thresholdUnit: 'PERCENT' | 'VISITORS' | null;
  thresholds: [number, number, number] | null; // [moderateFrom, busyFrom, veryBusyFrom]
  defaultCapacity?: number; // default CROWD_DEFAULT_CAPACITY (50)
}

export function resolveCrowd(input: ResolveCrowdInput) {
  const defaultCap = input.defaultCapacity ?? 50;
  const isLimited = input.limit !== null;
  const capacity = input.limit ?? input.referenceCapacity ?? defaultCap;

  // Hitung ambang batas (VISITORS langsung dipakai, PERCENT dihitung dari kapasitas)
  const raw =
    input.thresholdUnit === 'VISITORS' && input.thresholds
      ? input.thresholds
      : (input.thresholds ?? AUTO_PERCENT).map((p) =>
          Math.ceil((capacity * p) / 100),
        );

  const t: number[] = [];
  raw.forEach((v, i) => t.push(Math.max((t[i - 1] ?? 0) + 1, v)));

  const x = input.occupied;
  const level: CrowdLevel =
    isLimited && x >= capacity
      ? 'FULL'
      : x >= t[2]
      ? 'VERY_BUSY'
      : x >= t[1]
      ? 'BUSY'
      : x >= t[0]
      ? 'MODERATE'
      : 'QUIET';

  return {
    level,
    label: LABEL[level],
    occupied: x,
    capacity,
    isLimited,
    remaining: isLimited ? Math.max(capacity - x, 0) : null,
    percentage: Math.round((x / capacity) * 100),
    thresholds: {
      moderateFrom: t[0],
      busyFrom: t[1],
      veryBusyFrom: t[2],
    },
  };
}