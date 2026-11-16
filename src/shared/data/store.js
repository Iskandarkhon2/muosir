/**
 * store.js - Central Data Store for Muosir Plast
 * Manages reactive data state, persistence (localStorage), and sync between Admin & Landing.
 * Provides local persistence for site content and inquiry records.
 */

const STORAGE_KEY = 'muosir_plast_data_v4';
const LEGACY_STORAGE_KEYS = ['muosir_plast_data_v3', 'muosir_plast_data_v2'];
const LEADS_KEY = 'muosir_plast_leads_v2';

// Default initial state
const DEFAULT_DATA = {
  company: {
    name: "Муосир пласт",
    nameEn: "Muosir Plast",
    tagline: "Пластиковая упаковка напрямую от производителя из Таджикистана",
    taglineEn: "Plastic packaging directly from manufacturer in Tajikistan",
    taglineUz: "Tojikistondan to'g'ridan-to'g'ri ishlab chiqaruvchi plastik qadoqlar",
    taglineKk: "Тәжікстаннан тікелей өндірушіден пластикалық қаптама",
    subtagline: "Производство и поставка пластиковой упаковки для производителей продуктов питания, молочной, кондитерской и другой продукции. Оптовые и экспортные поставки.",
    subtaglineEn: "Mass production and wholesale export supply of plastic packaging for food, dairy, confectionery and other manufacturing industries.",
    subtaglineUz: "Oziq-ovqat, sut va qandolatchilik mahsulotlari uchun qattiq polimer qadoqlash vositalarini seriyali ishlab chiqarish va eksport qilish.",
    subtaglineKk: "Азық-түлік, сүт және кондитерлік өнімдер өндірушілеріне арналған сапалы полимерлі қаптамаларды сериялық өндіру және экспорттау.",
    phone: "+992 (92) 550-50-50",
    phoneClean: "992925505050",
    salesPhones: ["+992 (92) 550-50-50", "+992 (99) 550-50-50"],
    whatsapp: "+992 92 299 2000",
    whatsappClean: "992922992000",
    email: "info@muosirplast.tj",
    address: "Республика Таджикистан, Согдийская область, Б. Гафуровский район, ул. Вахдат, 15",
    addressEn: "Republic of Tajikistan, Sughd Region, B. Gafurov District, 15 Vahdat Street",
    addressUz: "Tojikiston Respublikasi, Sug'd viloyati, B. G'afurov tumani, Vahdat ko'chasi, 15",
    addressKk: "Тәжікстан Республикасы, Соғды облысы, Б. Ғафуров ауданы, Вахдат көшесі, 15",
    website: "https://muosirplast.tj",
    instagram: "https://instagram.com/muosirplast",
    facebook: "https://facebook.com/muosirplast",
    catalogPdfUrl: "assets/docs/muosir-plast-export-catalog.pdf",
    metaPixelId: "",
    ga4MeasurementId: "",
    telegramWebhookUrl: "",
    crmWebhookUrl: ""
  },
  stats: [
    { id: "lines", number: "14+", label: "автоматизированные линии", labelEn: "automated production lines", labelUz: "avtomatlashtirilgan liniyalar", labelKk: "автоматтандырылған желілер" },
    { id: "capacity", number: "20–60 млн", label: "единиц в год", labelEn: "units per year", labelUz: "dona yiliga", labelKk: "дана жылына" },
    { id: "molds", number: "50+", label: "видов пресс-форм", labelEn: "mold types", labelUz: "qolip turlari", labelKk: "қалып түрлері" },
    { id: "processes", number: "3", label: "основные технологии", labelEn: "core technologies", labelUz: "asosiy texnologiyalar", labelKk: "негізгі технологиялар" }
  ],
  categories: [
    { id: "all", name: "Вся продукция", nameEn: "All Products", nameUz: "Barcha mahsulotlar", nameKk: "Барлық өнімдер" },
    { id: "dairy", name: "Упаковка для молочной продукции", nameEn: "Dairy Packaging", nameUz: "Sut mahsulotlari uchun", nameKk: "Сүт өнімдеріне арналған" },
    { id: "eggs", name: "Упаковка для яиц", nameEn: "Egg Packaging", nameUz: "Tuxum qutilari", nameKk: "Жұмыртқа қаптамасы" },
    { id: "confectionery", name: "Упаковка для кондитерских изделий", nameEn: "Confectionery Packaging", nameUz: "Qandolatchilik idishlari", nameKk: "Кондитерлік қаптама" },
    { id: "containers", name: "Контейнеры для пищевых продуктов", nameEn: "Food Containers", nameUz: "Oziq-ovqat konteynerlari", nameKk: "Тағамдық контейнерлер" },
    { id: "cups", name: "Стаканы и крышки", nameEn: "Cups & Lids", nameUz: "Stakanlar va qopqoqlar", nameKk: "Стақандар мен қақпақтар" }
  ],
  products: [
    {
      id: "prod-1",
      categoryId: "dairy",
      title: "Стакан для сметаны и йогурта 400 мл (Ø 95 мм)",
      titleEn: "Sour cream & yogurt cup 400 ml (Ø 95 mm)",
      titleUz: "Smetana va yogurt uchun stakan 400 ml (Ø 95 mm)",
      titleKk: "Қаймақ пен йогуртқа арналған стақан 400 мл (Ø 95 мм)",
      volume: "400 мл",
      diameter: "Ø 95 мм, H 115 мм",
      material: "PP (Полипропилен)",
      color: "Белый / Прозрачный / С печатью",
      boxQty: "1 000 шт.",
      minOrder: "50 000 шт.",
      image: "assets/images/dairy-cup-400.png",
      photo: "assets/images/dairy-cup-400.png",
      customizable: true,
      desc: "Герметичный стакан под запайку платинкой из фольги или нахлобучку. Подходит для автоматических линий фасовки.",
      descEn: "Sealed cup suitable for aluminum foil sealing or snap-on lid. Designed for automated filling lines.",
      descUz: "Folga bilan payvandlanadigan va qopqoqli germetik stakan. Avtomatlashtirilgan quyish liniyalariga mos.",
      descKk: "Фольгамен дәнекерленетін немесе қақпақты герметикалық стақан. Автоматты желілерге арналған."
    },
    {
      id: "prod-2",
      categoryId: "dairy",
      title: "Стакан под творог и десерты 250 мл (Ø 95 мм)",
      titleEn: "Cottage cheese & dessert cup 250 ml (Ø 95 mm)",
      titleUz: "Tvorog va shirinliklar uchun stakan 250 ml (Ø 95 mm)",
      titleKk: "Сүзбе мен десертке арналған стақан 250 мл (Ø 95 мм)",
      volume: "250 мл",
      diameter: "Ø 95 мм, H 68 мм",
      material: "PP (Первичное сырье)",
      color: "Белый / Индивидуальный цвет",
      boxQty: "1 200 шт.",
      minOrder: "50 000 шт.",
      image: "assets/images/dairy-cup-250.png",
      photo: "assets/images/dairy-cup-250.png",
      desc: "Устойчив к глубокой заморозке и температурным перепадам. Прочный ободок под стандартную запайку.",
      descEn: "Resistant to deep freezing. Rigid rim for standard heat sealing.",
      descUz: "Muzlatishga chidamli. Standart payvandlash uchun mustahkam gardish.",
      descKk: "Мұздатуға төзімді. Фольгамен бекітуге арналған берік жиек."
    },
    {
      id: "prod-3",
      categoryId: "dairy",
      title: "Крышка-нахлобучка прозрачная Ø 95 мм",
      titleEn: "Transparent snap-on lid Ø 95 mm",
      titleUz: "Shaffof qopqoq Ø 95 mm",
      titleKk: "Мөлдір кигізілмелі қақпақ Ø 95 мм",
      volume: "Ø 95 мм",
      diameter: "Ø 95 мм, H 10 мм",
      material: "PET / PS",
      color: "Кристально прозрачный",
      boxQty: "2 000 шт.",
      minOrder: "50 000 шт.",
      image: "assets/images/product-DSC04876.png",
      photo: "assets/images/product-DSC04876.png",
      desc: "Идеальная фиксация на стаканах 95 мм. Защищает продукт после снятия фольги.",
      descEn: "Perfect snap-fit on 95mm cups. Protects the product after foil seal is removed.",
      descUz: "95 mm stakanlarga aniq o'tiradi. Folga ochilgandan so'ng mahsulotni toza saqlaydi.",
      descKk: "95 мм стақандарға тығыз киіледі. Фольга алынғаннан кейін өнімді қорғайды."
    },
    {
      id: "prod-4",
      categoryId: "eggs",
      title: "Контейнер для яиц на 10 шт. (C0 / C1 / C2)",
      titleEn: "Egg container for 10 pcs (C0 / C1 / C2)",
      titleUz: "10 talik tuxum qutisi (C0 / C1 / C2)",
      titleKk: "10 жұмыртқаға арналған контейнер (C0 / C1 / C2)",
      volume: "10 яиц",
      diameter: "248 x 105 x 70 мм",
      material: "PET (Высокая прозрачность)",
      color: "Прозрачный",
      boxQty: "600 шт.",
      minOrder: "30 000 шт.",
      image: "assets/images/product-DSC04876.png",
      photo: "assets/images/product-DSC04876.png",
      desc: "Усиленные ребра жесткости, надежный двойной замок. Безопасное штабелирование при транспортировке.",
      descEn: "Reinforced stiffening ribs, reliable dual snap locks. Safe stacking during transport.",
      descUz: "Qovurg'alari kuchaytirilgan, mustahkam ikkitalik qulf. Tashishda ustma-ust xavfsiz taxlanadi.",
      descKk: "Күшейтілген қаттылық қабырғалары, қос құлып. Тасымалдау кезінде қауіпсіз қабатталады."
    },
    {
      id: "prod-5",
      categoryId: "eggs",
      title: "Контейнер для яиц на 15 шт. с вентиляцией",
      titleEn: "Egg container for 15 pcs with ventilation",
      titleUz: "15 talik shamollatiladigan tuxum qutisi",
      titleKk: "Желдеткіші бар 15 жұмыртқалық контейнер",
      volume: "15 яиц",
      diameter: "295 x 150 x 70 мм",
      material: "PET пищевой",
      color: "Прозрачный глянцевый",
      boxQty: "450 шт.",
      minOrder: "30 000 шт.",
      image: "assets/images/product-DSC04957.png",
      photo: "assets/images/product-DSC04957.png",
      desc: "Эргономичная форма с вентиляционными отверстиями для продления свежести продукции на полке ритейла.",
      descEn: "Ergonomic shape with ventilation holes to prolong shelf life in retail stores.",
      descUz: "Do'kon peshtaxtalarida tuxum uzoq vaqt yangi turishi uchun shamollatish teshiklariga ega.",
      descKk: "Сауда сөрелерінде жұмыртқаның балғындығын сақтау үшін желдеткіш тесіктері бар."
    },
    {
      id: "prod-6",
      categoryId: "confectionery",
      title: "Тортовница круглая премиум Ø 210 мм с замком",
      titleEn: "Round cake container premium Ø 210 mm",
      titleUz: "Dumaloq tort qutisi Ø 210 mm qulflar bilan",
      titleKk: "Дөңгелек торт ыдысы премиум Ø 210 мм",
      volume: "до 1.5 кг",
      diameter: "Ø 210 мм, H 110 мм",
      material: "PET купол + PS дно",
      color: "Черное дно + прозрачный купол",
      boxQty: "200 шт.",
      minOrder: "20 000 шт.",
      image: "assets/images/product-DSC04876.png",
      photo: "assets/images/product-DSC04876.png",
      desc: "Премиальная презентация кондитерских изделий. Надежная круговая фиксация купола исключает случайное открытие.",
      descEn: "Premium presentation of confectionery. Secure perimeter locking prevents accidental opening.",
      descUz: "Tortlar va pishiriqlar uchun yuqori sifatli ko'rinish. Aylanma mustahkam qulflar tasodifiy ochilib ketishni oldini oladi.",
      descKk: "Кондитерлік өнімдерге арналған премиум ыдыс. Шеңберлі мықты бекіткіш өздігінен ашылып кетуге жол бермейді."
    },
    {
      id: "prod-7",
      categoryId: "confectionery",
      title: "Коррекс для печенья и зефира (3 секции)",
      titleEn: "Cookie & marshmallow tray (3 sections)",
      titleUz: "Pechenye va shirinliklar uchun korreks (3 bo'limli)",
      titleKk: "Печеньеге арналған коррекс (3 бөлімді)",
      volume: "350-500 г",
      diameter: "215 x 115 x 45 мм",
      material: "PS (Полистирол) / PET",
      color: "Коричневый / Прозрачный / Золотой",
      boxQty: "1 500 шт.",
      minOrder: "40 000 шт.",
      image: "assets/images/box-black.png",
      photo: "assets/images/box-black.png",
      desc: "Защищает хрупкую выпечку от ломки при транспортировке. Подходит для автоматических флоу-пак линий.",
      descEn: "Protects delicate bakery items from breaking during transport. Suitable for automated flow-pack lines.",
      descUz: "Tashish paytida mo'rt pishiriqlarni sinishdan saqlaydi. Avtomatik flow-pack qadoqlashga mos.",
      descKk: "Нәзік кондитерлік өнімдерді сынудан сақтайды. Автоматты флоу-пак желілеріне үйлесімді."
    },
    {
      id: "prod-8",
      categoryId: "containers",
      title: "Прямоугольный контейнер с крышкой 500 мл",
      titleEn: "Rectangular container with hinged lid 500 ml",
      titleUz: "Qopqoqli to'g'ri burchakli idish 500 ml",
      titleKk: "Қақпағы бар тікбұрышты контейнер 500 мл",
      volume: "500 мл",
      diameter: "140 x 115 x 52 мм",
      material: "PP пищевой термостойкий",
      color: "Прозрачный / Черный",
      boxQty: "500 шт.",
      minOrder: "30 000 шт.",
      image: "assets/images/product-DSC04953.png",
      photo: "assets/images/product-DSC04953.png",
      customizable: true,
      desc: "Подходит для горячих и холодных блюд, разогрева в СВЧ. Герметичный замок по всему периметру.",
      descEn: "Suitable for hot and cold dishes, microwave-safe. Leak-proof perimeter seal.",
      descUz: "Issiq va sovuq taomlar uchun, mikroto'lqinli pechga chidamli. Butun perimetr bo'ylab germetik yopiladi.",
      descKk: "Ыстық және суық тағамдарға, қысқа толқынды пеште жылытуға жарамды. Шеңбер бойы герметикалық құлып."
    },
    {
      id: "prod-9",
      categoryId: "containers",
      title: "Контейнер салатный круглый 750 мл с крышкой",
      titleEn: "Round salad bowl 750 ml with lid",
      titleUz: "Dumaloq salat idishi 750 ml qopqoq bilan",
      titleKk: "Дөңгелек салат ыдысы 750 мл қақпағымен",
      volume: "750 мл",
      diameter: "Ø 150 мм, H 65 мм",
      material: "PET сверхпрозрачный",
      color: "Прозрачный",
      boxQty: "400 шт.",
      minOrder: "30 000 шт.",
      image: "assets/images/product-DSC04876.png",
      photo: "assets/images/product-DSC04876.png",
      desc: "Идеален для готовых салатов, полуфабрикатов и кулинарии. Отличный глянец и жесткость стенок.",
      descEn: "Ideal for ready-to-eat salads, deli and food service. Superb clarity and wall stiffness.",
      descUz: "Tayyor salatlar va yarim tayyor taomlar uchun ideal. Ajoyib shaffoflik va qattiq devorlar.",
      descKk: "Дайын салаттар мен жартылай фабрикаттар үшін өте қолайлы. Жоғары мөлдірлік пен қабырға қаттылығы."
    },
    {
      id: "prod-10",
      categoryId: "cups",
      title: "Одноразовый стакан для напитков 500 мл",
      titleEn: "Disposable beverage cup 500 ml",
      titleUz: "Ichimliklar uchun bir martalik stakan 500 ml",
      titleKk: "Сусындарға арналған бір реттік стақан 500 мл",
      volume: "500 мл",
      diameter: "Ø 95 мм, H 135 мм",
      material: "PP первичный",
      color: "Прозрачный",
      boxQty: "1 000 шт.",
      minOrder: "50 000 шт.",
      image: "assets/images/product-DSC05040.png",
      photo: "assets/images/product-DSC05040.png",
      customizable: true,
      desc: "Эластичный, не трескается при сжатии. Возможность нанесения многоцветного логотипа бренда.",
      descEn: "Elastic and shatter-proof. Multi-color custom printing available.",
      descUz: "Elastik, siqilganda sinmaydi. Buyurtma asosida ko'p rangli logotip tushirish mumkin.",
      descKk: "Серпімді, қысқанда жарылмайды. Түрлі-түсті бренд логотипін басып шығару мүмкіндігі."
    },
    {
      id: "prod-11",
      categoryId: "cups",
      title: "Купольная крышка с отверстием Ø 95 мм",
      titleEn: "Dome lid with hole Ø 95 mm",
      titleUz: "Naycha teshikli gumbazsimon qopqoq Ø 95 mm",
      titleKk: "Түтікше тесігі бар күмбезді қақпақ Ø 95 мм",
      volume: "Ø 95 мм",
      diameter: "Ø 95 мм, H 45 мм",
      material: "PET кристальный",
      color: "Прозрачный",
      boxQty: "1 000 шт.",
      minOrder: "50 000 шт.",
      image: "assets/images/product-DSC05020.png",
      photo: "assets/images/product-DSC05020.png",
      desc: "Купол под коктейльные трубочки, десерты со взбитыми сливками и смузи. Плотно защелкивается.",
      descEn: "Dome for cocktail straws and whipped desserts. Snaps on tightly.",
      descUz: "Kokteyl naychalari, smuzi va desertlar uchun gumbaz qopqoq. Qattiq qisiladi.",
      descKk: "Көктейль түтікшелері мен смузи десерттеріне арналған күмбез қақпақ. Тығыз бекітіледі."
    },
    {
      id: "prod-12",
      categoryId: "containers",
      title: "Ланч-бокс двухсекционный 1000 мл (PP)",
      titleEn: "2-compartment lunch box 1000 ml (PP)",
      titleUz: "Ikki bo'limli lanch-boks 1000 ml (PP)",
      titleKk: "Екі бөлімді ланч-бокс 1000 мл (PP)",
      volume: "1000 мл (650+350)",
      diameter: "220 x 175 x 48 мм",
      material: "PP термостойкий (-20°C до +120°C)",
      color: "Черный корпус + прозрачная крышка",
      boxQty: "300 шт.",
      minOrder: "25 000 шт.",
      image: "assets/images/box-black.png",
      photo: "assets/images/box-black.png",
      customizable: true,
      desc: "Раздельное хранение основного блюда и гарнира. Прочный замок, выдерживает доставку горячих обедов.",
      descEn: "Separate compartments for main dish and side. Sturdy lock, ideal for hot meal delivery.",
      descUz: "Asosiy taom va garnirni alohida saqlash. Mustahkam qulf, issiq ovqat yetkazib berishga mos.",
      descKk: "Негізгі тағам мен гарнирді бөлек сақтау. Ыстық түскі асты жеткізуге арналған сенімді құлып."
    }
  ],
  // All 7 Advantages explicitly required by Section 7 of ТЗ:
  advantages: [
    {
      id: "adv-1",
      icon: "factory",
      title: "Собственное производство",
      titleEn: "Direct Manufacturing",
      titleUz: "O'z ishlab chiqarishimiz",
      titleKk: "Өз өндірісіміз",
      desc: "Первое специализированное предприятие Таджикистана по выпуску жёсткой пластиковой упаковки для пищевой промышленности.",
      descEn: "Tajikistan's first specialized manufacturer of rigid plastic packaging for the food industry.",
      descUz: "Tojikistondagi zavod bilan vositachilarsiz to'g'ridan-to'g'ri ishlash. Texnologiya va xomashyoni to'liq nazorat qilish.",
      descKk: "Тәжікстандағы зауытпен делдалсыз тікелей жұмыс істеу. Технология мен шикізатты толық бақылау."
    },
    {
      id: "adv-2",
      icon: "truck",
      title: "Оптовые объёмы",
      titleEn: "Wholesale Volumes",
      titleUz: "Katta ulgurji hajmlar",
      titleKk: "Ірі көтерме көлемдер",
      desc: "Производственная мощность — от 20 до 60 миллионов единиц готовой упаковки в год.",
      descEn: "Annual production capacity ranges from 20 to 60 million finished packaging units.",
      descUz: "Katta eksport buyurtmalarini tezkor bajarish. Oyiga 18 million donadan ortiq ishlab chiqarish quvvati.",
      descKk: "Ірі экспорттық тапсырыстарды орындау мүмкіндігі. Айына 18 миллионнан астам өнім қуаттылығы."
    },
    {
      id: "adv-3",
      icon: "percent",
      title: "Конкурентная стоимость",
      titleEn: "Competitive Pricing",
      titleUz: "Raqobatbardosh narxlar",
      titleKk: "Бәсекеге қабілетті баға",
      desc: "Планирование крупных партий с учётом отрасли, требований к упаковке и направления поставки.",
      descEn: "Large-batch planning based on industry, packaging requirements, and destination.",
      descUz: "Qulay energiya tariflari va optimallashtirilgan tannarx hisobiga B2B importchilar uchun eng arzon narxlar.",
      descKk: "Төмен энергия тарифтері мен оңтайландырылған өзіндік құн арқасында B2B импорттаушыларға тиімді баға."
    },
    {
      id: "adv-4",
      icon: "layers",
      title: "Широкий ассортимент",
      titleEn: "Wide Product Range",
      titleUz: "Keng mahsulot assortimenti",
      titleKk: "Кең өнім ассортименті",
      desc: "Различные виды жесткой пластиковой упаковки для бизнеса: стаканы, контейнеры для яиц, тортовницы, салатники, крышки.",
      descEn: "Diverse portfolio of rigid plastic packaging: cups, egg containers, cake boxes, food containers, and lids.",
      descUz: "Biznes uchun turli xil qattiq plastik qadoqlar: stakanlar, tuxum qutilari, tort idishlari, salatniklar va qopqoqlar.",
      descKk: "Бизнеске арналған қатты қаптаманың алуан түрі: стақандар, жұмыртқа ыдыстары, торт қораптары, қақпақтар."
    },
    {
      id: "adv-5",
      icon: "settings",
      title: "Индивидуальный подход",
      titleEn: "Custom Engineering",
      titleUz: "Yakka yondashuv",
      titleKk: "Жеке көзқарас",
      desc: "Парк предприятия включает 50+ видов высокоточных пресс-форм для производственных задач.",
      descEn: "The facility's tooling park includes at least 50 types of precision molds.",
      descUz: "Korxonada 50 dan ortiq yuqori aniqlikdagi press-qoliplar mavjud.",
      descKk: "Кәсіпорында 50-ден астам жоғары дәлдіктегі пресс-қалып бар."
    },
    {
      id: "adv-6",
      icon: "shield",
      title: "Контроль качества",
      titleEn: "Rigorous Quality Control",
      titleUz: "Qat'iy sifat nazorati",
      titleKk: "Сапаны қатаң бақылау",
      desc: "Производство соответствует международным санитарно-гигиеническим нормам и требованиям пищевой безопасности.",
      descEn: "Production complies with international sanitary, hygiene, and food-safety requirements.",
      descUz: "Ishlab chiqarish xalqaro sanitariya-gigiyena me'yorlari va oziq-ovqat xavfsizligi talablariga mos.",
      descKk: "Өндіріс халықаралық санитарлық-гигиеналық нормалар мен азық-түлік қауіпсіздігі талаптарына сәйкес."
    },
    {
      id: "adv-7",
      icon: "globe",
      title: "Экспортные запросы",
      titleEn: "Export Inquiries",
      titleUz: "Eksport so'rovlari",
      titleKk: "Экспорттық сұраныстар",
      desc: "Работа с импортёрами из Узбекистана, Казахстана, России, Кыргызстана и других зарубежных рынков.",
      descEn: "The international team accepts inquiries from Uzbekistan, Kazakhstan, Russia, Kyrgyzstan, and other markets.",
      descUz: "Xalqaro bo'lim O'zbekiston, Qozog'iston, Rossiya, Qirg'iziston va boshqa mamlakatlardan so'rovlarni qabul qiladi.",
      descKk: "Халықаралық бөлім Өзбекстан, Қазақстан, Ресей, Қырғызстан және басқа елдерден сұраныстарды қабылдайды."
    }
  ],
  // Production departments / galleries matching Section 12 of ТЗ:
  productionShowcase: [
    {
      id: "lines",
      category: "lines",
      title: "Автоматические линии термоформования",
      titleEn: "Automated Thermoforming Lines",
      titleUz: "Avtomatlashtirilgan termoformirovka liniyalari",
      titleKk: "Автоматтандырылған термоформалау желілері",
      desc: "На предприятии действует 14+ современных автоматизированных линий для производства упаковки.",
      descEn: "The facility operates 14+ modern automated packaging production lines.",
    },
    {
      id: "process",
      category: "process",
      title: "Технологии производства",
      titleEn: "Production Technologies",
      titleUz: "Ishlab chiqarish texnologiyalari",
      titleKk: "Өндіріс технологиялары",
      desc: "Основные процессы: термоформование, литьё пластмасс под давлением и декорирование IML.",
      descEn: "Core processes include thermoforming, injection molding, and in-mold labelling (IML).",
    },
    {
      id: "warehouse",
      category: "warehouse",
      title: "Производственный адрес",
      titleEn: "Production Site",
      titleUz: "Ishlab chiqarish manzili",
      titleKk: "Өндіріс мекенжайы",
      desc: "Республика Таджикистан, Согдийская область, Б. Гафуровский район, ул. Вахдат, 15.",
      descEn: "15 Vahdat Street, B. Gafurov District, Sughd Region, Republic of Tajikistan.",
    },
    {
      id: "qc",
      category: "qc",
      title: "Пищевая безопасность",
      titleEn: "Food Safety",
      titleUz: "Oziq-ovqat xavfsizligi",
      titleKk: "Азық-түлік қауіпсіздігі",
      desc: "Производство ведётся с соблюдением международных санитарно-гигиенических норм и требований пищевой безопасности.",
      descEn: "Production follows international sanitary, hygiene, and food-safety requirements.",
    },
  ],
  documents: [
    {
      id: "doc-1",
      title: "Требования пищевой безопасности",
      titleEn: "Food Safety Requirements",
      titleUz: "Oziq-ovqat xavfsizligi talablari",
      titleKk: "Азық-түлік қауіпсіздігі талаптары",
      type: "Информация",
      number: "По запросу",
      file: ""
    },
    {
      id: "doc-2",
      title: "Материалы и технологии",
      titleEn: "Materials & Technologies",
      titleUz: "Materiallar va texnologiyalar",
      titleKk: "Материалдар мен технологиялар",
      type: "Информация",
      number: "По запросу",
      file: ""
    },
    {
      id: "doc-3",
      title: "Техническая информация по изделию",
      titleEn: "Product Technical Information",
      titleUz: "Mahsulot bo'yicha texnik ma'lumot",
      titleKk: "Өнім туралы техникалық ақпарат",
      type: "Спецификация",
      number: "По запросу",
      file: ""
    },
    {
      id: "doc-4",
      title: "Документы для экспортной поставки",
      titleEn: "Export Shipment Documentation",
      titleUz: "Eksport yetkazib berish hujjatlari",
      titleKk: "Экспорттық жеткізу құжаттары",
      type: "Информация",
      number: "По запросу",
      file: ""
    }
  ]
};

