/**
 * Verified Auður óbundinn sparireikningur nominal rate schedule (%).
 * Rates are annual nominal (not EAR). Update manually after CBI MPC decisions
 * or when Auður moves independently — check audur.is/vaxtatafla.
 */
export const AUDUR_NOMINAL_RATES = [
  { date: '2023-05-01', rate: 7.0, note: 'Pre-May-24 rate (inferred from 0.50% spread)' },
  { date: '2023-05-26', rate: 7.8, note: 'Auður partial adjustment after 125bp CBI hike. Source: Vísir 26.05.2023' },
  { date: '2023-08-23', rate: 8.75, note: 'Full catch-up after Aug CBI hike to 9.25%. Source: Kvika 5-yr release' },
  { date: '2024-07-01', rate: 8.65, note: 'Auður unilateral 10bp cut without CBI move. Source: mbl.is 01.07.2024' },
  { date: '2024-10-02', rate: 8.4, note: 'CBI −25bp to 9.00%; Auður tracks 1:1' },
  { date: '2024-11-20', rate: 7.9, note: 'CBI −50bp to 8.50%; Auður tracks 1:1' },
  { date: '2025-02-05', rate: 7.4, note: 'CBI −50bp to 8.00%; Auður tracks 1:1' },
  { date: '2025-03-19', rate: 7.15, note: 'CBI −25bp to 7.75%; Auður tracks 1:1' },
];

/** Fallback spread (CBI − Auður) for dates before the schedule begins. */
export const PRE_SCHEDULE_SPREAD = 0.5;

export function nominalToEarPercent(nominalPercent) {
  const nominal = nominalPercent / 100;
  return (Math.pow(1 + nominal / 12, 12) - 1) * 100;
}

export function cbiRateAt(dailyRates, dateStr) {
  let rate = dailyRates[0]?.keyRate ?? 0;
  for (const entry of dailyRates) {
    if (entry.date <= dateStr) rate = entry.keyRate;
    else break;
  }
  return rate;
}

/**
 * @param {string} dateStr ISO date YYYY-MM-DD
 * @param {{ date: string, keyRate: number }[]} dailyRates CBI daily series
 * @param {number|null} liveAudurRate Current Auður nominal rate from live fetch (%)
 */
export function audurRateAt(dateStr, dailyRates, liveAudurRate = null) {
  if (!AUDUR_NOMINAL_RATES.length) {
    return liveAudurRate ?? 0;
  }

  const firstDate = AUDUR_NOMINAL_RATES[0].date;
  if (dateStr < firstDate) {
    return Math.max(0, cbiRateAt(dailyRates, dateStr) - PRE_SCHEDULE_SPREAD);
  }

  let rate = AUDUR_NOMINAL_RATES[0].rate;
  for (const entry of AUDUR_NOMINAL_RATES) {
    if (entry.date <= dateStr) rate = entry.rate;
  }

  const lastDate = AUDUR_NOMINAL_RATES[AUDUR_NOMINAL_RATES.length - 1].date;
  if (dateStr > lastDate && liveAudurRate != null) {
    return liveAudurRate;
  }

  return rate;
}

export function buildMergedRateChanges(dailyRates, liveAudurRate) {
  const cbiChangeDates = new Set();
  let previousKeyRate = null;
  for (const entry of dailyRates) {
    if (previousKeyRate === null || entry.keyRate !== previousKeyRate) {
      cbiChangeDates.add(entry.date);
      previousKeyRate = entry.keyRate;
    }
  }

  const eventDates = new Set([
    ...cbiChangeDates,
    ...AUDUR_NOMINAL_RATES.map((entry) => entry.date),
  ]);

  return [...eventDates]
    .sort()
    .map((date) => {
      const keyRate = cbiRateAt(dailyRates, date);
      const audurNominalRate = audurRateAt(date, dailyRates, liveAudurRate);
      return {
        date,
        keyRate,
        depositRate: audurNominalRate,
        audurNominalRate,
        audurEarRate: Number(nominalToEarPercent(audurNominalRate).toFixed(2)),
      };
    });
}

export function formatRateWithEar(nominalPercent, labels) {
  const ear = nominalToEarPercent(nominalPercent);
  return `${nominalPercent.toFixed(2).replace('.', ',')}% ${labels.nominal} (${ear.toFixed(2).replace('.', ',')}% ${labels.ear})`;
}
