export type Language = 'UA' | 'EN' | 'IT';

export const translations = {
  UA: {
    header: {
      routes: 'Маршрути',
      partners: 'Партнерам',
      forum: 'Форум',
      bookingBadge: 'БРОНЮВАННЯ 24/7',
      login: 'УВІЙТИ',
      langLabel: 'МОВА',
    },
    hero: {
      subtitle: 'Знайди рейс • Бронюй онлайн • Сплачуй при посадці',
      suggestCheapest: 'найдешевше',
      suggestToday: 'сьогодні',
      suggestFastest: 'найшвидше',
      aiSlogan: 'бронювання 24/7',
      suggestAiChoice: 'AI вибір',
      cityKyiv: 'Київ',
      cityWarsaw: 'Варшава',
      cityLviv: 'Львів',
      cityBerlin: 'Берлін',
      cityOdesa: 'Одеса',
      cityPrague: 'Прага',
    },
    search: {
      from: 'Звідки',
      to: 'Куди',
      date: 'Дата відправлення',
      search: 'ПОШУК',
      placeholderFrom: 'Місто...',
      placeholderTo: 'Куди прямуєте?',
    },
    popular: {
      badge: 'Напрямки 2026',
      title: 'Популярні',
      titleAccent: 'рейси',
      premium: 'Преміум маршрут',
      priceFrom: 'Вартість від',
      currency: '₴',
    },
    neuralWorkflow: {
      title: 'ЯК ЦЕ',
      titleAccent: 'ПРАЦЮЄ',
      steps: [
        {
          id: 1,
          title: 'Знайдіть рейс',
          text: 'Говоріть або пишіть — AI аналізує 15 країн Європи за 0.3 секунди.',
        },
        {
          id: 2,
          title: 'Оберіть квиток',
          text: 'AI Smart Suggest підкаже найкращий час, ціну та комфорт.',
        },
        {
          id: 3,
          title: 'Подорожуйте',
          text: 'Цифровий квиток та Passkey-авторизація. Сплата при посадці або криптою.',
        }
      ]
    },
    validation: {
      header: 'Майже готово!',
      fillAll: 'Будь ласка, заповніть місто відправлення, прибуття та дату.',
      from: 'Звідки їдемо?',
      to: 'Куди прямуєте?',
      date: 'Коли в дорогу?'
    },
    footer: {
      rights: '© 2026 Всі права захищені',
      about: 'Про нас',
      contacts: 'Контакти',
      terms: 'Угода користувача',
    },
    advantages: {
      badge: 'Переваги платформи',
      title: 'Чому обирають',
      titleAccent: 'BUSNET?',
      items: [
        {
          title: "60 секунд",
          subtitle: "на бронювання",
          desc: "Оберіть маршрут, місце і вкажіть ім'я. Жодних зайвих форм завдяки AI-автозаповненню."
        },
        {
          title: "0% передоплата",
          subtitle: "сплата при посадці",
          desc: "Ніякого ризику. Оплачуйте водієві або Apple Pay прямо в автобусі."
        },
        {
          title: "Перевірені",
          subtitle: "перевізники",
          desc: "Усі партнери проходять багаторівневу верифікацію та рейтинг у реальному часі."
        },
        {
          title: "Цифровий",
          subtitle: "квиток",
          desc: "Ваш посадковий завжди у смартфоні. Ніякого паперу, тільки QR або NFC."
        },
        {
          title: "Смарт-знижки",
          subtitle: "для всіх категорій",
          desc: "Дитяча -50%, студентська -20%, літні -30%. Розраховуються автоматично."
        },
        {
          title: "Підтримка",
          subtitle: "24/7 онлайн",
          desc: "Живі агенти та нейро-асистенти завжди на зв'язку. Миттєве вирішення питань."
        }
      ]
    },
    about: {
      title: 'МИ НЕ ПРОСТО',
      titleAccent: 'ПЕРЕВОЗИМО.',
      desc: 'Busnet UA — це інтелектуальна екосистема, що об’єднує міста за допомогою нейронних мереж та AI-аналітики. Ми відібрали найкращих перевізників Європи, щоб ваша подорож починалася не з вокзалу, а з першого кліку.',
      quote: '"Технології — це лише інструмент. Наша мета — ваш комфорт та безпека в кожному кілометрі."',
      stats: [
        { label: 'Пасажирів', value: '100k+' },
        { label: 'Країн Європи', value: '15+' },
        { label: 'Надійність', value: '99.8%' },
        { label: 'Швидкість AI', value: '0.3s' },
      ]
    },
    reviews: {
      title: 'ВІДГУКИ',
      titleAccent: 'МАНДРІВНИКІВ',
      items: [
        {
          name: "Ірина С., Одеса",
          text: "Чудово! Все швидко та комфортно. Рекомендую! Обов’язково поїду з вами ще раз. Сервіс на найвищому рівні!",
          route: "Київ → Варшава",
          img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Дмитро П., Кропивницький",
          text: "Автобуси преміум-класу, чисто, Wi-Fi працював стабільно всю дорогу. Водії ввічливі та пунктуальні.",
          route: "Львів → Прага",
          img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Олена В., Дніпро",
          text: "Завжди на зв'язку підтримка 24/7. Допомогли швидко вирішити питання з бронюванням. Комфортно і спокійно!",
          route: "Одеса → Берлін",
          img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Олег Н., Харків",
          text: "Цифровий квиток. Показав QR-код зі смартфона і поїхав. Оплата при посадці — це те, що я шукав.",
          route: "Львів → Відень",
          img: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=200&h=200&auto=format&fit=crop"
        }
      ]
    },
    appEco: {
      title: 'ТВІЙ КВИТОК ЗАВЖДИ З',
      titleAccent: 'BUSNET',
      desc: 'Мобільний додаток — це фінальний крок нашої екосистеми. Квиток у смартфоні, 24/7 AI підтримка, живий трекінг автобуса та верифікована безпека. Серйозна IT-платформа для твоєї наступної поїздки.',
      downloadStore: 'App Store',
      downloadStoreSub: 'Завантажте в',
      downloadGoogle: 'Google Play',
      downloadGoogleSub: 'ДОСТУПНО В',
      scanText: 'Скануйте для завантаження',
      phoneTitle: 'ЕКОСИСТЕМА',
      phoneLogo: 'BUSNET',
      ticketName: "Ім’я: Ірина Сидоренко",
      ticketBus: "Автобус: BusNet Express",
      ticketRoute: "Маршрут: Київ → Варшава",
      ticketTime: "AI Відправлення: 16.04.2026, 08:00",
      qrTitle: 'AI QR-КОД ДЛЯ ПОСАДКИ',
      priceTitle: 'Вартість (Верифіковано AI)',
      price: '1200 UAH',
      btnInstallPwa: 'PWA Інсталяція',
      btnInstalled: 'ВЖЕ ВСТАНОВЛЕНО',
      btnInstallMain: 'ВСТАНОВИТИ ДОДАТОК',
      btnEcoSys: 'ЕКОСИСТЕМА',
      btnEcoModules: 'ІНШІ МОДУЛІ',
      iosHintTitle: 'Встановити на iPhone',
      iosHintText: 'Apple не дозволяє пряме встановлення. Щоб додати <b>BUSNET</b> на екран «Домой», виконайте 2 кроки:',
      iosHintStep1: '1. Натисніть кнопку <b>"Поділитися"</b> знизу на панелі Safari',
      iosHintStep2: '2. Оберіть <b>"На екран «Домой»"</b> зі списку дій',
      iosHintGotIt: 'Я зрозумів',
      modulesModalTitle: 'Модулі екосистеми',
      modulesModalText: 'BUSNET — це єдина платформа мікросервісів. Відкрийте потрібний лінк на вашому телефоні, щоб встановити PWA додаток:',
    },
    confidence: {
      title: 'БЕЗПЕКА ТА',
      titleAccent: 'ДОВІРА',
      items: [
        { title: 'Страхування', desc: 'Кожен пасажир застрахований на €30,000 протягом всієї поїздки.', icon: 'shield' },
        { title: 'Підтримка 24/7', desc: 'Наші AI-агенти та живі оператори готові допомогти в будь-яку хвилину.', icon: 'support' },
        { title: 'Повернення', desc: 'Гарантоване повернення коштів при скасуванні рейсу за 24 години.', icon: 'refund' }
      ]
    },
    seo: {
      title: 'Популярні автобусні маршрути по Європі',
      desc: 'Busnet UA пропонує найшвидші та найдешевші автобусні квитки з України в Польщу, Італію, Німеччину та інші країни ЄС. Завдяки нашій унікальній AI-технології пошуку, ви можете знайти оптимальний маршрут з Києва, Львова, Одеси та Дніпра до Варшави, Берліна, Риму та Мілана за лічені секунди. Бронюйте квитки онлайн без передоплати та насолоджуйтесь комфортною подорожжю з перевіреними перевізниками.'
    }
  },
  EN: {
    header: {
      routes: 'Routes',
      partners: 'Partners',
      forum: 'Forum',
      bookingBadge: '24/7 BOOKING',
      login: 'LOGIN',
      langLabel: 'LANGUAGE',
    },
    hero: {
      subtitle: 'Find a trip • Book online • Pay on boarding',
      suggestCheapest: 'cheapest',
      suggestToday: 'today',
      suggestFastest: 'fastest',
      aiSlogan: '24/7 booking',
      suggestAiChoice: 'AI Choice',
      cityKyiv: 'Kyiv',
      cityWarsaw: 'Warsaw',
      cityLviv: 'Lviv',
      cityBerlin: 'Berlin',
      cityOdesa: 'Odesa',
      cityPrague: 'Prague',
    },
    search: {
      from: 'From',
      to: 'To',
      date: 'Departure Date',
      search: 'SEARCH',
      placeholderFrom: 'City...',
      placeholderTo: 'Where to?',
    },
    popular: {
      badge: '2026 Destinations',
      title: 'Popular',
      titleAccent: 'trips',
      premium: 'Premium Route',
      priceFrom: 'Price from',
      currency: '€',
    },
    neuralWorkflow: {
      title: 'HOW IT',
      titleAccent: 'WORKS',
      steps: [
        {
          id: 1,
          title: 'Find a trip',
          text: 'Speak or type — AI analyzes 15 European countries in 0.3 seconds.',
        },
        {
          id: 2,
          title: 'Choose a ticket',
          text: 'AI Smart Suggest will suggest the best time, price, and comfort.',
        },
        {
          id: 3,
          title: 'Travel',
          text: 'Digital ticket and Passkey authorization. Pay on boarding or with crypto.',
        }
      ]
    },
    validation: {
      header: 'Almost there!',
      fillAll: 'Please fill in the departure city, arrival city, and date.',
      from: 'Where from?',
      to: 'Where to?',
      date: 'When to go?'
    },
    footer: {
      rights: '© 2026 All rights reserved',
      about: 'About Us',
      contacts: 'Contacts',
      terms: 'Terms of Service',
    },
    advantages: {
      badge: 'Platform Advantages',
      title: 'Why Choose',
      titleAccent: 'BUSNET?',
      items: [
        {
          title: "60 Seconds",
          subtitle: "to Book",
          desc: "Select a route, seat, and enter your name. No extra forms thanks to AI autofill."
        },
        {
          title: "0% Prepayment",
          subtitle: "Pay on Boarding",
          desc: "No risk. Pay the driver or via Apple Pay directly on the bus."
        },
        {
          title: "Verified",
          subtitle: "Carriers",
          desc: "All partners undergo multi-level verification and real-time rating."
        },
        {
          title: "Digital",
          subtitle: "Ticket",
          desc: "Your boarding pass is always in your smartphone. No paper, just QR or NFC."
        },
        {
          title: "Smart Discounts",
          subtitle: "for All Categories",
          desc: "Child -50%, Student -20%, Senior -30%. Calculated automatically."
        },
        {
          title: "Support",
          subtitle: "24/7 Online",
          desc: "Live agents and neuro-assistants always available. Instant question resolution."
        }
      ]
    },
    about: {
      title: 'WE DON\'T JUST',
      titleAccent: 'TRANSPORT.',
      desc: 'Busnet UA is an intelligent ecosystem connecting cities through neural networks and AI analytics. We have selected Europe\'s best carriers so that your journey begins not from the terminal, but from the first click.',
      quote: '"Technology is just a tool. Our goal is your comfort and safety in every kilometer."',
      stats: [
        { label: 'Passengers', value: '100k+' },
        { label: 'EU Countries', value: '15+' },
        { label: 'Reliability', value: '99.8%' },
        { label: 'AI Speed', value: '0.3s' },
      ]
    },
    reviews: {
      title: 'TRAVELER',
      titleAccent: 'REVIEWS',
      items: [
        {
          name: "Iryna S., Odesa",
          text: "Wonderful! Everything was fast and comfortable. Highly recommend! Will definitely travel with you again. Top-level service!",
          route: "Kyiv → Warsaw",
          img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Dmytro P., Kropyvnytskyi",
          text: "Premium class buses, clean, Wi-Fi worked stably the whole way. Drivers were polite and punctual.",
          route: "Lviv → Prague",
          img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Olena V., Dnipro",
          text: "24/7 support always in touch. Helped quickly resolve a booking issue. Comfortable and peaceful!",
          route: "Odesa → Berlin",
          img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Oleh N., Kharkiv",
          text: "Digital ticket. Showed the QR code from my smartphone and off we go. Payment on boarding is what I was looking for.",
          route: "Lviv → Vienna",
          img: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=200&h=200&auto=format&fit=crop"
        }
      ]
    },
    appEco: {
      title: 'YOUR TICKET ALWAYS WITH',
      titleAccent: 'BUSNET',
      desc: 'The mobile app is the final step of our ecosystem. Ticket in your smartphone, 24/7 AI support, live bus tracking, and verified security. A serious IT platform for your next trip.',
      downloadStore: 'App Store',
      downloadStoreSub: 'Download on the',
      downloadGoogle: 'Google Play',
      downloadGoogleSub: 'GET IT ON',
      scanText: 'Scan to Download',
      phoneTitle: 'ECOSYSTEM',
      phoneLogo: 'BUSNET',
      ticketName: "Name: Iryna Sydorenko",
      ticketBus: "Bus: BusNet Express",
      ticketRoute: "Route: Kyiv → Warsaw",
      ticketTime: "AI Departure: 04/16/2026, 08:00",
      qrTitle: 'AI QR-CODE FOR BOARDING',
      priceTitle: 'Price (AI Verified)',
      price: '1200 UAH',
      btnInstallPwa: 'PWA Installation',
      btnInstalled: 'ALREADY INSTALLED',
      btnInstallMain: 'INSTALL APP',
      btnEcoSys: 'ECOSYSTEM',
      btnEcoModules: 'OTHER MODULES',
      iosHintTitle: 'Install on iPhone',
      iosHintText: 'Apple does not allow direct installation. To add <b>BUSNET</b> to your Home screen, follow 2 steps:',
      iosHintStep1: '1. Tap the <b>"Share"</b> button at the bottom of the Safari bar',
      iosHintStep2: '2. Select <b>"Add to Home Screen"</b> from the action list',
      iosHintGotIt: 'Got it',
      modulesModalTitle: 'Ecosystem Modules',
      modulesModalText: 'BUSNET is a single microservice platform. Open the required link on your phone to install the PWA app:',
    },
    confidence: {
      title: 'SAFETY AND',
      titleAccent: 'TRUST',
      items: [
        { title: 'Insurance', desc: 'Each passenger is insured for €30,000 throughout the entire trip.', icon: 'shield' },
        { title: '24/7 Support', desc: 'Our AI agents and live operators are ready to help at any moment.', icon: 'support' },
        { title: 'Refunds', desc: 'Guaranteed refund if the trip is canceled 24 hours in advance.', icon: 'refund' }
      ]
    },
    seo: {
      title: 'Popular Bus Routes Across Europe',
      desc: 'Busnet UA offers the fastest and cheapest bus tickets from Ukraine to Poland, Italy, Germany, and other EU countries. Thanks to our unique AI search technology, you can find the optimal route from Kyiv, Lviv, Odesa, and Dnipro to Warsaw, Berlin, Rome, and Milan in seconds. Book tickets online without prepayment and enjoy a comfortable journey with verified carriers.'
    }
  },
  IT: {
    header: {
      routes: 'Percorsi',
      partners: 'Partner',
      forum: 'Forum',
      bookingBadge: 'PRENOTAZIONE 24/7',
      login: 'ACCESSO',
      langLabel: 'LINGUA',
    },
    hero: {
      subtitle: 'Trova un viaggio • Prenota online • Paga all\'imbarco',
      suggestCheapest: 'economico',
      suggestToday: 'oggi',
      suggestFastest: 'veloce',
      aiSlogan: 'Prenotazione 24/7',
      suggestAiChoice: 'Scelta AI',
      cityKyiv: 'Kiev',
      cityWarsaw: 'Varsavia',
      cityLviv: 'Leopoli',
      cityBerlin: 'Berlino',
      cityOdesa: 'Odessa',
      cityPrague: 'Praga',
    },
    search: {
      from: 'Da',
      to: 'A',
      date: 'Data di partenza',
      search: 'CERCA',
      placeholderFrom: 'Città...',
      placeholderTo: 'Dove vai?',
    },
    popular: {
      badge: 'Destinazioni 2026',
      title: 'Viaggi',
      titleAccent: 'popolari',
      premium: 'Percorso Premium',
      priceFrom: 'Prezzo da',
      currency: '€',
    },
    neuralWorkflow: {
      title: 'COME',
      titleAccent: 'FUNZIONA',
      steps: [
        {
          id: 1,
          title: 'Trova un viaggio',
          text: 'Parla o scrivi: l\'AI analizza 15 paesi europei in 0.3 secondi.',
        },
        {
          id: 2,
          title: 'Scegli un biglietto',
          text: 'AI Smart Suggest ti suggerirà l\'orario, il prezzo e il comfort migliori.',
        },
        {
          id: 3,
          title: 'Viaggia',
          text: 'Biglietto digitale e autorizzazione Passkey. Paga all\'imbarco o con cripto.',
        }
      ]
    },
    validation: {
      header: 'Quasi pronto!',
      fillAll: 'Inserisci la città di partenza, la città di arrivo e la data.',
      from: 'Da dove?',
      to: 'Dove andare?',
      date: 'Quando andare?'
    },
    footer: {
      rights: '© 2026 Tutti i diritti riservati',
      about: 'Chi siamo',
      contacts: 'Contatti',
      terms: 'Termini e condizioni',
    },
    advantages: {
      badge: 'Vantaggi della Piattaforma',
      title: 'Perché Scegliere',
      titleAccent: 'BUSNET?',
      items: [
        {
          title: "60 Secondi",
          subtitle: "per Prenotare",
          desc: "Seleziona un percorso, un posto e inserisci il tuo nome. Niente moduli extra grazie all'autocompletamento AI."
        },
        {
          title: "0% Acconto",
          subtitle: "Paga all'Imbarco",
          desc: "Nessun rischio. Paga l'autista o tramite Apple Pay direttamente sul bus."
        },
        {
          title: "Verificati",
          subtitle: "Vettori",
          desc: "Tutti i partner sono sottoposti a una verifica a più livelli e a una valutazione in tempo reale."
        },
        {
          title: "Digitale",
          subtitle: "Biglietto",
          desc: "La tua carta d'imbarco è sempre nel tuo smartphone. Niente carta, solo QR o NFC."
        },
        {
          title: "Sconti Smart",
          subtitle: "per Tutte le Categorie",
          desc: "Bambini -50%, Studenti -20%, Senior -30%. Calcolati automaticamente."
        },
        {
          title: "Supporto",
          subtitle: "24/7 Online",
          desc: "Agenti live e neuro-assistenti sempre disponibili. Risoluzione istantanea dei problemi."
        }
      ]
    },
    about: {
      title: 'NON CI LIMITIAMO A',
      titleAccent: 'TRASPORTARE.',
      desc: 'Busnet UA è un ecosistema intelligente che collega le città attraverso reti neurali e analisi AI. Abbiamo selezionato i migliori vettori d\'Europa affinché il tuo viaggio inizi non dal terminal, ma dal primo clic.',
      quote: '"La tecnologia è solo uno strumento. Il nostro obiettivo è il tuo comfort e la tua sicurezza in ogni chilometro."',
      stats: [
        { label: 'Passeggeri', value: '100k+' },
        { label: 'Paesi Europei', value: '15+' },
        { label: 'Affidabilità', value: '99.8%' },
        { label: 'Velocità AI', value: '0.3s' },
      ]
    },
    reviews: {
      title: 'RECENSIONI DEI',
      titleAccent: 'VIAGGIATORI',
      items: [
        {
          name: "Iryna S., Odessa",
          text: "Splendido! Tutto veloce e confortevole. Lo consiglio vivamente! Viaggerò sicuramente di nuovo con voi. Servizio di alto livello!",
          route: "Kiev → Varsavia",
          img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Dmytro P., Kropyvnytskyi",
          text: "Autobus di classe premium, puliti, il Wi-Fi ha funzionato stabilmente per tutto il percorso. Autisti gentili e puntuali.",
          route: "Leopoli → Praga",
          img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Olena V., Dnipro",
          text: "Supporto 24/7 sempre disponibile. Mi hanno aiutato a risolvere rapidamente un problema di prenotazione. Comodo e tranquillo!",
          route: "Odessa → Berlino",
          img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&auto=format&fit=crop"
        },
        {
          name: "Oleh N., Kharkiv",
          text: "Biglietto digitale. Ho mostrato il codice QR dallo smartphone e sono partito. Il pagamento all'imbarco è quello che cercavo.",
          route: "Leopoli → Vienna",
          img: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=200&h=200&auto=format&fit=crop"
        }
      ]
    },
    appEco: {
      title: 'IL TUO BIGLIETTO SEMPRE CON',
      titleAccent: 'BUSNET',
      desc: "L'app mobile è l'ultimo passo del nostro ecosistema. Biglietto nello smartphone, supporto AI 24/7, monitoraggio bus in tempo reale e sicurezza verificata. Una seria piattaforma IT per il tuo prossimo viaggio.",
      downloadStore: 'App Store',
      downloadStoreSub: 'Scarica su',
      downloadGoogle: 'Google Play',
      downloadGoogleSub: 'DISPONIBILE SU',
      scanText: 'Scansiona per scaricare',
      phoneTitle: 'ECOSISTEMA',
      phoneLogo: 'BUSNET',
      ticketName: "Nome: Iryna Sydorenko",
      ticketBus: "Autobus: BusNet Express",
      ticketRoute: "Percorso: Kiev → Varsavia",
      ticketTime: "Partenza AI: 16.04.2026, 08:00",
      qrTitle: 'CODICE QR AI PER IMBARCO',
      priceTitle: 'Prezzo (Verificato AI)',
      price: '1200 UAH',
      btnInstallPwa: 'Installazione PWA',
      btnInstalled: 'GIÀ INSTALLATO',
      btnInstallMain: 'INSTALLA APP',
      btnEcoSys: 'ECOSISTEMA',
      btnEcoModules: 'ALTRI MODULI',
      iosHintTitle: 'Installa su iPhone',
      iosHintText: 'Apple non consente l\'installazione diretta. Per aggiungere <b>BUSNET</b> alla schermata Home, segui 2 passaggi:',
      iosHintStep1: '1. Tocca il pulsante <b>"Condividi"</b> nella parte inferiore della barra di Safari',
      iosHintStep2: '2. Seleziona <b>"Aggiungi alla schermata Home"</b> dall\'elenco',
      iosHintGotIt: 'Ho capito',
      modulesModalTitle: 'Moduli dell\'ecosistema',
      modulesModalText: 'BUSNET è una piattaforma unica di microservizi. Apri il link desiderato sul tuo telefono per installare la PWA:',
    },
    confidence: {
      title: 'SICUREZZA E',
      titleAccent: 'FIDUCIA',
      items: [
        { title: 'Assicurazione', desc: 'Ogni passeggero è assicurato per € 30.000 per l\'intero viaggio.', icon: 'shield' },
        { title: 'Supporto 24/7', desc: 'I nostri agenti AI e operatori live sono pronti ad aiutarti in ogni momento.', icon: 'support' },
        { title: 'Rimborsi', desc: 'Rimborso garantito in caso di cancellazione del viaggio con 24 ore di anticipo.', icon: 'refund' }
      ]
    },
    seo: {
      title: 'Linee di autobus popolari in tutta Europa',
      desc: 'Busnet UA offre i biglietti dell\'autobus più veloci ed economici dall\'Ucraina a Polonia, Italia, Germania e altri paesi dell\'UE. Grazie alla nostra esclusiva tecnologia di ricerca AI, puoi trovare il percorso ottimale da Kiev, Leopoli, Odessa e Dnipro a Varsavia, Berlino, Roma e Milano in pochi secondi. Prenota i biglietti online senza pagamento anticipato e goditi un viaggio confortevole con vettori verificati.'
    }
  }
};
