#!/usr/bin/env node
/**
 * Fetches CBI key interest rate history and current Auður savings rates,
 * then writes public/data/rates.json for the static site.
 *
 * Run: npm run update-rates
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_PATH = join(ROOT, 'public/data/rates.json');

const CBI_URL = 'https://www.sedlabanki.is/xmltimeseries/Default.aspx';
const AUDUR_URL = 'https://audur.is/vaxtatafla';
const CBI_KEY_SERIES = 17923;
const HISTORY_FROM = '2000-01-01';

function parseCbiDate(dateRaw) {
  const match = dateRaw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;

  const [, month, day, year] = match;
  const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const parsed = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;

  return isoDate;
}

async function fetchCbiKeyRates(fromDate) {
  const url = `${CBI_URL}?DagsFra=${fromDate}&TimeSeriesID=${CBI_KEY_SERIES}&Type=csv`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CBI request failed (${response.status}): ${url}`);
  }

  const text = await response.text();
  const rows = [];

  for (const line of text.trim().split('\n')) {
    const parts = line.split(';');
    if (parts.length < 8) continue;

    const dateRaw = parts[parts.length - 2];
    const rate = parseFloat(parts[parts.length - 1]);
    if (!dateRaw || Number.isNaN(rate)) continue;

    const isoDate = parseCbiDate(dateRaw);
    if (!isoDate) continue;

    rows.push({ date: isoDate, keyRate: rate });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

function parseIcelandicRate(text) {
  if (!text) return null;
  const match = text.match(/(\d+[,.]\d+)/);
  if (!match) return null;
  return parseFloat(match[1].replace(',', '.'));
}

async function fetchAudurRates() {
  const response = await fetch(AUDUR_URL, {
    headers: { 'User-Agent': 'tryggingar-calculator/1.0 (rent deposit interest tool)' },
  });
  if (!response.ok) {
    throw new Error(`Auður request failed (${response.status})`);
  }

  const html = await response.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error('Could not find __NEXT_DATA__ on audur.is/vaxtatafla');
  }

  const payload = JSON.parse(match[1]);
  const slices = payload?.props?.pageProps?.audurContentPage?.slices ?? [];
  const table = slices.find((slice) => slice.type === 'interesttable');
  if (!table?.fields?.length) {
    throw new Error('Could not find interest table on audur.is/vaxtatafla');
  }

  const accounts = table.fields
    .filter((row) => row.bank_account_type_slug)
    .map((row) => ({
      slug: row.bank_account_type_slug,
      name: row.bank_account_type?.[0]?.text ?? '',
      rate: parseIcelandicRate(row.annual_interest_rate?.[0]?.text),
      annualEquivalent: parseIcelandicRate(row.interest_on_an_annual_basis?.[0]?.text),
      paymentFrequency: row.interest_payment_frequency?.[0]?.text ?? '',
      indexation: row.indexation?.[0]?.text ?? '',
      availability: row.availability?.[0]?.text ?? '',
    }))
    .filter((row) => row.name && row.rate !== null);

  const savings = accounts.find((row) => row.slug === 'savings');
  if (!savings) {
    throw new Error('Could not find Auður savings account rate');
  }

  return { accounts, savingsRate: savings.rate };
}

function buildRateChanges(dailyRates, depositMargin) {
  const changes = [];
  let previousKeyRate = null;

  for (const entry of dailyRates) {
    if (previousKeyRate === null || entry.keyRate !== previousKeyRate) {
      changes.push({
        date: entry.date,
        keyRate: entry.keyRate,
        depositRate: Math.max(0, entry.keyRate - depositMargin),
      });
      previousKeyRate = entry.keyRate;
    }
  }

  return changes;
}

function loadExistingRates() {
  if (!existsSync(OUT_PATH)) return null;
  try {
    return JSON.parse(readFileSync(OUT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  console.log('Fetching CBI key interest rates…');
  const dailyRates = await fetchCbiKeyRates(HISTORY_FROM);
  if (dailyRates.length === 0) {
    throw new Error('No CBI rate data returned');
  }

  console.log('Fetching Auður rate table…');
  const audur = await fetchAudurRates();

  const latest = dailyRates[dailyRates.length - 1];
  const depositMargin = Math.max(0, latest.keyRate - audur.savingsRate);

  const rateChanges = buildRateChanges(dailyRates, depositMargin);
  const fetchedAt = new Date().toISOString();

  const output = {
    fetchedAt,
    sources: {
      cbi: CBI_URL,
      cbiSeriesId: CBI_KEY_SERIES,
      audur: AUDUR_URL,
    },
    current: {
      cbiKeyRate: latest.keyRate,
      cbiKeyRateDate: latest.date,
      audurSavingsRate: audur.savingsRate,
      depositMargin: Number(depositMargin.toFixed(2)),
    },
    audurAccounts: audur.accounts,
    rateChanges,
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

  const existing = loadExistingRates();
  const previousCount = existing?.rateChanges?.length ?? 0;

  console.log(`Wrote ${OUT_PATH}`);
  console.log(`  CBI key rate: ${latest.keyRate}% (${latest.date})`);
  console.log(`  Auður savings: ${audur.savingsRate}%`);
  console.log(`  Deposit margin: ${depositMargin.toFixed(2)}%`);
  console.log(`  Rate change events: ${rateChanges.length}${previousCount ? ` (was ${previousCount})` : ''}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
