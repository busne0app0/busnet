import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, File as FileIcon, Download, Upload, ShieldCheck, AlertCircle, Clock, Trash2, CheckCircle2, Loader2, X, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';

interface CarrierDoc {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'pending' | 'verified' | 'warning' | 'rejected';
  expiryDate?: string;
  uploadedAt: string;
  downloadUrl: string;
  storagePath: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'На перевірці', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <Clock size={12} /> },
  verified: { label: 'Верифіковано', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 size={12} /> },
  warning: { label: 'Увага! Термін', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: <AlertCircle size={12} /> },
  rejected: { label: 'Відхилено', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: <X size={12} /> },
};

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png',
  'application/zip', 'application/x-zip-compressed',
];
const MAX_SIZE_MB = 10;

const DocsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<CarrierDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docExpiry, setDocExpiry] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchDocs = async () => {
      const { data, error } = await supabase
        .from('carrier_documents')
        .select('*')
        .eq('carrier_id', user.uid);
      
      if (!error && data) {
        setDocuments((data as any[]).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)));
      }
      setLoading(false);
    };

    fetchDocs();

    const channel = supabase.channel('carrier_docs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carrier_documents', filter: `carrier_id=eq.${user.uid}` }, fetchDocs)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Дозволені формати: PDF, JPG, PNG, ZIP');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`Файл перевищує ${MAX_SIZE_MB} МБ`);
      return;
    }

    setSelectedFile(file);
    // Auto-fill document name from filename (without extension)
    if (!docName) {
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
      setDocName(nameWithoutExt);
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) return;
    if (!docName.trim()) {
      setFileError('Введіть назву документа');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setUploadingFileName(selectedFile.name);
    const toastId = toast.loading('Завантаження документа...');

    try {
      const ext = selectedFile.name.split('.').pop();
      const storagePath = `carrier_docs/${user.uid}/${Date.now()}_${selectedFile.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('carrier_docs')
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      setUploadProgress(80);

      const { data: { publicUrl } } = supabase.storage
        .from('carrier_docs')
        .getPublicUrl(storagePath);

      const sizeStr = selectedFile.size > 1024 * 1024
        ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} МБ`
        : `${Math.round(selectedFile.size / 1024)} КБ`;

      const { error: dbError } = await supabase
        .from('carrier_documents')
        .insert({
          carrierId: user.uid,
          name: docName.trim(),
          type: (ext || '').toUpperCase(),
          size: sizeStr,
          status: 'pending',
          expiryDate: docExpiry || null,
          uploadedAt: new Date().toLocaleDateString('uk-UA'),
          downloadUrl: publicUrl,
          storagePath
        });

      if (dbError) throw dbError;

      setUploadProgress(100);
      toast.success('Документ успішно завантажено! Очікує перевірки адміном.', { id: toastId });
      setShowUploadModal(false);
      setSelectedFile(null);
      setDocName('');
      setDocExpiry('');
      setFileError('');
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error(error);
      toast.error('Помилка при завантаженні', { id: toastId });
      setUploading(false);
    }
  };

  const handleDelete = async (docItem: CarrierDoc) => {
    if (!confirm(`Видалити документ "${docItem.name}"?`)) return;
    setDeletingId(docItem.id);
    const toastId = toast.loading('Видалення...');
    try {
      if (docItem.storagePath) {
        await supabase.storage.from('carrier_docs').remove([docItem.storagePath]);
      }
      await supabase.from('carrier_documents').delete().eq('id', docItem.id);
      toast.success('Документ видалено', { id: toastId });
    } catch (error) {
      toast.error('Помилка видалення', { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  const verifiedCount = documents.filter(d => d.status === 'verified').length;
  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const warningCount = documents.filter(d => d.status === 'warning').length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="w-12 h-1 bg-[#10B981] mb-4 shadow-[0_0_10px_rgba(16,185,129,0.5)] rounded-full" />
          <h2 className="text-3xl font-black uppercase tracking-widest text-white">ПАКЕТ ДОКУМЕНТІВ</h2>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest mt-2">Ліцензії, договори та юридичні документи</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#10B981] hover:text-white hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <Upload size={16} strokeWidth={2.5} /> ЗАВАНТАЖИТИ ДОКУМЕНТ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-[#1A2639]/30 border border-[#10B981]/20 p-6 rounded-[32px] group hover:bg-[#1A2639]/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] mb-4 border border-[#10B981]/20"><ShieldCheck size={20} /></div>
          <p className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest mb-1">ВЕРИФІКАЦІЯ</p>
          <h4 className="text-lg font-black text-white tracking-widest">{verifiedCount > 0 ? 'ПРОЙДЕНА' : 'НЕ ПРОЙДЕНА'}</h4>
        </div>
        <div className="bg-[#1A2639]/30 border border-white/5 p-6 rounded-[32px] group hover:bg-[#1A2639]/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] mb-4 border border-[#10B981]/20"><CheckCircle2 size={20} /></div>
          <p className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest mb-1">ВЕРИФІКОВАНІ</p>
          <h4 className="text-lg font-black text-white tracking-widest">{String(verifiedCount).padStart(2, '0')} ДОКУМЕНТИ</h4>
        </div>
        <div className="bg-[#1A2639]/30 border border-white/5 p-6 rounded-[32px] group hover:bg-[#1A2639]/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20"><Clock size={20} /></div>
          <p className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest mb-1">НА ПЕРЕВІРЦІ</p>
          <h4 className="text-lg font-black text-white tracking-widest">{String(pendingCount).padStart(2, '0')} ДОКУМЕНТИ</h4>
        </div>
        <div className="bg-[#1A2639]/30 border border-white/5 p-6 rounded-[32px] group hover:bg-[#1A2639]/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4 border border-orange-500/20"><AlertCircle size={20} /></div>
          <p className="text-[9px] font-black uppercase text-[#5A6A85] tracking-widest mb-1">ПОТРЕБУЮТЬ УВАГИ</p>
          <h4 className="text-lg font-black text-white tracking-widest">{String(warningCount).padStart(2, '0')} ДОКУМЕНТИ</h4>
        </div>
      </div>

      {/* Documents table */}
      <div className="bg-transparent overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="animate-spin text-[#10B981]" size={32} />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center bg-[#1A2639]/30 border border-white/5 rounded-[40px]">
            <FileIcon className="mx-auto mb-4 text-[#5A6A85] opacity-20" size={64} />
            <p className="text-[#8899B5] font-black uppercase tracking-widest text-[12px] mb-2">ДОКУМЕНТИ НЕ ЗАВАНТАЖЕНІ</p>
            <p className="text-[#5A6A85] text-[10px] font-bold uppercase tracking-widest mb-6">Завантажте ліцензії та юридичні документи для верифікації</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#10B981]/20 transition-all shadow-lg"
            >
              <Upload size={14} className="inline mr-2" />ЗАВАНТАЖИТИ ПЕРШИЙ ДОКУМЕНТ
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="min-w-[900px] w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-[#1A2639]/30">
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest rounded-l-full">НАЗВА</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">ФОРМАТ</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">ЗАВАНТАЖЕНО</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">ТЕРМІН ДІЇ</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">СТАТУС</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest text-right rounded-r-full">ДІЇ</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((docItem) => (
                  <tr key={docItem.id} className="bg-[#1A2639]/30 hover:bg-[#1A2639]/50 transition-colors group">
                    <td className="py-4 px-6 rounded-l-[16px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981] shrink-0">
                          <FileIcon size={16} />
                        </div>
                        <p className="text-[12px] font-bold text-white uppercase tracking-widest">{docItem.name}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-[#8899B5] uppercase tracking-widest">
                        {docItem.type} · {docItem.size}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[10px] font-black text-[#5A6A85] uppercase tracking-widest">{docItem.uploadedAt}</td>
                    <td className="py-4 px-6 text-[10px] font-black text-[#5A6A85] uppercase tracking-widest">{docItem.expiryDate || '—'}</td>
                    <td className="py-4 px-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${STATUS_MAP[docItem.status]?.color || STATUS_MAP.pending.color}`}>
                        {STATUS_MAP[docItem.status]?.icon}
                        {STATUS_MAP[docItem.status]?.label}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right rounded-r-[16px]">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={docItem.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-full text-[#8899B5] bg-white/[0.03] hover:text-[#10B981] hover:bg-[#10B981]/10 transition-all shadow-lg border border-white/5 hover:border-[#10B981]/20"
                          title="Переглянути"
                        >
                          <Eye size={14} />
                        </a>
                        <a
                          href={docItem.downloadUrl}
                          download
                          className="p-2.5 rounded-full text-[#8899B5] bg-white/[0.03] hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/10 transition-all shadow-lg border border-white/5 hover:border-[#0EA5E9]/20"
                          title="Завантажити"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={() => handleDelete(docItem)}
                          disabled={deletingId === docItem.id}
                          className="p-2.5 rounded-full text-rose-500 bg-rose-500/5 hover:text-white hover:bg-rose-500 transition-all disabled:opacity-40 shadow-lg border border-rose-500/10"
                          title="Видалити"
                        >
                          {deletingId === docItem.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget && !uploading) setShowUploadModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0B1221] border border-[#10B981]/20 rounded-[40px] p-6 md:p-10 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative scrollbar-hide"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-widest text-white">ЗАВАНТАЖИТИ ДОКУМЕНТ</h3>
                {!uploading && (
                  <button onClick={() => setShowUploadModal(false)} className="w-8 h-8 rounded-full bg-white/5 text-[#5A6A85] hover:text-white transition-colors flex items-center justify-center">
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Drop zone */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[32px] p-8 text-center cursor-pointer transition-all ${selectedFile ? 'border-[#10B981]/50 bg-[#10B981]/5' : 'border-white/10 hover:border-[#10B981]/30 hover:bg-[#10B981]/5'} ${uploading ? 'pointer-events-none' : ''}`}
              >
                {uploading ? (
                  <div className="space-y-3">
                    <Loader2 className="mx-auto animate-spin text-[#10B981]" size={32} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white">{uploadingFileName}</p>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div className="bg-[#10B981] h-2 rounded-full transition-all shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-[#10B981] font-black text-[10px] uppercase">{uploadProgress}%</p>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="mx-auto text-[#10B981]" size={32} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white truncate px-4">{selectedFile.name}</p>
                    <p className="text-[9px] font-black tracking-widest text-[#5A6A85]">{(selectedFile.size / 1024 / 1024).toFixed(2)} МБ</p>
                    <p className="text-[9px] text-[#10B981] font-black uppercase tracking-widest">НАТИСНІТЬ ЩОБ ЗАМІНИТИ</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="mx-auto text-[#5A6A85] opacity-50" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8899B5]">НАТИСНІТЬ АБО ПЕРЕТЯГНІТЬ ФАЙЛ</p>
                    <p className="text-[9px] text-[#5A6A85] uppercase font-bold tracking-widest">PDF, JPG, PNG, ZIP · ДО {MAX_SIZE_MB} МБ</p>
                  </div>
                )}
              </div>
              {fileError && <p className="text-rose-400 text-[10px] font-bold flex items-center gap-1"><AlertCircle size={10} />{fileError}</p>}

              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.zip" className="hidden" onChange={handleFileSelect} />

              {/* Doc name */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">НАЗВА ДОКУМЕНТА *</label>
                <input
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="напр. Ліцензія на перевезення"
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-5 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-[#10B981] transition-all"
                />
              </div>

              {/* Expiry date */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">ТЕРМІН ДІЇ (НЕОБОВ'ЯЗКОВО)</label>
                <input
                  type="date"
                  value={docExpiry}
                  onChange={(e) => setDocExpiry(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-5 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-[#10B981] transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => !uploading && setShowUploadModal(false)}
                  disabled={uploading}
                  className="flex-1 py-4 bg-transparent border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#8899B5] hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
                >
                  СКАСУВАТИ
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || !docName.trim() || uploading}
                  className="flex-1 py-4 bg-[#10B981] text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                  {uploading ? `${uploadProgress}%` : 'ЗАВАНТАЖИТИ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocsTab;

