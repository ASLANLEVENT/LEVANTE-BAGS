/* =====================================================
   LEVANTE WEBSITE
===================================================== */

const SUPABASE_URL = "https://npckaoaankdhiwbbgwwi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_QFpA4GTT-h6HzvqEJmm3OQ_jYmhhQfa";

// Edge function henüz yeni projede kurulu değil. Boş bırakılırsa sipariş
// doğrudan WhatsApp (wa.me) linkiyle açılır. Kurulunca şu satırı açın:
// const SUPABASE_WHATSAPP_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-whatsapp-order`;
const SUPABASE_WHATSAPP_FUNCTION_URL = "";

const WHATSAPP_NUMBER = "201039812810";


/* =====================================================
   EMAILJS CONFIG (order backup notification)
   Fill these in after creating your EmailJS account at
   https://www.emailjs.com — see setup notes in the
   accompanying message.
===================================================== */

const EMAILJS_PUBLIC_KEY = "Cpgy8iPT25kqk8akV";
const EMAILJS_SERVICE_ID = "service_2nvjn17";
const EMAILJS_TEMPLATE_ID = "template_lejoqhf";


/* =====================================================
   AUTH / ADMIN PORTAL CONFIG
===================================================== */

// Admin yetkisi artık e-postayla değil, veritabanındaki is_admin() ile belirlenir.
const PRODUCT_IMAGES_BUCKET = "product-images";
const HERO_IMAGES_BUCKET = "hero-images";


/* =====================================================
   GÜVENLİK: kullanıcıdan gelen metni HTML'e güvenle yaz
===================================================== */

