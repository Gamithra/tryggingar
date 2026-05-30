import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calculator, Calendar, Info } from 'lucide-react';
import { formatFetchedAt, loadRatesData } from '../lib/rates.js';
import SiteLayout from '../components/SiteLayout';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// I18n Provider wrapper component, probably unused
const I18nProvider = ({ locale, children }) => {
  useEffect(() => {
    // Set the document language
    document.documentElement.lang = locale;
  }, [locale]);

  return <div data-locale={locale}>{children}</div>;
};

const DepositCalculator = () => {
  const [depositAmount, setDepositAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [currentRates, setCurrentRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rateMeta, setRateMeta] = useState(null);
  const [language, setLanguage] = useState('en'); // 'en' for English, 'is' for Icelandic

  const CAPITAL_GAINS_TAX = 22; // 22% fjármagnstekjuskattur
  const LOCALE = language === 'en' ? 'en-GB' : 'is-IS'; // For DD/MM/YYYY formatting
  
  // Translation object
  const translations = {
    en: {
      title: 'Rental deposit calculator',
      subtitleIntro: 'According to the Article 40 of Icelandic Rent Act No. 36/1994, landlords must keep rental deposits in the highest available interest savings account.',
      subtitleHighlight: 'However, many landlords fail to do this, resulting in tenants losing out on interest earnings; furthermore the law does not specify how to calculate the interest owed.',
      subtitleOutro: 'This tool provides a simple way to calculate the approximate interest owed.',
      depositAmount: 'Deposit amount (ISK)',
      startDate: 'Start date',
      endDate: 'End date',
      calculateInterest: 'Calculate interest',
      enterDepositAmount: 'Enter deposit amount',
      rateCalculationMethod: 'Rate calculation method',
      rateCalculationText: 'According to Icelandic rental law, deposits must be stored in the highest interest savings account available. The calculator uses Auður\'s unbound savings rate as a proxy for the market high; historical amounts are derived from CBI key rate changes minus the current margin between CBI and Auður.',
      viewRates: 'View rate data',
      dataFetched: 'Rate data fetched',
      interestCalculation: 'Interest calculation',
      enterDepositDetails: 'Enter deposit details to calculate interest',
      netInterestEarned: 'Net interest earned',
      totalAmount: 'Total amount',
      detailedBreakdown: 'Detailed breakdown',
      originalDeposit: 'Original deposit:',
      duration: 'Duration:',
      days: 'days',
      grossInterest: 'Gross interest (variable rates):',
      capitalGainsTax: 'Fjármagnstekjuskattur',
      netInterest: 'Net interest earned:',
      effectiveAnnualRate: 'Effective annual rate (after tax):',
      interestRatePeriods: 'Interest rate periods',
      faq1Title: 'How is the deposit interest calculated?',
      faq1Text: 'According to Icelandic law, the interest is calculated based on the Central Bank of Iceland\'s key interest rate minus a margin matching Auður\'s unbound savings account, which is usually the highest rate on the market. The calculator applies the appropriate rate for each time period, accounting for any rate changes during your rental period.',
      faq2Title: 'Do I have to pay tax on the interest?',
      faq2Text: 'Yes, capital gains tax (Fjármagnstekjuskattur) of 22% is automatically applied to the interest earned on your deposit. This calculator shows both gross interest and net interest after tax. Whether the tax burden of this interest is on the tenant or the landlord is a matter of legal interpretation.',
      faq3Title: 'What if my landlord doesn\'t pay me the correct interest?',
      faq3Text: 'According to Article 40 of the Icelandic Rent Act (Húsaleigulög nr. 36/1994), landlords are legally required to keep deposits in separate accounts with the highest available interest rate. If your landlord hasn\'t paid the correct interest, you may have grounds for a claim. The landlord has four weeks from the end of the rental period to pay back the deposit. If they fail to do so, you can take legal action to recover the amount, and claim "dráttarvextir" (default interest) from the date the interest was due.',
      faq4Title: 'How often do interest rates change?',
      faq4Text: 'The Central Bank of Iceland periodically reviews and adjusts its key interest rate. These changes directly affect the interest rate that should be applied to your deposit. This calculator uses rate data fetched from the CBI and Auður; see the rate data page for when it was last updated.',
      footerText1: 'Created and hosted by Gamithra.',
      footerText2: 'This tool is for informational purposes; please consult legal advice for specific cases.'
    },
    is: {
      title: 'Reiknivél tryggingarfjár',
      subtitleIntro: 'Samkvæmt 40. gr. húsaleigulaga nr. 36/1994 skulu leigusalar varðveita tryggingarfé á sparireikningi með hæstu mögulegu vöxtum.',
      subtitleHighlight: 'Margir leigusalar gera það ekki, sem veldur því að leigjendur missa af vaxtatekjum; lögin kveða ekki á um hvernig eigi að reikna út vexti sem standa leigjanda til boða.',
      subtitleOutro: 'Þessi reiknivél býður upp á einfalda leið til að áætla vexti sem ættu að hafa verið greiddir.',
      depositAmount: 'Tryggingarfé (ISK)',
      startDate: 'Upphafsdagur',
      endDate: 'Lokadagur',
      calculateInterest: 'Reikna vexti',
      enterDepositAmount: 'Upphæð tryggingarfjár',
      rateCalculationMethod: 'Útreikningur vaxta',
      rateCalculationText: 'Samkvæmt íslenskum húsaleigulögum skal tryggingarfé geymt á reikningi með hæstu fáanlegu vöxtum. Reiknivélin notar vexti á óbundnum sparireikningi Auðar sem mælikvarða fyrir hæstu vexti á markaðnum; sögulegir vextir eru reiknaðir út frá stýrivöxtum Seðlabankans að frádregnum núverandi marginale milu milli SÍ og Auðar.',
      viewRates: 'Skoða vaxtagögn',
      dataFetched: 'Vaxtagögn sótt',
      interestCalculation: 'Vaxtareikningur',
      enterDepositDetails: 'Settu inn upplýsingar um tryggingarfé til að reikna vexti',
      netInterestEarned: 'Vaxtatekjur eftir skatt',
      totalAmount: 'Heildarupphæð',
      detailedBreakdown: 'Nánari sundurliðun',
      originalDeposit: 'Upphaflegt tryggingarfé:',
      duration: 'Tímalengd:',
      days: 'dagar',
      grossInterest: 'Heildarvextir (breytilegir):',
      capitalGainsTax: 'Fjármagnstekjuskattur',
      netInterest: 'Vaxtatekjur eftir skatt:',
      effectiveAnnualRate: 'Raunávöxtun á ári (eftir skatt):',
      interestRatePeriods: 'Þróun vaxta',
      faq1Title: 'Hvernig eru vextir af tryggingarfé reiknaðir?',
      faq1Text: 'Vextirnir eru reiknaðir út frá stýrivöxtum Seðlabanka Íslands að frádregnum marginale milu sem samsvarar óbundnum sparireikningi Auðar, sem endurspeglar yfirleitt hæstu vexti á markaðnum. Reiknivélin beitir viðeigandi vöxtum fyrir hvert tímabil og tekur tillit til vaxtabreytinga á leigutímanum.',
      faq2Title: 'Þarf ég að greiða skatt af vöxtunum?',
      faq2Text: 'Já, fjármagnstekjuskattur (22%) er sjálfkrafa dreginn frá vöxtum af tryggingarfé. Þessi reiknivél sýnir bæði heildarvexti og vaxtatekjur eftir skatt. Hvort leigjandi eða leigusali beri skattskylduna er lögfræðilegt álitaefni.',
      faq3Title: 'Hvað ef leigusali greiðir ekki rétta vexti?',
      faq3Text: 'Samkvæmt 40. gr. húsaleigulaga nr. 36/1994 ber leigusala að geyma tryggingarfé á sérstökum reikningi með hæstu mögulegu vöxtum. Ef leigusali hefur ekki greitt rétta vexti hefur leigjandinn rétt á að leggja fram kæru. Til upplýsinga hefur leigusali fjórar vikur eftir útflutningardag til að gera kröfu í tryggingarféð. Ef hann gerir það ekki, getur leigjandi leitað réttar síns og krafist dráttarvaxta frá þeim degi sem greiðslan átti að berast.',
      faq4Title: 'Hversu oft breytast vextir?',
      faq4Text: 'Seðlabanki Íslands endurskoðar og breytir stýrivöxtum reglulega. Þessar breytingar hafa bein áhrif á vexti sem eiga að gilda um tryggingarfé. Reiknivélin notar vaxtagögn frá Seðlabankanum og Auði; sjá síðu með vaxtagögnum fyrir hvenær síðast var uppfært.',
      footerText1: 'Reiknivélin er þróuð og hýst af Gamithru.',
      footerText2: 'Þetta tól er eingöngu til upplýsinga, leitaðu aðstoðar vegna sérstakra mála hjá lögfræðingi eða Leigjendasamtökunum.'
    }
    
  };

  // Update document title when language changes
  useEffect(() => {
    document.title = language === 'en' 
      ? 'Rental deposit calculator' 
      : 'Reiknivél tryggingarfjár';
  }, [language]);

  // Helper function to format dates for display (DD/MM/YYYY)
  const formatDateDisplay = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(LOCALE); // Use locale-appropriate date formatting
  };

  const fetchCurrentRates = async () => {
    setLoading(true);
    setError(null);

    try {
      const { meta, rateHistory: history, currentRates: rates } = await loadRatesData();
      setRateMeta(meta);
      setCurrentRates(rates);
      setRateHistory(history);
    } catch (err) {
      console.error('Error loading rate data:', err);
      setError(
        language === 'en'
          ? 'Failed to load rate data.'
          : 'Ekki tókst að hlaða vaxtagögnum.'
      );

      setCurrentRates({
        audur: {
          rate: 6.9,
          name: 'Fallback Rate',
          selectedAccount: { name: 'Fallback' },
        },
      });
      setRateHistory([
        { date: '2024-01-01', rates: { audur: 6.9 }, keyRate: 7.5 },
      ]);
    }

    setLoading(false);
  };

  // Get the highest rate bank at any given date
  const getHighestRateForDate = (date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    // Find the most recent rate entry for this date or before
    const applicableEntry = rateHistory
      .filter(entry => entry.date <= dateStr)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (!applicableEntry) {
      const audurRate = currentRates.audur?.rate || 6.9;
      return { rate: audurRate, bank: 'audur' };
    }

    return {
      rate: applicableEntry.rates.audur,
      bank: 'audur',
      keyRate: applicableEntry.keyRate
    };
  };

  const calculateInterestWithVariableRates = () => {
    if (!depositAmount || !startDate || !endDate || rateHistory.length === 0) return;

    const principal = parseFloat(depositAmount);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 0) return;

    let currentAmount = principal;
    let currentDate = new Date(start);
    let totalGrossInterest = 0;
    let rateBreakdown = [];

    // Create date-sorted rate history with all rate changes
    const allRateChanges = [];
    rateHistory.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= start && entryDate <= end) {
        allRateChanges.push({
          date: entryDate,
          rates: entry.rates,
          keyRate: entry.keyRate
        });
      }
    });

    // Sort by date
    allRateChanges.sort((a, b) => a.date - b.date);

    while (currentDate < end) {
      // Get the applicable rate for the current period
      const { rate: rateForPeriod, bank: bankUsed, keyRate } = getHighestRateForDate(currentDate);

      // Find the end of this rate period
      let periodEnd = new Date(end);
      for (const change of allRateChanges) {
        if (change.date > currentDate && change.date < end) {
          periodEnd = new Date(change.date);
          break;
        }
      }

      // Calculate days in this period
      const periodDays = Math.ceil((periodEnd - currentDate) / (1000 * 60 * 60 * 24));

      if (periodDays > 0) {
        // Calculate interest for this period
        const dailyRate = rateForPeriod / 100 / 365;
        const newAmount = currentAmount * Math.pow(1 + dailyRate, periodDays);
        const periodInterest = newAmount - currentAmount;

        totalGrossInterest += periodInterest;
        rateBreakdown.push({
          startDate: new Date(currentDate),
          endDate: new Date(periodEnd),
          days: periodDays,
          rate: rateForPeriod,
          bank: bankUsed,
          keyRate: keyRate,
          interest: periodInterest,
          startAmount: currentAmount,
          endAmount: newAmount
        });

        currentAmount = newAmount;
      }

      currentDate = new Date(periodEnd);
    }

    // Apply capital gains tax
    const tax = totalGrossInterest * (CAPITAL_GAINS_TAX / 100);
    const netInterest = totalGrossInterest - tax;
    const totalAmount = principal + netInterest;

    setResults({
      principal,
      daysDiff,
      grossInterest: totalGrossInterest,
      tax,
      netInterest,
      totalAmount,
      effectiveRate: ((netInterest / principal) * (365 / daysDiff) * 100),
      rateBreakdown
    });
  };

  // Load rate data on component mount
  useEffect(() => {
    fetchCurrentRates();
  }, []);

  useEffect(() => {
    calculateInterestWithVariableRates();
  }, [depositAmount, startDate, endDate, rateHistory]);

  const getCurrentHighestRate = () => {
    if (Object.keys(currentRates).length === 0) return { rate: 0, bank: 'Unknown' };

    return Object.entries(currentRates).reduce((highest, [bankKey, bankData]) =>
      bankData.rate > highest.rate ? { rate: bankData.rate, bank: bankData.name } : highest,
      { rate: 0, bank: 'Unknown' }
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <I18nProvider locale={language === 'en' ? 'en-GB' : 'is-IS'}>
      <SiteLayout
        language={language}
        setLanguage={setLanguage}
        title={translations[language].title}
        subtitle={
          <>
            {translations[language].subtitleIntro}{' '}
            <span className="brutal-marker">{translations[language].subtitleHighlight}</span>{' '}
            {translations[language].subtitleOutro}
          </>
        }
        activeNav="calculator"
        meta={
          <>
            {rateMeta?.fetchedAt && (
              <p className="text-sm text-[var(--color-text-muted)] brutal-mono">
                {translations[language].dataFetched}: {formatFetchedAt(rateMeta.fetchedAt, LOCALE)}
                {' · '}
                <Link href="/rates/" className="brutal-link">
                  {translations[language].viewRates}
                </Link>
              </p>
            )}
            {error && (
              <div
                className="mt-3 inline-flex items-center gap-2 px-3 py-2 border-2 border-[var(--color-border)] bg-[var(--color-warning)] text-[var(--color-text)] text-sm font-bold"
                role="alert"
              >
                <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}
          </>
        }
      >
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          <section className="brutal-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-[3px] border-[var(--color-border)]">
              <Calculator className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
              <h2 className="text-2xl font-black uppercase tracking-tight">
                {translations[language].calculateInterest}
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="deposit-amount" className="brutal-label">
                  {translations[language].depositAmount}
                </label>
                <div className="relative">
                  <input
                    id="deposit-amount"
                    type="text"
                    inputMode="numeric"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder={translations[language].enterDepositAmount}
                    className="brutal-input pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 brutal-mono text-sm font-bold">kr</span>
                </div>
              </div>

              <div>
                <label htmlFor="start-date" className="brutal-label">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                  {translations[language].startDate}
                </label>
                <DatePicker
                  id="start-date"
                  selected={startDate ? new Date(startDate) : null}
                  onChange={(date) => {
                    if (date) {
                      setStartDate(date.toISOString().split('T')[0]);
                    } else {
                      setStartDate('');
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="DD/MM/YYYY"
                  className="brutal-input"
                />
              </div>

              <div>
                <label htmlFor="end-date" className="brutal-label">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                  {translations[language].endDate}
                </label>
                <DatePicker
                  id="end-date"
                  selected={endDate ? new Date(endDate) : null}
                  onChange={(date) => {
                    if (date) {
                      setEndDate(date.toISOString().split('T')[0]);
                    } else {
                      setEndDate('');
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="DD/MM/YYYY"
                  className="brutal-input"
                />
              </div>
            </div>

            <aside className="mt-8 p-4 brutal-card-inset">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden="true" />
                <div className="text-sm leading-relaxed">
                  <p className="font-black uppercase text-xs tracking-wider mb-2">
                    {translations[language].rateCalculationMethod}
                  </p>
                  <p className="text-[var(--color-text-muted)]">{translations[language].rateCalculationText}</p>
                  {rateMeta?.current && (
                    <p className="mt-3 brutal-mono text-xs font-semibold border-t-2 border-[var(--color-border)] pt-3">
                      {language === 'en' ? 'Now' : 'Núna'}: CBI {rateMeta.current.cbiKeyRate}% − Auður{' '}
                      {rateMeta.current.audurSavingsRate}% = {rateMeta.current.depositMargin}%{' '}
                      {language === 'en' ? 'margin' : 'marginale mila'}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </section>

          <section className="brutal-card p-6 md:p-8">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6 pb-4 border-b-[3px] border-[var(--color-border)]">
              {translations[language].interestCalculation}
            </h2>

            {results ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="brutal-stat" style={{ background: 'var(--color-success)', color: '#fff' }}>
                    <p className="brutal-stat-label" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {translations[language].netInterestEarned}
                    </p>
                    <p className="brutal-stat-value">{formatCurrency(results.netInterest)}</p>
                  </div>
                  <div className="brutal-stat" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                    <p className="brutal-stat-label" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {translations[language].totalAmount}
                    </p>
                    <p className="brutal-stat-value">{formatCurrency(results.totalAmount)}</p>
                  </div>
                </div>

                <div className="brutal-card-inset overflow-hidden">
                  <div className="px-4 py-3 border-b-[3px] border-[var(--color-border)] bg-[var(--color-border)] text-white">
                    <h3 className="font-black uppercase text-sm tracking-wider">
                      {translations[language].detailedBreakdown}
                    </h3>
                  </div>
                  <dl className="p-4 space-y-3 text-sm">
                    {[
                      [translations[language].originalDeposit, formatCurrency(results.principal)],
                      [translations[language].duration, `${results.daysDiff} ${translations[language].days}`],
                      [translations[language].grossInterest, formatCurrency(results.grossInterest)],
                      [
                        `${translations[language].capitalGainsTax} (${CAPITAL_GAINS_TAX}%)`,
                        `−${formatCurrency(results.tax)}`,
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 border-b border-[var(--color-border)]/20 pb-2">
                        <dt className="text-[var(--color-text-muted)]">{label}</dt>
                        <dd className="brutal-mono font-bold text-right">{value}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-4 pt-2 text-base font-black">
                      <dt>{translations[language].netInterest}</dt>
                      <dd className="brutal-mono text-[var(--color-success)]">{formatCurrency(results.netInterest)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 text-xs">
                      <dt className="text-[var(--color-text-muted)]">{translations[language].effectiveAnnualRate}</dt>
                      <dd className="brutal-mono font-bold">{results.effectiveRate.toFixed(2)}%</dd>
                    </div>
                  </dl>
                </div>

                {results.rateBreakdown && results.rateBreakdown.length > 1 && (
                  <div className="brutal-card-inset overflow-hidden">
                    <div className="px-4 py-3 border-b-[3px] border-[var(--color-border)] bg-[var(--color-secondary)]">
                      <h3 className="font-black uppercase text-sm tracking-wider">
                        {translations[language].interestRatePeriods}
                      </h3>
                    </div>
                    <ul className="divide-y-2 divide-[var(--color-border)]">
                      {results.rateBreakdown.map((period, index) => (
                        <li key={index} className="p-4 hover:bg-[var(--color-bg)] transition-colors">
                          <div className="flex flex-wrap justify-between gap-2 mb-2">
                            <span className="font-bold text-sm">
                              {formatDateDisplay(period.startDate)} — {formatDateDisplay(period.endDate)}
                            </span>
                            <span className="brutal-mono font-bold text-[var(--color-primary)]">{period.rate}%</span>
                          </div>
                          <div className="flex flex-wrap justify-between gap-2 text-xs text-[var(--color-text-muted)] brutal-mono">
                            <span>
                              {period.days} {translations[language].days}
                              {period.keyRate && ` · CBI ${period.keyRate}%`}
                            </span>
                            <span className="font-bold text-[var(--color-text)]">
                              +{formatCurrency(period.interest)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 px-4 border-[3px] border-dashed border-[var(--color-border)]">
                <Calculator className="w-14 h-14 mx-auto mb-4 opacity-30" strokeWidth={1.5} aria-hidden="true" />
                <p className="font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {translations[language].enterDepositDetails}
                </p>
              </div>
            )}
          </section>
        </div>

        <section className="mt-10 md:mt-12 brutal-card p-6 md:p-8">
          <h2 className="text-xl font-black uppercase tracking-tight mb-6">FAQ</h2>
          <div className="space-y-0 divide-y-[3px] divide-[var(--color-border)]">
            {[1, 2, 3, 4].map((n) => (
              <details key={n} className="group py-4 first:pt-0 last:pb-0">
                <summary className="font-black text-lg cursor-pointer list-none flex justify-between items-center gap-4 [&::-webkit-details-marker]:hidden">
                  {translations[language][`faq${n}Title`]}
                  <span className="brutal-mono text-sm font-bold group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
                  {translations[language][`faq${n}Text`]}
                </p>
              </details>
            ))}
          </div>
        </section>
      </SiteLayout>
    </I18nProvider>
  );
};

export default DepositCalculator;