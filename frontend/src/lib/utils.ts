import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number | null | undefined, currency = "PKR", language = "en"): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return language === "ur" ? "روپے 0.00" : (currency === "PKR" ? "Rs. 0.00" : "$0.00");
  }
  const num = Number(amount);
  const formatted = num.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (language === "ur") {
    return `${formatted} روپے`;
  }

  if (currency === "PKR" || currency === "Rs" || currency === "Rs.") {
    return `Rs. ${formatted}`;
  }
  if (currency === "USD") {
    return `$${formatted}`;
  }
  if (currency === "EUR") {
    return `€${formatted}`;
  }
  return `${currency} ${formatted}`;
}

export function formatDate(dateString?: string | null, language = "en"): string {
  if (!dateString) return language === "ur" ? "دستیاب نہیں" : "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(language === "ur" ? "ur-PK" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function getConfidenceBadge(confidence: number, language = "en"): {
  label: string;
  bg: string;
  text: string;
  border: string;
  level: "high" | "medium" | "low";
} {
  const pct = Math.round(confidence * 100);
  if (confidence >= 0.90) {
    return {
      label: language === "ur" ? `${pct}% تصدیق شدہ` : `${pct}% Verified`,
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      level: "high",
    };
  }
  if (confidence >= 0.70) {
    return {
      label: language === "ur" ? `${pct}% درمیانہ` : `${pct}% Medium`,
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      level: "medium",
    };
  }
  return {
    label: language === "ur" ? `${pct}% جائزہ درکار` : `${pct}% Review`,
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
    level: "low",
  };
}

export function getStatusBadge(status: string, language = "en"): {
  label: string;
  bg: string;
  text: string;
} {
  const s = (status || "").toUpperCase();
  const isUrdu = language === "ur";

  switch (s) {
    case "VERIFIED":
    case "APPROVED":
      return { 
        label: isUrdu ? "منظور شدہ" : "Verified", 
        bg: "bg-emerald-100", 
        text: "text-emerald-800" 
      };
    case "REVIEW_REQUIRED":
    case "NEEDS_REVIEW":
      return { 
        label: isUrdu ? "جائزہ درکار" : "Review Required", 
        bg: "bg-amber-100", 
        text: "text-amber-800" 
      };
    case "PROCESSING":
      return { 
        label: isUrdu ? "عمل جاری" : "Processing", 
        bg: "bg-blue-100", 
        text: "text-blue-800" 
      };
    case "UPLOADED":
      return { 
        label: isUrdu ? "اپلوڈ شدہ" : "Uploaded", 
        bg: "bg-slate-100", 
        text: "text-slate-800" 
      };
    case "FAILED":
    case "REJECTED":
      return { 
        label: isUrdu ? "مسترد / ناکام" : "Failed", 
        bg: "bg-rose-100", 
        text: "text-rose-800" 
      };
    case "PENDING":
      return { 
        label: isUrdu ? "زیر التواء" : "Pending", 
        bg: "bg-amber-50", 
        text: "text-amber-700" 
      };
    case "ARCHIVED":
      return { 
        label: isUrdu ? "محفوظ شدہ" : "Archived", 
        bg: "bg-gray-100", 
        text: "text-gray-800" 
      };
    default:
      return { 
        label: status, 
        bg: "bg-slate-100", 
        text: "text-slate-800" 
      };
  }
}

