import React from 'react';
import {
  Bell,
  Lock,
  MessageSquare,
  Send,
  Shield,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const features = [
  {
    title: 'Особисті та групові чати',
    description: 'Спілкування з попутниками та відправниками посилок в одному місці.',
    icon: MessageSquare,
  },
  {
    title: 'Зв’язок із перевізником',
    description: 'Прямий контакт із водієм і диспетчером після бронювання.',
    icon: Send,
  },
  {
    title: 'Приватність за замовчуванням',
    description: 'Ваш номер телефону й email залишаються конфіденційними.',
    icon: Lock,
  },
  {
    title: 'Повідомлення в реальному часі',
    description: 'Миттєва синхронізація, статус прочитання та вкладення.',
    icon: Sparkles,
  },
];

export const MessagesView: React.FC = () => {
  const handleNotifyMe = () => {
    toast.success('Дякуємо! Ви першими отримаєте доступ до BUSNET MESSENGER.');
  };

  return (
    <section
      aria-labelledby="messages-heading"
      className="mx-auto w-full max-w-5xl"
    >
      <div className="relative isolate overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#0c1420] shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-36 -z-10 h-96 w-96 rounded-full bg-cyan-300/[0.08] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-28 -z-10 h-80 w-80 rounded-full bg-blue-500/[0.06] blur-3xl"
        />

        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:p-10">
          <div className="flex flex-col items-start">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/[0.08] text-cyan-100 shadow-[0_0_36px_rgba(34,211,238,0.12)]">
              <MessageSquare className="h-6 w-6" aria-hidden="true" />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100/80">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Етап 2 · Готується до запуску</span>
            </div>

            <h1
              id="messages-heading"
              className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              BUSNET{' '}
              <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                MESSENGER
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-[15px]">
              Вбудований простір для спілкування пасажирів, водіїв і перевізників. Зв’язуйтеся напряму — без сторонніх додатків.
            </p>

            <button
              type="button"
              onClick={handleNotifyMe}
              className="mt-7 inline-flex min-h-11 items-center justify-center gap-2.5 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_8px_28px_rgba(34,211,238,0.16)] transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1420]"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span>Сповістити мене про запуск</span>
            </button>
          </div>

          <div className="flex flex-col justify-center gap-3">
            <div className="mb-1 flex items-center gap-2 px-1">
              <Shield className="h-4 w-4 text-cyan-200" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Створено для подорожей
              </h2>
            </div>

            {features.map((feature) => {
              const FeatureIcon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-cyan-200/15 hover:bg-white/[0.04] sm:p-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#080d15]/70 text-cyan-200 transition-colors group-hover:border-cyan-200/20 group-hover:bg-cyan-200/[0.06]">
                    <FeatureIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-sm font-semibold text-slate-100">{feature.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{feature.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/[0.07] bg-black/[0.12] px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" aria-hidden="true" />
            BUSNET MESSENGER
          </span>
          <span>Спілкування для кожного етапу вашої подорожі</span>
        </div>
      </div>
    </section>
  );
};
