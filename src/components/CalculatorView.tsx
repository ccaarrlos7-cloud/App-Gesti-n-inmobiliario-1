import React, { useState } from 'react';
import { Calculator, Percent, Euro, Home, ArrowRight, Wallet, PieChart, TrendingUp, Building2, HelpCircle } from 'lucide-react';
import { useAppContext } from '../store';
import { formatNumber } from '../utils';
import SettingsModal from './SettingsModal';
import { User } from 'lucide-react';


function FormattedInput({ value, onChange, className, step = "1", ...props }: any) {
  const [isFocused, setIsFocused] = React.useState(false);
  
  let displayValue: string | number = '';
  if (isFocused) {
    displayValue = (value || value === 0) ? value : '';
  } else {
    displayValue = (value || value === 0) ? formatNumber(value, step === "any" || step.includes(".") ? 2 : 0) : '';
  }

  return (
    <input
      {...props}
      type={isFocused ? "number" : "text"}
      step={step}
      className={className}
      value={displayValue}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export default function CalculatorView() {
  const { language } = useAppContext();
  const isEs = language === 'Español';
  const [showSettings, setShowSettings] = useState(false);
  const { userName, avatarUrl } = useAppContext();
  const [activeTab, setActiveTab] = useState<'investment' | 'mortgage'>('investment');

  // Mortgage State
  const [mortgageCapital, setMortgageCapital] = useState<number>(100000);
  const [mortgageInterest, setMortgageInterest] = useState<number>(3.5);
  const [mortgageYears, setMortgageYears] = useState<number>(30);

  // Investment State
  const [invPurchasePrice, setInvPurchasePrice] = useState<number>(150000);
  const [invPurchaseExpenses, setInvPurchaseExpenses] = useState<number>(15000);
  const [invRehabCost, setInvRehabCost] = useState<number>(20000);
  const [invMonthlyRent, setInvMonthlyRent] = useState<number>(900);
  
  // Investment Financing
  const [invFinancedCapital, setInvFinancedCapital] = useState<number>(120000);
  const [invInterest, setInvInterest] = useState<number>(3.5);
  const [invYears, setInvYears] = useState<number>(30);
  
  // Investment Expenses (Annual)
  const [invIbi, setInvIbi] = useState<number>(300);
  const [invCommunity, setInvCommunity] = useState<number>(50); // 50/mo
  const [invInsurance, setInvInsurance] = useState<number>(250);

  // Calculated Mortgage Values
  const getMortgagePayment = (p: number, rAnnual: number, years: number) => {
    if (p <= 0 || rAnnual <= 0 || years <= 0) return 0;
    const r = (rAnnual / 100) / 12;
    const n = years * 12;
    return p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const mPayment = getMortgagePayment(mortgageCapital, mortgageInterest, mortgageYears);
  const mTotalCost = mPayment * (mortgageYears * 12);
  const mTotalInterest = mTotalCost - mortgageCapital;

  // Calculated Investment Values
  const totalProjectCost = invPurchasePrice + invPurchaseExpenses + invRehabCost;
  const investedCapital = totalProjectCost - invFinancedCapital;
  
  const invMortgagePayment = getMortgagePayment(invFinancedCapital, invInterest, invYears);
  const annualMortgageCost = invMortgagePayment * 12;
  
  const annualRent = invMonthlyRent * 12;
  const annualExpenses = invIbi + (invCommunity * 12) + invInsurance;
  const netOperatingIncome = annualRent - annualExpenses; // NOI
  const annualCashFlow = netOperatingIncome - annualMortgageCost;
  const monthlyCashFlow = annualCashFlow / 12;

  const grossYield = invPurchasePrice > 0 ? (annualRent / invPurchasePrice) * 100 : 0;
  const netYield = totalProjectCost > 0 ? (netOperatingIncome / totalProjectCost) * 100 : 0;
  const cashOnCash = investedCapital > 0 ? (annualCashFlow / investedCapital) * 100 : 0;
  const paybackYears = annualCashFlow > 0 ? (investedCapital / annualCashFlow) : 0;

  return (
    <div className="flex flex-col h-full relative">
      <header className="min-h-[64px] py-3 bg-white border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between px-4 sm:px-8 shrink-0">
        <h1 className="text-[18px] font-semibold text-slate-900 flex items-center gap-2 hidden sm:flex">
          <Calculator size={20} className="text-blue-600" />
          {isEs ? 'Calculadora' : 'Calculator'}
        </h1>
        
        <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] sm:mx-4">
          <h1 className="text-[18px] font-semibold text-slate-900 flex items-center gap-2 sm:hidden">
            <Calculator size={20} className="text-blue-600" />
            {isEs ? 'Calculadora' : 'Calculator'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Placeholder invisible para igualar el espaciado si los otros tienen botón */}
          <div className="w-[40px] sm:w-[150px] invisible hidden md:block"></div>
          
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-slate-500" />
            )}
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 flex-1 overflow-auto bg-slate-50/50">
        
        {/* Tabs */}
        <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6 max-w-sm mx-auto">
          <button
            onClick={() => setActiveTab('investment')}
            className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'investment' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TrendingUp size={16} /> {isEs ? 'Inversión' : 'Investment'}
          </button>
          <button
            onClick={() => setActiveTab('mortgage')}
            className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'mortgage' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Home size={16} /> {isEs ? 'Hipoteca' : 'Mortgage'}
          </button>
        </div>

        <div className="max-w-5xl mx-auto">
          {activeTab === 'mortgage' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-[14px] font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                  {isEs ? 'Datos del Préstamo' : 'Loan Details'}
                </h2>
                
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">{isEs ? 'Capital Solicitado (€)' : 'Capital (€)'}</label>
                  <div className="relative">
                    <Euro size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <FormattedInput className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors" value={mortgageCapital} onChange={setMortgageCapital} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">{isEs ? 'Tipo de Interés (%)' : 'Interest Rate (%)'}</label>
                    <div className="relative">
                      <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <FormattedInput step="0.01" className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors" value={mortgageInterest} onChange={setMortgageInterest} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">{isEs ? 'Plazo (Años)' : 'Term (Years)'}</label>
                    <FormattedInput className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-colors" value={mortgageYears} onChange={setMortgageYears} />
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <div className="bg-slate-900 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Calculator size={100}/></div>
                  <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2 relative z-10">
                    {isEs ? 'Cuota Mensual Estimada' : 'Estimated Monthly Payment'}
                  </h3>
                  <div className="text-4xl sm:text-5xl font-bold mb-1 relative z-10">
                    {formatNumber(mPayment, 2)} €
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase mb-1">{isEs ? 'Total Intereses' : 'Total Interest'}</span>
                    <span className="text-xl font-bold text-slate-900">{formatNumber(mTotalInterest, 2)} €</span>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase mb-1">{isEs ? 'Coste Total' : 'Total Cost'}</span>
                    <span className="text-xl font-bold text-slate-900">{formatNumber(mTotalCost, 2)} €</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'investment' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Investment Inputs Column */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Acquisition & Rehab */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-[14px] font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    {isEs ? 'Adquisición y Reforma' : 'Acquisition & Rehab'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{isEs ? 'Precio Compra' : 'Purchase Price'}</label>
                      <FormattedInput className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-blue-500" value={invPurchasePrice} onChange={setInvPurchasePrice} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{isEs ? 'Gastos + ITP' : 'Taxes & Fees'}</label>
                      <FormattedInput className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-blue-500" value={invPurchaseExpenses} onChange={setInvPurchaseExpenses} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{isEs ? 'Reforma' : 'Rehab'}</label>
                      <FormattedInput className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-blue-500" value={invRehabCost} onChange={setInvRehabCost} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs font-bold text-slate-600 uppercase">{isEs ? 'Coste Total Proyecto' : 'Total Project Cost'}</span>
                    <span className="text-lg font-bold text-slate-900">{formatNumber(totalProjectCost, 2)} €</span>
                  </div>
                </div>

                {/* Financing */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-[14px] font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    {isEs ? 'Financiación' : 'Financing'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{isEs ? 'Capital Hipoteca' : 'Loan Capital'}</label>
                      <FormattedInput className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-blue-500" value={invFinancedCapital} onChange={setInvFinancedCapital} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{isEs ? 'Interés (%)' : 'Interest Rate'}</label>
                      <FormattedInput step="0.01" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-blue-500" value={invInterest} onChange={setInvInterest} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{isEs ? 'Plazo (Años)' : 'Term (Years)'}</label>
                      <FormattedInput className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-slate-50 focus:bg-white focus:border-blue-500" value={invYears} onChange={setInvYears} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-blue-50 text-blue-900 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase">{isEs ? 'Aportación Propia' : 'Down Payment'}</span>
                      <span className="text-[15px] font-bold">{formatNumber(investedCapital, 2)} €</span>
                    </div>
                    <div className="bg-slate-50 text-slate-900 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase">{isEs ? 'Cuota Hipoteca' : 'Mortgage Pmt'}</span>
                      <span className="text-[15px] font-bold">{formatNumber(invMortgagePayment, 2)} €<span className="text-[10px] font-normal text-slate-500">/mes</span></span>
                    </div>
                  </div>
                </div>

                {/* Income & Expenses */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h2 className="text-[14px] font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    {isEs ? 'Ingresos y Gastos' : 'Income & Expenses'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">{isEs ? 'Alquiler/Mes' : 'Monthly Rent'}</label>
                      <FormattedInput className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm font-bold bg-emerald-50 focus:bg-white focus:border-emerald-500" value={invMonthlyRent} onChange={setInvMonthlyRent} />
                    </div>
                    <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-red-500 uppercase mb-1">{isEs ? 'IBI (Anual)' : 'Tax/Year'}</label>
                        <FormattedInput className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm font-semibold bg-red-50 focus:bg-white focus:border-red-500" value={invIbi} onChange={setInvIbi} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-red-500 uppercase mb-1">{isEs ? 'Comunidad (Mensual)' : 'HOA/Month'}</label>
                        <FormattedInput className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm font-semibold bg-red-50 focus:bg-white focus:border-red-500" value={invCommunity} onChange={setInvCommunity} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-red-500 uppercase mb-1">{isEs ? 'Seguro (Anual)' : 'Ins/Year'}</label>
                        <FormattedInput className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm font-semibold bg-red-50 focus:bg-white focus:border-red-500" value={invInsurance} onChange={setInvInsurance} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Investment KPIs Column */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white">
                  <h3 className="text-[12px] font-bold text-blue-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <PieChart size={16}/> {isEs ? 'Rentabilidades Estimadas' : 'Estimated Returns'}
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[13px] text-slate-300 font-medium">{isEs ? 'Rentabilidad Bruta' : 'Gross Yield'}</span>
                        <span className="text-2xl font-bold">{formatNumber(grossYield, 2)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-slate-400 h-1.5 rounded-full" style={{width: `${Math.min(grossYield * 5, 100)}%`}}></div></div>
                      <p className="text-[10px] text-slate-500 mt-1">Alquiler Anual / Precio de Compra</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[13px] text-slate-300 font-medium">{isEs ? 'Rentabilidad Neta' : 'Net Yield'}</span>
                        <span className="text-2xl font-bold">{formatNumber(netYield, 2)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${Math.min(netYield * 5, 100)}%`}}></div></div>
                      <p className="text-[10px] text-slate-500 mt-1">NOI / Coste Total del Proyecto</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[13px] text-slate-300 font-medium">{isEs ? 'ROI (Cash on Cash)' : 'Cash on Cash Return'}</span>
                        <span className="text-3xl font-bold text-blue-400">{formatNumber(cashOnCash, 2)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width: `${Math.min(cashOnCash * 4, 100)}%`}}></div></div>
                      <p className="text-[10px] text-slate-500 mt-1">Flujo de Caja Anual / Capital Invertido</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[13px] text-slate-300 font-medium">{isEs ? 'Tiempo de Recuperación' : 'Payback Period'}</span>
                        <span className="text-2xl font-bold">{formatNumber(paybackYears, 1)} {isEs ? 'años' : 'years'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Años para pagar la aportación con el alquiler</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-wider mb-2">
                    {isEs ? 'Flujo de Caja' : 'Cash Flow'}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-600">+ {isEs ? 'Ingresos Anuales' : 'Annual Income'}</span>
                      <span className="font-semibold text-emerald-600">{formatNumber(annualRent, 2)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-600">- {isEs ? 'Gastos Anuales' : 'Annual Expenses'}</span>
                      <span className="font-semibold text-red-500">{formatNumber(annualExpenses, 2)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-600">- {isEs ? 'Hipoteca Anual' : 'Annual Mortgage'}</span>
                      <span className="font-semibold text-red-500">{formatNumber(annualMortgageCost, 2)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-lg pt-1">
                      <span className="font-bold text-slate-900">{isEs ? 'Flujo Neto (Anual)' : 'Net Cash Flow'}</span>
                      <span className={`font-bold ${annualCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{annualCashFlow > 0 ? '+' : ''}{formatNumber(annualCashFlow, 2)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-sm bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                      <span className="font-bold text-blue-900">{isEs ? 'Flujo de Caja (Mensual)' : 'Monthly Cash Flow'}</span>
                      <span className={`font-bold ${monthlyCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{monthlyCashFlow > 0 ? '+' : ''}{formatNumber(monthlyCashFlow, 2)} €</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