function escapeHtml(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let supabaseClient = null;
if (window.supabase && typeof window.supabase.createClient === "function") {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
}

let currentUser = null;
let isAdmin = false;
let currentAuthTab = "login";
let currentAdminTab = "users";
let adminHeroRows = [];
let editingProductId = null;
let pfExistingMedia = []; // [{url, type}] already saved for the product being edited
let pfRemovedExistingUrls = []; // urls from pfExistingMedia the admin marked for removal
let pfNewFiles = []; // File objects picked in this edit session (not yet uploaded)


/* =====================================================
   FABRIC & MEASUREMENTS (shared across the collection)
===================================================== */

const MATERIAL_INFO = {

  tr: "Yıkamalı kanvas (yarn dyed canvas), %100 pamuk, 300–340 gr/m².",

  en: "Yarn dyed canvas, 100% cotton, 300–340 GSM.",

  ar: "قماش كانفاس مصبوغ الغزل، قطن 100%، 300–340 جم/م²."

};


const MEASUREMENTS_INFO = {

  tr: [
    "Alt genişlik: 40 cm",
    "Yükseklik: 45 cm",
    "Üst açıklık genişliği: 30 cm",
    "Sap uzunluğu (düğüm dahil): 50 cm",
    "Sap genişliği: 8 cm",
    "Gövde derinliği: 20 cm",
    "İç cep ölçüsü: 18 x 14 cm"
  ],

  en: [
    "Width (bottom): 40 cm",
    "Height: 45 cm",
    "Top opening width: 30 cm",
    "Handle length (incl. knot): 50 cm",
    "Handle width: 8 cm",
    "Body depth (gusset): 20 cm",
    "Inner pocket size: 18 x 14 cm"
  ],

  ar: [
    "العرض (أسفل): 40 سم",
    "الارتفاع: 45 سم",
    "عرض الفتحة العلوية: 30 سم",
    "طول المقبض (مع العقدة): 50 سم",
    "عرض المقبض: 8 سم",
    "عمق الجسم: 20 سم",
    "مقاس الجيب الداخلي: 18 × 14 سم"
  ]

};


function formatPrice(price, language) {

  const rounded =
    Math.round(price);

  if (language === "ar") {

    return `${rounded.toLocaleString("ar-EG")} ج.م`;

  }

  return `${rounded.toLocaleString("en-US")} EGP`;

}


/* =====================================================
   PRODUCTS
   (this static array is the default/fallback content —
   once Supabase has rows in the "products" table, those
   are loaded instead and take over; the admin portal
   writes to that same table)
===================================================== */

let products = [

  {
    id: 1,
    number: "01",
    code: "LV-GLT-01",
    name: "GALATA STRIPE",
    price: 2000,

    image: "images/product-lv-glt-01.jpg",

    colors: [
      {
        name: "Galata Stripe",
        hex: "#c7a27b"
      }
    ],

    specs: {
      tr: [
        "Ayarlanabilir omuz askısı",
        "Günlük kullanım için hafif yapı",
        "İç astar ve fermuarlı bölme"
      ],

      en: [
        "Adjustable shoulder strap",
        "Lightweight construction for everyday use",
        "Inner lining with zip compartment"
      ],

      ar: [
        "حزام كتف قابل للتعديل",
        "تصميم خفيف للاستخدام اليومي",
        "بطانة داخلية مع جيب بسحاب"
      ]
    },

    story: {
      tr: "Galata'nın zamansız sokaklarından ilham aldı. Geçmişin hikâyesi ile modern stilin buluştuğu, her güne karakter katan bir tasarım.",

      en: "Inspired by the timeless streets of Galata. Where history meets effortless modern style.",

      ar: "مستوحاة من شوارع غلطة الخالدة، حيث تلتقي حكايات الماضي بالأناقة العصرية."
    }
  },


  {
    id: 2,
    number: "02",
    code: "LV-BSP-02",
    name: "BOSPHORUS BLUE",
    price: 1500,

    image: "images/product-lv-bsp-02.jpg",

    colors: [
      {
        name: "Bosphorus Blue",
        hex: "#526f88"
      }
    ],

    specs: {
      tr: [
        "Ayarlanabilir omuz askısı",
        "Hafif ve rahat kullanım",
        "İç astarlı yapı"
      ],

      en: [
        "Adjustable shoulder strap",
        "Lightweight and comfortable",
        "Fully lined interior"
      ],

      ar: [
        "حزام قابل للتعديل",
        "خفيفة ومريحة",
        "بطانة داخلية كاملة"
      ]
    },

    story: {
      tr: "Boğaz'ın sakin mavisinden ilham aldı. Akışkan, zarif ve her kombine doğal bir şıklık katan bir model.",

      en: "Inspired by the calm blue of the Bosphorus. Fluid, elegant and effortlessly refined.",

      ar: "مستوحاة من زرقة البوسفور الهادئة. ناعمة وأنيقة وسهلة التنسيق."
    }
  },


  {
    id: 3,
    number: "03",
    code: "LV-KRK-03",
    name: "BEŞİKTAŞ BLACK",
    price: 1500,

    image: "images/product-lv-krk-03.jpg",

    colors: [
      {
        name: "Beşiktaş Black",
        hex: "#262321"
      }
    ],

    specs: {
      tr: [
        "Ayarlanabilir omuz askısı",
        "Günlük şehir kullanımı",
        "İç astarlı yapı"
      ],

      en: [
        "Adjustable shoulder strap",
        "Designed for city life",
        "Fully lined interior"
      ],

      ar: [
        "حزام كتف قابل للتعديل",
        "مصممة للحياة اليومية في المدينة",
        "بطانة داخلية"
      ]
    },

    story: {
      tr: "Zamansız siyah, ince çizgileriyle Beşiktaş'tan ilham alıyor. Zahmetsiz, şık ve sonsuza dek klasik.",

      en: "Timeless black with subtle pinstripes, inspired by Beşiktaş. Effortless, chic, and forever classic.",

      ar: "أسود خالد بخطوط دقيقة، مستوحى من بشيكتاش. أنيق بلا مجهود وكلاسيكي إلى الأبد."
    }
  },


  {
    id: 4,
    number: "04",
    code: "LV-BLT-04",
    name: "BALAT",
    price: 1500,

    image: "images/product-lv-blt-04.jpg",

    colors: [
      {
        name: "Balat Rose",
        hex: "#d3a29c"
      }
    ],

    specs: {
      tr: [
        "Ayarlanabilir askı",
        "Hafif günlük kullanım",
        "İç astarlı tasarım"
      ],

      en: [
        "Adjustable strap",
        "Lightweight everyday use",
        "Lined interior"
      ],

      ar: [
        "حزام قابل للتعديل",
        "خفيفة للاستخدام اليومي",
        "بطانة داخلية"
      ]
    },

    story: {
      tr: "Balat'ın renkli sokakları ve geçmişten gelen karakterinden ilham aldı.",

      en: "Inspired by the colourful streets and historic character of Balat.",

      ar: "مستوحاة من شوارع بالات الملونة وطابعها التاريخي."
    }
  },


  {
    id: 5,
    number: "05",
    code: "LV-TSM-05",
    name: "TAKSIM",
    price: 1500,

    image: "images/product-lv-tsm-05.jpg",

    colors: [
      {
        name: "Taksim Burgundy",
        hex: "#6b2c34"
      }
    ],

    specs: {
      tr: [
        "Ayarlanabilir omuz askısı",
        "Şehir hayatına uygun",
        "İç astarlı tasarım"
      ],

      en: [
        "Adjustable shoulder strap",
        "Designed for city life",
        "Lined interior"
      ],

      ar: [
        "حزام كتف قابل للتعديل",
        "مناسبة لحياة المدينة",
        "بطانة داخلية"
      ]
    },

    story: {
      tr: "Taksim'in hiç durmayan enerjisinden ilham aldı.",

      en: "Inspired by the endless energy of Taksim.",

      ar: "مستوحاة من طاقة تقسيم التي لا تتوقف."
    }
  },


  {
    id: 6,
    number: "06",
    code: "LV-USK-06",
    name: "ÜSKÜDAR",
    price: 1500,

    image: "images/Levante-06.png",

    colors: [
      {
        name: "Üsküdar",
        hex: "#a77d5a"
      }
    ],

    specs: {
      tr: [
        "Ayarlanabilir omuz askısı",
        "Hafif kullanım",
        "İç astarlı yapı"
      ],

      en: [
        "Adjustable shoulder strap",
        "Lightweight construction",
        "Lined interior"
      ],

      ar: [
        "حزام كتف قابل للتعديل",
        "تصميم خفيف",
        "بطانة داخلية"
      ]
    },

    story: {
      tr: "Üsküdar'ın sakin, zarif ve zamansız atmosferinden ilham aldı.",

      en: "Inspired by the calm, elegant and timeless atmosphere of Üsküdar.",

      ar: "مستوحاة من أجواء أسكودار الهادئة والأنيقة والخالدة."
    }
  },


  {
    id: 7,
    number: "07",
    code: "LV-MDN-07",
    name: "MAIDEN'S TOWER",
    price: 1500,

    image: "images/Levante-07.png",

    colors: [
      {
        name: "Maiden's Tower",
        hex: "#d1ad82"
      }
    ],

    specs: {
      tr: [
        "Ayarlanabilir askı",
        "Hafif ve rahat",
        "İç astarlı yapı"
      ],

      en: [
        "Adjustable strap",
        "Lightweight and comfortable",
        "Lined interior"
      ],

      ar: [
        "حزام قابل للتعديل",
        "خفيفة ومريحة",
        "بطانة داخلية"
      ]
    },

    story: {
      tr: "Kız Kulesi'nin zamansız ve romantik hikâyesinden ilham aldı.",

      en: "Inspired by the timeless and romantic story of Maiden's Tower.",

      ar: "مستوحاة من قصة برج العذراء الخالدة والرومانسية."
    }
  },


  {
    id: 8,
    number: "08",
    code: "LV-PRK-08",
    name: "PERA",
    price: 1500,

    image: "images/Levante-08.png",

    colors: [
      {
        name: "Pera",
        hex: "#9b846f"
      }
    ],

    specs: {
      tr: [
        "Ayarlanabilir omuz askısı",
        "Günlük kullanım",
        "İç astarlı yapı"
      ],

      en: [
        "Adjustable shoulder strap",
        "Everyday use",
        "Lined interior"
      ],

      ar: [
        "حزام كتف قابل للتعديل",
        "للاستخدام اليومي",
        "بطانة داخلية"
      ]
    },

    story: {
      tr: "Pera'nın sanat, tarih ve şehir hayatını buluşturan ruhundan ilham aldı.",

      en: "Inspired by Pera's meeting point of art, history and city life.",

      ar: "مستوحاة من روح بيرا التي تجمع بين الفن والتاريخ وحياة المدينة."
    }
  },


  {
    id: 9,
    number: "09",
    code: "LV-EMN-09",
    name: "EMİNÖNÜ",
    price: 1500,

    image: "images/Levante-09.png",

    colors: [
      {
        name: "Eminönü",
        hex: "#b98d67"
      }
    ],

    specs: {
      tr: [
        "Ayarlanabilir askı",
        "Hafif şehir kullanımı",
        "İç astarlı yapı"
      ],

      en: [
        "Adjustable strap",
        "Lightweight city use",
        "Lined interior"
      ],

      ar: [
        "حزام قابل للتعديل",
        "خفيفة للاستخدام في المدينة",
        "بطانة داخلية"
      ]
    },

    story: {
      tr: "Eminönü'nün hareketli, canlı ve geleneksel ruhundan ilham aldı.",

      en: "Inspired by the lively and traditional spirit of Eminönü.",

      ar: "مستوحاة من روح أمينونو النابضة بالحياة والتقاليد."
    }
  },


  {
    id: 10,
    number: "10",
    code: "LV-MID-10",
    name: "MIDNIGHT ISTANBUL",
    price: 1500,

    image: "images/Levante-10.png",

    colors: [
      {
        name: "Midnight Istanbul",
        hex: "#1d1d20"
      }
    ],

    specs: {
      tr: [
        "Ayarlanabilir omuz askısı",
        "Zarif günlük kullanım",
        "İç astarlı yapı"
      ],

      en: [
        "Adjustable shoulder strap",
        "Elegant everyday use",
        "Lined interior"
      ],

      ar: [
        "حزام كتف قابل للتعديل",
        "استخدام يومي أنيق",
        "بطانة داخلية"
      ]
    },

    story: {
      tr: "İstanbul gecelerinden ilham aldı. Derin, zarif ve gizemli. Günün her saatinde güçlü bir ifade.",

      en: "Inspired by Istanbul nights. Deep, elegant and mysterious. A powerful statement at any hour.",

      ar: "مستوحاة من ليالي إسطنبول. عميقة وأنيقة وغامضة، حضور قوي في كل وقت."
    }
  }

];


/* =====================================================
   VARIABLES
===================================================== */

let cart = [];

let currentProductId = null;
let currentProductMediaList = [];
let currentMediaIndex = 0;

let currentSlide = 0;

let showingFavoritesOnly = false;

let favorites = [];

try {

  favorites =
    JSON.parse(
      localStorage.getItem(
        "levante_favorites"
      )
      || "[]"
    );

}

catch (error) {

  favorites = [];

}


/* =====================================================
   TRANSLATIONS
===================================================== */

const translations = {

  tr: {

    menuHome: "Ana Sayfa",
    menuCollection: "Koleksiyon",
    menuBags: "Çantalar",
    menuStory: "Hikâyemiz",
    menuContact: "İletişim",

    heroTag: "İSTANBUL'DA DOĞDU",
    heroTitle: "Bir çantadan<br>daha fazlası.",
    heroText:
      "Her LEVANTE modeli bir şehirden, bir sokaktan ve bir anıdan ilham alır.",
    heroButton: "Koleksiyonu Keşfet →",

    introTag: "LEVANTE DENEYİMİ",
    introTitle: "Taşıdığın şey sadece bir çanta olmasın.",
    introText:
      "İstanbul'un enerjisi, Akdeniz'in hafifliği ve günlük hayatın özgürlüğü.",

    collectionTag: "KOLEKSİYONU KEŞFET",
    collectionTitle: "Hikâyeni Taşı.",
    collectionText:
      "Her modelin kendine ait bir karakteri var. Hangisi sana daha yakın?",

    storyTag: "LEVANT RÜZGARI",
    storyTitle:
      "İstanbul'da doğdu.<br>Levant rüzgârından ilham aldı.",
    storyText:
      "LEVANTE, İstanbul'un enerjisini ve Akdeniz'in özgür ruhunu bir araya getirir.",

    featuresTag: "NEDEN LEVANTE?",
    featuresTitle:
      "Hareket halindeki hayatlar için tasarlandı.",

    feature1Title:
      "Her Çantanın Bir Hikâyesi Var",
    feature1Text:
      "Her model bir şehirden, bir duygudan ve bir anıdan ilham alır.",

    feature2Title:
      "Seninle Hareket Eder",
    feature2Text:
      "Günlük hayatının ritmine uyum sağlamak için tasarlandı.",

    feature3Title:
      "Senin Hikâyen",
    feature3Text:
      "Sadece bir çanta seçmezsin. Sana benzeyen hikâyeyi bulursun.",

    contactTag: "İLETİŞİM",
    contactTitle: "LEVANTE ile iletişime geç.",
    contactText:
      "Koleksiyon, iş birlikleri ve siparişler için bize ulaşabilirsin.",

    quickView: "İncele",
    add: "Sepete Ekle",
    coming: "Yakında",

    cartTitle: "Sipariş Özeti",

    checkoutTitle: "Bilgileriniz",

    namePlaceholder: "Ad Soyad",
    phonePlaceholder: "Telefon Numarası",
    addressPlaceholder: "Şehir / Bölge (Teslimat için)",

    paymentNote:
      "Ödeme yöntemi (kapıda ödeme / havale), siparişiniz onaylandıktan sonra WhatsApp üzerinden netleştirilir.",

    trustBadges: [
      "🔒 Güvenli Sipariş",
      "✓ Orijinal Ürün"
    ],

    policyList: [
      "Kargo: Sipariş onayından itibaren 3-5 iş günü içinde kargoya verilir.",
      "İade: Teslimattan itibaren 14 gün içinde, kullanılmamış ürünlerde iade kabul edilir.",
      "Ödeme: Kapıda ödeme veya banka havalesi ile ödeme yapabilirsiniz."
    ],

    orderButton:
      "Sipariş Talebi Gönder",

    emptyCart:
      "Sepetin henüz boş. Hikâyeni seçmeye başla.",

    remove: "Sil",

    removeConfirmText:
      "\"{name}\" ürününü sepetten kaldırmak istediğinize emin misiniz?",

    removeConfirmYes:
      "Evet, Kaldır",

    removeConfirmNo:
      "Hayır, Vazgeç",

    productCode:
      "Ürün Kodu",

    inStock:
      "Stokta mevcut",

    lowStockText:
      "Son {n} ürün!",

    outOfStock:
      "Ön Sipariş Ver",

    storyLabel:
      "Hikâyesi",

    detailsLabel:
      "Çanta Detayları",

    colorsLabel:
      "Renkler",

    fabricLabel:
      "Kumaş Bilgisi",

    measurementsLabel:
      "Ölçüler",

    usageNote:
      "İçine bir defter, cüzdan ve telefonunuzu rahatça alır.",

    limitedBadgeText:
      "Sınırlı Üretim",

    searchPlaceholder:
      "Ürün ara...",

    noResults:
      "Aradığınız kriterlere uygun ürün bulunamadı.",

    favoriteLabel:
      "Favorilere ekle",

    favoriteAdd:
      "Favorilere Ekle",

    favoriteRemove:
      "Favorilerden Çıkar",

    favoritesToggle:
      "Favorilerim",

    communityTitle:
      "Hikâyemiz henüz başlıyor.",

    communityText:
      "LEVANTE yeni bir marka ve topluluğunu şimdi kuruyor. İlk deneyimini bizimle paylaş, hikâyemizin bir parçası ol.",

    communityCta:
      "Deneyimini Paylaş",

    totalLabel:
      "Toplam",

    buyNow:
      "Satın Al",

    recommendationTag:
      "BUNLARI DA SEVEBİLİRSİN",

    recommendationTitle:
      "Senin için seçtik.",

    storyOne:
      "İstanbul hikâyesi",

    storyTwo:
      "Şehir. Sonsuz ilham."
  },


  en: {

    menuHome: "Home",
    menuCollection: "Collection",
    menuBags: "Bags",
    menuStory: "Our Story",
    menuContact: "Contact",

    heroTag: "BORN IN ISTANBUL",
    heroTitle: "More than<br>a bag.",
    heroText:
      "Every LEVANTE model is inspired by a city, a street and a memory.",
    heroButton: "Explore Collection →",

    introTag: "THE LEVANTE EXPERIENCE",
    introTitle:
      "What you carry should be more than just a bag.",
    introText:
      "The energy of Istanbul, the lightness of the Mediterranean and the freedom of everyday life.",

    collectionTag: "EXPLORE COLLECTION",
    collectionTitle: "Carry Your Story.",
    collectionText:
      "Every model has its own character. Which one feels closest to you?",

    storyTag: "LEVANT BREEZE",
    storyTitle:
      "Born in Istanbul.<br>Inspired by the Levant breeze.",
    storyText:
      "LEVANTE brings together the energy of Istanbul and the free spirit of the Mediterranean.",

    featuresTag: "WHY LEVANTE?",
    featuresTitle:
      "Designed for lives in motion.",

    feature1Title:
      "Every Bag Has a Story",
    feature1Text:
      "Every model is inspired by a city, a feeling and a memory.",

    feature2Title:
      "Moves With You",
    feature2Text:
      "Designed to adapt to the rhythm of your everyday life.",

    feature3Title:
      "Your Story",
    feature3Text:
      "You don't simply choose a bag. You find the story that feels like you.",

    contactTag: "CONTACT",
    contactTitle: "Get in touch with LEVANTE.",
    contactText:
      "Contact us for collections, collaborations and orders.",

    quickView: "View Details",
    add: "Add to Bag",
    coming: "Coming Soon",

    cartTitle: "Order Summary",

    checkoutTitle: "Your Details",

    namePlaceholder: "Full Name",
    phonePlaceholder: "Phone Number",
    addressPlaceholder: "City / Area (for delivery)",

    paymentNote:
      "Payment method (cash on delivery / bank transfer) will be confirmed via WhatsApp after your order request.",

    trustBadges: [
      "🔒 Secure Order",
      "✓ Genuine Product"
    ],

    policyList: [
      "Shipping: Orders are shipped within 3-5 business days of confirmation.",
      "Returns: Accepted within 14 days of delivery for unused items.",
      "Payment: Cash on delivery or bank transfer available."
    ],

    orderButton:
      "Send Order Request",

    emptyCart:
      "Your bag is empty. Start choosing your story.",

    remove: "Remove",

    removeConfirmText:
      "Are you sure you want to remove \"{name}\" from your cart?",

    removeConfirmYes:
      "Yes, Remove",

    removeConfirmNo:
      "No, Keep It",

    productCode:
      "Product Code",

    inStock:
      "In stock",

    lowStockText:
      "Only {n} left!",

    outOfStock:
      "Pre-Order Now",

    storyLabel:
      "The Story",

    detailsLabel:
      "Bag Details",

    colorsLabel:
      "Colors",

    fabricLabel:
      "Fabric Information",

    measurementsLabel:
      "Measurements",

    usageNote:
      "Comfortably fits a notebook, a wallet and your phone.",

    limitedBadgeText:
      "Limited Production",

    searchPlaceholder:
      "Search products...",

    noResults:
      "No products match your search.",

    favoriteLabel:
      "Add to favorites",

    favoriteAdd:
      "Add to Favorites",

    favoriteRemove:
      "Remove from Favorites",

    favoritesToggle:
      "My Favorites",

    communityTitle:
      "Our story is just beginning.",

    communityText:
      "LEVANTE is a new brand, building its community right now. Share your first experience with us and become part of the story.",

    communityCta:
      "Share Your Experience",

    totalLabel:
      "Total",

    buyNow:
      "Buy Now",

    recommendationTag:
      "YOU MAY ALSO LIKE",

    recommendationTitle:
      "Selected for you.",

    storyOne:
      "Istanbul stories",

    storyTwo:
      "City. Endless inspiration."
  },


  ar: {

    menuHome: "الرئيسية",
    menuCollection: "المجموعة",
    menuBags: "الحقائب",
    menuStory: "قصتنا",
    menuContact: "تواصل معنا",

    heroTag: "وُلِدت في إسطنبول",
    heroTitle: "أكثر من<br>مجرد حقيبة.",
    heroText:
      "كل تصميم من LEVANTE مستوحى من مدينة وشارع وذكرى.",
    heroButton: "اكتشف المجموعة ←",

    introTag: "تجربة LEVANTE",
    introTitle:
      "ما تحمله يجب أن يكون أكثر من مجرد حقيبة.",
    introText:
      "طاقة إسطنبول وخفة البحر المتوسط وحرية الحياة اليومية.",

    collectionTag: "اكتشف المجموعة",
    collectionTitle: "احمل قصتك.",
    collectionText:
      "لكل تصميم شخصيته الخاصة. أيها يشبهك أكثر؟",

    storyTag: "نسيم المشرق",
    storyTitle:
      "وُلِدت في إسطنبول.<br>مستوحاة من نسيم المشرق.",
    storyText:
      "تجمع LEVANTE بين طاقة إسطنبول وروح البحر المتوسط الحرة.",

    featuresTag: "لماذا LEVANTE؟",
    featuresTitle:
      "مصممة للحياة المتحركة.",

    feature1Title:
      "لكل حقيبة قصة",
    feature1Text:
      "كل تصميم مستوحى من مدينة وشعور وذكرى.",

    feature2Title:
      "تتحرك معك",
    feature2Text:
      "مصممة لتواكب إيقاع حياتك اليومية.",

    feature3Title:
      "قصتك أنت",
    feature3Text:
      "أنت لا تختار حقيبة فقط، بل تجد القصة التي تشبهك.",

    contactTag: "تواصل معنا",
    contactTitle: "تواصل مع LEVANTE.",
    contactText:
      "تواصل معنا بخصوص المجموعة والتعاون والطلبات.",

    quickView:
      "عرض التفاصيل",

    add:
      "أضف إلى الحقيبة",

    coming:
      "قريباً",

    cartTitle:
      "ملخص الطلب",

    checkoutTitle:
      "بياناتك",

    namePlaceholder:
      "الاسم بالكامل",

    phonePlaceholder:
      "رقم الهاتف",

    addressPlaceholder:
      "المدينة / المنطقة (للتوصيل)",

    paymentNote:
      "سيتم تأكيد طريقة الدفع (الدفع عند الاستلام / التحويل البنكي) عبر واتساب بعد تأكيد طلبك.",

    trustBadges: [
      "🔒 طلب آمن",
      "✓ منتج أصلي"
    ],

    policyList: [
      "الشحن: يتم شحن الطلبات خلال 3-5 أيام عمل من التأكيد.",
      "الإرجاع: يُقبل الإرجاع خلال 14 يوماً من التسليم للمنتجات غير المستخدمة.",
      "الدفع: الدفع عند الاستلام أو التحويل البنكي متاحان."
    ],

    orderButton:
      "إرسال طلب الشراء",

    emptyCart:
      "حقيبتك فارغة. ابدأ باختيار قصتك.",

    remove:
      "حذف",

    removeConfirmText:
      "هل أنت متأكد أنك تريد إزالة \"{name}\" من حقيبتك؟",

    removeConfirmYes:
      "نعم، احذف",

    removeConfirmNo:
      "لا، تراجع",

    productCode:
      "كود المنتج",

    inStock:
      "متوفر",

    lowStockText:
      "باقي {n} فقط!",

    outOfStock:
      "اطلب مسبقًا",

    storyLabel:
      "القصة",

    detailsLabel:
      "تفاصيل الحقيبة",

    colorsLabel:
      "الألوان",

    fabricLabel:
      "معلومات القماش",

    measurementsLabel:
      "المقاسات",

    usageNote:
      "تتسع بسهولة لدفتر ومحفظة وهاتفك.",

    limitedBadgeText:
      "إنتاج محدود",

    searchPlaceholder:
      "ابحث عن منتج...",

    noResults:
      "لا توجد منتجات مطابقة لبحثك.",

    favoriteLabel:
      "أضف إلى المفضلة",

    favoriteAdd:
      "أضف إلى المفضلة",

    favoriteRemove:
      "إزالة من المفضلة",

    favoritesToggle:
      "المفضلة لدي",

    communityTitle:
      "قصتنا بدأت للتو.",

    communityText:
      "ليفانتي علامة تجارية جديدة تبني مجتمعها الآن. شاركنا تجربتك الأولى وكن جزءاً من قصتنا.",

    communityCta:
      "شارك تجربتك",

    totalLabel:
      "الإجمالي",

    buyNow:
      "اشتري الآن",

    recommendationTag:
      "قد يعجبك أيضاً",

    recommendationTitle:
      "اخترناها لك.",

    storyOne:
      "حكايات إسطنبول",

    storyTwo:
      "مدينة. إلهام لا ينتهي."
  }

};


/* =====================================================
   LANGUAGE
===================================================== */

function getLanguage() {

  const element =
    document.getElementById("language");

  return element
    ? element.value
    : "tr";

}


function t() {

  return (
    translations[getLanguage()]
    || translations.tr
  );

}


function setText(
  id,
  value,
  html = false
) {

  const element =
    document.getElementById(id);

  if (!element) {
    return;
  }

  if (html) {
    element.innerHTML = value;
  }

  else {
    element.textContent = value;
  }

}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts(
  list = products
) {

  const grid =
    document.getElementById("productsGrid");

  if (!grid) {
    return;
  }

  const text = t();

  const noResultsEl =
    document.getElementById(
      "searchNoResults"
    );

  if (noResultsEl) {

    noResultsEl.textContent =
      list.length === 0
        ? text.noResults
        : "";

  }

  grid.innerHTML =
    list.map(product => `

      <article class="product-card">

        <div
          class="product-image-wrap"
          onclick="openProduct(${product.id})"
        >

          <img
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
          >

          <button
            class="quick-view"
            onclick="
              event.stopPropagation();
              openProduct(${product.id});
            "
          >
            ${text.quickView}
          </button>


          <button
            class="favorite-btn${
              isFavorite(product.id)
                ? " active"
                : ""
            }"
            data-fav-id="${product.id}"
            aria-label="${text.favoriteLabel}"
            onclick="
              toggleFavorite(
                ${product.id},
                event
              )
            "
          >
            ♥
          </button>

        </div>


        <div class="product-info">

          <div class="product-code">

            ${product.number}
            ·
            ${product.code}

          </div>


          <h3>
            ${product.name}
          </h3>


          <p class="story">

            ${
              product.story[getLanguage()]
              || product.story.en
            }

          </p>


          <div class="product-bottom">

            <span class="price">
              ${formatPrice(product.price, getLanguage())}
            </span>


            <button
              class="add-btn"
              onclick="
                addToCart(
                  ${product.id},
                  this
                )
              "
            >
              ${text.add}
            </button>

          </div>

        </div>

      </article>

    `).join("");

}


function saveFavorites() {

  try {

    localStorage.setItem(
      "levante_favorites",
      JSON.stringify(
        favorites
      )
    );

  }

  catch (error) {}

}


function isFavorite(
  productId
) {

  return favorites.includes(
    productId
  );

}


function toggleFavorite(
  productId,
  event
) {

  if (event) {
    event.stopPropagation();
  }

  if (isFavorite(productId)) {

    favorites =
      favorites.filter(
        id =>
          id !== productId
      );

  }

  else {

    favorites =
      [
        ...favorites,
        productId
      ];

  }

  saveFavorites();

  updateFavoritesCount();


  if (showingFavoritesOnly) {

    applyFavoritesFilter();

  }

  else {

    const btns =
      document.querySelectorAll(
        `[data-fav-id="${productId}"]`
      );

    btns.forEach(
      btn => {

        btn.classList.toggle(
          "active",
          isFavorite(productId)
        );

      }
    );

  }

}


function toggleDetailFavorite() {

  if (!currentProductId) {
    return;
  }

  toggleFavorite(
    currentProductId
  );

  updateDetailFavoriteButton();

}


function updateDetailFavoriteButton() {

  const btn =
    document.getElementById(
      "detailFavoriteBtn"
    );

  const icon =
    document.getElementById(
      "detailFavoriteIcon"
    );

  const label =
    document.getElementById(
      "detailFavoriteLabel"
    );

  if (
    !btn
    ||
    !currentProductId
  ) {
    return;
  }

  const active =
    isFavorite(
      currentProductId
    );

  const text = t();

  btn.classList.toggle(
    "active",
    active
  );

  icon.textContent =
    active
      ? "♥"
      : "♡";

  label.textContent =
    active
      ? text.favoriteRemove
      : text.favoriteAdd;

}


function updateFavoritesCount() {

  const el =
    document.getElementById(
      "favoritesCount"
    );

  if (el) {

    el.textContent =
      favorites.length;

  }

}


function toggleFavoritesFilter() {

  showingFavoritesOnly =
    !showingFavoritesOnly;

  const toggleBtn =
    document.getElementById(
      "favoritesToggle"
    );

  if (toggleBtn) {

    toggleBtn.classList.toggle(
      "active",
      showingFavoritesOnly
    );

  }

  applyFavoritesFilter();

}


function applyFavoritesFilter() {

  if (showingFavoritesOnly) {

    renderProducts(
      products.filter(
        product =>
          isFavorite(product.id)
      )
    );

  }

  else {

    const searchInput =
      document.getElementById(
        "productSearch"
      );

    if (
      searchInput
      &&
      searchInput.value.trim()
    ) {

      filterProducts(
        searchInput.value
      );

    }

    else {

      renderProducts();

    }

  }

}


function filterProducts(
  query
) {

  const normalized =
    query
      .trim()
      .toLocaleLowerCase("tr");

  if (!normalized) {

    renderProducts();

    return;

  }

  const filtered =
    products.filter(
      product => {

        const haystack = [
          product.name,
          product.code,
          product.number,
          product.story.tr,
          product.story.en
        ]
          .join(" ")
          .toLocaleLowerCase("tr");

        return haystack.includes(
          normalized
        );

      }
    );

  renderProducts(filtered);

}


/* =====================================================
   CHANGE LANGUAGE
===================================================== */

function changeLanguage() {

  const text = t();

  const language =
    getLanguage();

  document.documentElement.lang =
    language;

  document.documentElement.dir =
    language === "ar"
      ? "rtl"
      : "ltr";


  [
    [
      "heroTag",
      text.heroTag
    ],

    [
      "heroTitle",
      text.heroTitle,
      true
    ],

    [
      "heroText",
      text.heroText
    ],

    [
      "heroButton",
      text.heroButton
    ],

    [
      "introTag",
      text.introTag
    ],

    [
      "introTitle",
      text.introTitle
    ],

    [
      "introText",
      text.introText
    ],

    [
      "collectionTag",
      text.collectionTag
    ],

    [
      "collectionTitle",
      text.collectionTitle
    ],

    [
      "collectionText",
      text.collectionText
    ],

    [
      "storyTag",
      text.storyTag
    ],

    [
      "storyTitle",
      text.storyTitle,
      true
    ],

    [
      "storyText",
      text.storyText
    ],

    [
      "featuresTag",
      text.featuresTag
    ],

    [
      "featuresTitle",
      text.featuresTitle
    ],

    [
      "feature1Title",
      text.feature1Title
    ],

    [
      "feature1Text",
      text.feature1Text
    ],

    [
      "feature2Title",
      text.feature2Title
    ],

    [
      "feature2Text",
      text.feature2Text
    ],

    [
      "feature3Title",
      text.feature3Title
    ],

    [
      "feature3Text",
      text.feature3Text
    ],

    [
      "communityTitle",
      text.communityTitle
    ],

    [
      "communityText",
      text.communityText
    ],

    [
      "communityCta",
      text.communityCta
    ],

    [
      "contactTag",
      text.contactTag
    ],

    [
      "contactTitle",
      text.contactTitle
    ],

    [
      "contactText",
      text.contactText
    ],

    [
      "cartTitle",
      text.cartTitle
    ],

    [
      "checkoutTitle",
      text.checkoutTitle
    ],

    [
      "whatsappButton",
      text.orderButton
    ],

    [
      "storyNumberOne",
      text.storyOne
    ],

    [
      "storyNumberTwo",
      text.storyTwo
    ]

  ].forEach(
    ([id, value, html]) =>
      setText(
        id,
        value,
        html
      )
  );


  document
    .querySelectorAll("[data-i18n]")
    .forEach(element => {

      const key =
        element.dataset.i18n;

      if (text[key]) {

        element.textContent =
          text[key];

      }

    });


  const name =
    document.getElementById(
      "customerName"
    );

  const phone =
    document.getElementById(
      "customerPhone"
    );


  if (name) {

    name.placeholder =
      text.namePlaceholder;

  }


  if (phone) {

    phone.placeholder =
      text.phonePlaceholder;

  }


  const address =
    document.getElementById(
      "customerAddress"
    );

  if (address) {

    address.placeholder =
      text.addressPlaceholder;

  }


  const searchInput =
    document.getElementById(
      "productSearch"
    );

  if (searchInput) {

    searchInput.placeholder =
      text.searchPlaceholder;

  }

  setText(
    "favoritesToggleLabel",
    text.favoritesToggle
  );


  setText(
    "paymentNote",
    text.paymentNote
  );


  const trustBadges =
    document.getElementById(
      "trustBadges"
    );

  if (trustBadges) {

    trustBadges.innerHTML =
      text.trustBadges
        .map(
          badge =>
            `<span>${badge}</span>`
        )
        .join("");

  }





  if (
    searchInput
    &&
    searchInput.value.trim()
  ) {

    filterProducts(
      searchInput.value
    );

  }

  else {

    renderProducts();

  }

  updateCart();


  if (currentProductId) {

    openProduct(
      currentProductId,
      true
    );

  }

}


/* =====================================================
   PRODUCT DETAIL
===================================================== */

function toListSafe(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    return value.split("\n").map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function isVideoUrl(url) {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url || "");
}

function getProductMedia(product) {
  if (!product) return [];
  if (Array.isArray(product.media) && product.media.length > 0) {
    return product.media;
  }
  if (product.image) {
    return [{ url: product.image, type: isVideoUrl(product.image) ? "video" : "image" }];
  }
  return [];
}

function openProduct(
  productId,
  preserveScroll = false
) {

  const product =
    products.find(
      product =>
        product.id === productId
    );

  if (!product) {
    return;
  }


  currentProductId =
    productId;

  const text =
    t();


  const modal =
    document.getElementById(
      "productModal"
    );


  const productMedia =
    getProductMedia(product);

  currentProductMediaList = productMedia;
  currentMediaIndex = 0;

  const firstMedia =
    productMedia[0] || { url: product.image, type: "image" };

  showDetailMedia(
    firstMedia.url,
    firstMedia.type,
    product.name
  );

  const navDisplay = productMedia.length > 1 ? "flex" : "none";
  const navPrev = document.getElementById("galleryNavPrev");
  const navNext = document.getElementById("galleryNavNext");
  if (navPrev) navPrev.style.display = navDisplay;
  if (navNext) navNext.style.display = navDisplay;


  setText(
    "detailNumber",
    `${product.number} · LEVANTE`
  );

  setText(
    "detailName",
    product.name
  );

  setText(
    "detailCodeLabel",
    text.productCode
  );

  setText(
    "detailCode",
    product.code
  );

  setText(
    "detailPrice",
    formatPrice(
      product.price,
      getLanguage()
    )
  );

  {
    const stockEl = document.getElementById("detailStock");
    const stockRow = stockEl ? stockEl.closest(".detail-stock") : null;
    const stock = product.stock;

    let stockLabel = text.inStock;
    let urgent = false;
    let preOrder = false;

    if (typeof stock === "number") {
      if (stock <= 0) {
        stockLabel = text.outOfStock;
        preOrder = true;
      } else if (stock <= 5) {
        stockLabel = text.lowStockText.replace("{n}", stock);
        urgent = true;
      }
    }

    if (stockEl) stockEl.textContent = stockLabel;
    if (stockRow) {
      stockRow.classList.toggle("low-stock", urgent);
      stockRow.classList.toggle("pre-order", preOrder);
    }
  }

  setText(
    "limitedBadge",
    text.limitedBadgeText
  );

  updateDetailFavoriteButton();

  setText(
    "detailFabricLabel",
    text.fabricLabel
  );

  setText(
    "detailFabric",
    MATERIAL_INFO[getLanguage()]
    || MATERIAL_INFO.en
  );

  setText(
    "detailMeasurementsLabel",
    text.measurementsLabel
  );

  setText(
    "detailUsageNote",
    text.usageNote
  );

  setText(
    "detailStoryLabel",
    text.storyLabel
  );

  setText(
    "detailStory",
    product.story[getLanguage()]
    || product.story.en
  );

  setText(
    "detailDetailsLabel",
    text.detailsLabel
  );

  setText(
    "detailColorsLabel",
    text.colorsLabel
  );

  setText(
    "recommendationTag",
    text.recommendationTag
  );

  setText(
    "recommendationTitle",
    text.recommendationTitle
  );


  const specs =
    document.getElementById(
      "detailSpecs"
    );

  specs.innerHTML =
    toListSafe(
      product.specs[getLanguage()]
      || product.specs.en
    )
      .map(
        item =>
          `<li>${item}</li>`
      )
      .join("");


  const measurements =
    document.getElementById(
      "detailMeasurementsList"
    );

  measurements.innerHTML =
    (
      MEASUREMENTS_INFO[getLanguage()]
      || MEASUREMENTS_INFO.en
    )
      .map(
        item =>
          `<li>${item}</li>`
      )
      .join("");


  const colors =
    document.getElementById(
      "detailColors"
    );


  colors.innerHTML =
    product.colors
      .map(
        color => `

          <button
            class="color-option"
            title="${color.name}"
            aria-label="${color.name}"
          >

            <span
              class="color-swatch"
              style="
                background:
                ${color.hex}
              "
            ></span>

          </button>

        `
      )
      .join("");


  const thumbnails =
    document.getElementById(
      "productThumbnails"
    );


  thumbnails.innerHTML =
    productMedia
      .map(
        (media, index) => `

    <button
      class="thumb-btn ${index === 0 ? "active" : ""} ${media.type === "video" ? "thumb-video" : ""}"
      onclick="
        setDetailImage(
          '${media.url}',
          '${media.type}',
          ${index},
          this
        )
      "
    >

      ${
        media.type === "video"
          ? `<video src="${media.url}" muted></video>`
          : `<img src="${media.url}" alt="${product.name}">`
      }

    </button>

  `
      )
      .join("");


  const add =
    document.getElementById(
      "detailAddButton"
    );


  add.textContent =
    text.add;


  add.onclick =
    () =>
      addToCart(
        product.id,
        add,
        document.getElementById(
          "detailMainImage"
        )
      );


  const buy =
    document.getElementById(
      "detailBuyButton"
    );


  buy.textContent =
    text.buyNow;


  buy.onclick =
    () => {

      addToCart(
        product.id,
        buy,
        document.getElementById(
          "detailMainImage"
        )
      );

      closeProduct();

      setTimeout(
        openCart,
        450
      );

    };


  renderRecommendations(
    product.id
  );


  if (!preserveScroll) {

    modal.classList.add(
      "active"
    );

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "product-open"
    );

  }

}


