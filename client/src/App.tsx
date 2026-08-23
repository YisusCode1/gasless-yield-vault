import React, { useState } from 'react';
import { Web3Provider } from './context/Web3Context';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { VaultView } from './components/VaultView';
import { EstrategiaIAView } from './components/EstrategiaIAView';
import { ActividadView } from './components/ActividadView';
import { ComoFuncionaView } from './components/ComoFuncionaView';

export function AppContent() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 font-sans antialiased flex flex-col selection:bg-emerald-500/30">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full py-4 sm:py-6">
        {activeTab === 'home' && <HomeView onNavigate={setActiveTab} />}
        {activeTab === 'vault' && <VaultView />}
        {activeTab === 'estrategia' && <EstrategiaIAView />}
        {activeTab === 'actividad' && <ActividadView />}
        {activeTab === 'como-funciona' && <ComoFuncionaView onNavigate={setActiveTab} />}
      </main>

      <Footer />
    </div>
  );
}

export function App() {
  return (
    <Web3Provider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </Web3Provider>
  );
}

export default App;
