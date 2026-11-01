import React from 'react';
import { motion } from 'framer-motion';
import { Search, Ticket, Bus, Zap } from 'lucide-react';
import { useLanguage } from '@busnet/shared/context/LanguageContext';

export default function NeuralWorkflow() {
  const { t } = useLanguage();

  const workflowSteps = [
    {
      id: "01",
      title: t.neuralWorkflow.steps[0].title,
      text: t.neuralWorkflow.steps[0].text,
      highlight: t.neuralWorkflow.steps[0].highlight,
      icon: Search,
      color: 'text-cyan-400',
      glow: 'shadow-cyan-500/20',
      border: 'border-cyan-500/30',
      line: 'from-cyan-400/70 to-purple-400/70',
      dot: 'bg-cyan-300 text-cyan-300'
    },
    {
      id: "02",
      title: t.neuralWorkflow.steps[1].title,
      text: t.neuralWorkflow.steps[1].text,
      highlight: t.neuralWorkflow.steps[1].highlight,
      icon: Ticket,
      color: 'text-purple-400',
      glow: 'shadow-purple-500/20',
      border: 'border-purple-500/30',
      line: 'from-purple-400/70 to-orange-400/70',
      dot: 'bg-purple-300 text-purple-300'
    },
    {
      id: "03",
      title: t.neuralWorkflow.steps[2].title,
      text: t.neuralWorkflow.steps[2].text,
      highlight: t.neuralWorkflow.steps[2].highlight,
      icon: Bus,
      color: 'text-orange-400',
      glow: 'shadow-orange-500/20',
      border: 'border-orange-500/30',
      line: '',
      dot: ''
    }
  ];

  const renderStepText = (text: string, highlight: string) => {
    if (!text) return null;
    const parts = text.split('{highlight}');
    if (parts.length === 1) return <>{text}</>;

    return (
      <>
        {parts[0]}
        <span className="text-cyan-400 font-medium">{highlight}</span>
        {parts[1]}
      </>
    );
  };

  return (
    <section className="py-8 sm:py-24 relative overflow-hidden w-full flex flex-col items-center">

      {/* Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center mb-6 sm:mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight italic text-gradient-silver"
          >
            {t.neuralWorkflow.title} {t.neuralWorkflow.titleAccent}?
          </motion.h2>
        </div>

        {/* ТЕЛЕФОН І ПЛАНШЕТ: компактна вертикальна лінія часу */}
        <div className="lg:hidden relative max-w-xl mx-auto">
          <ol className="flex flex-col gap-3">
            {workflowSteps.map((step, index) => (
              <motion.li
                key={step.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                className="relative flex items-start gap-3"
              >
                {/* З'єднувач до наступного кроку: закінчується на останньому колі, без «хвоста» */}
                {index < workflowSteps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={`absolute left-6 -translate-x-1/2 top-12 -bottom-3 w-px bg-gradient-to-b ${step.line}`}
                  />
                )}

                {/* Іконка кроку */}
                <div
                  className={`relative z-10 shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-[#0a0f1a] border ${step.border}`}
                >
                  <step.icon className={`w-6 h-6 ${step.color}`} strokeWidth={1.5} />
                </div>

                {/* Текст кроку */}
                <div className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-base font-black text-white mb-1.5 uppercase tracking-normal">
                    {step.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {renderStepText(step.text, step.highlight)}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* КОМП'ЮТЕР: великі вузли з лінією, як раніше */}
        <div className="relative hidden lg:block">

          <div className="grid grid-cols-3 gap-8">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex flex-col items-center group relative"
              >
                {/* Лінія-з'єднувач до наступного кроку: починається й закінчується поруч із колами, а не перетинає їх */}
                {index < workflowSteps.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={`absolute top-[72px] left-[calc(50%+88px)] w-[calc(100%-144px)] h-px bg-gradient-to-r ${step.line}`}
                  >
                    <motion.span
                      className={`absolute -top-[2px] w-[5px] h-[5px] -ml-[2px] rounded-full shadow-[0_0_8px_currentColor] ${step.dot}`}
                      animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', delay: index * 0.8 }}
                    />
                  </div>
                )}

                {/* Node Section */}
                <div className="relative mb-20">
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -left-4 w-9 h-9 rounded-full bg-black/80 border border-white/10 flex items-center justify-center z-30 shadow-xl">
                    <span className="text-[10px] font-black font-mono text-cyan-400 tracking-tighter">{step.id}</span>
                  </div>

                  {/* Main Node Circle */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotateY: 20 }}
                    className={`w-36 h-36 rounded-full flex items-center justify-center bg-white/[0.03] backdrop-blur-2xl border border-white/10 relative shadow-2xl transition-all duration-300 group-hover:border-white/20`}
                  >
                    <div className={`absolute inset-0 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 ${step.glow} blur-2xl`} />
                    <step.icon className={`w-16 h-16 ${step.color} relative z-10 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`} strokeWidth={1.5} />

                    {/* Lightning Bolts on Line Interaction */}
                    <div className="flex absolute -bottom-8 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/10 items-center justify-center z-20">
                      <Zap size={14} className="text-cyan-400 animate-pulse" />
                    </div>
                  </motion.div>
                </div>

                {/* Card Section */}
                <motion.div
                  whileHover={{ y: -10 }}
                  className="w-full bg-glass-card p-8 rounded-[2.5rem] relative overflow-hidden group-hover:border-indigo-500/50 transition-all duration-500"
                >
                  {/* Background Number (Decorative) */}
                  <div className="absolute -right-4 -top-8 text-[120px] font-black text-white/[0.03] select-none pointer-events-none">
                    {step.id}
                  </div>

                  <h3 className="text-xl font-black text-white mb-4 uppercase tracking-normal relative z-10 group-hover:text-cyan-400 transition-colors pr-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-light relative z-10">
                    {renderStepText(step.text, step.highlight)}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}