function showDetailMedia(src, type, altText) {

  const img =
    document.getElementById("detailMainImage");
  const video =
    document.getElementById("detailMainVideo");

  if (type === "video") {
    video.src = src;
    video.style.display = "block";
    img.style.display = "none";
    img.src = "";
  } else {
    img.src = src;
    img.alt = altText || "";
    img.style.display = "block";
    video.pause?.();
    video.style.display = "none";
    video.src = "";
  }

}

function openMediaLightbox() {

  const img = document.getElementById("detailMainImage");
  if (!img || !img.src || img.style.display === "none") {
    return;
  }

  const lightbox = document.getElementById("mediaLightbox");
  const lightboxImg = document.getElementById("lightboxImage");
  const lightboxVideo = document.getElementById("lightboxVideo");

  lightboxVideo.pause?.();
  lightboxVideo.style.display = "none";
  lightboxVideo.src = "";

  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt || "";
  lightboxImg.style.display = "block";

  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");

}

function closeMediaLightbox() {

  const lightbox = document.getElementById("mediaLightbox");
  const lightboxImg = document.getElementById("lightboxImage");
  const lightboxVideo = document.getElementById("lightboxVideo");

  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");

  lightboxImg.src = "";
  lightboxVideo.pause?.();
  lightboxVideo.src = "";

}

