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
        .eq('carrierId', user.uid);
      
      if (!error && data) {
        setDocuments((data as any[]).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)));
      }
      setLoading(false);
    };

    fetchDocs();

    const channel = supabase.channel('carrier_docs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carrier_documents', filter: `carrierId=eq.${user.uid}` }, fetchDocs)
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
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-cyan-500 rounded-full" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-syne">ПАКЕТ ДОКУМЕНТІВ</h2>
          </div>
          <p className="text-[#5a6a85] text-sm font-medium tracking-wide ml-5 uppercase tracking-widest">Ліцензії, договори та юридичні документи</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-8 py-3 bg-[#00c8ff] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all shadow-lg flex items-center gap-2"
        >
          <Upload size={14} /> Завантажити документ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-[#111520] border border-cyan-500/20 p-6 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4"><ShieldCheck size={20} /></div>
          <p className="text-[9px] font-black uppercase text-[#5a6a85] tracking-widest mb-1">Верифікація</p>
          <h4 className="text-sm font-bold text-white">{verifiedCount > 0 ? 'Пройдена' : 'Не пройдена'}</h4>
        </div>
        <div className="bg-[#111520] border border-white/5 p-6 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-[#00e676]/10 flex items-center justify-center text-[#00e676] mb-4"><CheckCircle2 size={20} /></div>
          <p className="text-[9px] font-black uppercase text-[#5a6a85] tracking-widest mb-1">Верифіковані</p>
          <h4 className="text-sm font-bold text-white">{String(verifiedCount).padStart(2, '0')} документи</h4>
        </div>
        <div className="bg-[#111520] border border-white/5 p-6 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4"><Clock size={20} /></div>
          <p className="text-[9px] font-black uppercase text-[#5a6a85] tracking-widest mb-1">На перевірці</p>
          <h4 className="text-sm font-bold text-white">{String(pendingCount).padStart(2, '0')} документи</h4>
        </div>
        <div className="bg-[#111520] border border-white/5 p-6 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4"><AlertCircle size={20} /></div>
          <p className="text-[9px] font-black uppercase text-[#5a6a85] tracking-widest mb-1">Потребують уваги</p>
          <h4 className="text-sm font-bold text-white">{String(warningCount).padStart(2, '0')} документи</h4>
        </div>
      </div>

      {/* Documents table */}
      <div className="bg-[#111520] border border-white/5 rounded-[40px] overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="animate-spin text-cyan-400" size={32} />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <FileIcon className="mx-auto mb-4 text-[#3d5670]" size={48} />
            <p className="text-[#5a6a85] font-bold uppercase tracking-widest text-sm mb-2">Документи не завантажені</p>
            <p className="text-[#3d5670] text-xs mb-6">Завантажте ліцензії та юридичні документи для верифікації</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
            >
              <Upload size={14} className="inline mr-2" />Завантажити перший документ
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5">
                  <th className="py-4 px-8 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Назва</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Формат</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Завантажено</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Термін дії</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Статус</th>
                  <th className="py-4 px-6 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {documents.map((docItem) => (
                  <tr key={docItem.id} className="group hover:bg-white/[0.01] transition-all">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                          <FileIcon size={18} />
                        </div>
                        <p className="text-sm font-bold text-white">{docItem.name}</p>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-black text-[#8899b5] uppercase">
                        {docItem.type} · {docItem.size}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-xs font-bold text-[#5a6a85] uppercase">{docItem.uploadedAt}</td>
                    <td className="py-5 px-6 text-xs font-bold text-[#5a6a85]">{docItem.expiryDate || '—'}</td>
                    <td className="py-5 px-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase ${STATUS_MAP[docItem.status]?.color || STATUS_MAP.pending.color}`}>
                        {STATUS_MAP[docItem.status]?.icon}
                        {STATUS_MAP[docItem.status]?.label}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <a
                          href={docItem.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl text-[#3d5670] hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                          title="Переглянути"
                        >
                          <Eye size={16} />
                        </a>
                        <a
                          href={docItem.downloadUrl}
                          download
                          className="p-2 rounded-xl text-[#3d5670] hover:text-[#00e676] hover:bg-[#00e676]/10 transition-all"
                          title="Завантажити"
                        >
                          <Download size={16} />
                        </a>
                        <button
                          onClick={() => handleDelete(docItem)}
                          disabled={deletingId === docItem.id}
                          className="p-2 rounded-xl text-[#3d5670] hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-40"
                          title="Видалити"
                        >
                          {deletingId === docItem.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget && !uploading) setShowUploadModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111520] border border-white/10 rounded-[40px] p-10 w-full max-w-md space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Завантажити документ</h3>
                {!uploading && (
                  <button onClick={() => setShowUploadModal(false)} className="w-8 h-8 rounded-xl bg-white/5 text-[#5a6a85] hover:text-white transition-colors flex items-center justify-center">
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Drop zone */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${selectedFile ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5'} ${uploading ? 'pointer-events-none' : ''}`}
              >
                {uploading ? (
                  <div className="space-y-3">
                    <Loader2 className="mx-auto animate-spin text-cyan-400" size={32} />
                    <p className="text-sm font-bold text-white">{uploadingFileName}</p>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-cyan-400 font-black text-sm">{uploadProgress}%</p>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="mx-auto text-cyan-400" size={32} />
                    <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                    <p className="text-xs text-[#5a6a85]">{(selectedFile.size / 1024 / 1024).toFixed(2)} МБ</p>
                    <p className="text-[10px] text-cyan-400 font-bold uppercase">Натисніть щоб замінити</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="mx-auto text-[#3d5670]" size={32} />
                    <p className="text-sm font-bold text-[#8899b5]">Натисніть або перетягніть файл</p>
                    <p className="text-[10px] text-[#3d5670] uppercase font-bold">PDF, JPG, PNG, ZIP · До {MAX_SIZE_MB} МБ</p>
                  </div>
                )}
              </div>
              {fileError && <p className="text-rose-400 text-[10px] font-bold flex items-center gap-1"><AlertCircle size={10} />{fileError}</p>}

              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.zip" className="hidden" onChange={handleFileSelect} />

              {/* Doc name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Назва документа *</label>
                <input
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="напр. Ліцензія на перевезення"
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-5 text-sm font-medium text-white outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              {/* Expiry date */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#5a6a85] uppercase tracking-widest">Термін дії (необов'язково)</label>
                <input
                  type="date"
                  value={docExpiry}
                  onChange={(e) => setDocExpiry(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-3 px-5 text-sm font-medium text-white outline-none focus:border-cyan-500 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => !uploading && setShowUploadModal(false)}
                  disabled={uploading}
                  className="flex-1 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-[#8899b5] hover:text-white transition-all disabled:opacity-40"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || !docName.trim() || uploading}
                  className="flex-1 py-3 bg-[#00c8ff] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                  {uploading ? `${uploadProgress}%` : 'Завантажити'}
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