const PRODUCT_SKUS = {
  "prod-1": "MP-PP-DAIRY-400-D95",
  "prod-2": "MP-PP-DAIRY-250-D95",
  "prod-3": "MP-PET-PS-LID-95",
  "prod-4": "MP-PET-EGG-10",
  "prod-5": "MP-PET-EGG-15",
  "prod-6": "MP-PET-PS-CAKE-210",
  "prod-7": "MP-PS-PET-CORREX-3",
  "prod-8": "MP-PP-CONTAINER-500",
  "prod-9": "MP-PET-SALAD-750",
  "prod-10": "MP-PP-CUP-500",
  "prod-11": "MP-PET-DOME-LID-95",
  "prod-12": "MP-PP-LUNCH-1000"
};
const RELATED_PRODUCT_IDS = {
  "prod-1": ["prod-2", "prod-3", "prod-11"],
  "prod-2": ["prod-1", "prod-3", "prod-11"],
  "prod-3": ["prod-1", "prod-2", "prod-11"],
  "prod-4": ["prod-5"],
  "prod-5": ["prod-4"],
  "prod-6": ["prod-7"],
  "prod-7": ["prod-6"],
  "prod-8": ["prod-9", "prod-12"],
  "prod-9": ["prod-8", "prod-12"],
  "prod-10": ["prod-11", "prod-3"],
  "prod-11": ["prod-10", "prod-3"],
  "prod-12": ["prod-8", "prod-9"]
};
const PRODUCT_GALLERIES = {
  "prod-9": [
    "assets/images/product-DSC04876.png",
    "assets/images/product-DSC04874.png"
  ],
  "prod-10": [
    "assets/images/product-DSC05040.png",
    "assets/images/product-DSC05046.png"
  ]
};
const LEGACY_PRODUCT_IMAGES = {
  "prod-1": ["assets/images/product-dairy-cup.svg"],
  "prod-2": ["assets/images/product-dairy-250.svg"],
  "prod-3": ["assets/images/product-lid-95.svg", "assets/images/snap-lid-95.png", "assets/images/DSC04876.png"],
  "prod-4": ["assets/images/product-egg-10.svg", "assets/images/egg-box-10.png", "assets/images/DSC04876.png"],
  "prod-5": ["assets/images/product-egg-15.svg", "assets/images/egg-box-15.png", "assets/images/DSC04957.png"],
  "prod-6": ["assets/images/product-cake-round.svg", "assets/images/cake-round.png", "assets/images/DSC04876.png"],
  "prod-7": ["assets/images/product-correx.jpg", "assets/images/correx-tray.png", "assets/images/DSC04953.png"],
  "prod-8": ["assets/images/product-container-500.svg", "assets/images/container-500.png", "assets/images/DSC04953.png"],
  "prod-9": ["assets/images/product-salad-750.svg", "assets/images/salad-bowl.png", "assets/images/DSC04876.png"],
  "prod-10": ["assets/images/product-cup-500.svg", "assets/images/cup-500.png", "assets/images/DSC05091.png", "assets/images/DSC05040.png"],
  "prod-11": ["assets/images/product-dome-lid.svg", "assets/images/dome-lid.png", "assets/images/DSC05020.png"],
  "prod-12": ["assets/images/product-lunch-box.svg", "assets/images/lunch-box.png"]
};

