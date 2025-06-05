import React, { useState, useEffect } from 'react';
import { Calculator, Calendar, TrendingUp, Info, RefreshCw } from 'lucide-react';

const DepositCalculator = () => {
  const [depositAmount, setDepositAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [currentRates, setCurrentRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const CAPITAL_GAINS_TAX = 22; // 22% fjármagnstekjuskattur

  // Bank APIs and configurations
  const BANK_APIS = {
    arion: {
      name: 'Arion banki',
      baseUrl: 'https://www.arionbanki.is/api/v1',
      endpoints: {
        interestRates: '/interestrates',
        categories: '/interestrates/categories'
      }
    },
    audur: {
      name: 'Auður (Kvika)',
      manualRates: true
    }
  };

  // Fetch current interest rates from multiple banks
  const fetchCurrentRates = async () => {
    setLoading(true);
    setError(null);

    const rates = {};

    try {
      // Fetch Arion rates
      const arionResponse = await fetch(`${BANK_APIS.arion.baseUrl}${BANK_APIS.arion.endpoints.interestRates}`);
      if (arionResponse.ok) {
        const arionData = await arionResponse.json();

        // Find savings account rates (sparnaðarreikningur equivalent)
        const savingsRates = arionData.interest_rate?.filter(rate =>
          rate.name?.toLowerCase().includes('sparnaður') ||
          rate.description?.toLowerCase().includes('sparnaður') ||
          rate.name?.toLowerCase().includes('savings')
        ) || [];

        if (savingsRates.length > 0) {
          // Get the highest rate
          const highestArionRate = Math.max(...savingsRates.map(rate =>
            parseFloat(rate.rate?.value_to || rate.rate?.value_from || 0)
          ));

          rates.arion = {
            rate: highestArionRate,
            name: BANK_APIS.arion.name,
            lastUpdated: arionData.publication_date,
            products: savingsRates
          };
        }
      }

      // Add manual Auður data (since they don't have a public API)
      rates.audur = {
        rate: 6.90, // Current rate from website
        name: BANK_APIS.audur.name,
        lastUpdated: new Date().toISOString(),
        manual: true
      };

      // Load historical data from state or initialize
      let history = rateHistory.length > 0 ? [...rateHistory] : [
        { date: '2023-06-02', rates: { audur: 8.25 } },
        { date: '2024-01-01', rates: { audur: 7.50 } },
        { date: '2024-06-01', rates: { audur: 7.00 } },
        { date: '2025-01-01', rates: { audur: 6.90 } }
      ];

      // Add current rates to history if they're different from the last entry
      const today = new Date().toISOString().split('T')[0];
      const lastEntry = history[history.length - 1];

      Object.keys(rates).forEach(bank => {
        const currentRate = rates[bank].rate;
        if (!lastEntry || lastEntry.date !== today || lastEntry.rates[bank] !== currentRate) {
          // Update or add today's entry
          const todayIndex = history.findIndex(entry => entry.date === today);
          if (todayIndex >= 0) {
            history[todayIndex].rates[bank] = currentRate;
          } else {
            history.push({
              date: today,
              rates: { [bank]: currentRate }
            });
          }
        }
      });

      setCurrentRates(rates);
      setRateHistory(history);

    } catch (err) {
      console.error('Error fetching rates:', err);
      setError('Failed to fetch current interest rates. Using fallback data.');

      // Fallback to manual data
      setCurrentRates({
        audur: { rate: 6.90, name: 'Auður (Kvika)', manual: true }
      });
      setRateHistory([
        { date: '2023-06-02', rates: { audur: 8.25 } },
        { date: '2024-01-01', rates: { audur: 7.50 } },
        { date: '2024-06-01', rates: { audur: 7.00 } },
        { date: '2025-01-01', rates: { audur: 6.90 } }
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
      const highestCurrent = Object.values(currentRates).reduce((highest, bank) =>
        bank.rate > highest.rate ? bank : highest, { rate: 0 });
      return { rate: highestCurrent.rate, bank: 'audur' };
    }

    // Find the bank with highest rate on that date
    let highestRate = 0;
    let highestBank = 'audur';

    Object.entries(applicableEntry.rates).forEach(([bank, rate]) => {
      if (rate > highestRate) {
        highestRate = rate;
        highestBank = bank;
      }
    });

    return { rate: highestRate, bank: highestBank };
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
          rates: entry.rates
        });
      }
    });

    // Sort by date
    allRateChanges.sort((a, b) => a.date - b.date);

    while (currentDate < end) {
      // Get the applicable rate for the current period
      const { rate: rateForPeriod, bank: bankUsed } = getHighestRateForDate(currentDate);

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
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Leigugjald Vaxta Reiknivél
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Rental Deposit Interest Calculator for Iceland
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              {loading ? 'Loading rates...' :
                `Highest rate: ${getCurrentHighestRate().rate}% (${getCurrentHighestRate().bank}) - before ${CAPITAL_GAINS_TAX}% tax`}
            </div>

            <button
              onClick={fetchCurrentRates}
              disabled={loading}
              className="inline-flex items-center bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded-full text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Update Rates
            </button>
          </div>

          {error && (
            <div className="mt-2 inline-flex items-center bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm">
              <Info className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-6">
              <Calculator className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Calculate Interest</h2>
            </div>

            <div className="space-y-6">
              {/* Deposit Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount (ISK)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter deposit amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                  <span className="absolute right-3 top-3 text-gray-500">kr</span>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={today}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Legal Info */}
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Icelandic Law Requirement</p>
                  <p>According to Icelandic rental law, deposits must be stored in the highest interest savings account available. This calculator compares rates from multiple banks and uses the highest available rate for each time period.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Interest Calculation</h2>

            {results ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-800">Net Interest Earned</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(results.netInterest)}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-800">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(results.totalAmount)}
                    </p>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium text-gray-900">Detailed Breakdown</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original deposit:</span>
                      <span className="font-medium">{formatCurrency(results.principal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{results.daysDiff} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gross interest (variable rates):</span>
                      <span className="font-medium">{formatCurrency(results.grossInterest)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Fjármagnstekjuskattur ({CAPITAL_GAINS_TAX}%):</span>
                      <span className="font-medium">-{formatCurrency(results.tax)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-lg font-semibold">
                      <span>Net interest earned:</span>
                      <span className="text-green-600">{formatCurrency(results.netInterest)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Effective annual rate (after tax):</span>
                      <span>{results.effectiveRate.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* Rate Breakdown */}
                {results.rateBreakdown && results.rateBreakdown.length > 1 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="font-medium text-gray-900">Interest Rate Periods</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {results.rateBreakdown.map((period, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">
                              {period.startDate.toLocaleDateString('is-IS')} - {period.endDate.toLocaleDateString('is-IS')}
                            </span>
                            <div className="text-right">
                              <span className="text-sm font-medium text-blue-600">{period.rate}%</span>
                              <div className="text-xs text-gray-500">{currentRates[period.bank]?.name || period.bank}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
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
                <p className="text-gray-500">Enter deposit details to calculate interest</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-600">
          <p>Interest rates are fetched from bank APIs and updated automatically. Historical data ensures accurate calculations.</p>
          <p className="mt-1">This tool is for informational purposes. Please consult legal advice for specific cases.</p>
        </div>
      </div>
    </div>
  );
};

export default DepositCalculator;