import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { LogoCRM } from './ModuleLogos';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  UserCheck,
  Calendar,
  Settings
} from 'lucide-react';

export const CarrierDashboard: React.FC = () => {
  const { user, carrierBalance, logout } = useAuthStore();

  const debtRatio = carrierBalance 
    ? (carrierBalance.totalDebtToAdmin + carrierBalance.totalDebtToAgents) / carrierBalance.creditLimit 
    : 0;
  
  const isCriticalDebt = debtRatio > 0.8;

  const stats = [
    { label: 'Пасажири сьогодні', value: '1,280', icon: Users, color: '#00d4ff' },
    { label: 'Активні рейси', value: '42', icon: Clock, color: '#FFB800' },
    { label: 'Коефіцієнт загрузки', value: '88%', icon: TrendingUp, color: '#00FF88' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#FFB800]/30">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10">
            <LogoCRM />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter font-syne">BUSNET</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold">CRM v4.0</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {['Огляд', 'Рейси', 'Пасажири', 'Агенти', 'Звіти'].map((item) => (
            <button
              key={item}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition-all duration-300"
            >
              {item}
            </button>
          ))}
        </nav>

        <button 
          onClick={logout}
          className="mt-auto px-4 py-3 text-sm text-red-400/60 hover:text-red-400 font-bold text-left"
        >
          Вихід
        </button>
      </aside>

      {/* Main Content */}
      <main className="pl-64 p-8">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-2">Добрий день, {user?.companyName}</h2>
            <p className="text-white/40 font-medium">Ваш флот під контролем екосистеми BUSNET.</p>
          </div>
          
          <div className="flex gap-4">
            <button className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl transition-all h-fit self-end">
              <Calendar className="w-5 h-5 opacity-40" />
            </button>
            <button className="bg-[#FFB800] text-black px-6 py-3 rounded-2xl font-bold text-sm shadow-[0_4px_20px_rgba(255,184,0,0.3)] transition-all h-fit self-end">
              Новий рейс
            </button>
          </div>
        </header>

        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Debt Widget (The Spatial Pressure Module) */}
          <motion.div
            layout
            className={`col-span-1 relative overflow-hidden rounded-[32px] border ${
              isCriticalDebt ? 'border-red-500/50' : 'border-[#FFB800]/20'
            } p-8 flex flex-col justify-between h-[240px]`}
          >
            {/* Liquid Background */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: isCriticalDebt ? [0.6, 0.8, 0.6] : [0.2, 0.3, 0.2],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className={`absolute inset-0 blur-[60px] -z-10 transition-colors duration-500 ${
                isCriticalDebt ? 'bg-red-500/20' : 'bg-[#FFB800]/10'
              }`}
            />

            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/5 rounded-2xl backdrop-blur-md">
                <AlertCircle className={`w-5 h-5 ${isCriticalDebt ? 'text-red-400' : 'text-[#FFB800]'}`} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Financial Status</span>
            </div>

            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Заборгованість</p>
              <h3 className="text-3xl font-black tracking-tight">
                {(carrierBalance?.totalDebtToAdmin || 0) + (carrierBalance?.totalDebtToAgents || 0)} ₴
              </h3>
            </div>

            <div className="mt-4">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(debtRatio * 100, 100)}%` }}
                  className={`h-full ${isCriticalDebt ? 'bg-red-500' : 'bg-[#FFB800]'}`}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/30">
                <span>Борг</span>
                <span>Ліміт: {carrierBalance?.creditLimit || 5000} ₴</span>
              </div>
            </div>
          </motion.div>

          {stats.map((stat) => (
            <div key={stat.label} className="bg-white/5 border border-white/5 p-8 rounded-[32px] flex flex-col justify-between hover:border-white/15 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/5 rounded-2xl backdrop-blur-md">
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-20" />
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black tracking-tight">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Boarding Activity */}
        <div className="bg-white/5 border border-white/5 rounded-[32px] p-8 overflow-hidden relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              Останні Посадки (Live Ready)
            </h3>
            <span className="px-3 py-1 bg-cyan-400/10 text-cyan-400 text-[10px] font-black rounded-full uppercase tracking-widest">
              Миттєве Оновлення
            </span>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 group cursor-pointer hover:px-4 transition-all duration-300 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-full border border-white/10 flex items-center justify-center font-bold text-white/40">
                    K{i}
                  </div>
                  <div>
                    <h4 className="font-bold">Дніпро — Варшава</h4>
                    <p className="text-xs text-white/40">Пасажир: Олександр М. • Квиток #2940{i}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono text-[#00FF88]">+450 ₴</span>
                  <p className="text-[10px] uppercase opacity-30 font-bold">Оплата готівкою</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
