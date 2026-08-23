import React, { useState } from 'react';
import { Download, ExternalLink, FileSpreadsheet, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, History } from 'lucide-react';
import { useVault } from '../hooks/useVault';
import { useLanguage } from '../context/LanguageContext';
import { ARBITRUM_SEPOLIA_EXPLORER } from '../config/constants';

export const ActividadView: React.FC = () => {
  const [filter, setFilter] = useState('Todos');
  const { history } = useVault();
  const { t } = useLanguage();

  const totalDeposits = history
    .filter((item) => (item.type === 'DEPÓSITO' || item.type === 'DEPOSIT') && item.amount !== '-')
    .reduce((acc, item) => {
      const val = parseFloat(item.amount.replace(' USD₮', '').replace(' USDC', '').replace(',', ''));
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

  const totalWithdrawals = history
    .filter((item) => (item.type === 'RETIRO' || item.type === 'WITHDRAW') && item.amount !== '-')
    .reduce((acc, item) => {
      const val = parseFloat(item.amount.replace(' USD₮', '').replace(' USDC', '').replace(',', ''));
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

  const exportCSV = () => {
    if (history.length === 0) return;
    const headers = ['Date', 'Type', 'Description', 'Protocol', 'Amount', 'Status', 'Hash'];
    const rows = history.map((item) => [
      item.date,
      item.type,
      item.description,
      item.protocol,
      item.amount,
      item.status,
      item.hash
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'flowfi_activity_ledger.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = history.filter((item) => {
    if (filter === 'Todos') return true;
    if (filter === 'Depositos') return item.type === 'DEPÓSITO' || item.type === 'DEPOSIT';
    if (filter === 'Retiros') return item.type === 'RETIRO' || item.type === 'WITHDRAW';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 text-slate-100 font-sans">
      
      {/* Header & Ledger Stat Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{t('activity.title')}</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">{t('activity.subtitle')}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
          <div className="bg-[#0B1120] border border-slate-800 px-4 py-2.5 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-mono uppercase">{t('activity.eventsCount')}</div>
            <div className="text-base font-bold font-mono text-white">{history.length}</div>
            <div className="text-[10px] text-slate-500 font-mono">Live</div>
          </div>
          <div className="bg-[#0B1120] border border-slate-800 px-4 py-2.5 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-mono uppercase">{t('activity.totalDeposited')}</div>
            <div className="text-base font-bold font-mono text-emerald-400">
              ${totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">USD₮ Total</div>
          </div>
          <div className="bg-[#0B1120] border border-slate-800 px-4 py-2.5 rounded-2xl">
            <div className="text-[10px] text-slate-400 font-mono uppercase">{t('activity.totalWithdrawn')}</div>
            <div className="text-base font-bold font-mono text-rose-400">
              ${totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">USD₮ Total</div>
          </div>
        </div>
      </div>

      {/* Filter and Export Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0B1120] border border-slate-800 p-3 rounded-2xl">
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'Todos', label: t('activity.tabAll') },
            { id: 'Depositos', label: t('activity.tabDeposits') },
            { id: 'Retiros', label: t('activity.tabWithdrawals') }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filter === f.id
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button
          onClick={exportCSV}
          disabled={history.length === 0}
          className="flex items-center gap-2 bg-[#060913] border border-slate-800 hover:border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-mono text-slate-300 transition-colors w-full sm:w-auto justify-center disabled:opacity-40"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('activity.exportCsv')}</span>
        </button>
      </div>

      {/* Transaction Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#060913]/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">{t('activity.thDate')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('activity.thType')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('activity.thDesc')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('activity.thProtocol')}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">{t('activity.thAmount')}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">{t('activity.thShares')}</th>
                  <th className="py-3.5 px-4 font-semibold text-center">{t('activity.thStatus')}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">{t('activity.thTx')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredHistory.map((item, index) => {
                  const isDeposit = item.type === 'DEPÓSITO' || item.type === 'DEPOSIT';
                  return (
                    <tr key={index} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3.5 px-4 text-slate-300">{item.date}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isDeposit 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {isDeposit ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{item.description}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">{item.protocol || 'Aave V3'}</td>
                      <td className={`py-3.5 px-4 text-right font-bold ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.amount}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300">
                        {item.subAmount || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{item.status || 'Success'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.hash && item.hash !== '-' ? (
                          <a
                            href={`${ARBITRUM_SEPOLIA_EXPLORER}/tx/${item.hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <span>{item.hash}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs font-mono space-y-2">
            <History className="w-8 h-8 mx-auto opacity-30 text-emerald-400" />
            <p>{t('activity.empty')}</p>
            <p className="text-[11px] text-slate-600">{t('activity.emptySub')}</p>
          </div>
        )}
      </div>

    </div>
  );
};