function setDetailImage(
  src,
  type,
  index,
  button
) {

  showDetailMedia(src, type);

  if (typeof index === "number") {
    currentMediaIndex = index;
  }


  document
    .querySelectorAll(
      ".thumb-btn"
    )
    .forEach(
      button =>
        button.classList.remove(
          "active"
        )
    );


  if (button) {

    button.classList.add(
      "active"
    );

  }

}

function navigateDetailMedia(direction) {

  if (!currentProductMediaList || currentProductMediaList.length < 2) {
    return;
  }

  const len = currentProductMediaList.length;
  currentMediaIndex = (currentMediaIndex + direction + len) % len;

  const media = currentProductMediaList[currentMediaIndex];
  showDetailMedia(media.url, media.type);

  const thumbs = document.querySelectorAll(".thumb-btn");
  thumbs.forEach((btn, i) => {
    btn.classList.toggle("active", i === currentMediaIndex);
  });

  const activeThumb = thumbs[currentMediaIndex];
  if (activeThumb && activeThumb.scrollIntoView) {
    activeThumb.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
  }

}


function closeProduct() {

  const modal =
    document.getElementById(
      "productModal"
    );


  modal.classList.remove(
    "active"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "product-open"
  );


  currentProductId =
    null;

}


/* =====================================================
   RECOMMENDATIONS
===================================================== */

function renderRecommendations(
  currentId
) {

  const grid =
    document.getElementById(
      "recommendationGrid"
    );


  const selected =
    products
      .filter(
        product =>
          product.id !== currentId
      )
      .sort(
        () =>
          Math.random() - 0.5
      )
      .slice(
        0,
        3
      );


  grid.innerHTML =
    selected.map(
      product => `

        <article
          class="recommendation-card"
          onclick="
            openProduct(
              ${product.id}
            )
          "
        >

          <img
            src="${product.image}"
            alt="${product.name}"
          >

          <div>

            <small>
              ${product.code}
            </small>

            <h4>
              ${product.name}
            </h4>

          </div>

        </article>

      `
    ).join("");

}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCart(
  productId,
  sourceButton = null,
  sourceImage = null
) {

  const product =
    products.find(
      item =>
        item.id === productId
    );


  if (!product) {
    return;
  }


  const existing =
    cart.find(
      item =>
        item.id === productId
    );


  if (existing) {

    existing.quantity += 1;

  }

  else {

    cart.push({

      ...product,

      quantity: 1

    });

  }


  if (
    !sourceImage
    &&
    sourceButton
  ) {

    const card =
      sourceButton.closest(
        ".product-card"
      );


    sourceImage =
      card
        ? card.querySelector(
            "img"
          )
        : null;

  }


  if (sourceImage) {

    animateToCart(
      sourceImage
    );

  }

  else {

    updateCart(
      true
    );

  }

}


/* =====================================================
   FLY TO CART
===================================================== */

function animateToCart(
  sourceImage
) {

  const rect =
    sourceImage.getBoundingClientRect();


  const cartButton =
    document.getElementById(
      "cartButton"
    );


  const target =
    cartButton.getBoundingClientRect();


  const flying =
    sourceImage.cloneNode(
      true
    );


  flying.className =
    "flying-product";


  flying.style.left =
    `${rect.left}px`;

  flying.style.top =
    `${rect.top}px`;

  flying.style.width =
    `${rect.width}px`;

  flying.style.height =
    `${rect.height}px`;


  document.body.appendChild(
    flying
  );


  requestAnimationFrame(
    () => {

      flying.style.left =
        `${
          target.left
          +
          target.width / 2
          -
          18
        }px`;


      flying.style.top =
        `${
          target.top
          +
          target.height / 2
          -
          18
        }px`;


      flying.style.width =
        "36px";

      flying.style.height =
        "36px";

      flying.style.opacity =
        ".25";

      flying.style.transform =
        "rotate(18deg) scale(.45)";

    }
  );


  setTimeout(
    () => {

      flying.remove();

      updateCart(
        true
      );

    },
    730
  );

}