// ==========================================
// Category & Vendor Bilingual Localization
// ==========================================
export const categoryTranslationsUrdu: Record<string, string> = {
  "Grocery & Food": "گروسری اور خوراک",
  "Groceries": "گروسری اور خوراک",
  "Grocery": "گروسری",
  "Food": "خوراک و کھانا",
  "Restaurant & Dining": "ریسٹورنٹ اور کھانا",
  "Restaurant": "ریسٹورنٹ",
  "Dining": "کھانا پینا",
  "Medicine & Pharmacy": "ادویات اور فارمیسی",
  "Medicine": "ادویات",
  "Pharmacy": "فارمیسی / میڈیکل",
  "Utilities & Bills": "یوٹیلیٹیز اور بلز",
  "Utilities": "یوٹیلیٹیز",
  "Bills": "بلز",
  "Electronics & Tech": "الیکٹرانکس اور ٹیکنالوجی",
  "Electronics": "الیکٹرانکس",
  "Tech": "ٹیکنالوجی",
  "Office & Supplies": "دفتری سامان",
  "Office Supplies": "دفتری سامان",
  "Office": "دفتری سامان",
  "Supplies": "سامان",
  "Household & Repairs": "گھریلو سامان اور مرمت",
  "Repairs": "مرمت",
  "Maintenance & Repairs": "دیکھ بھال اور مرمت",
  "Travel & Fuel": "سفر اور ایندھن",
  "Travel & Transportation": "سفر اور نقل و حمل",
  "Travel": "سفر",
  "Fuel": "ایندھن / پیٹرول",
  "Meals & Entertainment": "کھانے اور تفریح",
  "Entertainment": "تفریح",
  "Raw Materials & Inventory": "خام مال اور انوینٹری",
  "Inventory": "انوینٹری",
  "Legal & Professional Services": "قانونی اور پیشہ ورانہ خدمات",
  "Marketing & Advertising": "مارکیٹنگ اور تشہیر",
  "Software & Subscriptions": "سافٹ ویئر اور سبسکرپشنز",
  "Rent & Facilities": "کرایہ اور سہولیات",
  "Taxes & Licenses": "ٹیکس اور لائسنس",
  "Health & Wellness": "صحت و تندرستی",
  "Education & Training": "تعلیم و تربیت",
  "Other": "دیگر",
  "Miscellaneous": "متفرق",
  "General": "عام اخراجات",
  "Uncategorized": "غیر زمرہ بند",
  "System Default": "سسٹم ڈیفالٹ",
  "Custom": "کسٹم",
};

export const vendorTranslationsUrdu: Record<string, string> = {
  "Uni Tech Diagnostic Center": "یونی ٹیک ڈائیگنوسٹک سینٹر",
  "Royal Fans": "رائل فینز",
  "Hafiz Electric Store (Royal Fans)": "حافظ الیکٹرک اسٹور (رائل فینز)",
  "Hafiz Electric Store": "حافظ الیکٹرک اسٹور",
  "ABC Super Store": "اے بی سی سپر اسٹور",
  "Metro Cash & Carry": "میٹرو کیش اینڈ کیری",
  "Metro": "میٹرو",
  "Cafe Aylanto": "کیفے ایلانتو",
  "Fazal Din's Pharma Plus": "فضل دین فارما پلس",
  "Fazal Din Pharma": "فضل دین فارما",
  "LESCO Electricity": "لیسکو بجلی (LESCO)",
  "LESCO": "لیسکو بجلی",
  "K-Electric": "کے الیکٹرک",
  "SNGPL Gas": "سوئی گیس (SNGPL)",
  "Manual Test Hardware": "مینول ٹیسٹ ہارڈویئر",
  "Al-Madina Store": "المدینہ اسٹور",
  "Bismillah Super Mart": "بسم اللہ سپر مارٹ",
  "Imtiaz Super Market": "امتیاز سپر مارکیٹ",
  "Chase Up": "چیز اپ",
  "Carrefour": "کیریفور",
  "Shell Petrol Pump": "شیل پیٹرول پمپ",
  "Total Parco": "ٹوٹل پارکو",
  "PSO": "پی ایس او (PSO)",
  "PTCL": "پی ٹی سی ایل (PTCL)",
  "Nayatel": "نیا ٹیل",
  "Unknown Vendor": "نامعلوم وینڈر",
  "No Vendor": "کوئی وینڈر نہیں",
};