function createProductSku(product) {
  const material = product.material?.match(/\b(PP|PET|PS)\b/i)?.[1]?.toUpperCase() || "MIX";
  const volume = product.volume?.match(/\d+/)?.[0] || "ITEM";
  const id = String(product.id || "NEW").replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `MP-${material}-${volume}-${id}`;
}

function enrichProduct(product) {
  const diameter = product.diameter?.match(/Ø\s*(\d+)\s*мм/i)?.[1];
  const height = product.diameter?.match(/\bH\s*(\d+)\s*мм/i)?.[1];
  const gallery = product.gallery?.length
    ? product.gallery
    : PRODUCT_GALLERIES[product.id] || [...new Set([product.photo, product.image].filter(Boolean))];

  return {
    ...product,
    sku: product.sku || PRODUCT_SKUS[product.id] || createProductSku(product),
    dimensions: {
      description: product.diameter || "",
      ...(diameter ? { diameterTop: `${diameter} мм` } : {}),
      ...(height ? { height: `${height} мм` } : {}),
      ...(product.dimensions || {})
    },
    packing: {
      inBox: product.packing?.inBox || product.boxQty || "",
      onPallet: product.packing?.onPallet || "",
      boxWeight: product.packing?.boxWeight || ""
    },
    moq: product.moq || product.minOrder || "",
    gallery,
    relatedSkus: product.relatedSkus || (RELATED_PRODUCT_IDS[product.id] || [])
      .map(id => PRODUCT_SKUS[id])
      .filter(Boolean)
  };
}