/* =====================================================
   CART QUANTITY
===================================================== */

function changeQuantity(
  productId,
  amount
) {

  const item =
    cart.find(
      item =>
        item.id === productId
    );


  if (!item) {
    return;
  }


  item.quantity +=
    amount;


  if (
    item.quantity <= 0
  ) {

    removeFromCart(
      productId
    );

  }

  else {

    updateCart();

  }

}


function removeFromCart(
  productId
) {

  cart =
    cart.filter(
      item =>
        item.id !== productId
    );


  updateCart();

}


let pendingRemoveId = null;


function requestRemoveFromCart(
  productId,
  productName
) {

  pendingRemoveId = productId;

  const text =
    translations[getLanguage()];


  setText(
    "removeConfirmText",
    text.removeConfirmText.replace(
      "{name}",
      productName
    )
  );

  setText(
    "removeConfirmYes",
    text.removeConfirmYes
  );

  setText(
    "removeConfirmNo",
    text.removeConfirmNo
  );


  document
    .getElementById(
      "removeConfirmOverlay"
    )
    .classList.add("active");

  document
    .getElementById(
      "removeConfirmBox"
    )
    .classList.add("active");

}


function confirmRemoveFromCart() {

  if (pendingRemoveId !== null) {

    removeFromCart(
      pendingRemoveId
    );

  }


  cancelRemoveFromCart();

}


function cancelRemoveFromCart() {

  pendingRemoveId = null;

  document
    .getElementById(
      "removeConfirmOverlay"
    )
    .classList.remove("active");

  document
    .getElementById(
      "removeConfirmBox"
    )
    .classList.remove("active");

}


/* =====================================================
   UPDATE CART
===================================================== */

function updateCart(
  animateCount = false
) {

  const cartItems =
    document.getElementById(
      "cartItems"
    );


  const cartCount =
    document.getElementById(
      "cartCount"
    );


  if (
    !cartItems
    ||
    !cartCount
  ) {
    return;
  }


  const text =
    t();


  const total =
    cart.reduce(
      (
        sum,
        item
      ) =>
        sum + item.quantity,
      0
    );


  const totalPrice =
    cart.reduce(
      (
        sum,
        item
      ) =>
        sum + (item.price * item.quantity),
      0
    );


  cartCount.textContent =
    total;


  const totalLabelEl =
    document.getElementById(
      "cartTotalLabel"
    );

  const totalValueEl =
    document.getElementById(
      "cartTotalValue"
    );

  if (totalLabelEl) {

    totalLabelEl.textContent =
      text.totalLabel;

  }

  if (totalValueEl) {

    totalValueEl.textContent =
      formatPrice(
        totalPrice,
        getLanguage()
      );

  }


  if (animateCount) {

    cartCount.classList.remove(
      "bump"
    );


    void cartCount.offsetWidth;


    cartCount.classList.add(
      "bump"
    );

  }


  if (!cart.length) {

    cartItems.innerHTML =
      `
        <div
          class="empty-cart"
        >
          ${text.emptyCart}
        </div>
      `;

    return;

  }


  cartItems.innerHTML =
    cart.map(
      item => `

        <div
          class="cart-item"
        >

          <button
            class="cart-item-remove"
            aria-label="${text.remove}"
            onclick="
              requestRemoveFromCart(
                ${item.id},
                '${item.name.replace(/'/g, "\\'")}'
              )
            "
          >
            ×
          </button>


          <img
            src="${item.image}"
            alt="${item.name}"
          >


          <div
            class="cart-item-info"
          >

            <h4>

              ${item.number}
              ·
              ${item.name}

            </h4>


            <small>

              ${item.code}

            </small>


            <div class="cart-item-price">

              ${formatPrice(
                item.price,
                getLanguage()
              )}

            </div>


            <div
              class="quantity-controls"
            >

              <button
                onclick="
                  changeQuantity(
                    ${item.id},
                    -1
                  )
                "
              >
                −
              </button>


              <strong>

                ${item.quantity}

              </strong>


              <button
                onclick="
                  changeQuantity(
                    ${item.id},
                    1
                  )
                "
              >
                +
              </button>

            </div>

          </div>

        </div>

      `
    )
    .join("");

}


/* =====================================================
   CART OPEN / CLOSE
===================================================== */

function openCart() {

  document
    .getElementById(
      "cartDrawer"
    )
    .classList.add(
      "active"
    );


  document
    .getElementById(
      "cartOverlay"
    )
    .classList.add(
      "active"
    );


  document.body.classList.add(
    "cart-open"
  );

}


function closeCart() {

  document
    .getElementById(
      "cartDrawer"
    )
    .classList.remove(
      "active"
    );


  document
    .getElementById(
      "cartOverlay"
    )
    .classList.remove(
      "active"
    );


  document.body.classList.remove(
    "cart-open"
  );

}


/* =====================================================
   MENU
===================================================== */

function openMenu() {

  document
    .getElementById(
      "sideMenu"
    )
    .classList.add(
      "active"
    );


  document
    .getElementById(
      "menuOverlay"
    )
    .classList.add(
      "active"
    );


  document.body.classList.add(
    "menu-open"
  );

}


function closeMenu() {

  document
    .getElementById(
      "sideMenu"
    )
    .classList.remove(
      "active"
    );


  document
    .getElementById(
      "menuOverlay"
    )
    .classList.remove(
      "active"
    );


  document.body.classList.remove(
    "menu-open"
  );

}


/* =====================================================
   ORDER
===================================================== */

function sendOrderEmailBackup(
  orderData
) {

  if (
    !window.emailjs
    ||
    EMAILJS_PUBLIC_KEY ===
      "YOUR_PUBLIC_KEY"
  ) {

    return;

  }


  const itemsText =
    orderData.items
      .map(
        (
          item,
          index
        ) =>
          `${index + 1}. ${item.number} · ${item.name} (${item.code}) — Adet: ${item.quantity}`
      )
      .join("\n");


  const templateParams = {

    customer_name:
      orderData.customer_name,

    customer_phone:
      orderData.customer_phone,

    customer_address:
      orderData.customer_address,

    total_price:
      formatPrice(
        orderData.total_price,
        orderData.language
      ),

    order_items:
      itemsText,

    order_date:
      orderData.created_at

  };


  emailjs
    .send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    )
    .catch(
      error => {

        console.warn(
          "Email backup notification failed:",
          error
        );

      }
    );

}


function saveOrderToSupabase(
  orderData
) {

  if (!supabaseClient) {
    return;
  }

  // Sipariş doğrudan tabloya yazılmaz; sunucudaki place_order() fonksiyonu
  // fiyatı ürün tablosundan kendisi hesaplar ve girdileri doğrular.
  supabaseClient
    .rpc("place_order", {
      p_name: orderData.customer_name,
      p_phone: orderData.customer_phone,
      p_address: orderData.customer_address,
      p_items: orderData.items.map(item => ({
        id: item.id,
        quantity: item.quantity
      }))
    })
    .then(
      ({ error }) => {
        if (error) {
          console.warn(
            "Order record failed:",
            error.message
          );
        }
      }
    );

}


async function sendWhatsAppOrder() {

  const nameEl =
    document.getElementById(
      "customerName"
    );


  const phoneEl =
    document.getElementById(
      "customerPhone"
    );


  const addressEl =
    document.getElementById(
      "customerAddress"
    );


  const button =
    document.getElementById(
      "whatsappButton"
    );


  const language =
    getLanguage();


  const name =
    nameEl.value.trim();


  const phone =
    phoneEl.value.trim();


  const address =
    addressEl
      ? addressEl.value.trim()
      : "";


  const messages = {

    tr: {
      empty:
        "Sepetiniz boş.",

      required:
        "Lütfen ad soyad, telefon numarası ve şehir/bölge bilginizi giriniz.",

      sending:
        "Gönderiliyor..."
    },


    en: {
      empty:
        "Your bag is empty.",

      required:
        "Please enter your full name, phone number and city/area.",

      sending:
        "Sending..."
    },


    ar: {
      empty:
        "حقيبتك فارغة.",

      required:
        "يرجى إدخال الاسم ورقم الهاتف والمدينة/المنطقة.",

      sending:
        "جارٍ الإرسال..."
    }

  };


  const msg =
    messages[language];


  if (!cart.length) {

    alert(
      msg.empty
    );

    return;

  }


  if (
    !name
    ||
    !phone
    ||
    !address
  ) {

    alert(
      msg.required
    );

    return;

  }


  const totalPrice =
    cart.reduce(
      (
        sum,
        item
      ) =>
        sum + (item.price * item.quantity),
      0
    );


  const orderData = {

    customer_name:
      name,

    customer_phone:
      phone,

    customer_address:
      address,

    total_price:
      totalPrice,

    language:
      language,

    items:
      cart.map(
        item => ({

          id:
            item.id,

          name:
            item.name,

          number:
            item.number,

          code:
            item.code,

          quantity:
            item.quantity,

          price:
            item.price

        })
      ),

    created_at:
      new Date()
        .toISOString()

  };


  // Fire-and-forget email backup — always attempted,
  // independent of whether the WhatsApp step below
  // succeeds, fails, or the customer skips sending.
  sendOrderEmailBackup(
    orderData
  );

  // Fire-and-forget order record — powers the admin
  // sales analytics, independent of the WhatsApp step.
  saveOrderToSupabase(
    orderData
  );


  const original =
    button.textContent;


  button.disabled =
    true;


  button.textContent =
    msg.sending;


  try {

    if (!SUPABASE_WHATSAPP_FUNCTION_URL) {
      throw new Error("WhatsApp function not configured");
    }

    const response =
      await fetch(

        SUPABASE_WHATSAPP_FUNCTION_URL,

        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json",

            "apikey":
              SUPABASE_PUBLISHABLE_KEY,

            "Authorization":
              `Bearer ${SUPABASE_PUBLISHABLE_KEY}`

          },

          body:
            JSON.stringify(
              orderData
            )

        }

      );


    if (!response.ok) {

      throw new Error(
        "Edge function unavailable"
      );

    }


    nameEl.value =
      "";

    phoneEl.value =
      "";

    if (addressEl) {

      addressEl.value =
        "";

    }


    setTimeout(
      closeCart,
      350
    );

  }


  catch (error) {

    const items =
      cart.map(
        (
          item,
          index
        ) =>

          `${
            index + 1
          }. ${
            item.number
          } · ${
            item.name
          }\nKod: ${
            item.code
          }\nAdet: ${
            item.quantity
          }`

      )
      .join(
        "\n\n"
      );


    const whatsappMessage =
      `👜 *NEW LEVANTE ORDER REQUEST*

👤 *Customer Name:* ${name}
📱 *Customer Phone:* ${phone}
📍 *City/Area:* ${address}

🛍️ *ORDER DETAILS*

${items}

💰 *Total:* ${formatPrice(totalPrice, language)}

✨ Sent from LEVANTE Website`;


    const url =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;


    window.open(
      url,
      "_blank"
    );

  }


  finally {

    button.disabled =
      false;


    button.textContent =
      original;

  }

}


/* =====================================================
   HERO SLIDER
===================================================== */

function goToSlide(
  index
) {

  const slides =
    document.querySelectorAll(
      ".slide"
    );


  const dots =
    document.querySelectorAll(
      ".dot"
    );


  if (!slides.length) {
    return;
  }


  slides[
    currentSlide
  ]
    ?.classList.remove(
      "active"
    );


  dots[
    currentSlide
  ]
    ?.classList.remove(
      "active"
    );


  currentSlide =
    index;


  if (
    currentSlide >=
    slides.length
  ) {

    currentSlide =
      0;

  }


  if (
    currentSlide < 0
  ) {

    currentSlide =
      slides.length - 1;

  }


  slides[
    currentSlide
  ]
    ?.classList.add(
      "active"
    );


  dots[
    currentSlide
  ]
    ?.classList.add(
      "active"
    );

}


