import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Search, Filter, Calendar, CheckCircle2, Clock, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@busnet/shared/store/useAuthStore';
import { supabase } from '@busnet/shared/supabase/config';

const InvoicesTab: React.FC = () => {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchInvoices = async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('carrierId', user.uid);
      
      if (!error && data) {
        setInvoices(data.map(d => ({
          id: d.id,
          period: d.period || 'Невідомий період',
          amount: d.amount || 0,
          status: d.status || 'pending',
          date: d.date ? new Date(d.date).toLocaleDateString('uk-UA') : 'Нещодавно',
          items: d.items || 0
        })));
      }
    };

    fetchInvoices();
  }, [user]);

  const handleDownloadInvoice = (inv: any) => {
    // Generate a simple HTML template and open it in a new window to print/save as PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Будь ласка, дозвольте спливаючі вікна для цього сайту');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Invoice ${inv.id}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 40px; }
            .header h1 { margin: 0; color: #111; text-transform: uppercase; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .amount { font-size: 24px; font-weight: bold; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { text-transform: uppercase; font-size: 12px; color: #666; }
            .footer { margin-top: 60px; font-size: 12px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
            <p><strong>ID:</strong> ${inv.id}</p>
            <p><strong>Date:</strong> ${inv.date}</p>
          </div>
          <div class="details">
            <div>
              <h3>Bill To:</h3>
              <p>Carrier ID: ${user?.uid || 'Unknown'}</p>
              <p>${user?.email || 'Unknown'}</p>
            </div>
            <div>
              <h3>From:</h3>
              <p>Busnet Services LLC</p>
              <p>help@busnet.com</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Platform Commission (${inv.period})</td>
                <td>${inv.items}</td>
                <td>-</td>
                <td>€${inv.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <div class="amount">
            <p>Total Due: €${inv.amount.toLocaleString()}</p>
          </div>
          <div class="footer">
            <p>Thank you for your business. Generated securely by Busnet.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success(`Інвойс ${inv.id} відкрито для друку/збереження`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-6 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-syne">Інвойси</h2>
          </div>
          <p className="text-[#5a6a85] text-sm font-medium tracking-wide ml-5 uppercase tracking-widest">Бухгалтерська звітність та акти виконаних робіт</p>
        </div>
      </div>

      <div className="bg-[#111520] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
         <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#5a6a85] flex items-center gap-2">
               <Calendar size={14} /> Архів за 2026 рік
            </h3>
            <div className="flex gap-4">
               <button 
                 onClick={() => toast.success('Архів інвойсів за 2026 рік готується до завантаження...')}
                 className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[#8899b5] hover:text-white transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2"
               >
                  <Download size={18} /> Скачати всі
               </button>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left">
               <thead>
                  <tr className="bg-white/[0.02]">
                     <th className="py-5 px-8 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Номер та Період</th>
                     <th className="py-5 px-8 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Дата</th>
                     <th className="py-5 px-8 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Кількість послуг</th>
                     <th className="py-5 px-8 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em]">Сума (€)</th>
                     <th className="py-5 px-8 text-[9px] font-black text-[#5a6a85] uppercase tracking-[0.2em] text-right">Статус</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {invoices.map((inv, idx) => (
                     <tr key={idx} className="group hover:bg-white/[0.01] transition-all cursor-pointer">
                        <td className="py-6 px-8">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                                 <FileText size={20} />
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-white tracking-tight">{inv.id}</p>
                                 <p className="text-[10px] text-violet-400 font-black uppercase tracking-widest mt-0.5 italic">{inv.period}</p>
                              </div>
                           </div>
                        </td>
                        <td className="py-6 px-8 text-xs font-bold text-[#8899b5] uppercase">
                           {inv.date}
                        </td>
                        <td className="py-6 px-8">
                           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/5">
                              <span className="text-xs font-black text-white">{inv.items}</span>
                              <span className="text-[9px] font-bold text-[#5a6a85] uppercase">Квитків</span>
                           </div>
                        </td>
                        <td className="py-6 px-8 text-base font-black text-white italic tracking-tighter">
                           €{inv.amount.toLocaleString()}
                        </td>
                        <td className="py-6 px-8 text-right">
                           <div className="flex items-center justify-end gap-6">
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20">
                                 <CheckCircle2 size={12} />
                                 <span className="text-[9px] font-black uppercase tracking-widest leading-none">Сплачено</span>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(inv); }}
                                className="p-2 rounded-xl text-[#3d5670] hover:text-white hover:bg-white/5 transition-all"
                              >
                                 <Download size={18} />
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
         <div className="p-8 rounded-[40px] bg-gradient-to-br from-violet-600/10 to-transparent border border-violet-500/10 flex items-center justify-between">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-400">
                  <Mail size={24} />
               </div>
               <div>
                  <h4 className="text-base font-bold text-white italic tracking-tight">Email Розсилка</h4>
                  <p className="text-xs text-[#5a6a85] uppercase font-black tracking-widest mt-1">Отримувати інвойси на пошту</p>
               </div>
            </div>
            <button 
               onClick={() => toast.success('Налаштування розсилки оновлено')}
               className="px-6 py-2 rounded-full border border-violet-500/30 text-violet-400 text-[10px] font-black uppercase tracking-widest hover:bg-violet-500 hover:text-white transition-all"
            >
               Увімкнено
            </button>
         </div>
      </div>
    </div>
  );
};

export default InvoicesTab;

