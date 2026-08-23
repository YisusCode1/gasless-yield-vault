import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Wallet, Zap, Activity, Cpu, CheckCircle2, ChevronRight } from 'lucide-react';
import { useVault } from '../hooks/useVault';
import { useWeb3 } from '../hooks/useWeb3';
import { useLanguage } from '../context/LanguageContext';

interface HomeViewProps {
  onNavigate: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { wallet, connectWallet } = useWeb3();
  const { metrics } = useVault();
  const { t } = useLanguage();

  const coreFeatures = [
    {
      id: 'vault',
      title: t('home.pillar1Title'),
      subtitle: t('vault.title'),
      desc: t('home.pillar1Desc'),
      badge: t('nav.wdkBadge'),
      icon: Zap,
      actionText: t('home.ctaVault')
    },
    {
      id: 'estrategia',
      title: t('home.pillar2Title'),
      subtitle: t('strategy.title'),
      desc: t('home.pillar2Desc'),
      badge: 'Gemini 2.5 Flash',
      icon: Cpu,
      actionText: t('strategy.title')
    },
    {
      id: 'como-funciona',
      title: t('home.pillar3Title'),
      subtitle: t('how.title'),
      desc: t('home.pillar3Desc'),
      badge: t('nav.network'),
      icon: ShieldCheck,
      actionText: t('home.ctaHowItWorks')
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 text-slate-100 font-sans">
      
      {/* Hero Section */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] items-stretch">
        
        {/* Left Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-slate-800 bg-[#0B1120]/90 p-6 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full" />

          <div>
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-300 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
              {t('home.badge')}
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
              {t('home.heroTitle1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">{t('home.heroTitle2')}</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl">
              {t('home.heroDesc')}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('vault')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-6 py-3.5 text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <span>{t('home.ctaVault')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('estrategia')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-semibold px-5 py-3.5 text-xs transition-all"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>{t('nav.strategy')}</span>
            </button>
          </div>
        </motion.div>

        {/* Right Metric Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl border border-slate-800 bg-[#0B1120]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">GasslessPilotVault (ERC-4626)</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Live On-Chain
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="bg-[#060913] border border-slate-800/80 rounded-2xl p-4">
                <div className="text-[11px] font-mono text-slate-400 uppercase">{t('home.statTvl')}</div>
                <div className="text-2xl font-bold text-white font-mono mt-1">
                  ${parseFloat(metrics.totalAssets).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD₮
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-semibold">100% On-Chain</span> · Arbitrum Sepolia
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#060913] border border-slate-800/80 rounded-2xl p-4">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t('home.statApy')}</div>
                  <div className="text-xl font-bold text-emerald-400 font-mono mt-1">8.03%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t('home.statApySub')}</div>
                </div>

                <div className="bg-[#060913] border border-slate-800/80 rounded-2xl p-4">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">{t('home.statGas')}</div>
                  <div className="text-xl font-bold text-[#00E5C9] font-mono mt-1">0.00 ETH</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t('home.statGasSub')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Wallet status CTA */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            {!wallet.isConnected ? (
              <button
                onClick={connectWallet}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
              >
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>{t('nav.connectWallet')} (MetaMask EOA)</span>
              </button>
            ) : (
              <div className="flex items-center justify-between text-xs font-mono bg-[#060913] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">EOA:</span>
                <span className="text-emerald-400 font-semibold">{wallet.account?.slice(0, 6)}...{wallet.account?.slice(-4)}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Feature Pillar Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {coreFeatures.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + index * 0.1 }}
              className="glass-panel rounded-3xl p-6 flex flex-col justify-between glass-panel-hover"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                    {item.badge}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white tracking-tight">{item.title}</h2>
                <div className="text-xs text-emerald-400/90 font-medium mt-1">{item.subtitle}</div>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">{item.desc}</p>
              </div>

              <button
                onClick={() => onNavigate(item.id)}
                className="mt-6 inline-flex items-center justify-between w-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-xs font-semibold text-slate-200 px-4 py-2.5 rounded-xl transition-all"
              >
                <span>{item.actionText}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};