DEFAULT_DATA.products = DEFAULT_DATA.products.map(enrichProduct);

class Store {
  constructor() {
    this.data = this.loadData();
    this.leads = this.loadLeads();
  }

  loadData() {
    try {
      const currentStored = localStorage.getItem(STORAGE_KEY);
      const stored = currentStored || LEGACY_STORAGE_KEYS
        .map(key => localStorage.getItem(key))
        .find(Boolean);
      if (stored) {
        const parsed = JSON.parse(stored);
        const storedCompany = { ...(parsed.company || {}) };
        delete storedCompany.warehouseAddress;
        const products = (parsed.products || DEFAULT_DATA.products).map(product => {
          const defaults = DEFAULT_DATA.products.find(item => item.id === product.id);
          const legacyImages = LEGACY_PRODUCT_IMAGES[product.id] || [];
          const hasLegacyPhoto = legacyImages.includes(product.photo);
          const hasLegacyImage = legacyImages.includes(product.image);
          return enrichProduct({
            ...defaults,
            ...product,
            image: hasLegacyImage ? defaults?.image : product.image || defaults?.image,
            photo: hasLegacyPhoto ? defaults?.photo : product.photo || defaults?.photo,
            gallery: hasLegacyPhoto || hasLegacyImage ? undefined : product.gallery,
            customizable: product.customizable ?? defaults?.customizable ?? false
          });
        });
        const isLegacyData = !currentStored;
        const linesShowcaseDefaults = DEFAULT_DATA.productionShowcase.find(item => item.id === "lines");
        const productionShowcase = (
          isLegacyData ? DEFAULT_DATA.productionShowcase : (parsed.productionShowcase || DEFAULT_DATA.productionShowcase)
        ).filter(item => item.id !== "shipping").map(item => item.id === "lines" && linesShowcaseDefaults
          ? { ...item, desc: linesShowcaseDefaults.desc, descEn: linesShowcaseDefaults.descEn }
          : item);
        const stats = (isLegacyData ? DEFAULT_DATA.stats : (parsed.stats || DEFAULT_DATA.stats))
          .map(item => item.id === "lines" ? { ...item, number: "14+" } : item);
        const data = {
          ...DEFAULT_DATA,
          ...parsed,
          company: {
            ...DEFAULT_DATA.company,
            ...storedCompany,
            phone: DEFAULT_DATA.company.phone,
            phoneClean: DEFAULT_DATA.company.phoneClean,
            salesPhones: DEFAULT_DATA.company.salesPhones,
            whatsapp: DEFAULT_DATA.company.whatsapp,
            whatsappClean: DEFAULT_DATA.company.whatsappClean,
            email: DEFAULT_DATA.company.email,
            address: DEFAULT_DATA.company.address,
            addressEn: DEFAULT_DATA.company.addressEn,
            addressUz: DEFAULT_DATA.company.addressUz,
            addressKk: DEFAULT_DATA.company.addressKk,
          },
          products,
          stats,
          advantages: isLegacyData ? DEFAULT_DATA.advantages : (parsed.advantages || DEFAULT_DATA.advantages),
          productionShowcase,
          documents: isLegacyData ? DEFAULT_DATA.documents : (parsed.documents || DEFAULT_DATA.documents)
        };
        if (isLegacyData) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn("Error loading stored data:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  saveData(newData) {
    this.data = newData || this.data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      window.dispatchEvent(new CustomEvent('muosir_store_updated', { detail: this.data }));
      return true;
    } catch (e) {
      console.error("Error saving data:", e);
      return false;
    }
  }

  resetData() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('muosir_store_updated', { detail: this.data }));
  }

