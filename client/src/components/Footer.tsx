import { useLanguage } from '../context/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-800/80 bg-[#060913]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-white tracking-tight">FlowFi</span>
          <span className="text-xs text-slate-400 font-medium">· {t('footer.desc')}</span>
        </div>

        <p className="text-xs text-slate-400 text-center font-mono">
          {t('footer.subdesc')}
        </p>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <a
            href="https://github.com/YisusCode1/gasless-yield-vault"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors"
          >
            {t('footer.github')}
          </a>
          <a
            href="https://sepolia.arbiscan.io/address/0x9b24ADD6fe458f1d620A17ceC8d20944C37296d7"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-400 transition-colors"
          >
            {t('footer.contract')}
          </a>
        </div>
      </div>
    </footer>
  );
}