/* =====================================================
   HERO SLIDES <-> SUPABASE
===================================================== */

async function loadHeroSlidesFromSupabase() {

  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    // table empty/unreachable — keep the built-in default slides
    return;
  }

  renderHeroSlides(data);

}

function renderHeroSlides(rows) {

  const container = document.getElementById("heroSlidesContainer");
  const dotsWrap = document.getElementById("sliderDots");
  if (!container || !dotsWrap || rows.length === 0) return;

  container.innerHTML = rows
    .map(
      (row, i) =>
        `<div class="slide${i === 0 ? " active" : ""}" style="background-image:url('${row.image_url}');"></div>`
    )
    .join("");

  dotsWrap.innerHTML = rows
    .map(
      (row, i) =>
        `<button class="dot${i === 0 ? " active" : ""}" onclick="goToSlide(${i})" aria-label="Slide ${i + 1}"></button>`
    )
    .join("");

  currentSlide = 0;

}

async function loadAdminHeroSlides() {

  const container = document.getElementById("adminHeroList");
  if (!container) return;

  container.innerHTML = '<p class="admin-loading">Yükleniyor...</p>';

  if (!supabaseClient) {
    container.innerHTML = '<p class="admin-loading">Bağlantı kurulamadı.</p>';
    return;
  }

  const { data, error } = await supabaseClient
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    container.innerHTML = '<p class="admin-loading">Yüklenemedi: ' + escapeHtml(error.message) + '</p>';
    return;
  }

  adminHeroRows = data || [];
  renderAdminHeroList();

}

function renderAdminHeroList() {

  const container = document.getElementById("adminHeroList");
  if (!container) return;

  if (adminHeroRows.length === 0) {
    container.innerHTML =
      '<p class="admin-loading">Henüz slider görseli eklenmedi. Üstteki "+ Görsel Ekle" ile ekleyebilirsin. Eklenene kadar sitede varsayılan görseller gösterilir.</p>';
    return;
  }

  container.innerHTML = adminHeroRows
    .map(
      (row, index) => `
        <div class="admin-hero-row">
          <img src="${escapeHtml(row.image_url)}" alt="">
          <div class="ahr-order">
            <button ${index === 0 ? "disabled" : ""} onclick="moveHeroSlide(${row.id}, -1)" title="Yukarı">↑</button>
            <button ${index === adminHeroRows.length - 1 ? "disabled" : ""} onclick="moveHeroSlide(${row.id}, 1)" title="Aşağı">↓</button>
          </div>
          <div class="ahr-spacer"></div>
          <button class="apr-edit" onclick="deleteHeroSlide(${row.id}, ${JSON.stringify(row.path || "")})">Sil</button>
        </div>
      `
    )
    .join("");

}

async function uploadHeroSlides(files) {

  if (!supabaseClient || !isAdmin || !files || files.length === 0) return;

  let nextOrder =
    adminHeroRows.length > 0
      ? Math.max(...adminHeroRows.map(r => r.sort_order || 0)) + 1
      : 1;

  for (const file of Array.from(files)) {

    const ext = file.name.split(".").pop() || "jpg";
    const path = "slide-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;

    const { error: uploadError } = await supabaseClient.storage
      .from(HERO_IMAGES_BUCKET)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      alert("Görsel yüklenemedi: " + uploadError.message);
      continue;
    }

    const { data } = supabaseClient.storage
      .from(HERO_IMAGES_BUCKET)
      .getPublicUrl(path);

    const { error: insertError } = await supabaseClient
      .from("hero_slides")
      .insert({
        id: Date.now() + Math.floor(Math.random() * 1000),
        image_url: data.publicUrl,
        path: path,
        sort_order: nextOrder
      });

    if (insertError) {
      alert("Kaydedilemedi: " + insertError.message);
      continue;
    }

    nextOrder += 1;

  }

  await loadAdminHeroSlides();
  await loadHeroSlidesFromSupabase();

}

async function deleteHeroSlide(id, path) {

  if (!supabaseClient || !isAdmin) return;

  const confirmed = confirm("Bu görsel slider'dan kaldırılsın mı?");
  if (!confirmed) return;

  if (path) {
    await supabaseClient.storage
      .from(HERO_IMAGES_BUCKET)
      .remove([path]);
  }

  const { error } = await supabaseClient
    .from("hero_slides")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Silinemedi: " + error.message);
    return;
  }

  await loadAdminHeroSlides();
  await loadHeroSlidesFromSupabase();

}

async function moveHeroSlide(id, direction) {

  if (!supabaseClient || !isAdmin) return;

  const index = adminHeroRows.findIndex(r => r.id === id);
  const swapIndex = index + direction;

  if (index === -1 || swapIndex < 0 || swapIndex >= adminHeroRows.length) return;

  const current = adminHeroRows[index];
  const neighbor = adminHeroRows[swapIndex];

  const currentOrder = current.sort_order;
  const neighborOrder = neighbor.sort_order;

  const { error: err1 } = await supabaseClient
    .from("hero_slides")
    .update({ sort_order: neighborOrder })
    .eq("id", current.id);

  const { error: err2 } = await supabaseClient
    .from("hero_slides")
    .update({ sort_order: currentOrder })
    .eq("id", neighbor.id);

  if (err1 || err2) {
    alert("Sıralama değiştirilemedi.");
    return;
  }

  await loadAdminHeroSlides();
  await loadHeroSlidesFromSupabase();

}

document
  .getElementById("heroFileInput")
  ?.addEventListener("change", function () {
    if (this.files && this.files.length > 0) {
      uploadHeroSlides(this.files);
      this.value = "";
    }
  });


/* =====================================================
   PAGE INITIALIZATION
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderProducts();

    updateCart();

    changeLanguage();

    updateFavoritesCount();

    loadProductsFromSupabase();

    loadHeroSlidesFromSupabase();

    initAuth();


    if (
      window.emailjs
      &&
      EMAILJS_PUBLIC_KEY !==
        "YOUR_PUBLIC_KEY"
    ) {

      emailjs.init(
        EMAILJS_PUBLIC_KEY
      );

    }


    const nameInput =
      document.getElementById(
        "customerName"
      );

    if (nameInput) {

      nameInput.addEventListener(
        "input",
        () => {

          nameInput.value =
            nameInput.value.replace(
              /[^\p{L}\s'-]/gu,
              ""
            );

        }
      );

    }


    const phoneInput =
      document.getElementById(
        "customerPhone"
      );

    if (phoneInput) {

      phoneInput.addEventListener(
        "input",
        () => {

          phoneInput.value =
            phoneInput.value.replace(
              /[^0-9+\s]/g,
              ""
            );

        }
      );

    }


    const header =
      document.getElementById(
        "header"
      );


    window.addEventListener(
      "scroll",
      () => {

        if (header) {

          header.classList.toggle(
            "scrolled",
            window.scrollY > 50
          );

        }

      }
    );


    setInterval(
      () => {

        goToSlide(
          currentSlide + 1
        );

      },
      5000
    );


    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key ===
          "Escape"
        ) {

          const lightbox =
            document.getElementById("mediaLightbox");

          if (lightbox && lightbox.classList.contains("active")) {
            closeMediaLightbox();
            return;
          }

          closeMenu();

          closeCart();

          closeProduct();

        }

      }
    );

  }
);


/* =====================================================
   AUTH MODAL (LOGIN / REGISTER)
===================================================== */

function openAccountAction() {

  if (isAdmin) {
    openAdminPortal();
    return;
  }

  if (currentUser) {
    // logged-in regular customer: just offer logout
    const wantsLogout = confirm(
      "Hesabınızdan çıkış yapmak ister misiniz?\n(" +
        currentUser.email +
        ")"
    );
    if (wantsLogout) {
      handleLogout();
    }
    return;
  }

  openAuthModal();
}

function openAuthModal() {

  document.getElementById("authOverlay").classList.add("active");
  document.getElementById("authBox").classList.add("active");

  switchAuthTab("login");

  const errorEl = document.getElementById("authError");
  const successEl = document.getElementById("authSuccess");
  if (errorEl) errorEl.classList.remove("active");
  if (successEl) successEl.classList.remove("active");
}

function closeAuthModal() {

  document.getElementById("authOverlay").classList.remove("active");
  document.getElementById("authBox").classList.remove("active");
}

function switchAuthTab(tab) {

  currentAuthTab = tab;

  document.getElementById("authTabLogin")
    .classList.toggle("active", tab === "login");
  document.getElementById("authTabRegister")
    .classList.toggle("active", tab === "register");

  document.getElementById("loginForm")
    .classList.toggle("active", tab === "login");
  document.getElementById("registerForm")
    .classList.toggle("active", tab === "register");

  const errorEl = document.getElementById("authError");
  const successEl = document.getElementById("authSuccess");
  if (errorEl) errorEl.classList.remove("active");
  if (successEl) successEl.classList.remove("active");
}

function showAuthError(message) {
  const errorEl = document.getElementById("authError");
  const successEl = document.getElementById("authSuccess");
  if (successEl) successEl.classList.remove("active");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("active");
  }
}

function showAuthSuccess(message) {
  const errorEl = document.getElementById("authError");
  const successEl = document.getElementById("authSuccess");
  if (errorEl) errorEl.classList.remove("active");
  if (successEl) {
    successEl.textContent = message;
    successEl.classList.add("active");
  }
}

async function handleLogin(event) {

  event.preventDefault();

  if (!supabaseClient) {
    showAuthError("Bağlantı şu anda kurulamıyor, lütfen daha sonra tekrar deneyin.");
    return;
  }

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const submitBtn = document.getElementById("loginSubmitBtn");

  submitBtn.disabled = true;
  submitBtn.textContent = "Giriş yapılıyor...";

  let data, error;
  try {
    const result = await supabaseClient.auth.signInWithPassword({ email, password });
    data = result.data;
    error = result.error;
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Giriş Yap";
    showAuthError("Beklenmeyen bir hata oluştu: " + (err && err.message ? err.message : err));
    return;
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Giriş Yap";

  if (error) {
    showAuthError(
      error.message === "Invalid login credentials"
        ? "E-posta veya şifre hatalı."
        : error.message
    );
    return;
  }

  await handleSession(data.session);
  closeAuthModal();

  if (isAdmin) {
    openAdminPortal();
  } else {
    alert("Hoş geldiniz, " + (currentUser.email || "") + "!");
  }
}

async function handleRegister(event) {

  event.preventDefault();

  if (!supabaseClient) {
    showAuthError("Bağlantı şu anda kurulamıyor (Supabase yüklenemedi). Sayfayı yenileyip tekrar deneyin.");
    return;
  }

  const fullName = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const submitBtn = document.getElementById("registerSubmitBtn");

  submitBtn.disabled = true;
  submitBtn.textContent = "Üye olunuyor...";

  let data, error;
  try {
    const result = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
    data = result.data;
    error = result.error;
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Üye Ol";
    showAuthError("Beklenmeyen bir hata oluştu: " + (err && err.message ? err.message : err));
    return;
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Üye Ol";

  if (error) {
    showAuthError(error.message);
    return;
  }

  if (data.session) {
    await handleSession(data.session);
    closeAuthModal();
    if (isAdmin) {
      openAdminPortal();
    } else {
      alert("Üyeliğiniz oluşturuldu, hoş geldiniz!");
    }
  } else {
    const msg =
      "Üyeliğiniz oluşturuldu. Supabase projenizde e-posta onayı açık " +
      "olduğu için, giriş yapabilmeniz için önce " +
      email +
      " adresine gelen onay mailine tıklamanız gerekiyor. " +
      "(Mail gelmediyse spam/gereksiz klasörünü kontrol edin, ya da " +
      "Supabase panelinde Authentication > Providers > Email > " +
      "\"Confirm email\" seçeneğini kapatıp tekrar deneyin.)";
    showAuthSuccess(msg);
    alert(msg);
  }
}

async function handleLogout() {

  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }

  currentUser = null;
  isAdmin = false;

  closeAdminPortal();
  updateAccountUI();
}

async function initAuth() {

  if (!supabaseClient) {
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  await handleSession(data.session);

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    // (callback içinde doğrudan Supabase çağrısı beklemek kilitlenmeye yol açabilir)
    setTimeout(() => handleSession(session), 0);
  });
}