const commonVendorKeywords: [RegExp, string][] = [
  [/\bdiagnostic\s*center\b/gi, "ڈائیگنوسٹک سینٹر"],
  [/\bdiagnostic\b/gi, "ڈائیگنوسٹک"],
  [/\bcenter\b/gi, "سینٹر"],
  [/\bcentre\b/gi, "سینٹر"],
  [/\belectric\s*store\b/gi, "الیکٹرک اسٹور"],
  [/\belectric\b/gi, "الیکٹرک"],
  [/\belectronics\b/gi, "الیکٹرانکس"],
  [/\bsuper\s*store\b/gi, "سپر اسٹور"],
  [/\bsuper\s*market\b/gi, "سپر مارکیٹ"],
  [/\bsuper\s*mart\b/gi, "سپر مارٹ"],
  [/\bstore\b/gi, "اسٹور"],
  [/\bmart\b/gi, "مارٹ"],
  [/\bmarket\b/gi, "مارکیٹ"],
  [/\bpharmacy\b/gi, "فارمیسی"],
  [/\bpharma\b/gi, "فارما"],
  [/\bhardware\b/gi, "ہارڈویئر"],
  [/\bcash\s*&\s*carry\b/gi, "کیش اینڈ کیری"],
  [/\bcafe\b/gi, "کیفے"],
  [/\brestaurant\b/gi, "ریسٹورنٹ"],
  [/\bhospital\b/gi, "ہسپتال"],
  [/\bclinic\b/gi, "کلینک"],
  [/\blab\b/gi, "لیب"],
  [/\blaboratories\b/gi, "لیبارٹریز"],
  [/\bfans\b/gi, "فینز"],
  [/\bfan\b/gi, "فین"],
  [/\btraders\b/gi, "ٹریڈرز"],
  [/\btrading\b/gi, "ٹریڈنگ"],
  [/\bservices\b/gi, "سروسز"],
  [/\bsolutions\b/gi, "سلوشنز"],
  [/\bcompany\b/gi, "کمپنی"],
  [/\blimited\b/gi, "لمیٹڈ"],
  [/\bltd\b/gi, "لمیٹڈ"],
  [/\bprivate\b/gi, "پرائیویٹ"],
  [/\bpvt\b/gi, "پرائیویٹ"],
  [/\bpetrol\s*pump\b/gi, "پیٹرول پمپ"],
  [/\bpetrol\b/gi, "پیٹرول"],
  [/\bgas\b/gi, "گیس"],
  [/\belectricity\b/gi, "بجلی"],
  [/\bplus\b/gi, "پلس"],
];

export function getLocalizedCategory(name?: string | null, language = "en"): string {
  if (!name) return language === "ur" ? "غیر زمرہ بند" : "Uncategorized";
  if (language !== "ur") return name;
  const trimmed = name.trim();
  if (categoryTranslationsUrdu[trimmed]) return categoryTranslationsUrdu[trimmed];
  for (const [key, val] of Object.entries(categoryTranslationsUrdu)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) return val;
  }
  return trimmed;
}

export function getLocalizedVendor(name?: string | null, language = "en"): string {
  if (!name) return language === "ur" ? "نامعلوم وینڈر" : "Unknown Vendor";
  if (language !== "ur") return name;
  const trimmed = name.trim();
  if (vendorTranslationsUrdu[trimmed]) return vendorTranslationsUrdu[trimmed];
  for (const [key, val] of Object.entries(vendorTranslationsUrdu)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) return val;
  }
  // Keyword-assisted translation
  let translated = trimmed;
  for (const [pattern, urduWord] of commonVendorKeywords) {
    translated = translated.replace(pattern, urduWord);
  }
  return translated;
}

// ==========================================
// Customer Bilingual Localization & Names
// ==========================================
export const customerTranslationsUrdu: Record<string, string> = {
  "NOREEN KOUSER": "نورین کوثر",
  "Noreen Kouser": "نورین کوثر",
  "NOREEN KAUSAR": "نورین کوثر",
  "Noreen Kausar": "نورین کوثر",
  "Noreen": "نورین",
  "Kouser": "کوثر",
  "Walk-in Customer": "عام خریدار (واک ان)",
  "Walk-in": "عام خریدار",
  "Walk In Customer": "عام خریدار (واک ان)",
  "Cash Customer": "نقد خریدار",
  "General Customer": "عام گاہک",
  "Counter Sale": "کاؤنٹر سیل",
  "Unknown Customer": "نامعلوم گاہک",
  "Guest": "مہمان خریدار",
  "Patient": "مریض",
  "Client": "کلائنٹ",
};

