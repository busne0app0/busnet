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
      icon: Search,
      color: 'text-cyan-400',
      glow: 'shadow-cyan-500/20',
      border: 'border-cyan-500/30'
    },
    {
      id: "02",
      title: t.neuralWorkflow.steps[1].title,
      text: t.neuralWorkflow.steps[1].text,
      icon: Ticket,
      color: 'text-purple-400',
      glow: 'shadow-purple-500/20',
      border: 'border-purple-500/30'
    },
    {
      id: "03",
      title: t.neuralWorkflow.steps[2].title,
      text: t.neuralWorkflow.steps[2].text,
      icon: Bus,
      color: 'text-orange-400',
      glow: 'shadow-orange-500/20',
      border: 'border-orange-500/30'
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden w-full flex flex-col items-center">
      
      {/* Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight italic text-gradient-silver pr-6"
          >
            {t.neuralWorkflow.title} {t.neuralWorkflow.titleAccent}?
          </motion.h2>
        </div>

        {/* Workflow Container */}
        <div className="relative">
          
          {/* Main Flow Line (Desktop) */}
          <div className="hidden lg:block absolute top-[60px] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent overflow-hidden">
             <div className="absolute inset-0 w-40 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-move-line" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex flex-col items-center group relative"
              >
                {/* Node Section */}
                <div className="relative mb-12 lg:mb-20">
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
                    
                    {/* Lightning Bolts on Line Interaction (Hidden on mobile) */}
                    <div className="hidden lg:flex absolute -bottom-8 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black/60 border border-white/10 items-center justify-center z-20">
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
                  <p className="text-slate-400 text-sm leading-relaxed font-light relative z-10 flex flex-wrap gap-x-1">
                    {/* Parsing text for highlight parts if any, but default to simple for now */}
                    {step.text.split('—').map((part, i, arr) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && <span className="text-cyan-400 font-medium">AI аналізує</span>}
                      </React.Fragment>
                    ))}
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