async function handleSession(session) {

  currentUser = session ? session.user : null;
  isAdmin = false;

  if (currentUser && supabaseClient) {
    try {
      const { data, error } = await supabaseClient.rpc("is_admin");
      isAdmin = !error && data === true;
    } catch (err) {
      isAdmin = false;
    }
  }

  updateAccountUI();
}

function updateAccountUI() {

  const btn = document.getElementById("accountButton");
  const sideLabel = document.getElementById("sideMenuAccountLabel");
  const heroLabel = document.getElementById("heroAccountLabel");

  let label = "Üye Ol / Giriş Yap";

  if (isAdmin) {
    label = "Admin Portal";
  } else if (currentUser) {
    label = "Hesabım (" + currentUser.email + ")";
  }

  if (sideLabel) sideLabel.textContent = label;
  if (heroLabel) heroLabel.textContent = label;

  if (btn) {
    btn.classList.toggle("is-logged-in", !!currentUser);
    btn.title = label;
  }

  const adminLinks = document.getElementById("sideMenuAdminLinks");
  if (adminLinks) {
    adminLinks.style.display = isAdmin ? "flex" : "none";
  }
}


/* =====================================================
   ADMIN PORTAL
===================================================== */

function openAdminPortal() {

  if (!isAdmin) {
    return;
  }

  document.getElementById("adminOverlay").classList.add("active");
  document.getElementById("adminPortal").classList.add("active");

  switchAdminTab("users");
}

function closeAdminPortal() {

  document.getElementById("adminOverlay").classList.remove("active");
  document.getElementById("adminPortal").classList.remove("active");
}

function switchAdminTab(tab) {

  currentAdminTab = tab;

  document.getElementById("adminTabUsers")
    .classList.toggle("active", tab === "users");
  document.getElementById("adminTabProducts")
    .classList.toggle("active", tab === "products");
  document.getElementById("adminTabAnalytics")
    .classList.toggle("active", tab === "analytics");
  document.getElementById("adminTabHero")
    .classList.toggle("active", tab === "hero");

  document.getElementById("adminPanelUsers")
    .classList.toggle("active", tab === "users");
  document.getElementById("adminPanelProducts")
    .classList.toggle("active", tab === "products");
  document.getElementById("adminPanelAnalytics")
    .classList.toggle("active", tab === "analytics");
  document.getElementById("adminPanelHero")
    .classList.toggle("active", tab === "hero");

  if (tab === "users") {
    loadUsersForAdmin();
  } else if (tab === "products") {
    renderAdminProductsList();
  } else if (tab === "analytics") {
    loadAnalytics();
  } else if (tab === "hero") {
    loadAdminHeroSlides();
  }
}

async function loadUsersForAdmin() {

  const container = document.getElementById("adminUsersList");
  if (!container) return;

  container.innerHTML = '<p class="admin-loading">Yükleniyor...</p>';

  if (!supabaseClient) {
    container.innerHTML = '<p class="admin-loading">Bağlantı kurulamadı.</p>';
    return;
  }

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("full_name, email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML =
      '<p class="admin-loading">Kullanıcılar yüklenemedi: ' +
      escapeHtml(error.message) +
      "</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML =
      '<p class="admin-loading">Henüz üye olan kullanıcı yok.</p>';
    return;
  }

  container.innerHTML =
    "<table><thead><tr><th>Ad Soyad</th><th>E-posta</th><th>Kayıt Tarihi</th></tr></thead><tbody>" +
    data
      .map(
        u =>
          "<tr><td>" +
          escapeHtml(u.full_name || "—") +
          "</td><td>" +
          escapeHtml(u.email) +
          "</td><td>" +
          new Date(u.created_at).toLocaleDateString("tr-TR") +
          "</td></tr>"
      )
      .join("") +
    "</tbody></table>";
}


/* =====================================================
   ANALYTICS (sales by product / by day-week-month-year)
===================================================== */

let analyticsOrders = [];
let analyticsPeriod = "day";
let analyticsTimeChart = null;
let analyticsProductChart = null;

async function loadAnalytics() {

  const tableWrap = document.getElementById("analyticsTableWrap");
  const summaryEl = document.getElementById("analyticsSummary");

  if (summaryEl) summaryEl.innerHTML = "";
  if (tableWrap) {
    tableWrap.innerHTML = '<p class="admin-loading">Yükleniyor...</p>';
  }

  if (!supabaseClient) {
    if (tableWrap) {
      tableWrap.innerHTML = '<p class="admin-loading">Bağlantı kurulamadı.</p>';
    }
    return;
  }

  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    if (tableWrap) {
      tableWrap.innerHTML =
        '<p class="admin-loading">Sipariş verileri yüklenemedi: ' +
        escapeHtml(error.message) +
        "</p>";
    }
    return;
  }

  analyticsOrders = data || [];
  renderAnalytics();
}

function setAnalyticsPeriod(period) {

  analyticsPeriod = period;

  document
    .querySelectorAll(".analytics-period-btn")
    .forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.getAttribute("data-period") === period
      );
    });

  renderAnalytics();
}

function getBucketKey(dateStr, period) {

  const d = new Date(dateStr);

  if (period === "year") {
    return String(d.getFullYear());
  }

  if (period === "month") {
    return d.toISOString().slice(0, 7);
  }

  if (period === "week") {
    const day = d.getUTCDay() || 7;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - day + 1);
    return monday.toISOString().slice(0, 10);
  }

  // day
  return d.toISOString().slice(0, 10);
}

