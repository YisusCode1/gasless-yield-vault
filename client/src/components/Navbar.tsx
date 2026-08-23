import React, { useState } from 'react';
import { ChevronDown, Wallet, LogOut, RefreshCw, AlertCircle, Menu, X, Globe } from 'lucide-react';
import { useWeb3 } from '../hooks/useWeb3';
import { useLanguage } from '../context/LanguageContext';
import { ARBITRUM_SEPOLIA_CHAIN_ID } from '../config/constants';

const logoUrl = new URL('../assets/flowfi-symbol.png', import.meta.url).href;

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { wallet, connectWallet, disconnectWallet, switchNetwork } = useWeb3();
  const { language, toggleLanguage, t } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: t('nav.home') },
    { id: 'vault', label: t('nav.vault') },
    { id: 'estrategia', label: t('nav.strategy') },
    { id: 'actividad', label: t('nav.activity') },
    { id: 'como-funciona', label: t('nav.howItWorks') },
  ];

  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const isWrongNetwork = wallet.isConnected && wallet.chainId !== ARBITRUM_SEPOLIA_CHAIN_ID;

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-xl px-4 py-3 md:px-8 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Tagline */}
        <div 
          className="flex items-center gap-3 cursor-pointer select-none group" 
          onClick={() => handleNavigate('home')}
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-emerald-500/30 bg-[#0B1120] flex items-center justify-center p-1.5 shadow-[0_0_20px_rgba(0,147,147,0.2)] group-hover:border-emerald-400/60 transition-all">
            <img
              src={logoUrl}
              alt="FlowFi Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                FlowFi
              </span>
              <span className="text-[10px] uppercase font-mono font-semibold bg-[#009393]/15 text-[#00E5C9] px-2 py-0.5 rounded border border-[#009393]/30 tracking-wider">
                {t('nav.wdkBadge')}
              </span>
            </div>
            <p className="text-[10px] tracking-wider uppercase text-slate-400 font-medium">
              Gasless Yield Protocol · Arbitrum
            </p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0B1120]/80 border border-slate-800/80 p-1 rounded-xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action: Language, Network & Wallet */}
        <div className="hidden md:flex items-center gap-2.5">
          
          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1120] border border-slate-800 hover:border-emerald-500/40 px-3 py-2 text-xs font-mono text-slate-300 hover:text-emerald-300 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-[11px]">{language.toUpperCase()}</span>
          </button>

          {isWrongNetwork ? (
            <button
              onClick={switchNetwork}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20"
            >
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>Arbitrum</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl bg-[#0B1120] border border-slate-800 px-3 py-2 text-xs font-mono text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
              <span className="text-[11px] font-semibold">Arbitrum Sepolia</span>
            </div>
          )}

          {/* Wallet Dropdown / Connect Button */}
          <div className="relative">
            {wallet.isConnected ? (
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-[#0B1120] px-3.5 py-2 text-xs font-mono text-emerald-300 transition hover:bg-slate-800/80 hover:border-emerald-400/50"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{formatAddress(wallet.account)}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={connectWallet}
                disabled={wallet.isConnecting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 active:scale-95"
              >
                {wallet.isConnecting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
                <span>{wallet.isConnecting ? '...' : t('nav.connectWallet')}</span>
              </button>
            )}

            {/* Dropdown Menu */}
            {showDropdown && wallet.isConnected && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-800 bg-[#0B1120] p-3 shadow-2xl text-xs text-slate-300 backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">EOA</p>
                  <p className="mt-1 text-xs text-white font-mono truncate">{wallet.account}</p>
                  {wallet.balance && (
                    <p className="mt-1 text-[11px] text-emerald-400 font-mono">
                      Gas: {parseFloat(wallet.balance).toFixed(4)} ETH
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    connectWallet();
                    setShowDropdown(false);
                  }}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 px-3 py-2 text-left text-xs text-slate-200 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t('nav.connectWallet')}</span>
                </button>

                <button
                  onClick={() => {
                    disconnectWallet();
                    setShowDropdown(false);
                  }}
                  className="mt-1.5 flex w-full items-center gap-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 text-left text-xs text-rose-300 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-400" />
                  <span>{t('nav.disconnect')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Actions: Language & Drawer Trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1 rounded-xl bg-[#0B1120] border border-slate-800 p-2 text-xs font-mono text-slate-300"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-[11px]">{language.toUpperCase()}</span>
          </button>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-[#0B1120] p-2 text-slate-200 hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="mt-3 space-y-3 border-t border-slate-800 pt-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full rounded-xl px-4 py-2.5 text-left text-xs font-semibold transition ${
                  activeTab === item.id
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            {wallet.isConnected ? (
              <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">EOA</div>
                  <div className="text-xs font-mono text-emerald-400">{formatAddress(wallet.account)}</div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="text-xs bg-rose-500/10 text-rose-300 px-2.5 py-1.5 rounded-lg border border-rose-500/20"
                >
                  {t('nav.disconnect')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  connectWallet();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                <span>{t('nav.connectWallet')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

