import React, { useState, useEffect } from 'react';
import { Calculator, Calendar, TrendingUp, Info, RefreshCw, Globe } from 'lucide-react';
import { CENTRAL_BANK_CSV } from '../centralBankRates.js';

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
  const [language, setLanguage] = useState('en'); // 'en' for English, 'is' for Icelandic

  const CAPITAL_GAINS_TAX = 22; // 22% fjármagnstekjuskattur
  const DEPOSIT_RATE_MARGIN = 0.60; // Deposit rate = Key rate - 0.60%
  const LOCALE = language === 'en' ? 'en-GB' : 'is-IS'; // For DD/MM/YYYY formatting
  
  // Translation object
  const translations = {
    en: {
      title: 'Rental deposit calculator',
      subtitle: 'According to the Article 40 of Icelandic Rent Act No. 36/1994, landlords must keep rental deposits in the highest available interest savings account. However, many landlords fail to do this, resulting in tenants losing out on interest earnings; furthermore the law does not specify how to calculate the interest owed. This tool provides a simple way to calculate the approximate interest owed.',
      depositAmount: 'Deposit amount (ISK)',
      startDate: 'Start date',
      endDate: 'End date',
      calculateInterest: 'Calculate interest',
      enterDepositAmount: 'Enter deposit amount',
      rateCalculationMethod: 'Rate calculation method',
      rateCalculationText: 'According to Icelandic rental law, deposits must be stored in the highest interest savings account available. This calculator assumes the highest available rate is the Central Bank\'s key interest rate minus 0.60%, which reflects the interest offered on Auður bank\'s savings account, generally the highest one on the market.',
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
      faq1Text: 'According to Icelandic law, the interest is calculated based on the Central Bank of Iceland\'s key interest rate minus a margin (0.60%), which is usually the rate of the best interest on the market. The calculator applies the appropriate rate for each time period, accounting for any rate changes during your rental period.',
      faq2Title: 'Do I have to pay tax on the interest?',
      faq2Text: 'Yes, capital gains tax (Fjármagnstekjuskattur) of 22% is automatically applied to the interest earned on your deposit. This calculator shows both gross interest and net interest after tax. Whether the tax burden of this interest is on the tenant or the landlord is a matter of legal interpretation.',
      faq3Title: 'What if my landlord doesn\'t pay me the correct interest?',
      faq3Text: 'According to Article 40 of the Icelandic Rent Act (Húsaleigulög nr. 36/1994), landlords are legally required to keep deposits in separate accounts with the highest available interest rate. If your landlord hasn\'t paid the correct interest, you may have grounds for a claim. The landlord has four weeks from the end of the rental period to pay back the deposit. If they fail to do so, you can take legal action to recover the amount, and claim "dráttarvextir" (default interest) from the date the interest was due.',
      faq4Title: 'How often do interest rates change?',
      faq4Text: 'The Central Bank of Iceland periodically reviews and adjusts its key interest rate. These changes directly affect the interest rate that should be applied to your deposit. This calculator automatically accounts for all rate changes during your rental period. The tool does not provide real-time updates, so it is advisable to check the Central Bank\'s website for the latest rates.',
      footerText1: 'Created and hosted by Gamithra.',
      footerText2: 'This tool is for informational purposes; please consult legal advice for specific cases.'
    },
    is: {
      title: 'Reiknivél tryggingarfjár',
      subtitle: 'Samkvæmt 40. gr. húsaleigulaga nr. 36/1994 skulu leigusalar varðveita tryggingarfé á sparireikningi með hæstu mögulegu vöxtum. Margir leigusalar gera það ekki, sem veldur því að leigjendur missa af vaxtatekjum; lögin kveða ekki á um hvernig eigi að reikna út vexti sem standa leigjanda til boða. Þessi reiknivél býður upp á einfalda leið til að áætla vexti sem ættu að hafa verið greiddir.',
      depositAmount: 'Tryggingarfé (ISK)',
      startDate: 'Upphafsdagur',
      endDate: 'Lokadagur',
      calculateInterest: 'Reikna vexti',
      enterDepositAmount: 'Upphæð tryggingarfjár',
      rateCalculationMethod: 'Útreikningur vaxta',
      rateCalculationText: 'Samkvæmt íslenskum húsaleigulögum skal tryggingarfé geymt á reikningi með hæstu fáanlegu vöxtum. Þessi reiknivél byggir á þeirri forsendu að hæstu vextirnir séu stýrivextir Seðlabanka Íslands að frádregnum 0,60%, sem samsvarar yfirleitt vöxtum á hæstu reikningum á markaðnum, eins og á óbundnum vaxtarreikningi hjá Auði.',
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
      faq1Text: 'Vextirnir eru reiknaðir út frá stýrivöxtum Seðlabanka Íslands að frádregnum 0,60%, sem endurspeglar yfirleitt hæstu vexti á sparnaðarreikningum á markaðnum. Reiknivélin beitir viðeigandi vöxtum fyrir hvert tímabil og tekur tillit til vaxtabreytinga á leigutímanum.',
      faq2Title: 'Þarf ég að greiða skatt af vöxtunum?',
      faq2Text: 'Já, fjármagnstekjuskattur (22%) er sjálfkrafa dreginn frá vöxtum af tryggingarfé. Þessi reiknivél sýnir bæði heildarvexti og vaxtatekjur eftir skatt. Hvort leigjandi eða leigusali beri skattskylduna er lögfræðilegt álitaefni.',
      faq3Title: 'Hvað ef leigusali greiðir ekki rétta vexti?',
      faq3Text: 'Samkvæmt 40. gr. húsaleigulaga nr. 36/1994 ber leigusala að geyma tryggingarfé á sérstökum reikningi með hæstu mögulegu vöxtum. Ef leigusali hefur ekki greitt rétta vexti hefur leigjandinn rétt á að leggja fram kæru. Til upplýsinga hefur leigusali fjórar vikur eftir útflutningardag til að gera kröfu í tryggingarféð. Ef hann gerir það ekki, getur leigjandi leitað réttar síns og krafist dráttarvaxta frá þeim degi sem greiðslan átti að berast.',
      faq4Title: 'Hversu oft breytast vextir?',
      faq4Text: 'Seðlabanki Íslands endurskoðar og breytir stýrivöxtum reglulega. Þessar breytingar hafa bein áhrif á vexti sem eiga að gilda um tryggingarfé. Reiknivélin tekur sjálfkrafa mið af öllum vaxtabreytingum á leigutímanum. Tólið veitir ekki rauntímaupplýsingar, svo það er ráðlagt að skoða heimasíðu Seðlabankans fyrir nýjustu vexti.',
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

  // Fetch and process Central Bank rates
  const fetchCurrentRates = async () => {
    setLoading(true);
    setError(null);

    try {
      const lines = CENTRAL_BANK_CSV.trim().split('\n');
      const allRateData = [];

      for (let i = 1; i < lines.length; i++) {
        const [dateStr, overnightRate, currentAccountRate, keyInterestRate] = lines[i].split(',');

        if (dateStr && keyInterestRate) {
          // Convert DD.MM.YYYY to YYYY-MM-DD
          const [day, month, year] = dateStr.split('.');
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

          // Highest deposit rate = Key interest rate - 0.60%
          const keyRate = parseFloat(keyInterestRate);
          const depositRate = Math.max(0, keyRate - DEPOSIT_RATE_MARGIN);

          allRateData.push({
            date: isoDate,
            keyRate: keyRate,
            depositRate: depositRate
          });
        }
      }

      // Sort by date to ensure chronological order
      allRateData.sort((a, b) => new Date(a.date) - new Date(b.date));

      if (allRateData.length === 0) {
        throw new Error('No rate data available');
      }

      // Get the most recent rate
      const latestRate = allRateData[allRateData.length - 1];

      setCurrentRates({
        arion: {
          rate: latestRate.depositRate,
          name: 'Highest Available (CBI Key Rate - 0.60%)',
          lastUpdated: latestRate.date,
          selectedAccount: {
            name: 'Vöxtur óbundinn - 1. þrep (calculated from CBI rate)',
            description: `Based on Central Bank key rate (${latestRate.keyRate}%) minus 0.60%`
          },
          calculatedFromCBI: true,
          keyRate: latestRate.keyRate
        }
      });

      const history = [];
      let previousKeyRate = null;

      for (const entry of allRateData) {
        if (previousKeyRate === null || entry.keyRate !== previousKeyRate) {
          history.push({
            date: entry.date,
            rates: { arion: entry.depositRate },
            keyRate: entry.keyRate
          });

          console.log(`Rate change: ${entry.date} - Key: ${entry.keyRate}% - Deposit: ${entry.depositRate}%`);
          previousKeyRate = entry.keyRate;
        }
      }

      setRateHistory(history);
      console.log(`Loaded ${history.length} rate changes from Central Bank data`);

    } catch (err) {
      console.error('Error parsing Central Bank data:', err);
      setError('Failed to parse Central Bank rate data. Using fallback rates.');

      // Fallback rates (not used anymore, but kept for reference)
      setCurrentRates({
        arion: {
          rate: 6.9,
          name: 'Fallback Rate',
          selectedAccount: { name: 'Fallback - Vöxtur óbundinn' }
        }
      });
      setRateHistory([
        { date: '2024-01-01', rates: { arion: 6.9 } },
        { date: '2025-01-01', rates: { arion: 6.9 } }
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
      // Fallback to current rates
      const arionRate = currentRates.arion?.rate || 6.9;
      return { rate: arionRate, bank: 'arion' };
    }

    return {
      rate: applicableEntry.rates.arion,
      bank: 'arion',
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
      <div className="min-h-screen bg-stone-100 p-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'is' : 'en')}
              className="flex items-center space-x-2 bg-white border border-gray-300 hover:bg-blue-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              <Globe className="w-4 h-4 text-blue-600" />
              <span className="text-gray-800">{language === 'en' ? 'Íslenska' : 'English'}</span>
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {translations[language].title}
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              {translations[language].subtitle}
            </p>
            <div className="flex flex-col items-center gap-4">
            </div>

            {error && (
              <div className="mt-2 inline-flex items-center bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm">
                <Info className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input form */}
            <div className="bg-white rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <Calculator className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">{translations[language].calculateInterest}</h2>
              </div>

              <div className="space-y-6">
                {/* Deposit amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translations[language].depositAmount}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={translations[language].enterDepositAmount}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-900"
                    />
                    <span className="absolute right-3 top-3 text-gray-700">kr</span>
                  </div>
                </div>

                {/* Start date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {translations[language].startDate}
                  </label>
                  <DatePicker
                    selected={startDate ? new Date(startDate) : null}
                    onChange={(date) => {
                      if (date) {
                        const isoDate = date.toISOString().split('T')[0];
                        setStartDate(isoDate);
                      } else {
                        setStartDate('');
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/YYYY"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>               
                
                {/* End date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {translations[language].endDate}
                  </label>
                  <DatePicker
                    selected={endDate ? new Date(endDate) : null}
                    onChange={(date) => {
                      if (date) {
                        const isoDate = date.toISOString().split('T')[0];
                        setEndDate(isoDate);
                      } else {
                        setEndDate('');
                      }
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="DD/MM/YYYY"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>    

              </div>

              {/* Legal info */}
              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">{translations[language].rateCalculationMethod}</p>
                    <p>{translations[language].rateCalculationText}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">{translations[language].interestCalculation}</h2>

              {results ? (
                <div className="space-y-6">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-800">{translations[language].netInterestEarned}</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatCurrency(results.netInterest)}
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-800">{translations[language].totalAmount}</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatCurrency(results.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Detailed breakdown */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="font-medium text-gray-900">{translations[language].detailedBreakdown}</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-800">{translations[language].originalDeposit}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(results.principal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800">{translations[language].duration}</span>
                        <span className="font-medium text-gray-900">{results.daysDiff} {translations[language].days}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800">{translations[language].grossInterest}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(results.grossInterest)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>{translations[language].capitalGainsTax} ({CAPITAL_GAINS_TAX}%):</span>
                        <span className="font-medium text-gray-900">-{formatCurrency(results.tax)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                        <span className="text-gray-900">{translations[language].netInterest}</span>
                        <span className="text-green-700 font-bold">{formatCurrency(results.netInterest)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-800">
                        <span>{translations[language].effectiveAnnualRate}</span>
                        <span className="text-gray-900">{results.effectiveRate.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Rate breakdown */}
                  {results.rateBreakdown && results.rateBreakdown.length > 1 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <h3 className="font-medium text-gray-900">{translations[language].interestRatePeriods}</h3>
                      </div>
                      <div className="p-4 space-y-3">
                        {results.rateBreakdown.map((period, index) => (
                          <div key={index} className="bg-gray-100 p-3 rounded">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm text-gray-900">
                                {formatDateDisplay(period.startDate)} - {formatDateDisplay(period.endDate)}
                              </span>
                              <div className="text-right">
                                <span className="text-sm font-medium text-blue-600">{period.rate}%</span>
                                {period.keyRate && (
                                  <div className="text-xs text-gray-700">CBI: {period.keyRate}%</div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-800 space-y-1">
                              <div className="flex justify-between">
                                <span>{period.days} days</span>
                                <span>Interest: {formatCurrency(period.interest)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{translations[language].enterDepositDetails}</p>
                </div>
              )}
            </div>
          </div>

          {/* FAQ section */}
          <div className="mt-12 bg-stone-100 rounded-2xl p-8">
            
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-medium text-lg text-gray-900 mb-2">{translations[language].faq1Title}</h3>
                <p className="text-gray-700">{translations[language].faq1Text}</p>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="font-medium text-lg text-gray-900 mb-2">{translations[language].faq2Title}</h3>
                <p className="text-gray-700">{translations[language].faq2Text}</p>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="font-medium text-lg text-gray-900 mb-2">{translations[language].faq3Title}</h3>
                <p className="text-gray-700">{translations[language].faq3Text}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg text-gray-900 mb-2">{translations[language].faq4Title}</h3>
                <p className="text-gray-700">{translations[language].faq4Text}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-sm text-gray-600">
            <p>
              {language === 'en' ? 'Created and hosted by ' : 'Reiknivélin er þróuð og hýst af '}
              <a 
                href="https://gamithra.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                  {language === 'en' ? 'Gamithra' : 'Gamithru'}
              </a>.
            </p>
            <p className="mt-1">{translations[language].footerText2}</p>
            <p className="mt-2">
              <a 
                href="https://github.com/Gamithra/tryggingar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </I18nProvider>
  );
};

export default DepositCalculator;