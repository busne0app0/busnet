import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, Mail, Phone, MapPin, CreditCard, ShieldCheck, Edit, Camera, Activity, FileText, Check, X, Loader2, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';

const ProfileTab: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    companyName: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    iban: '',
    mfo: '',
    logoUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('uid', user.uid)
          .single();
        
        if (!error && data) {
          setProfile({
            companyName: data.companyName || '',
            taxId: data.taxId || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            address: data.address || '',
            iban: data.iban || '',
            mfo: data.mfo || '',
            logoUrl: data.logoUrl || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('users')
        .update({
          companyName: profile.companyName,
          taxId: profile.taxId,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          iban: profile.iban,
          mfo: profile.mfo,
        })
        .eq('uid', user.uid);
      
      if (error) throw error;
      
      setIsEditing(false);
      toast.success('Профіль успішно оновлено');
    } catch (error) {
      console.error('Error updating profile', error);
      toast.error('Помилка оновлення профілю');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Оберіть файл зображення (JPG, PNG, SVG)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Розмір файлу не повинен перевищувати 2 МБ');
      return;
    }

    setUploadingLogo(true);
    setUploadProgress(0);
    const toastId = toast.loading('Завантаження логотипу...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.uid}-${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('users')
        .update({ logoUrl: publicUrl })
        .eq('uid', user.uid);
      
      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, logoUrl: publicUrl }));
      toast.success('Логотип успішно оновлено!', { id: toastId });
    } catch (error) {
      console.error('Logo upload failed:', error);
      toast.error('Помилка при завантаженні', { id: toastId });
    } finally {
      setUploadingLogo(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  const initials = profile.companyName?.substring(0, 2).toUpperCase() ||
    user?.email?.substring(0, 2).toUpperCase() || 'БН';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="w-12 h-1 bg-[#10B981] mb-4 shadow-[0_0_10px_rgba(16,185,129,0.5)] rounded-full" />
          <h2 className="text-3xl font-black uppercase tracking-widest text-white">ПРОФІЛЬ КОМПАНІЇ</h2>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest mt-2">Основні дані та реквізити перевізника</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1A2639]/30 border border-white/5 rounded-[40px] p-8 flex flex-col items-center text-center">
            {/* Logo with upload */}
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-[#ff6b35] to-[#cc3300] flex items-center justify-center text-5xl font-black text-white shadow-2xl overflow-hidden uppercase">
                {profile.logoUrl ? (
                  <img src={profile.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-[40px]">
                    <Loader2 className="animate-spin text-white mb-1" size={24} />
                    <span className="text-white text-xs font-bold">{uploadProgress}%</span>
                  </div>
                )}
              </div>

              {/* Upload overlay on hover */}
              {!uploadingLogo && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-[40px] gap-2"
                >
                  <Camera size={22} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Завантажити логотип</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            {/* Upload button (always visible) */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="mb-4 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-[#8899B5] hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 shadow-lg"
            >
              <Upload size={12} />
              {uploadingLogo ? `ЗАВАНТАЖЕННЯ ${uploadProgress}%` : 'ЗМІНИТИ ЛОГОТИП'}
            </button>
            <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mb-4">JPG, PNG АБО SVG · МАКС. 2 МБ</p>

            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">{profile.companyName || user?.email || 'Ваша компанія'}</h3>
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] text-[9px] font-black rounded-full uppercase border border-[#10B981]/20">АКТИВНИЙ</span>
              <span className="px-3 py-1 bg-[#ff6b35]/10 text-[#ff6b35] text-[9px] font-black rounded-full uppercase border border-[#ff6b35]/20">PREMIUM</span>
            </div>

            <div className="w-full space-y-3 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#5a6a85] font-black uppercase tracking-widest text-[9px]">ID Партнера</span>
                <span className="text-white font-bold font-mono text-[10px] truncate ml-2 max-w-[120px]">{user?.uid || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#5a6a85] font-black uppercase tracking-widest text-[9px]">Електронна пошта</span>
                <span className="text-white font-bold text-[10px] truncate ml-2 max-w-[140px]">{user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#5a6a85] font-black uppercase tracking-widest text-[9px]">Дата реєстрації</span>
                <span className="text-white font-bold">
                  {user?.createdAt
                    ? new Date(parseInt(user?.createdAt as string)).toLocaleDateString('uk-UA')
                    : 'Недавно'}
                </span>
              </div>
            </div>
          </div>

          {/* Verification block */}
          <div className="bg-[#1A2639]/50 border border-[#10B981]/20 rounded-[40px] p-8 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
            <h4 className="text-[9px] font-black uppercase text-[#10B981] tracking-widest mb-4">СТАТУС ВЕРИФІКАЦІЇ</h4>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] border border-[#10B981]/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-widest">ПОВНА ВЕРИФІКАЦІЇ</p>
                <p className="text-[9px] text-[#10B981] font-black uppercase tracking-widest mt-0.5">ДОКУМЕНТИ ПІДТВЕРДЖЕНО</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/docs')}
              className="w-full py-3 bg-white/5 border border-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#8899B5] hover:bg-white/10 hover:text-white transition-all shadow-lg"
            >
              ПЕРЕГЛЯНУТИ ДОКУМЕНТИ
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main info form */}
          <div className="bg-[#1A2639]/30 border border-white/5 rounded-[40px] p-10">
            <div className="flex justify-between items-center mb-10">
              <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-3">
                <FileText size={18} className="text-[#10B981]" /> ОСНОВНА ІНФОРМАЦІЯ
              </h4>
              {isEditing ? (
                <div className="flex gap-2">
                  <button onClick={handleSave} className="p-2.5 rounded-full bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981] hover:text-white transition-all shadow-lg border border-[#10B981]/20" title="Зберегти">
                    <Check size={16} />
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-2.5 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg border border-rose-500/20" title="Скасувати">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditing(true)} className="p-2.5 rounded-full bg-white/5 border border-white/5 text-[#8899B5] hover:text-white hover:bg-white/10 transition-all shadow-lg" title="Редагувати">
                  <Edit size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {[
                { label: 'НАЗВА КОМПАНІЇ', name: 'companyName', icon: Building2, value: profile.companyName },
                { label: 'КОД ЄДРПОУ / TAX ID', name: 'taxId', icon: Activity, value: profile.taxId },
                { label: "EMAIL ДЛЯ ЗВ'ЯЗКУ", name: 'email', icon: Mail, value: profile.email },
                { label: 'ТЕЛЕФОН', name: 'phone', icon: Phone, value: profile.phone },
              ].map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest block">{field.label}</label>
                  <div className="flex items-center gap-3 text-white font-bold tracking-widest py-1 border-b border-white/5">
                    <field.icon size={14} className="text-[#5A6A85] shrink-0" />
                    {isEditing ? (
                      <input
                        name={field.name}
                        value={field.value}
                        onChange={handleChange}
                        className="bg-transparent outline-none w-full text-[#10B981] placeholder:text-[#5A6A85]"
                        placeholder={field.label}
                      />
                    ) : (
                      <span className={field.value ? 'text-white text-xs' : 'text-[#5A6A85] text-xs'}>{field.value || 'Не вказано'}</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Address full width */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest block">ЮРИДИЧНА АДРЕСА</label>
                <div className="flex items-center gap-3 text-white font-bold tracking-widest py-1 border-b border-white/5">
                  <MapPin size={14} className="text-[#5A6A85] shrink-0" />
                  {isEditing ? (
                    <input
                      name="address"
                      value={profile.address}
                      onChange={handleChange}
                      className="bg-transparent outline-none w-full text-[#10B981] placeholder:text-[#5A6A85]"
                      placeholder="ЮРИДИЧНА АДРЕСА КОМПАНІЇ"
                    />
                  ) : (
                    <span className={profile.address ? 'text-white text-xs uppercase' : 'text-[#5A6A85] text-xs'}>{profile.address || 'Не вказано'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bank details */}
          <div className="bg-[#1A2639]/30 border border-white/5 rounded-[40px] p-10">
            <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-3 mb-10">
              <CreditCard size={18} className="text-[#FBBF24]" /> БАНКІВСЬКІ РЕКВІЗИТИ (IBAN)
            </h4>
            <div className="bg-[#1A2639]/60 border border-white/5 p-8 rounded-[24px] relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest">ОСНОВНИЙ РАХУНОК</p>
                  <span className="px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-[8px] font-black uppercase tracking-widest">
                    {profile.iban ? 'ВЕРИФІКОВАНО' : 'НЕ ВКАЗАНО'}
                  </span>
                </div>
                {isEditing ? (
                  <input
                    name="iban"
                    value={profile.iban}
                    onChange={handleChange}
                    placeholder="UA 00 000000 00000 0000 0000 0000 00"
                    className="bg-transparent border-b border-white/20 outline-none w-full text-[#10B981] text-xl font-mono py-1 placeholder:text-[#5A6A85] placeholder:text-sm"
                  />
                ) : (
                  <div className="text-xl font-bold tracking-widest text-[#E8EDF5] font-mono overflow-hidden text-ellipsis">
                    {profile.iban || <span className="text-[#5A6A85] text-sm">НЕ ВКАЗАНО</span>}
                  </div>
                )}

                <div className="flex gap-12 pt-4">
                  <div>
                    <p className="text-[8px] font-black text-[#5A6A85] uppercase tracking-widest mb-1">ОТРИМУВАЧ</p>
                    <p className="text-xs font-bold text-white uppercase truncate max-w-[150px] tracking-widest">
                      {profile.companyName || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-[#5A6A85] uppercase tracking-widest mb-1">МФО</p>
                    {isEditing ? (
                      <input
                        name="mfo"
                        value={profile.mfo}
                        onChange={handleChange}
                        className="bg-transparent border-b border-white/20 outline-none w-[100px] text-[#10B981] text-xs font-bold py-1 tracking-widest"
                        placeholder="000000"
                      />
                    ) : (
                      <p className="text-xs font-bold text-white tracking-widest">{profile.mfo || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <button
                onClick={handleSave}
                className="mt-6 w-full py-4 bg-[#10B981] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <Check size={14} /> ЗБЕРЕГТИ ВСІ ЗМІНИ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
