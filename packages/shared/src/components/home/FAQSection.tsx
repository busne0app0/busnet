import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Sparkles, Bus, CreditCard, Luggage, Dog, ShieldCheck, Clock, MapPin } from 'lucide-react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const faqData: FAQItem[] = [
  {
    id: 'baggage-allowance',
    category: 'Багаж',
    icon: <Luggage className="w-5 h-5 text-neon-cyan" />,
    question: 'Скільки багажу включено у вартість квитка на автобус Україна — Італія?',
    answer: 'У стандартний квиток BUSNET включено:\n• 1 місце ручної поклажі (до 5 кг, розмір до 40×30×20 см) у салон автобуса.\n• 1 або 2 основні валізи в багажне відділення (загальною вагою до 30-40 кг залежно від перевізника, зазвичай сума вимірів до 160 см).\n\nДодатковий багаж або негабаритні речі (велосипеди, побутова техніка) узгоджуються з диспетчером перед поїздкою та оплачуються окремо за тарифом перевізника.'
  },
  {
    id: 'pay-to-driver',
    category: 'Оплата',
    icon: <CreditCard className="w-5 h-5 text-neon-cyan" />,
    question: 'Чи можна забронювати квиток без передоплати та оплатити водієві при посадці?',
    answer: 'Так, у сервісі BUSNET діє зручна послуга безкоштовного онлайн-бронювання місця без введення банківської картки.\n\nВи бронюєте місце на сайті, отримуєте електронний ваучер/квиток із номером місця, а повну вартість поїздки сплачуєте готівкою безпосередньо екіпажу при посадці в автобус (приймаються євро € або гривні ₴ за офіційним курсом рейсу).'
  },
  {
    id: 'departure-stations',
    category: 'Маршрути та вокзали',
    icon: <MapPin className="w-5 h-5 text-neon-cyan" />,
    question: 'Звідки саме відправляються та куди прибувають автобуси у Римі, Мілані, Києві, Львові?',
    answer: 'Регулярні точки посадки та висадки пасажирів:\n• Київ: Центральний автовокзал (Деміївська площа, 3) та АС «Київ» (вул. С. Петлюри, 32 біля залізничного вокзалу).\n• Львів: Центральний автовокзал (вул. Стрийська, 109).\n• Рим (Roma): Міжнародна автостанція Autostazione Tiburtina (Largo Guido Mazzoni).\n• Мілан (Milano): Автостанція Lampugnano (станція метро M1 Lampugnano).\n• Болонья (Bologna): Autostazione di Bologna (Piazza XX Settembre).\n• Неаполь (Napoli): Metropark Centrale (станція Napoli Centrale).\n• Салерно (Salerno): Piazza della Concordia.\n\nТочна адреса платформи, геолокація зупинки та контакти водія вказуються у вашому посадковому талоні.'
  },
  {
    id: 'travel-with-pets',
    category: 'Тварини',
    icon: <Dog className="w-5 h-5 text-neon-cyan" />,
    question: 'Чи дозволено перевезення домашніх тварин (котів, собак) до Італії?',
    answer: 'Так, перевезення котів та невеликих собак (до 8-10 кг) можливе за попереднім погодженням з перевізником. Тварина обов\'язково повинна перебувати в переносці з твердим водонепроникним дном.\n\nВимоги для перетину кордону Україна — ЄС (Італія):\n1. Міжнародний ветеринарний паспорт встановленого зразка.\n2. Вживлений електронний мікрочип (стандарт ISO 11784/11785).\n3. Діюча вакцинація проти сказу (зроблена не менше ніж за 21 день до виїзду).\n4. Сертифікат про тест на титри антитіл до сказу (FAVN тест).\n5. Обробка від ехінококозу та кліщів за 24-48 годин до виїзду.'
  },
  {
    id: 'bus-amenities',
    category: 'Комфорт у дорозі',
    icon: <Bus className="w-5 h-5 text-neon-cyan" />,
    question: 'Які зручності є в автобусах на рейсах між Україною та Італією?',
    answer: 'Усі міжнародні рейси BUSNET обслуговуються сучасними комфортабельними автобусами туристичного класу (Van Hool, Setra, Mercedes-Benz, Neoplan).\n\nНа борту є:\n• Безкоштовний високошвидкісний Wi-Fi (працює по Україні та в роумінгу ЄС);\n• Індивідуальні розетки 220V та USB-порти біля кожного сидіння;\n• Клімат-контроль та система вентиляції;\n• Анатомічні сидіння зі збільшеною відстанню для ніг і функцією нахилу спинки;\n• Працюючий біотуалет під час усього руху;\n• Гарячі напої (чай, кава) та зупинки на сучасних АЗС кожні 3.5–4 години.'
  },
  {
    id: 'travel-time-border',
    category: 'Час у дорозі та кордон',
    icon: <Clock className="w-5 h-5 text-neon-cyan" />,
    question: 'Скільки триває поїздка і як проходить проходження кордону?',
    answer: 'Орієнтовна тривалість поїздки:\n• Львів → Північна Італія (Венеція, Верона, Мілан, Болонья): 20–26 годин.\n• Львів → Рим, Неаполь: 26–30 годин.\n• Київ → Рим, Салерно: 32–38 годин.\n\nАвтобуси прямують через офіційні міжнародні пункти пропуску (Чоп — Захонь, Ужгород — Вишнє Нємецьке тощо). Пасажири проходять паспортний і митний контроль. Екіпаж супроводжує пасажирів на кожному етапі перевірки.'
  },
  {
    id: 'children-documents',
    category: 'Документи та діти',
    icon: <ShieldCheck className="w-5 h-5 text-neon-cyan" />,
    question: 'Які документи потрібні для дорослих та поїздки з дітьми за кордон?',
    answer: 'Для дорослих: дійсний біометричний закордонний паспорт (термін дії не менше 3 місяців після дати повернення) або діюча шенгенська віза / посвідка на проживання (Permesso di soggiorno).\n\nДля дітей до 16 років: закордонний паспорт дитини, свідоцтво про народження (оригінал). У разі виїзду з одним із батьків або у супроводі третіх осіб під час воєнного стану діють спрощені правила перетину кордону (нотаріальна згода другого з батьків не вимагається при супроводі матері/батька, але необхідне підтвердження родинних зв\'язків).'
  }
];

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(faqData[0].id);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  // Розширена мікророзмітка Schema.org FAQPage для пошукового робота Google та Gemini AI Overviews
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqData.map((item) => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer.replace(/\n/g, '<br/>')
      }
    }))
  };

  return (
    <section id="faq" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-20 relative scroll-mt-24">
      {/* Schema.org мікророзмітка FAQPage для Gemini та Google AI */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Фоновий неоновий блік */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Заголовок секції */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-mono uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>База знань пасажира</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight uppercase">
          Часті запитання <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-blue-500">(FAQ)</span>
        </h2>
        <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Детальні відповіді про багаж, оплату водієві, станції відправлення, перевезення тварин та кордон між Україною та містами Італії.
        </p>
      </div>

      {/* Акордеон запитань */}
      <div className="space-y-4">
        {faqData.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className={`border rounded-2xl transition-all duration-300 backdrop-blur-md overflow-hidden ${
                isOpen
                  ? 'border-neon-cyan/40 bg-[#0c1424]/90 shadow-[0_0_25px_rgba(0,229,255,0.08)]'
                  : 'border-white/5 bg-[#080d19]/60 hover:border-white/15 hover:bg-[#0c1424]/50'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between p-5 sm:p-6 text-left gap-4 focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-3.5 sm:gap-4 flex-1">
                  <div className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                    isOpen ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan' : 'bg-white/5 border-white/5 text-slate-400'
                  }`}>
                    {item.icon}
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neon-cyan/80 block mb-1">
                      {item.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {item.question}
                    </h3>
                  </div>
                </div>

                <div className={`p-2 rounded-lg shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-slate-400'
                }`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                  >
                    <div className="px-5 sm:px-6 pb-6 pt-2 text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line border-t border-white/5 font-normal">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Нижня плашка зворотного зв'язку */}
      <div className="mt-10 p-6 rounded-2xl border border-white/5 bg-gradient-to-r from-white/[0.02] to-neon-cyan/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-neon-cyan/10 text-neon-cyan">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Не знайшли відповіді на своє запитання?</h4>
            <p className="text-xs text-slate-400">Наша диспетчерська служба на зв'язку щодня 24/7 у Viber, Telegram та WhatsApp.</p>
          </div>
        </div>
        <a
          href="#contacts"
          className="px-5 py-2.5 rounded-xl bg-neon-cyan hover:bg-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)] shrink-0"
        >
          Зв'язатися з підтримкою
        </a>
      </div>
    </section>
  );
};

export default FAQSection;

