import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Briefcase, CheckCircle2, XCircle, Clock, Phone, Mail, User, Bus, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../supabase/config';
import { toast } from 'react-hot-toast';

interface PartnerApplication {
  id: string;
  type: 'carrier' | 'agent';
  company_name: string;
  contact_name: string;
  phone: string;
  email: string;
  fleet_size?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const PartnerApplicationsSection: React.FC = () => {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('partner_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (!error && data) {
        setApplications(data as PartnerApplication[]);
      }
    } catch (err: any) {
      console.error('[PartnerApplications] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const channel = supabase.channel(`partner_apps_${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_applications' }, () => {
        fetchApplications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const handleUpdateStatus = async (app: PartnerApplication, newStatus: 'approved' | 'rejected') => {
    setProcessingId(app.id);
    try {
      // 1. Update application status
      const { error: appError } = await supabase
        .from('partner_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', app.id);

      if (appError) throw appError;

      // 2. If approved, upgrade existing user if already registered by email
      if (newStatus === 'approved') {
        const { data: existingUser } = await supabase
          .from('users')
          .select('uid')
          .eq('email', app.email)
          .maybeSingle();

        if (existingUser) {
          await supabase
            .from('users')
            .update({ 
              role: app.type, 
              companyName: app.company_name, 
              phone: app.phone,
              status: 'active' 
            })
            .eq('uid', existingUser.uid);
          toast.success(`Акаунт ${app.email} оновлено до ролі ${app.type === 'carrier' ? 'Перевізник' : 'Агент'}!`);
        } else {
          toast.success(`Заявку схвалено! Коли партнер зареєструється з ${app.email}, надайте доступ.`);
        }
      } else {
        toast.success('Заявку відхилено');
      }

      fetchApplications();
    } catch (err: any) {
      console.error('[PartnerApplications] Status error:', err);
      toast.error(err.message || 'Помилка оновлення статусу');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            <span>Заявки на партнерство</span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-black">
                {pendingCount} нових
              </span>
            )}
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Керування вхідними запитами від транспортних компаній та агентів
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filter === st
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'pending' ? 'Очікують' : st === 'approved' ? 'Схвалені' : st === 'rejected' ? 'Відхилені' : 'Всі'}
            </button>
          ))}
          <button
            onClick={fetchApplications}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-all"
            title="Оновити"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-black/20 border border-white/5">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">Заявок у цій категорії немає</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applications.map((app) => {
            const isCarrier = app.type === 'carrier';
            const accentBg = isCarrier ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400';

            return (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-black/30 border border-white/5 hover:border-white/10 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${accentBg}`}>
                      {isCarrier ? <Building2 size={20} /> : <Briefcase size={20} />}
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm tracking-tight">{app.company_name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${accentBg}`}>
                          {isCarrier ? 'Перевізник' : 'Агент'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(app.created_at).toLocaleDateString('uk-UA')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    app.status === 'pending'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : app.status === 'approved'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {app.status === 'pending' ? 'Очікує' : app.status === 'approved' ? 'Схвалено' : 'Відхилено'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User size={13} className="text-slate-500" />
                    <span>Контакт: <strong className="text-white font-medium">{app.contact_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={13} className="text-slate-500" />
                    <a href={`tel:${app.phone}`} className="text-cyan-400 hover:underline">{app.phone}</a>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail size={13} className="text-slate-500" />
                    <a href={`mailto:${app.email}`} className="text-cyan-400 hover:underline">{app.email}</a>
                  </div>
                  {app.fleet_size && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Bus size={13} className="text-slate-500" />
                      <span>Автопарк: <strong className="text-white font-medium">{app.fleet_size}</strong></span>
                    </div>
                  )}
                  {app.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-black/40 p-2.5 rounded-xl border border-white/5 mt-2">
                      «{app.notes}»
                    </p>
                  )}
                </div>

                {app.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleUpdateStatus(app, 'approved')}
                      disabled={processingId === app.id}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                      <span>Схвалити</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app, 'rejected')}
                      disabled={processingId === app.id}
                      className="py-2 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/20 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      <span>Відхилити</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