  getData() {
    return this.data;
  }

  // --- Product Management ---
  getProducts(categoryId = 'all') {
    if (!categoryId || categoryId === 'all') {
      return this.data.products;
    }
    return this.data.products.filter(p => p.categoryId === categoryId);
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  getProductBySku(sku) {
    return this.data.products.find(product => product.sku === sku);
  }

  addProduct(product) {
    if (!product.id) {
      product.id = 'prod-' + Date.now();
    }
    this.data.products.unshift(enrichProduct(product));
    this.saveData();
    return product;
  }

  updateProduct(id, updatedFields) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.products[idx] = enrichProduct({ ...this.data.products[idx], ...updatedFields });
      this.saveData();
      return true;
    }
    return false;
  }

  deleteProduct(id) {
    this.data.products = this.data.products.filter(p => p.id !== id);
    this.saveData();
  }

  // --- Leads Management ---
  loadLeads() {
    try {
      const stored = localStorage.getItem(LEADS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveLead(leadData) {
    const lead = {
      id: 'lead-' + Date.now(),
      createdAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleString('ru-RU'),
      ...leadData
    };
    this.leads.unshift(lead);
    try {
      localStorage.setItem(LEADS_KEY, JSON.stringify(this.leads));
      window.dispatchEvent(new CustomEvent('muosir_lead_created', { detail: lead }));

      // Dispatch Webhooks if configured in admin
      this.dispatchWebhooks(lead);
    } catch (e) {
      console.error("Error saving lead:", e);
    }
    return lead;
  }

  dispatchWebhooks(lead) {
    const company = this.data.company;
    
    // Telegram Webhook
    if (company.telegramWebhookUrl) {
      try {
        const text = `🔔 *Новая B2B заявка Муосир пласт*\n\n` +
          `👤 *Имя:* ${lead.name}\n` +
          `🏢 *Компания:* ${lead.company}\n` +
          `🌍 *Страна:* ${lead.country}\n` +
          `📞 *Телефон:* ${lead.phone}\n` +
          `✉️ *Email:* ${lead.email || '—'}\n` +
          `📦 *Товар:* ${lead.product}\n` +
          `📊 *Объем:* ${lead.volume || '—'}\n` +
          `💬 *Комментарий:* ${lead.comment || '—'}\n` +
          `🎯 *UTM:* ${lead.utmSource || 'direct'} / ${lead.utmCampaign || '—'}`;

        fetch(company.telegramWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, parse_mode: 'Markdown' })
        }).catch(err => console.warn("Telegram webhook error:", err));
      } catch (err) {}
    }

    // CRM Webhook (Bitrix24 / amoCRM webhook)
    if (company.crmWebhookUrl) {
      try {
        fetch(company.crmWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead)
        }).catch(err => console.warn("CRM webhook error:", err));
      } catch (err) {}
    }
  }

  getLeads() {
    return this.leads;
  }

  deleteLead(id) {
    this.leads = this.leads.filter(l => l.id !== id);
    try {
      localStorage.setItem(LEADS_KEY, JSON.stringify(this.leads));
      return true;
    } catch (e) {
      return false;
    }
  }

  clearLeads() {
    this.leads = [];
    localStorage.removeItem(LEADS_KEY);
  }

  // --- Export / Import Config ---
  exportToJson() {
    const payload = {
      data: this.data,
      leads: this.leads,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muosir-plast-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importFromJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.data) {
        this.saveData(parsed.data);
      }
      if (parsed.leads && Array.isArray(parsed.leads)) {
        this.leads = parsed.leads;
        localStorage.setItem(LEADS_KEY, JSON.stringify(this.leads));
      }
      return true;
    } catch (e) {
      console.error("Import error:", e);
      return false;
    }
  }
}

// Global singleton instance
window.muosirStore = new Store();
