import { 
  LayoutDashboard, 
  TrendingUp, 
  CreditCard, 
  TrendingDown, 
  Car, 
  Home, 
  Coins, 
  Calendar, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
}

export default function Sidebar({ currentTab, onChangeTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'incomes', label: 'Receitas', icon: TrendingUp },
    { id: 'cards', label: 'Cartões', icon: CreditCard },
    { id: 'expenses', label: 'Despesas', icon: TrendingDown },
    { id: 'car', label: 'Meu Carro', icon: Car },
    { id: 'house', label: 'Casa', icon: Home },
    { id: 'tithe', label: 'Dízimo', icon: Coins },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Navigation (>= 900px) */}
      <aside 
        id="desktop-sidebar"
        className="hidden min-[900px]:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#060c1f] border-r border-white/5 p-5 z-20"
      >
        {/* Logo Header */}
        <div className="flex items-center gap-3 px-2 py-4 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-extrabold text-white text-lg font-display">FA</span>
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-white font-display uppercase">
              FinAI <span className="text-cyan-400">Premium</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">V1.0 - OFFLINE</p>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition duration-200 border ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 text-white border-cyan-500/20 shadow-md shadow-indigo-950/20' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border-transparent'
                }`}
              >
                <IconComponent 
                  size={18} 
                  className={`transition duration-200 ${isActive ? 'text-cyan-400 scale-110' : 'text-slate-400'}`} 
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-white/5 pt-4 px-2">
          <p className="text-[10px] text-slate-500 font-mono text-center">
            FinAI Premium © 2026
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Bar (< 900px) */}
      <nav 
        id="mobile-bottom-nav"
        className="flex min-[900px]:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#060c1f]/95 backdrop-blur-md border-t border-white/5 justify-around items-center px-2 pb-safe z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.4)]"
      >
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-tab-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition ${
                isActive ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              <IconComponent 
                size={18} 
                className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} 
              />
              <span className="text-[9px] font-medium tracking-wide truncate max-w-[50px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