function renderAnalytics() {

  const summaryEl = document.getElementById("analyticsSummary");
  const tableWrap = document.getElementById("analyticsTableWrap");

  if (!analyticsOrders.length) {
    if (summaryEl) {
      summaryEl.innerHTML =
        '<p class="admin-panel-note">Henüz kaydedilmiş sipariş yok.</p>';
    }
    if (tableWrap) {
      tableWrap.innerHTML =
        '<p class="admin-loading">Henüz kaydedilmiş sipariş yok.</p>';
    }
    destroyAnalyticsCharts();
    return;
  }

  // ---- per-product aggregation (all time) ----
  const productStats = {};

  analyticsOrders.forEach(order => {
    (order.items || []).forEach(item => {
      const key = item.name || item.code || "Bilinmeyen";
      if (!productStats[key]) {
        productStats[key] = { quantity: 0, revenue: 0 };
      }
      productStats[key].quantity += Number(item.quantity) || 0;
      productStats[key].revenue +=
        (Number(item.quantity) || 0) * (Number(item.price) || 0);
    });
  });

  const productRows = Object.entries(productStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.quantity - a.quantity);

  // ---- time-bucketed aggregation (by selected period) ----
  const bucketStats = {};

  analyticsOrders.forEach(order => {
    const key = getBucketKey(order.created_at, analyticsPeriod);
    if (!bucketStats[key]) {
      bucketStats[key] = { count: 0, revenue: 0 };
    }
    bucketStats[key].count += 1;
    bucketStats[key].revenue += Number(order.total_price) || 0;
  });

  const bucketKeys = Object.keys(bucketStats).sort();

  // ---- summary ----
  const totalOrders = analyticsOrders.length;
  const totalRevenue = analyticsOrders.reduce(
    (sum, o) => sum + (Number(o.total_price) || 0),
    0
  );
  const bestProduct = productRows[0];

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="analytics-stat">
        <strong>${totalOrders}</strong>
        <span>Toplam Sipariş</span>
      </div>
      <div class="analytics-stat">
        <strong>${formatPrice(totalRevenue, getLanguage())}</strong>
        <span>Toplam Ciro</span>
      </div>
      <div class="analytics-stat">
        <strong>${bestProduct ? escapeHtml(bestProduct.name) : "—"}</strong>
        <span>En Çok Satan</span>
      </div>
    `;
  }

  // ---- table ----
  if (tableWrap) {
    tableWrap.innerHTML =
      "<table><thead><tr><th>Ürün</th><th>Satılan Adet</th><th>Toplam Ciro</th></tr></thead><tbody>" +
      productRows
        .map(
          row =>
            "<tr><td>" +
            escapeHtml(row.name) +
            "</td><td>" +
            row.quantity +
            "</td><td>" +
            formatPrice(row.revenue, getLanguage()) +
            "</td></tr>"
        )
        .join("") +
      "</tbody></table>";
  }

  renderAnalyticsCharts(bucketKeys, bucketStats, productRows);
}

function destroyAnalyticsCharts() {
  if (analyticsTimeChart) {
    analyticsTimeChart.destroy();
    analyticsTimeChart = null;
  }
  if (analyticsProductChart) {
    analyticsProductChart.destroy();
    analyticsProductChart = null;
  }
}

function renderAnalyticsCharts(bucketKeys, bucketStats, productRows) {

  if (typeof Chart === "undefined") {
    return;
  }

  destroyAnalyticsCharts();

  const timeCanvas = document.getElementById("analyticsTimeChart");
  if (timeCanvas) {
    analyticsTimeChart = new Chart(timeCanvas, {
      type: "line",
      data: {
        labels: bucketKeys,
        datasets: [
          {
            label: "Ciro (EGP)",
            data: bucketKeys.map(k => bucketStats[k].revenue),
            borderColor: "#9d7a47",
            backgroundColor: "rgba(157,122,71,0.15)",
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Zaman İçinde Ciro"
          }
        }
      }
    });
  }

  const productCanvas = document.getElementById("analyticsProductChart");
  if (productCanvas) {
    const top = productRows.slice(0, 10);
    analyticsProductChart = new Chart(productCanvas, {
      type: "bar",
      data: {
        labels: top.map(p => p.name),
        datasets: [
          {
            label: "Satılan Adet",
            data: top.map(p => p.quantity),
            backgroundColor: "#171717"
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Ürün Bazlı Satış"
          }
        }
      }
    });
  }
}

function downloadAnalyticsPdf() {

  if (typeof window.jspdf === "undefined") {
    alert("PDF kütüphanesi yüklenemedi, lütfen internet bağlantınızı kontrol edin.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 18;

  doc.setFontSize(18);
  doc.text("LEVANTE Istanbul — Satış Raporu", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(
    "Oluşturulma tarihi: " + new Date().toLocaleString("tr-TR"),
    14,
    y
  );
  y += 10;

  const totalOrders = analyticsOrders.length;
  const totalRevenue = analyticsOrders.reduce(
    (sum, o) => sum + (Number(o.total_price) || 0),
    0
  );

  doc.setFontSize(12);
  doc.text("Toplam Sipariş: " + totalOrders, 14, y);
  y += 7;
  doc.text(
    "Toplam Ciro: " + formatPrice(totalRevenue, getLanguage()),
    14,
    y
  );
  y += 10;

  const timeCanvas = document.getElementById("analyticsTimeChart");
  if (timeCanvas) {
    try {
      const imgData = timeCanvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 14, y, 180, 80);
      y += 88;
    } catch (e) {
      console.warn("Chart image failed:", e);
    }
  }

  const productCanvas = document.getElementById("analyticsProductChart");
  if (productCanvas) {
    if (y > 180) {
      doc.addPage();
      y = 18;
    }
    try {
      const imgData = productCanvas.toDataURL("image/png");
      doc.addImage(imgData, "PNG", 14, y, 180, 80);
      y += 88;
    } catch (e) {
      console.warn("Chart image failed:", e);
    }
  }

  if (y > 230) {
    doc.addPage();
    y = 18;
  }

  doc.setFontSize(13);
  doc.text("Ürün Bazlı Satış Tablosu", 14, y);
  y += 8;

  doc.setFontSize(10);

  const productStats = {};
  analyticsOrders.forEach(order => {
    (order.items || []).forEach(item => {
      const key = item.name || item.code || "Bilinmeyen";
      if (!productStats[key]) {
        productStats[key] = { quantity: 0, revenue: 0 };
      }
      productStats[key].quantity += Number(item.quantity) || 0;
      productStats[key].revenue +=
        (Number(item.quantity) || 0) * (Number(item.price) || 0);
    });
  });

  const rows = Object.entries(productStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.quantity - a.quantity);

  rows.forEach(row => {
    if (y > 280) {
      doc.addPage();
      y = 18;
    }
    doc.text(
      row.name + "  —  Adet: " + row.quantity + "  —  Ciro: " + formatPrice(row.revenue, getLanguage()),
      14,
      y
    );
    y += 7;
  });

  doc.save("levante-satis-raporu.pdf");
}


/* =====================================================
   PRODUCTS <-> SUPABASE
===================================================== */

let productsAreFromDatabase = false;

async function loadProductsFromSupabase() {

  if (!supabaseClient) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    // table is empty/unreachable — keep the built-in static products
    productsAreFromDatabase = false;
    if (currentAdminTab === "products") {
      renderAdminProductsList();
    }
    return;
  }

  productsAreFromDatabase = true;

  products = data.map(row => ({
    id: row.id,
    number: row.number,
    code: row.code,
    name: row.name,
    price: row.price,
    stock: row.stock,
    image: row.image,
    media: row.media || [],
    colors: row.colors || [],
    specs: row.specs || { tr: "", en: "", ar: "" },
    story: row.story || { tr: "", en: "", ar: "" }
  }));

  renderProducts();
  renderRecommendations?.();

  if (currentAdminTab === "products") {
    renderAdminProductsList();
  }
}

async function seedProductsToSupabase() {

  if (!supabaseClient || !isAdmin) return;

  const btn = document.getElementById("adminSeedBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Aktarılıyor...";
  }

  const payload = products.map((p, index) => ({
    id: p.id,
    number: p.number || "",
    code: p.code || "",
    name: p.name,
    price: p.price,
    stock: p.stock !== undefined ? p.stock : 10,
    image: p.image,
    media: getProductMedia(p),
    colors: p.colors || [],
    specs: p.specs || { tr: "", en: "", ar: "" },
    story: p.story || { tr: "", en: "", ar: "" },
    sort_order: index + 1
  }));

  const { error } = await supabaseClient
    .from("products")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    alert("Aktarılamadı: " + error.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Mevcut Ürünleri Veritabanına Aktar";
    }
    return;
  }

  await loadProductsFromSupabase();
  renderAdminProductsList();
}

function renderAdminProductsList() {

  const container = document.getElementById("adminProductsList");
  if (!container) return;

  let html = "";

  if (!productsAreFromDatabase) {
    html += `
      <div class="admin-seed-note">
        <p>
          Ürünler şu an sitenin kendi içinde kayıtlı (veritabanında değil).
          Yeni ürün eklemeden önce, mevcut ${products.length} ürünü
          veritabanına aktarmanı öneririm — aksi halde sadece yeni eklediğin
          ürün görünür, eskiler kaybolur.
        </p>
        <button id="adminSeedBtn" class="admin-add-btn" onclick="seedProductsToSupabase()">
          Mevcut Ürünleri Veritabanına Aktar
        </button>
      </div>
    `;
  }

  if (!products || products.length === 0) {
    html += '<p class="admin-loading">Henüz ürün yok.</p>';
    container.innerHTML = html;
    return;
  }

  html += products
    .map(
      p => `
        <div class="admin-product-row">
          ${
            isVideoUrl(p.image)
              ? `<video src="${escapeHtml(p.image)}" muted></video>`
              : `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">`
          }
          <div class="apr-info">
            <strong>${escapeHtml(p.code)} · ${escapeHtml(p.name)}</strong>
            <span>${p.price} EGP · Stok: ${
        p.stock !== undefined ? p.stock : "—"
      }</span>
          </div>
          <button class="apr-edit" onclick="openProductForm(${JSON.stringify(
            p.id
          )})">Düzenle</button>
        </div>
      `
    )
    .join("");

  container.innerHTML = html;
}

function openProductForm(productId) {

  editingProductId = productId;
  pfRemovedExistingUrls = [];
  pfNewFiles = [];

  const form = document.getElementById("productForm");
  form.reset();

  document.getElementById("productFormError").classList.remove("active");

  if (productId !== null && productId !== undefined) {

    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById("productFormTitle").textContent = "Ürünü Düzenle";
    document.getElementById("pfId").value = product.id;
    document.getElementById("pfCode").value = product.code || "";
    document.getElementById("pfName").value = product.name || "";
    document.getElementById("pfPrice").value = product.price || 0;
    document.getElementById("pfStock").value =
      product.stock !== undefined ? product.stock : 10;
    document.getElementById("pfSpecsTr").value = Array.isArray(product.specs?.tr) ? product.specs.tr.join("\n") : (product.specs?.tr || "");
    document.getElementById("pfSpecsEn").value = Array.isArray(product.specs?.en) ? product.specs.en.join("\n") : (product.specs?.en || "");
    document.getElementById("pfSpecsAr").value = Array.isArray(product.specs?.ar) ? product.specs.ar.join("\n") : (product.specs?.ar || "");
    document.getElementById("pfStoryTr").value = product.story?.tr || "";
    document.getElementById("pfStoryEn").value = product.story?.en || "";
    document.getElementById("pfStoryAr").value = product.story?.ar || "";

    pfExistingMedia = getProductMedia(product);

    document.getElementById("pfDeleteBtn").style.display = "inline-block";

  } else {

    document.getElementById("productFormTitle").textContent = "Yeni Ürün";
    document.getElementById("pfId").value = "";
    pfExistingMedia = [];
    document.getElementById("pfDeleteBtn").style.display = "none";
  }

  renderPfMediaGrid();

  document.getElementById("productFormOverlay").classList.add("active");
  document.getElementById("productFormBox").classList.add("active");
}

function closeProductForm() {

  document.getElementById("productFormOverlay").classList.remove("active");
  document.getElementById("productFormBox").classList.remove("active");
  editingProductId = null;
  pfExistingMedia = [];
  pfRemovedExistingUrls = [];
  pfNewFiles = [];
}

function renderPfMediaGrid() {

  const grid = document.getElementById("pfMediaGrid");
  if (!grid) return;

  const existingItems = pfExistingMedia
    .map((media, index) => {
      const removed = pfRemovedExistingUrls.includes(media.url);
      const mediaTag =
        media.type === "video"
          ? `<video src="${media.url}" muted></video>`
          : `<img src="${media.url}" alt="">`;
      return `
        <div class="pf-media-item ${removed ? "pf-marked-remove" : ""}">
          ${mediaTag}
          ${media.type === "video" ? '<span class="pf-media-video-badge">video</span>' : ""}
          <button type="button" class="pf-media-remove" title="${removed ? "Geri al" : "Kaldır"}"
            onclick="togglePfExistingRemoval(${index})">${removed ? "↺" : "×"}</button>
        </div>
      `;
    })
    .join("");

  const newItems = pfNewFiles
    .map((file, index) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video/");
      const mediaTag = isVideo
        ? `<video src="${url}" muted></video>`
        : `<img src="${url}" alt="">`;
      return `
        <div class="pf-media-item">
          ${mediaTag}
          ${isVideo ? '<span class="pf-media-video-badge">video</span>' : ""}
          <button type="button" class="pf-media-remove" title="Kaldır"
            onclick="removePfNewFile(${index})">×</button>
        </div>
      `;
    })
    .join("");

  grid.innerHTML = existingItems + newItems;
}

function togglePfExistingRemoval(index) {
  const media = pfExistingMedia[index];
  if (!media) return;
  const pos = pfRemovedExistingUrls.indexOf(media.url);
  if (pos === -1) {
    pfRemovedExistingUrls.push(media.url);
  } else {
    pfRemovedExistingUrls.splice(pos, 1);
  }
  renderPfMediaGrid();
}

function removePfNewFile(index) {
  pfNewFiles.splice(index, 1);
  renderPfMediaGrid();
}

function showProductFormError(message) {
  const el = document.getElementById("productFormError");
  if (el) {
    el.textContent = message;
    el.classList.add("active");
  }
}

function textareaToList(value) {
  return (value || "")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

async function handleProductFormSubmit(event) {

  event.preventDefault();

  if (!supabaseClient || !isAdmin) {
    showProductFormError("Bu işlem için admin girişi gerekiyor.");
    return;
  }

  const saveBtn = document.getElementById("pfSaveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Kaydediliyor...";

  try {

    const isNew = !document.getElementById("pfId").value;
    const id = isNew
      ? Date.now()
      : Number(document.getElementById("pfId").value);

    const existing = isNew ? null : products.find(p => p.id === id);

    const remainingExisting = pfExistingMedia.filter(
      media => !pfRemovedExistingUrls.includes(media.url)
    );

    let uploadedMedia = [];
    if (pfNewFiles.length > 0) {
      uploadedMedia = await uploadProductMedia(pfNewFiles, id);
      if (uploadedMedia === null) {
        saveBtn.disabled = false;
        saveBtn.textContent = "Kaydet";
        return;
      }
    }

    const finalMedia = [...remainingExisting, ...uploadedMedia];

    if (finalMedia.length === 0) {
      showProductFormError("Lütfen en az bir fotoğraf veya video seçin.");
      saveBtn.disabled = false;
      saveBtn.textContent = "Kaydet";
      return;
    }

    const imageUrl = finalMedia[0].url;

    const payload = {
      id,
      number: document.getElementById("pfCode").value.split("-").pop() || "",
      code: document.getElementById("pfCode").value.trim(),
      name: document.getElementById("pfName").value.trim(),
      price: Number(document.getElementById("pfPrice").value),
      stock: Number(document.getElementById("pfStock").value),
      image: imageUrl,
      media: finalMedia,
      colors: existing ? existing.colors : [],
      specs: {
        tr: textareaToList(document.getElementById("pfSpecsTr").value),
        en: textareaToList(document.getElementById("pfSpecsEn").value),
        ar: textareaToList(document.getElementById("pfSpecsAr").value)
      },
      story: {
        tr: document.getElementById("pfStoryTr").value,
        en: document.getElementById("pfStoryEn").value,
        ar: document.getElementById("pfStoryAr").value
      },
      sort_order: existing
        ? existing.sort_order || 0
        : products.length + 1,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
      .from("products")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      showProductFormError("Kaydedilemedi: " + error.message);
      saveBtn.disabled = false;
      saveBtn.textContent = "Kaydet";
      return;
    }

    await loadProductsFromSupabase();
    renderAdminProductsList();
    closeProductForm();

  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Kaydet";
  }
}

async function handleProductDelete() {

  if (!supabaseClient || !isAdmin) {
    return;
  }

  const id = Number(document.getElementById("pfId").value);
  if (!id) return;

  const product = products.find(p => p.id === id);
  const confirmed = confirm(
    "\"" + (product ? product.name : "Bu ürün") + "\" silinsin mi?"
  );
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    showProductFormError("Silinemedi: " + error.message);
    return;
  }

  await loadProductsFromSupabase();
  renderAdminProductsList();
  closeProductForm();
}

async function uploadProductMedia(files, productId) {

  const results = [];

  for (const file of files) {

    const isVideo = file.type.startsWith("video/");
    const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
    const path =
      productId + "/" + (isVideo ? "video-" : "img-") + Date.now() + "-" +
      Math.random().toString(36).slice(2, 8) + "." + ext;

    const { error } = await supabaseClient.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, file, { upsert: true });

    if (error) {
      showProductFormError("Yükleme başarısız: " + error.message);
      return null;
    }

    const { data } = supabaseClient.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(path);

    results.push({
      url: data.publicUrl,
      type: isVideo ? "video" : "image"
    });

  }

  return results;
}


document
  .getElementById("pfImageFile")
  ?.addEventListener("change", function () {
    if (this.files && this.files.length > 0) {
      pfNewFiles = pfNewFiles.concat(Array.from(this.files));
      renderPfMediaGrid();
      this.value = ""; // allow picking more files afterward without clearing the list
    }
  });
