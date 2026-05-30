import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { formatFetchedAt } from '../lib/rates';
import SiteLayout from '../components/SiteLayout';

const translations = {
  en: {
    title: 'Interest rate data',
    subtitle: 'Sources and history used by the rental deposit calculator.',
    back: 'Back to calculator',
    lastUpdated: 'Data last fetched',
    currentRates: 'Current rates',
    cbiKeyRate: 'CBI key interest rate',
    audurSavings: 'Auður savings account (unbound)',
    depositMargin: 'Applied margin (CBI − Auður)',
    depositRateUsed: 'Deposit rate used in calculator',
    audurTable: 'Auður rate table',
    account: 'Account',
    rate: 'Rate',
    annualEquivalent: 'Annual equivalent',
    payment: 'Interest paid',
    indexation: 'Indexation',
    availability: 'Availability',
    cbiHistory: 'CBI key rate changes since 2000',
    date: 'Date',
    keyRate: 'Key rate',
    depositRate: 'Deposit rate',
    sources: 'Sources',
    marginNote: 'Historical calculations apply today\'s margin between the CBI key rate and Auður\'s unbound savings rate to all past periods. This tracks market moves reasonably well but is an approximation.',
    loadError: 'Could not load rate data.',
    footer: 'This tool is for informational purposes; please consult legal advice for specific cases.',
  },
  is: {
    title: 'Vaxtagögn',
    subtitle: 'Heimildir og saga sem reiknivélin notar.',
    back: 'Til baka í reiknivél',
    lastUpdated: 'Gögn sótt',
    currentRates: 'Núverandi vextir',
    cbiKeyRate: 'Stýrivextir Seðlabanka',
    audurSavings: 'Sparnaðarreikningur Auðar (óbundinn)',
    depositMargin: 'Notaður marginalemur (SÍ − Auður)',
    depositRateUsed: 'Vaxtastig í reiknivél',
    audurTable: 'Vaxtatafla Auðar',
    account: 'Reikningur',
    rate: 'Vextir',
    annualEquivalent: 'Vextir á ársgrundvelli',
    payment: 'Vaxtagreiðsla',
    indexation: 'Verðtrygging',
    availability: 'Hvenær laus',
    cbiHistory: 'Breytingar á stýrivöxtum frá 2000',
    date: 'Dagsetning',
    keyRate: 'Stýrivextir',
    depositRate: 'Innlánsvextir',
    sources: 'Heimildir',
    marginNote: 'Sögulegir útreikningar nota núverandi marginale milu milli stýrivaxta Seðlabankans og óbundins sparireiknings Auðar fyrir öll fyrri tímabil. Þetta fylgir markaðsbreytingum nokkuð vel en er áætlun.',
    loadError: 'Ekki tókst að hlaða vaxtagögnum.',
    footer: 'Þetta tól er eingöngu til upplýsinga, leitaðu aðstoðar vegna sérstakra mála hjá lögfræðingi eða Leigjendasamtökunum.',
  },
};

