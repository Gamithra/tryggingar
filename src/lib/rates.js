import { nominalToEarPercent } from './audurRates';

export function formatFetchedAt(isoString, locale = 'is-IS') {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function buildRateState(data) {
  if (!data?.rateChanges?.length) {
    throw new Error('Invalid rates data');
  }

  const { current, rateChanges } = data;
  const latest = rateChanges[rateChanges.length - 1];

  const history = rateChanges.map((row) => ({
    date: row.date,
    keyRate: row.keyRate,
    rates: {
      audur: row.depositRate,
      audurEar: row.audurEarRate ?? nominalToEarPercent(row.depositRate),
    },
  }));

  return {
    meta: data,
    rateHistory: history,
    currentRates: {
      audur: {
        rate: latest.depositRate,
        earRate: latest.audurEarRate ?? nominalToEarPercent(latest.depositRate),
        name: 'Auður (highest market savings proxy)',
        lastUpdated: latest.date,
        selectedAccount: {
          name: 'Sparnaðarreikningur (Auður)',
          description: `Auður nominal rate (${current.audurSavingsRate}% / ${current.audurEarRate ?? nominalToEarPercent(current.audurSavingsRate).toFixed(2)}% EAR)`,
        },
        keyRate: current.cbiKeyRate,
        audurRate: current.audurSavingsRate,
        depositMargin: current.depositMargin,
      },
    },
  };
}

export async function loadRatesData() {
  const response = await fetch('/data/rates.json');
  if (!response.ok) {
    throw new Error(`Failed to load rates (${response.status})`);
  }
  const data = await response.json();
  return buildRateState(data);
}
