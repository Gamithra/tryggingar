import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe, ArrowLeft, ExternalLink } from 'lucide-react';
import { formatFetchedAt } from '../lib/rates';

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
    <div className="min-h-screen bg-stone-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Link>
          <button
            onClick={() => setLanguage(language === 'en' ? 'is' : 'en')}
            className="flex items-center space-x-2 bg-white border border-gray-300 hover:bg-blue-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="text-gray-800">{language === 'en' ? 'Íslenska' : 'English'}</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-lg text-gray-600">{t.subtitle}</p>
          {data?.fetchedAt && (
            <p className="mt-3 text-sm text-gray-500">
              {t.lastUpdated}: {formatFetchedAt(data.fetchedAt, locale)}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-8">
            <section className="bg-white rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.currentRates}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  [t.cbiKeyRate, formatRate(data.current.cbiKeyRate)],
                  [t.audurSavings, formatRate(data.current.audurSavingsRate)],
                  [t.depositMargin, formatRate(data.current.depositMargin)],
                  [t.depositRateUsed, formatRate(data.current.cbiKeyRate - data.current.depositMargin)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-600">{t.marginNote}</p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 overflow-hidden">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.audurTable}</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-600">
                      <th className="py-2 pr-4">{t.account}</th>
                      <th className="py-2 pr-4">{t.rate}</th>
                      <th className="py-2 pr-4">{t.annualEquivalent}</th>
                      <th className="py-2 pr-4">{t.payment}</th>
                      <th className="py-2 pr-4">{t.indexation}</th>
                      <th className="py-2">{t.availability}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.audurAccounts.map((account) => (
                      <tr key={`${account.slug}-${account.name}-${account.availability}`} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium text-gray-900">{account.name}</td>
                        <td className="py-3 pr-4">{formatRate(account.rate)}</td>
                        <td className="py-3 pr-4">{formatRate(account.annualEquivalent)}</td>
                        <td className="py-3 pr-4 text-gray-700">{account.paymentFrequency}</td>
                        <td className="py-3 pr-4 text-gray-700">{account.indexation}</td>
                        <td className="py-3 text-gray-700">{account.availability}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 overflow-hidden">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.cbiHistory}</h2>
              <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b text-left text-gray-600">
                      <th className="py-2 pr-4">{t.date}</th>
                      <th className="py-2 pr-4">{t.keyRate}</th>
                      <th className="py-2">{t.depositRate}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row) => (
                      <tr key={row.date} className="border-b last:border-0">
                        <td className="py-2 pr-4 text-gray-900">{formatDate(row.date, locale)}</td>
                        <td className="py-2 pr-4">{formatRate(row.keyRate)}</td>
                        <td className="py-2">{formatRate(row.depositRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t.sources}</h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={data.sources.cbi}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    Seðlabanki Íslands — stýrivextir (API)
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
                <li>
                  <a
                    href={data.sources.audur}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    Auður — vaxtatafla
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </li>
              </ul>
            </section>
          </div>
        )}

        <p className="text-center mt-12 text-sm text-gray-600">{t.footer}</p>
      </div>
    </div>
  );
}