function formatRate(value) {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(2).replace('.', ',')}%`;
}

function formatDate(dateStr, locale) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(locale);
}

export default function RatesPage() {
  const [language, setLanguage] = useState('is');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const t = translations[language];
  const locale = language === 'en' ? 'en-GB' : 'is-IS';

  useEffect(() => {
    document.title = language === 'en' ? 'Interest rate data' : 'Vaxtagögn';
  }, [language]);

  useEffect(() => {
    fetch('/data/rates.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setData)
      .catch(() => setError(t.loadError));
  }, [t.loadError]);

  const history = data?.rateChanges ? [...data.rateChanges].reverse() : [];

  return (
    <SiteLayout
      language={language}
      setLanguage={setLanguage}
      title={t.title}
      subtitle={t.subtitle}
      activeNav="rates"
      meta={
        data?.fetchedAt ? (
          <p className="text-sm text-[var(--color-text-muted)] brutal-mono">
            {t.lastUpdated}: {formatFetchedAt(data.fetchedAt, locale)}
          </p>
        ) : null
      }
    >
      {error && (
        <div
          className="mb-6 px-4 py-3 border-[3px] border-[var(--color-border)] bg-[var(--color-warning)] font-bold"
          role="alert"
        >
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6 md:space-y-8">
          <section className="brutal-card p-6 md:p-8">
            <h2 className="text-xl font-black uppercase tracking-tight mb-5 pb-3 border-b-[3px] border-[var(--color-border)]">
              {t.currentRates}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                [t.cbiKeyRate, formatRate(data.current.cbiKeyRate), 'var(--color-bg-alt)'],
                [t.audurSavings, formatRate(data.current.audurSavingsRate), 'var(--color-secondary)'],
                [t.depositMargin, formatRate(data.current.depositMargin), 'var(--color-bg-alt)'],
                [
                  t.depositRateUsed,
                  formatRate(data.current.cbiKeyRate - data.current.depositMargin),
                  'var(--color-primary)',
                ],
              ].map(([label, value, bg]) => (
                <div key={label} className="brutal-stat" style={{ background: bg }}>
                  <p className="brutal-stat-label">{label}</p>
                  <p className="brutal-stat-value">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-[var(--color-text-muted)] leading-relaxed border-l-[4px] border-[var(--color-border)] pl-4">
              {t.marginNote}
            </p>
          </section>

          <section className="brutal-card p-6 md:p-8 overflow-hidden">
            <h2 className="text-xl font-black uppercase tracking-tight mb-5 pb-3 border-b-[3px] border-[var(--color-border)]">
              {t.audurTable}
            </h2>
            <div className="overflow-x-auto">
              <table className="brutal-table">
                <thead>
                  <tr>
                    <th>{t.account}</th>
                    <th>{t.rate}</th>
                    <th>{t.annualEquivalent}</th>
                    <th>{t.payment}</th>
                    <th>{t.indexation}</th>
                    <th>{t.availability}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.audurAccounts.map((account) => (
                    <tr key={`${account.slug}-${account.name}-${account.availability}`}>
                      <td className="font-bold">{account.name}</td>
                      <td className="brutal-mono font-bold">{formatRate(account.rate)}</td>
                      <td className="brutal-mono">{formatRate(account.annualEquivalent)}</td>
                      <td>{account.paymentFrequency}</td>
                      <td>{account.indexation}</td>
                      <td>{account.availability}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="brutal-card p-6 md:p-8 overflow-hidden">
            <h2 className="text-xl font-black uppercase tracking-tight mb-5 pb-3 border-b-[3px] border-[var(--color-border)]">
              {t.cbiHistory}
            </h2>
            <div className="overflow-x-auto max-h-[28rem] overflow-y-auto border-[3px] border-[var(--color-border)]">
              <table className="brutal-table">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th>{t.date}</th>
                    <th>{t.keyRate}</th>
                    <th>{t.depositRate}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.date}>
                      <td>{formatDate(row.date, locale)}</td>
                      <td className="brutal-mono font-bold">{formatRate(row.keyRate)}</td>
                      <td className="brutal-mono">{formatRate(row.depositRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="brutal-card p-6 md:p-8">
            <h2 className="text-xl font-black uppercase tracking-tight mb-4">{t.sources}</h2>
            <ul className="space-y-3">
              <li>
                <a
                  href={data.sources.cbi}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brutal-link inline-flex items-center gap-2 font-bold uppercase text-sm tracking-wide"
                >
                  Seðlabanki Íslands — stýrivextir (API)
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href={data.sources.audur}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brutal-link inline-flex items-center gap-2 font-bold uppercase text-sm tracking-wide"
                >
                  Auður — vaxtatafla
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </section>
        </div>
      )}
    </SiteLayout>
  );
}
