/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Mail, Phone, MapPin, CreditCard, ShieldCheck, 
  Edit, Camera, Activity, FileText, Check, X, Loader2, Upload, AlertCircle, Copy
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';

const ProfileTab: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);
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

  // Requisites real-time validation error state
  const [validationErrors, setValidationErrors] = useState({
    taxId: '',
    phone: '',
    iban: '',
    mfo: ''
  });

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

  // Requisite validate function
  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'taxId') {
      if (value && !/^\d{8}$|^\d{10}$/.test(value)) {
        error = 'Код ЄДРПОУ має містити 8 або 10 цифр';
      }
    } else if (name === 'mfo') {
      if (value && !/^\d{6}$/.test(value)) {
        error = 'МФО має містити рівно 6 цифр';
      }
    } else if (name === 'iban') {
      const cleanIban = value.replace(/\s+/g, '');
      if (cleanIban && !/^UA\d{27}$/i.test(cleanIban)) {
        error = 'IBAN має починатися з UA та містити 29 символів';
      }
    } else if (name === 'phone') {
      if (value && !/^\+?\d{10,13}$/.test(value)) {
        error = 'Введіть коректний номер телефону (напр. +380990000000)';
      }
    }
    setValidationErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Final check for errors
    const hasErrors = Object.values(validationErrors).some(err => err !== '');
    if (hasErrors) {
      toast.error('Будь ласка, виправте помилки валідації реквізитів');
      return;
    }

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
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Auto-format Ukrainian IBAN (spaces every 4 chars)
    if (name === 'iban') {
      const uppercase = value.toUpperCase();
      const clean = uppercase.replace(/[^A-Z0-9]/g, '');
      const matched = clean.match(/.{1,4}/g);
      formattedValue = matched ? matched.join(' ') : clean;
    }
    
    // Auto-filter digits for EDRPOU and MFO
    if (name === 'taxId' || name === 'mfo') {
      formattedValue = value.replace(/\D/g, '');
    }

    setProfile({ ...profile, [name]: formattedValue });
    validateField(name, formattedValue);
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
    setUploadProgress(15);
    const toastId = toast.loading('Завантаження логотипу...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.uid}-${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      setUploadProgress(70);

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

  const handleCopyIban = () => {
    if (!profile.iban) return;
    // Clean IBAN formatting spaces before copying
    navigator.clipboard.writeText(profile.iban.replace(/\s+/g, ''));
    setCopiedIban(true);
    toast.success('IBAN скопійовано в буфер обміну');
    setTimeout(() => setCopiedIban(false), 2000);
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

  const hasErrors = Object.values(validationErrors).some(err => err !== '');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-6 bg-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">ПРОФІЛЬ КОМПАНІЇ</h2>
          </div>
          <p className="text-[#5A6A85] text-[11px] font-black uppercase tracking-[0.12em] ml-4 font-bold">Управління банківськими реквізитами з валідацією та інформацією перевізника</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column logo */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1A2639]/30 border border-white/5 rounded-[40px] p-8 flex flex-col items-center text-center shadow-xl">
            {/* Logo with upload overlay */}
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-[#00E5FF] to-[#6366F1] flex items-center justify-center text-5xl font-black text-white shadow-2xl overflow-hidden uppercase">
                {profile.logoUrl ? (
                  <img src={profile.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-[32px]">
                    <Loader2 className="animate-spin text-white mb-1" size={24} />
                    <span className="text-white text-xs font-bold font-mono">{uploadProgress}%</span>
                  </div>
                )}
              </div>

              {!uploadingLogo && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-[32px] gap-2 active:scale-95"
                >
                  <Camera size={22} className="text-[#00E5FF]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#00E5FF]">Завантажити</span>
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

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="mb-4 flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-[#8899B5] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50 shadow-lg active:scale-95 font-bold"
            >
              <Upload size={12} />
              {uploadingLogo ? `ЗАВАНТАЖЕННЯ...` : 'ЗМІНИТИ ЛОГОТИП'}
            </button>
            <p className="text-[9px] text-[#5A6A85] font-black uppercase tracking-widest mb-6">JPG, PNG АБО SVG · МАКС. 2 МБ</p>

            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">{profile.companyName || user?.email || 'Ваша компанія'}</h3>
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] text-[9px] font-black rounded-full uppercase border border-[#10B981]/20">АКТИВНИЙ</span>
              <span className="px-3 py-1 bg-[#00E5FF]/10 text-[#00E5FF] text-[9px] font-black rounded-full uppercase border border-[#00E5FF]/20 shadow-[0_0_10px_rgba(0,229,255,0.15)]">PREMIUM</span>
            </div>

            <div className="w-full space-y-3.5 pt-6 border-t border-white/5 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#5a6a85] font-black uppercase tracking-widest text-[9px] font-sans font-bold">ID Партнера</span>
                <span className="text-white font-bold text-[10px] truncate ml-2 max-w-[120px]">{user?.uid || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#5a6a85] font-black uppercase tracking-widest text-[9px] font-sans font-bold">Email</span>
                <span className="text-white font-bold text-[10px] truncate ml-2 max-w-[140px] font-sans">{user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#5a6a85] font-black uppercase tracking-widest text-[9px] font-sans font-bold">Реєстрація</span>
                <span className="text-white font-bold text-[10px] tabular-nums font-sans">
                  {user?.createdAt
                    ? new Date(parseInt(user?.createdAt as string)).toLocaleDateString('uk-UA')
                    : 'Нещодавно'}
                </span>
              </div>
            </div>
          </div>

          {/* Verification indicator */}
          <div className="bg-[#1A2639]/50 border border-[#10B981]/20 rounded-[40px] p-8 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
            <h4 className="text-[9px] font-black uppercase text-[#10B981] tracking-widest mb-4 font-bold">СТАТУС ВЕРИФІКАЦІЇ</h4>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#10B981]/10 flex items-center justify-center text-[#10B981] border border-[#10B981]/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-widest">ПОВНА ВЕРИФІКАЦІЯ</p>
                <p className="text-[9px] text-[#10B981] font-black uppercase tracking-widest mt-0.5 font-bold">ДОКУМЕНТИ ПІДТВЕРДЖЕНО</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/docs')}
              className="w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-[#8899B5] hover:bg-white/10 hover:text-white transition-all shadow-lg active:scale-95 font-bold"
            >
              ПЕРЕГЛЯНУТИ ДОКУМЕНТИ
            </button>
          </div>
        </div>

        {/* Right column Form with Requisites Val */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Info */}
          <div className="bg-[#0B1221] border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-3">
                <FileText size={18} className="text-[#10B981]" /> ОСНОВНА ІНФОРМАЦІЯ
              </h4>
              {isEditing ? (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSave} 
                    disabled={hasErrors}
                    className="p-3 rounded-xl bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981] hover:text-white transition-all shadow-lg border border-[#10B981]/20 active:scale-95 disabled:opacity-40" 
                    title="Зберегти"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setValidationErrors({ taxId: '', phone: '', iban: '', mfo: '' });
                    }} 
                    className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg border border-rose-500/20 active:scale-95" 
                    title="Скасувати"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="p-3 rounded-xl bg-white/5 border border-white/5 text-[#8899B5] hover:text-white hover:bg-white/10 hover:border-white/10 transition-all shadow-lg active:scale-95" 
                  title="Редагувати"
                >
                  <Edit size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {[
                { label: 'НАЗВА КОМПАНІЇ', name: 'companyName', icon: Building2, value: profile.companyName, error: '' },
                { label: 'КОД ЄДРПОУ / TAX ID', name: 'taxId', icon: Activity, value: profile.taxId, error: validationErrors.taxId },
                { label: "EMAIL ДЛЯ ЗВ'ЯЗКУ", name: 'email', icon: Mail, value: profile.email, error: '' },
                { label: 'ТЕЛЕФОН', name: 'phone', icon: Phone, value: profile.phone, error: validationErrors.phone },
              ].map((field) => (
                <div key={field.name} className="space-y-2">
                  <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest block font-bold">{field.label}</label>
                  <div className={`flex items-center gap-3 text-white font-bold tracking-widest py-2 border-b transition-all ${
                    field.error ? 'border-rose-500' : isEditing ? 'border-[#10B981]/40 focus-within:border-[#10B981]' : 'border-white/5'
                  }`}>
                    <field.icon size={14} className="text-[#5A6A85] shrink-0" />
                    {isEditing ? (
                      <input
                        name={field.name}
                        value={field.value}
                        onChange={handleChange}
                        className="bg-transparent outline-none w-full text-white text-xs placeholder:text-[#5A6A85] font-sans font-bold"
                        placeholder={field.label}
                      />
                    ) : (
                      <span className={field.value ? 'text-white text-xs' : 'text-[#5A6A85] text-xs'}>{field.value || 'Не вказано'}</span>
                    )}
                  </div>
                  {field.error && (
                    <p className="text-rose-400 text-[9px] font-black uppercase flex items-center gap-1 mt-1 font-bold">
                      <AlertCircle size={10} /> {field.error}
                    </p>
                  )}
                </div>
              ))}

              <div className="space-y-2 md:col-span-2">
                <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest block font-bold">ЮРИДИЧНА АДРЕСА</label>
                <div className={`flex items-center gap-3 text-white font-bold tracking-widest py-2 border-b ${isEditing ? 'border-[#10B981]/40 focus-within:border-[#10B981]' : 'border-white/5'}`}>
                  <MapPin size={14} className="text-[#5A6A85] shrink-0" />
                  {isEditing ? (
                    <input
                      name="address"
                      value={profile.address}
                      onChange={handleChange}
                      className="bg-transparent outline-none w-full text-white text-xs placeholder:text-[#5A6A85] font-sans font-bold uppercase"
                      placeholder="ЮРИДИЧНА АДРЕСА КОМПАНІЇ"
                    />
                  ) : (
                    <span className={profile.address ? 'text-white text-xs uppercase' : 'text-[#5A6A85] text-xs'}>{profile.address || 'Не вказано'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details with real-time format/validator */}
          <div className="bg-[#0B1221] border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-3 mb-8">
              <CreditCard size={18} className="text-[#FBBF24]" /> БАНКІВСЬКІ РЕКВІЗИТИ (IBAN)
            </h4>
            <div className={`bg-black/40 border p-6 rounded-[24px] relative overflow-hidden transition-all duration-300 ${
              validationErrors.iban ? 'border-rose-500/50' : profile.iban && !validationErrors.iban ? 'border-[#10B981]/40' : 'border-white/5'
            }`}>
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest font-bold">ОСНОВНИЙ РАХУНОК УКРАЇНИ</p>
                  <span className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${
                    validationErrors.iban ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                    profile.iban ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'bg-white/5 text-[#5A6A85] border-white/5'
                  }`}>
                    {validationErrors.iban ? 'ПОМИЛКА IBAN' : profile.iban ? 'ВКАЗАНО' : 'НЕ ВКАЗАНО'}
                  </span>
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      name="iban"
                      value={profile.iban}
                      onChange={handleChange}
                      placeholder="UA00 0000 0000 0000 0000 0000 0000 0"
                      className="bg-transparent border-b border-white/10 outline-none w-full text-white text-lg font-mono py-1.5 placeholder:text-[#5A6A85] placeholder:text-sm focus:border-[#10B981] transition-all"
                    />
                    {validationErrors.iban && (
                      <p className="text-rose-400 text-[9px] font-black uppercase flex items-center gap-1 font-bold">
                        <AlertCircle size={10} /> {validationErrors.iban}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-base md:text-lg font-bold tracking-widest text-[#E8EDF5] font-mono overflow-hidden text-ellipsis select-all">
                      {profile.iban || <span className="text-[#5A6A85] text-sm font-sans">НЕ ВКАЗАНО</span>}
                    </div>
                    {profile.iban && (
                      <button
                        onClick={handleCopyIban}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#8899B5] hover:text-white hover:bg-white/10 transition-all shrink-0 active:scale-95 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest font-sans font-bold"
                        title="Скопіювати IBAN"
                      >
                        {copiedIban ? <Check size={12} className="text-[#10B981]" /> : <Copy size={12} />}
                        {copiedIban ? 'СКОПІЙОВАНО' : 'КОПІЮВАТИ'}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-12 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[8px] font-black text-[#5A6A85] uppercase tracking-widest mb-1 font-bold">ОТРИМУВАЧ</p>
                    <p className="text-xs font-bold text-white uppercase truncate max-w-[180px] tracking-widest">
                      {profile.companyName || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-[#5A6A85] uppercase tracking-widest mb-1 font-bold">КОД МФО БАНКУ</p>
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          name="mfo"
                          value={profile.mfo}
                          onChange={handleChange}
                          className="bg-transparent border-b border-white/10 focus:border-[#10B981] outline-none w-[100px] text-white text-xs font-bold py-1 tracking-widest font-mono"
                          placeholder="000000"
                        />
                        {validationErrors.mfo && (
                          <p className="text-rose-400 text-[8px] font-black uppercase flex items-center gap-1 font-bold">
                            <AlertCircle size={8} /> {validationErrors.mfo}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-white tracking-widest font-mono">{profile.mfo || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <button
                onClick={handleSave}
                disabled={hasErrors}
                className="mt-6 w-full py-4 bg-[#10B981] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95 font-bold disabled:opacity-40 disabled:cursor-not-allowed"
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
