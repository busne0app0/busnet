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
        .eq('carrier_id', user.uid);
      
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

  const handleDownloadAll = () => {
    if (invoices.length === 0) {
      toast.error('Немає інвойсів для завантаження');
      return;
    }
    toast.success('Генерація загального звіту...');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Invoices Archive 2026</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .invoice { page-break-after: always; margin-bottom: 50px; border-bottom: 2px dashed #ccc; padding-bottom: 50px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 40px; }
            .header h1 { margin: 0; color: #111; text-transform: uppercase; }
            .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          ${invoices.map(inv => `
            <div class="invoice">
              <div class="header">
                <h1>INVOICE</h1>
                <p><strong>ID:</strong> ${inv.id}</p>
                <p><strong>Date:</strong> ${inv.date}</p>
              </div>
              <div class="details">
                <div>
                  <h3>Bill To:</h3>
                  <p>Carrier ID: ${user?.uid || 'Unknown'}</p>
                </div>
                <div>
                  <h3>From:</h3>
                  <p>Busnet Services LLC</p>
                </div>
              </div>
              <table>
                <thead><tr><th>Description</th><th>Quantity</th><th>Amount</th></tr></thead>
                <tbody>
                  <tr>
                    <td>Platform Commission (${inv.period})</td>
                    <td>${inv.items}</td>
                    <td>€${inv.amount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              <h2 style="margin-top: 20px">Total Due: €${inv.amount.toLocaleString()}</h2>
            </div>
          `).join('')}
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-[#A855F7] shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">ІНВОЙСИ</h2>
          </div>
          <p className="text-[#5A6A85] text-[10px] font-black uppercase tracking-widest ml-4">Бухгалтерська звітність та акти виконаних робіт</p>
        </div>
      </div>

      <div className="bg-[#0B1221] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl min-h-[400px]">
         <div className="p-6 md:px-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-[#5A6A85] flex items-center gap-3">
               <Calendar size={16} /> АРХІВ ЗА 2026 РІК
            </h3>
            <div className="flex gap-4">
               <button 
                 onClick={handleDownloadAll}
                 className="px-6 py-2.5 rounded-[12px] bg-[#1A2639] text-[#8899B5] hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-transparent hover:border-white/10"
               >
                  <Download size={14} /> СКАЧАТИ ВСІ
               </button>
            </div>
         </div>
         <div className="overflow-x-auto h-full">
            <table className="min-w-[800px] w-full text-left h-full">
               <thead>
                  <tr className="bg-[#1A2639]/30 border-b border-white/5">
                     <th className="py-4 px-8 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">НОМЕР ТА ПЕРІОД</th>
                     <th className="py-4 px-8 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">ДАТА</th>
                     <th className="py-4 px-8 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">КІЛЬКІСТЬ ПОСЛУГ</th>
                     <th className="py-4 px-8 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest">СУМА (€)</th>
                     <th className="py-4 px-8 text-[9px] font-black text-[#5A6A85] uppercase tracking-widest text-right">СТАТУС</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {invoices.map((inv, idx) => (
                     <tr key={idx} className="group hover:bg-[#1A2639]/30 transition-all cursor-pointer">
                        <td className="py-6 px-8">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-[12px] bg-[#A855F7]/10 border border-[#A855F7]/20 flex items-center justify-center text-[#A855F7]">
                                 <FileText size={20} />
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-white tracking-tight">{inv.id}</p>
                                 <p className="text-[9px] text-[#A855F7] font-black uppercase tracking-widest mt-0.5 italic">{inv.period}</p>
                              </div>
                           </div>
                        </td>
                        <td className="py-6 px-8 text-xs font-bold text-[#5A6A85] uppercase">
                           {inv.date}
                        </td>
                        <td className="py-6 px-8">
                           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#1A2639]/50 border border-transparent">
                              <span className="text-xs font-black text-white">{inv.items}</span>
                              <span className="text-[9px] font-bold text-[#5A6A85] uppercase">КВИТКІВ</span>
                           </div>
                        </td>
                        <td className="py-6 px-8 text-sm font-black text-white italic tracking-tighter">
                           €{inv.amount.toLocaleString()}
                        </td>
                        <td className="py-6 px-8 text-right">
                           <div className="flex items-center justify-end gap-4">
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                                 <CheckCircle2 size={12} />
                                 <span className="text-[8px] font-black uppercase tracking-widest leading-none">СПЛАЧЕНО</span>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(inv); }}
                                className="p-2 rounded-[10px] text-[#5A6A85] hover:text-white hover:bg-[#1A2639] transition-all"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
         <div className="p-6 md:p-8 rounded-[32px] bg-[#1A2639]/20 border border-[#A855F7]/20 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 rounded-[16px] bg-[#A855F7]/10 flex items-center justify-center text-[#A855F7]">
                  <Mail size={20} />
               </div>
               <div>
                  <h4 className="text-[13px] font-black text-white italic tracking-tight">Email Розсилка</h4>
                  <p className="text-[9px] text-[#5A6A85] uppercase font-black tracking-widest mt-1">ОТРИМУВАТИ ІНВОЙСИ НА ПОШТУ</p>
               </div>
            </div>
            <button 
               onClick={() => toast.success('Налаштування розсилки оновлено')}
               className="px-6 py-2.5 rounded-full border border-[#A855F7]/30 text-[#A855F7] text-[9px] font-black uppercase tracking-widest hover:bg-[#A855F7] hover:text-white transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)] hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]"
            >
               УВІМКНЕНО
            </button>
         </div>
      </div>
    </div>
  );
};

export default InvoicesTab;

