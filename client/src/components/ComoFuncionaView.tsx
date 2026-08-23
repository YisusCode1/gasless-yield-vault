import React from 'react';
import { Database, Brain, Compass, Box, TrendingUp, ShieldCheck, Eye, Zap, Cpu, Lock, ArrowRight, Layers, Fuel, Server } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ComoFuncionaProps {
  onNavigate?: (tab: string) => void;
}

export const ComoFuncionaView: React.FC<ComoFuncionaProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  const layers = [
    {
      num: '01',
      title: t('how.layer1Title'),
      subtitle: 'Tether WDK Track 2',
      desc: t('how.layer1Desc'),
      icon: Fuel,
      badge: 'Tether WDK Gasless',
      metric: '0.00 ETH Needed'
    },
    {
      num: '02',
      title: t('how.layer2Title'),
      subtitle: 'Gemini 2.5 Flash',
      desc: t('how.layer2Desc'),
      icon: Cpu,
      badge: 'Quant Engine',
      metric: 'Continuous Feed'
    },
    {
      num: '03',
      title: t('how.layer3Title'),
      subtitle: 'ERC-4626 Tokenized',
      desc: t('how.layer3Desc'),
      icon: Lock,
      badge: 'GasslessPilotVault',
      metric: '100% Non-Custodial'
    },
    {
      num: '04',
      title: t('how.layer4Title'),
      subtitle: 'Aave V3 Lending Pool',
      desc: t('how.layer4Desc'),
      icon: TrendingUp,
      badge: 'Aave V3 Protocol',
      metric: '8.03% Supply APY'
    },
  ];

  const securityPillars = [
    {
      title: t('how.sec1Title'),
      desc: t('how.sec1Desc'),
      icon: ShieldCheck,
    },
    {
      title: t('how.sec2Title'),
      desc: t('how.sec2Desc'),
      icon: Eye,
    },
    {
      title: t('how.sec3Title'),
      desc: t('how.sec3Desc'),
      icon: Zap,
    },
    {
      title: 'Parametric Risk Guard',
      desc: 'On-chain mathematical constraints enforce strict capital allocation limits per selected risk profile.',
      icon: Server,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="bg-[#0B1120] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#009393]/10 blur-3xl pointer-events-none rounded-full" />
        
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-300 mb-4">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
            4-Layer Protocol Architecture
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            {t('how.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-3 leading-relaxed">
            {t('how.subtitle')}
          </p>
        </div>
      </div>

      {/* 4-Layer Architecture Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {layers.map((layer) => {
          const Icon = layer.icon;
          return (
            <div
              key={layer.num}
              className="glass-panel rounded-3xl p-6 flex flex-col justify-between glass-panel-hover"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                    LAYER {layer.num}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <h2 className="text-base font-bold text-white tracking-tight">{layer.title}</h2>
                <div className="text-xs text-emerald-300 font-medium mt-1">{layer.subtitle}</div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">{layer.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{layer.metric}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security & Integrity Pillars */}
      <div>
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-4">
          {t('how.securityTitle')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {securityPillars.map((p, idx) => {
            const IconComp = p.icon;
            return (
              <div key={idx} className="bg-[#0B1120] border border-slate-800 p-5 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white mb-1">{p.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
