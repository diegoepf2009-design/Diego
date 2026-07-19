import { useState } from 'react';
import { 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  FileDown, 
  FileSpreadsheet, 
  Check, 
  Trash2, 
  Sparkles,
  Info,
  AlertTriangle,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { AppNotification } from '../types';

interface TopbarProps {
  monthId: string;
  onChangeMonth: (newMonth: string) => void;
  onCloneMonth: () => void;
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export default function Topbar({
  monthId,
  onChangeMonth,
  onCloneMonth,
  notifications,
  onMarkNotificationRead,
  onClearNotifications,
  onExportPDF,
  onExportExcel
}: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  // Parse YYYY-MM into friendly localized string (e.g. Julho de 2026)
  const getFriendlyMonth = (mId: string) => {
    const [year, month] = mId.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = monthId.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    onChangeMonth(prevMonthStr);
  };

  const handleNextMonth = () => {
    const [year, month] = monthId.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    onChangeMonth(nextMonthStr);
  };

  // Notifications filtering
  const unreadNotifications = notifications.filter(n => !n.read);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={15} className="text-amber-400 shrink-0" />;
      case 'danger':
        return <AlertTriangle size={15} className="text-red-400 shrink-0" />;
      case 'success':
        return <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />;
      default:
        return <Info size={15} className="text-cyan-400 shrink-0" />;
    }
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#060c1f]/85 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      
      {/* Month Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-slate-900/60 rounded-xl p-1 border border-white/5">
          <button 
            id="prev-month-btn"
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="px-3 flex items-center gap-2 font-display min-w-[140px] justify-center">
            <CalendarDays size={14} className="text-cyan-400" />
            <span className="text-xs font-semibold text-slate-100">{getFriendlyMonth(monthId)}</span>
          </div>

          <button 
            id="next-month-btn"
            onClick={handleNextMonth}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Clone month button */}
        <button
          id="clone-month-btn"
          onClick={onCloneMonth}
          title="Clonar dados deste mês para o próximo mês"
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 hover:from-cyan-600/35 hover:to-indigo-600/35 border border-cyan-500/10 text-cyan-300 text-xs font-semibold rounded-xl transition shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          <Copy size={13} />
          <span className="hidden sm:inline">Clonar Mês</span>
        </button>
      </div>

      {/* Action buttons, Exports, and Notifications */}
      <div className="flex items-center gap-3">
        {/* Exports Dropdown / Buttons */}
        <div className="flex items-center gap-2">
          {/* PDF button */}
          <button
            id="export-pdf-btn"
            onClick={onExportPDF}
            title="Exportar Relatório PDF"
            className="p-2 text-slate-400 hover:text-red-400 bg-slate-900/40 rounded-xl border border-white/5 hover:border-red-500/20 transition flex items-center justify-center"
          >
            <FileDown size={17} />
          </button>
          {/* Excel button */}
          <button
            id="export-excel-btn"
            onClick={onExportExcel}
            title="Exportar Planilha Excel"
            className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900/40 rounded-xl border border-white/5 hover:border-emerald-500/20 transition flex items-center justify-center"
          >
            <FileSpreadsheet size={17} />
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-white/5"></div>

        {/* Notifications Icon with Dropdown */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 bg-slate-900/60 border border-white/5 rounded-xl hover:bg-slate-900 text-slate-300 hover:text-slate-100 transition relative flex items-center justify-center"
          >
            <Bell size={17} />
            {unreadNotifications.length > 0 && (
              <span id="notifications-count-badge" className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-slate-950">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-3.5 w-80 rounded-2xl glass-panel border border-white/10 shadow-2xl p-4 z-50 flex flex-col gap-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200 text-xs">
                  <Sparkles size={13} className="text-cyan-400" />
                  <span>Central de Notificações</span>
                </div>
                {unreadNotifications.length > 0 && (
                  <button 
                    onClick={onClearNotifications}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline transition"
                  >
                    Marcar lidas
                  </button>
                )}
              </div>

              {/* Notification items list */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-2.5 rounded-xl text-xs flex gap-2.5 transition border ${
                      notification.read 
                        ? 'bg-slate-900/20 border-white/5 opacity-60' 
                        : 'bg-slate-900/60 border-white/10'
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-slate-100 block">{notification.title}</span>
                        {!notification.read && (
                          <button 
                            onClick={() => onMarkNotificationRead(notification.id)}
                            title="Marcar como lida"
                            className="p-0.5 text-slate-400 hover:text-emerald-400 rounded transition"
                          >
                            <Check size={11} />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{notification.message}</p>
                      <span className="text-[9px] text-slate-500 font-mono block pt-1">{notification.date}</span>
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6 italic">
                    Nenhuma notificação por aqui.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
