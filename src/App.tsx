import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users,
  Calculator
} from 'lucide-react';
import DashboardView from './components/DashboardView';
import PortfolioView from './components/PortfolioView';
import CRMView from './components/CRMView';
import CalculatorView from './components/CalculatorView';
import Login from './components/Login';
import { PropertyStatus } from './types';
import { useAppContext } from './store';
import { supabase } from './lib/supabase';
import { LogOut } from 'lucide-react';

export type ViewType = 'dashboard' | 'portfolio' | 'crm' | 'calculator';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [portfolioFilter, setPortfolioFilter] = useState<PropertyStatus | 'Todos'>('Todos');
  const [resetKey, setResetKey] = useState(0);
  const { theme, language } = useAppContext();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'Oscuro' || theme === 'Dark') {
      root.classList.add('dark');
    } else if (theme === 'Sistema' || theme === 'System') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const navigateTo = (view: ViewType, filter?: PropertyStatus | 'Todos') => {
    if (filter) setPortfolioFilter(filter);
    setCurrentView(view);
    setResetKey(prev => prev + 1);
  };

  const isEs = language === 'Español';

  const navigation = [
    { name: isEs ? 'Inicio' : 'Home', id: 'dashboard', icon: LayoutDashboard },
    { name: isEs ? 'Portfolio' : 'Portfolio', id: 'portfolio', icon: Building2 },
    { name: isEs ? 'Inquilinos' : 'Tenants', id: 'crm', icon: Users },
    { name: isEs ? 'Calculadora' : 'Calculator', id: 'calculator', icon: Calculator },
  ];

  if (!session) {
    return <Login />;
  }

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 flex flex-col text-slate-900 dark:text-white font-sans overflow-hidden transition-colors pt-[env(safe-area-inset-top)]">
      {/* Main Content */}
      <main className="flex-1 w-full relative overflow-hidden flex flex-col mt-2">
        <div className="animate-in fade-in duration-300 h-full flex flex-col w-full">
          {currentView === 'dashboard' && <div key={`dashboard-${resetKey}`} className="h-full"><DashboardView onNavigate={navigateTo} /></div>}
          {currentView === 'portfolio' && <div key={`portfolio-${resetKey}`} className="h-full"><PortfolioView initialTab={portfolioFilter} /></div>}
          {currentView === 'crm' && <div key={`crm-${resetKey}`} className="h-full"><CRMView /></div>}
          {currentView === 'calculator' && <div key={`calculator-${resetKey}`} className="h-full"><CalculatorView /></div>}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-around px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 transition-colors">
        {navigation.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentView(item.id as ViewType);
              setResetKey(prev => prev + 1);
            }}
            className={`
              flex flex-col items-center justify-center gap-1 p-1 sm:p-2 min-w-[3.5rem] flex-1
              ${currentView === item.id 
                ? 'text-blue-500' 
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}
            `}
          >
            <item.icon size={22} className={currentView === item.id ? 'text-blue-500' : ''} />
            <span className="text-[10px] sm:text-xs font-medium text-center leading-none tracking-tight">{item.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
