import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Home, QrCode, ClipboardList, MapPin, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';

const DriverLayout: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-[#05050d] text-white flex flex-col">
      {/* Mobile Top Bar */}
      <div className="h-16 border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-black italic">D</div>
          <span className="text-sm font-black italic tracking-tighter">DRIVER HUB</span>
        </div>
        <button onClick={handleLogout} className="p-2 opacity-50 hover:opacity-100 transition-opacity">
          <LogOut size={20} />
        </button>
      </div>

      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* Driver Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#0a0e1a]/95 border-t border-white/5 backdrop-blur-2xl p-4 md:hidden z-50">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button onClick={() => navigate('/driver')} className="flex flex-col items-center gap-1 group">
            <div className="p-2 rounded-xl group-hover:bg-white/5 transition-colors">
              <Home size={22} className="text-orange-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4a6a85]">Головна</span>
          </button>
          
          <button onClick={() => navigate('/driver/scan')} className="flex flex-col items-center gap-1 group -translate-y-4">
            <div className="p-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.4)] border-4 border-[#05050d]">
              <QrCode size={28} className="text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mt-1">Чек-ін</span>
          </button>

          <button onClick={() => navigate('/driver/trips')} className="flex flex-col items-center gap-1 group">
            <div className="p-2 rounded-xl group-hover:bg-white/5 transition-colors">
              <ClipboardList size={22} className="text-[#4a6a85]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4a6a85]">Рейси</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default DriverLayout;
