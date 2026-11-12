import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  MessageSquare, 
  Users, 
  AlertTriangle, 
  Package, 
  ExternalLink,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ConnectPromoCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1a30] via-[#091222] to-[#050912] border border-cyan-500/30 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ОКРЕМИЙ ДОДАТОК СПІЛЬНОТИ</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            BUSNET <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">CONNECT</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Перша соціальна мережа для українських мандрівників у Європі. Дивіться живі оновлення черг на кордонах, знаходьте надійних попутників, передавайте посилки та спілкуйтесь без посередників.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => navigate('/connect')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-[0_0_25px_rgba(0,212,255,0.4)] active:scale-95 transition-all cursor-pointer"
            >
              <span>Відкрити BUSNET CONNECT</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Безкоштовно та доступно для всіх пасажирів</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── KEY CAPABILITIES TILES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tile 1 */}
        <div 
          onClick={() => navigate('/connect')}
          className="p-5 rounded-2xl bg-[#091120] border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm mb-1">Кордон Live</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Реальні звіти пасажирів про черги на пунктах пропуску Україна — Польща / Угорщина / Словаччина.
          </p>
        </div>

        {/* Tile 2 */}
        <div 
          onClick={() => navigate('/connect')}
          className="p-5 rounded-2xl bg-[#091120] border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm mb-1">Пошук попутників</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Шукайте компанію для спільних поїздок між містами Італії та України, щоб подорожувати безпечніше.
          </p>
        </div>

        {/* Tile 3 */}
        <div 
          onClick={() => navigate('/connect')}
          className="p-5 rounded-2xl bg-[#091120] border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm mb-1">Посилки та передачі</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Зручна дошка оголошень для передачі важливих документів чи передач через перевірених пасажирів.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConnectPromoCard;