export const pakistaniNameTokens: Record<string, string> = {
  // Titles / Prefixes
  "MR": "مسٹر",
  "MRS": "مسز",
  "MS": "مس",
  "DR": "ڈاکٹر",
  "DOCTOR": "ڈاکٹر",
  "ENGR": "انجینئر",
  "ENGINEER": "انجینئر",
  "PROF": "پروفیسر",
  "PROFESSOR": "پروفیسر",
  "HAJI": "حاجی",
  "HAJEE": "حاجی",
  "CH": "چوہدری",
  "MALIK": "ملک",
  "RAJA": "راجہ",
  "MIAN": "میاں",
  "SARDAR": "سردار",
  "SYED": "سید",
  "SAYYED": "سید",
  "SHAH": "شاہ",
  "SHEIKH": "شیخ",
  "SHAIKH": "شیخ",

  // Female Given Names
  "NOREEN": "نورین",
  "KOUSER": "کوثر",
  "KAUSAR": "کوثر",
  "KOSAR": "کوثر",
  "FATIMA": "فاطمہ",
  "FATIMAH": "فاطمہ",
  "AISHA": "عائشہ",
  "AYESHA": "عائشہ",
  "KHADIJA": "خدیجہ",
  "ZAINAB": "زینب",
  "MARYAM": "مریم",
  "MARIAM": "مریم",
  "SARA": "سارہ",
  "SARAH": "سارہ",
  "SANA": "ثناء",
  "HINA": "حنا",
  "AMNA": "آمنہ",
  "AAMNA": "آمنہ",
  "SADIA": "سعدیہ",
  "RABIA": "رابعہ",
  "SIDRA": "سدرہ",
  "BUSHRA": "بشریٰ",
  "UZMA": "عظمیٰ",
  "SAMINA": "ثمینہ",
  "FARZANA": "فرزانہ",
  "SHAGUFTA": "شگوفہ",
  "NAHEED": "ناہید",
  "PARVEEN": "پروین",
  "PERVEEN": "پروین",
  "NASREEN": "نسرین",
  "YASMEEN": "یاسمین",
  "YASMIN": "یاسمین",
  "SAIMA": "صائمہ",
  "FOZIA": "فوزیہ",
  "FOUZIA": "فوزیہ",
  "NIGHAT": "نگہت",
  "RUBINA": "روبینہ",
  "SHABANA": "شبانہ",
  "TAHIRA": "طاہرہ",
  "ZAHIDA": "زاہدہ",
  "KHALIDA": "خالدہ",
  "RASHIDA": "راشدہ",
  "SAJIDA": "ساجدہ",
  "BIBI": "بی بی",
  "BEGUM": "بیگم",
  "KHATOON": "خاتون",
  "BANO": "بانو",
  "AKHTAR": "اختر",
  "ANJUM": "انجم",
  "KANWAL": "کنول",
  "KIRAN": "کرن",
  "MEHREEN": "مہرین",
  "FARAH": "فرح",
  "NIDA": "ندا",
  "ZARA": "زارا",
  "MAHAM": "ماہم",
  "MANAHIL": "مناہل",
  "DUA": "دعا",
  "IQRA": "اقراء",
  "AYLA": "عائلہ",
  "ANAYA": "عنایہ",
  "MEHWISH": "مہوش",
  "ZUNAIRA": "زنیرہ",
  "SEHRISH": "سحرش",
  "KOMAL": "کومل",
  "ALINA": "علینہ",
  "ALEENA": "علینہ",
  "JAVERIA": "جویریہ",
  "MOMINA": "مومنہ",
  "SABA": "صبا",
  "HIRA": "حرا",
  "ASMA": "اسماء",
  "SUMAIRA": "سمیرا",
  "SAMIRA": "سمیرہ",
  "TAZEEN": "تزئین",
  "SHAZIA": "شازیہ",
  "NAILA": "نائلہ",
  "ZOYA": "زویا",
  "LAIBA": "لائبہ",
  "MAHNOOR": "ماہ نور",
  "AIMEN": "ایمن",
  "AYMEN": "ایمن",
  "BISMA": "بسمہ",
  "NIMRA": "نمرہ",
  "RIMSHA": "رمشاء",
  "AROOJ": "عروج",
  "ANUM": "انم",
  "FAREEHA": "فریحہ",
  "MISBAH": "مصباح",
  "NAZIA": "نازیہ",
  "SHAHIDA": "شاہیدہ",
  "RUKHSANA": "رخسانہ",
  "SURAYYA": "ثریا",
  "KALSOOM": "کلثوم",
  "KULSOOM": "کلثوم",
  "SHAMEEM": "شمیم",
  "SHAMIM": "شمیم",
  "BILQUIS": "بلقیس",
  "BILQEES": "بلقیس",
  "HUMA": "ہما",
  "TANZILA": "تنزیلہ",
  "AMBREEN": "عنبرین",
  "SOBIA": "صوبیہ",
  "FARHAT": "فرحت",
  "SHAISTA": "شائستہ",

  // Male Given Names
  "MUHAMMAD": "محمد",
  "MOHAMMAD": "محمد",
  "MOHAMED": "محمد",
  "MD": "محمد",
  "MOHD": "محمد",
  "AHMED": "احمد",
  "AHMAD": "احمد",
  "ALI": "علی",
  "HASSAN": "حسن",
  "HASAN": "حسن",
  "HUSSAIN": "حسین",
  "HOSSAIN": "حسین",
  "USMAN": "عثمان",
  "OSMAN": "عثمان",
  "OTHMAN": "عثمان",
  "UMAR": "عمر",
  "OMAR": "عمر",
  "ABUBAKAR": "ابوبکر",
  "ABU": "ابو",
  "BAKAR": "بکر",
  "BAKR": "بکر",
  "HAMZA": "حمزہ",
  "BILAL": "بلال",
  "TARIQ": "طارق",
  "KHALID": "خالد",
  "ASIF": "آصف",
  "MAHMOOD": "محمود",
  "MEHMOOD": "محمود",
  "RASHID": "راشد",
  "SAJID": "ساجد",
  "ZAHID": "زاہد",
  "SHAHID": "شاہد",
  "WAHID": "واحد",
  "IMRAN": "عمران",
  "KAMRAN": "کامران",
  "ADNAN": "عدنان",
  "IRFAN": "عرفان",
  "FARHAN": "فرحان",
  "SALMAN": "سلمان",
  "RIZWAN": "رضوان",
  "REHMAN": "رحمان",
  "RAHMAN": "رحمان",
  "ABDUL": "عبدال",
  "ABDULLAH": "عبداللہ",
  "WAQAS": "وقاص",
  "WAQAR": "وقار",
  "FAISAL": "فیصل",
  "KASHIF": "کاشف",
  "NAEEM": "نعیم",
  "NADEEM": "ندیم",
  "WASIM": "وسیم",
  "WASEEM": "وسیم",
  "BABAR": "بابر",
  "SHOAIB": "شعیب",
  "JUNAID": "جنید",
  "SHEHZAD": "شہزاد",
  "SHAHZAD": "شہزاد",
  "JAVED": "جاوید",
  "JAVAID": "جاوید",
  "IQBAL": "اقبال",
  "ASLAM": "اسلم",
  "AKRAM": "اکرم",
  "ANWAR": "انور",
  "AZHAR": "اظہر",
  "ARSHAD": "ارشد",
  "AMJAD": "امجد",
  "ASHRAF": "اشرف",
  "ALTAF": "الطاف",
  "AFZAL": "افضل",
  "AYUB": "ایوب",
  "SAEED": "سعید",
  "SHABBIR": "شبیر",
  "ZULFIQAR": "ذوالفقار",
  "NAVEED": "نوید",
  "MAJID": "ماجد",
  "HAMID": "حامد",
  "ZIA": "ضیاء",
  "FAROOQ": "فاروق",
  "SOHAIL": "سہیل",
  "SUHAIL": "سہیل",
  "SHAN": "شان",
  "SHAHBAZ": "شہباز",
  "SHAHNAWAZ": "شاہنواز",
  "TANVEER": "تنویر",
  "TANVIR": "تنویر",
  "GHULAM": "غلام",
  "HABIB": "حبیب",
  "HAROON": "ہارون",
  "HARUN": "ہارون",
  "QASIM": "قاسم",
  "AZIZ": "عزیز",
  "NASIR": "ناصر",
  "YASIR": "یاسر",
  "AAMIR": "عامر",
  "AMIR": "عامر",
  "IMTIAZ": "امتیاز",
  "SHAKEEL": "شکیل",
  "MUSHTAQ": "مشتاق",
  "MUNAWAR": "منور",
  "MUNIR": "منیر",
  "BASHIR": "بشیر",
  "NAZIR": "نذیر",
  "SARFRAZ": "سرفراز",
  "EJAZ": "اعجاز",
  "IJAZ": "اعجاز",
  "AYAZ": "ایاز",
  "FAHAD": "فہد",
  "HAMMAD": "حماد",
  "DANISH": "دانش",
  "AYAN": "ایان",
  "AYAAN": "ایان",
  "ARHAM": "ارحم",
  "ROHAIL": "روہیل",
  "HASNAIN": "حسنین",
  "ZARYAB": "زریاب",
  "SHERAZ": "شیراز",
  "ATIF": "عاطف",
  "ABID": "عابد",
  "SAQIB": "ثاقب",
  "SALIK": "سالک",
  "TALHA": "طلحہ",
  "ZAHIR": "ظاہر",
  "SHAHMIR": "شاہ میر",
  "ZAIN": "زین",
  "ZESHAN": "ذیشان",
  "ZEESHAN": "ذیشان",

  // Surnames / Castes / Family names
  "KHAN": "خان",
  "CHAUDHRY": "چوہدری",
  "CHOUDHARY": "چوہدری",
  "CHOUDHURY": "چوہدری",
  "CHOWDHURY": "چوہدری",
  "BUTT": "بٹ",
  "BHATTI": "بھٹی",
  "RANA": "رانا",
  "GILL": "گل",
  "MIRZA": "مرزا",
  "QURESHI": "قریشی",
  "ANSARI": "انصاری",
  "SIDDIQUI": "صدیقی",
  "FAROOQI": "فاروقی",
  "USMANI": "عثمانی",
  "ALVI": "علوی",
  "BAIG": "بیگ",
  "BEG": "بیگ",
  "DAR": "ڈار",
  "LONE": "لون",
  "WARRAICH": "وڑائچ",
  "GUJJAR": "گجر",
  "JAT": "جاٹ",
  "JATT": "جاٹ",
  "RAJPUT": "راجپوت",
  "MUGHAL": "مغل",
  "AWAN": "اعوان",
  "ABBASI": "عباسی",
  "HASHMI": "ہاشمی",
  "KAZMI": "کاظمی",
  "GILANI": "گیلانی",
  "GILLANI": "گیلانی",
  "BUKHARI": "بخاری",
  "GARDEZI": "گردیزی",
  "NIAZI": "نیازی",
  "PASHA": "پاشا",
  "KHATTAK": "خٹک",
  "AFRIDI": "آفریدی",
  "ACHAKZAI": "اچکزئی",
  "BUGTI": "بگٹی",
  "MARRI": "مری",
  "MENGAL": "مینگل",
  "MAZARI": "مزاری",
  "LEGHARI": "لغاری",
  "KHAR": "کھر",
  "DASTI": "دستی",
  "KHOSA": "کھوسہ",
  "ZARDARI": "زرداری",
  "TALPUR": "ٹالپر",
  "MEMON": "میمن",
  "SOOMRO": "سومرو",
  "JUNEJO": "جونیجو",
  "MAHAR": "ماہر",
};

export function getLocalizedCustomer(name?: string | null, language = "en"): string {
  if (!name) return language === "ur" ? "نامعلوم گاہک" : "Unknown Customer";
  if (language !== "ur") return name;
  const trimmed = name.trim();
  if (!trimmed) return "نامعلوم گاہک";

  // If already contains Urdu/Arabic characters
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return trimmed;
  }

  // 1. Direct match in dictionary
  if (customerTranslationsUrdu[trimmed]) {
    return customerTranslationsUrdu[trimmed];
  }
  for (const [key, val] of Object.entries(customerTranslationsUrdu)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) return val;
  }

  // 2. Tokenized word-level transliteration for composite Pakistani names
  const tokens = trimmed.split(/[\s_.-]+/);
  if (tokens.length > 0) {
    const translatedTokens = tokens.map((token) => {
      const clean = token.toUpperCase().trim();
      return pakistaniNameTokens[clean] || token;
    });

    const anyTranslated = translatedTokens.some((t, i) => t !== tokens[i]);
    if (anyTranslated) {
      return translatedTokens.join(" ");
    }
  }

  return trimmed;
}
