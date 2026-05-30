import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { nominalToEarPercent } from '../lib/audurRates';
import { formatFetchedAt } from '../lib/rates';
import { getTranslations } from '../lib/translations';
import { localeForLanguage, useLanguage } from '../lib/useLanguage';
import SiteLayout from '../components/SiteLayout';

function formatRate(value) {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(2).replace('.', ',')}%`;
}

function formatDate(dateStr, locale) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(locale);
}

export default function RatesPage() {
  const [language, setLanguage] = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const { common, rates: t } = getTranslations(language);
  const locale = localeForLanguage(language);

  useEffect(() => {
    document.title = t.documentTitle;
  }, [language, t.documentTitle]);

  useEffect(() => {
    fetch('/data/rates.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setData)
      .catch(() => setError(common.loadRateDataError));
  }, [common.loadRateDataError]);

  const history = data?.rateChanges ? [...data.rateChanges].reverse() : [];
  const audurSchedule = data?.audurNominalRates ? [...data.audurNominalRates].reverse() : [];

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
                [t.audurEarRate, formatRate(data.current.audurEarRate ?? nominalToEarPercent(data.current.audurSavingsRate)), 'var(--color-bg-alt)'],
                [
                  t.depositRateUsed,
                  formatRate(data.current.depositRate ?? data.current.audurSavingsRate),
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

          {audurSchedule.length > 0 && (
            <section className="brutal-card p-6 md:p-8 overflow-hidden">
              <h2 className="text-xl font-black uppercase tracking-tight mb-5 pb-3 border-b-[3px] border-[var(--color-border)]">
                {t.audurSchedule}
              </h2>
              <div className="overflow-x-auto">
                <table className="brutal-table">
                  <thead>
                    <tr>
                      <th>{t.date}</th>
                      <th>{t.rate}</th>
                      <th>{t.annualEquivalent}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audurSchedule.map((row) => (
                      <tr key={row.date}>
                        <td>{formatDate(row.date, locale)}</td>
                        <td className="brutal-mono font-bold">{formatRate(row.rate)}</td>
                        <td className="brutal-mono">{formatRate(nominalToEarPercent(row.rate))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

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
                    <th>{t.depositRateEar}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.date}>
                      <td>{formatDate(row.date, locale)}</td>
                      <td className="brutal-mono font-bold">{formatRate(row.keyRate)}</td>
                      <td className="brutal-mono">{formatRate(row.depositRate)}</td>
                      <td className="brutal-mono text-[var(--color-text-muted)]">
                        {formatRate(row.audurEarRate ?? nominalToEarPercent(row.depositRate))}
                      </td>
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
                  {t.sourceCbi}
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
                  {t.sourceAudur}
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
