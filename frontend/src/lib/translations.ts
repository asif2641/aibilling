export type Language = "en" | "ur";

export interface Translations {
  // Brand
  brand: {
    name: string;
    tagline: string;
  };
  // Navigation & Menu
  nav: {
    menu: string;
    dashboard: string;
    invoices: string;
    uploadBill: string;
    manualBill: string;
    vendors: string;
    customers: string;
    reports: string;
    settings: string;
    signOut: string;
    newBadge: string;
    userAccount: string;
  };
  // Header
  header: {
    searchPlaceholder: string;
    uploadBill: string;
    currencyTag: string;
    language: string;
    english: string;
    urdu: string;
  };
  // Common
  common: {
    all: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    view: string;
    apply: string;
    reset: string;
    close: string;
    loading: string;
    processing: string;
    success: string;
    error: string;
    actions: string;
    status: string;
    date: string;
    amount: string;
    total: string;
    notes: string;
    search: string;
    filter: string;
    exportCsv: string;
    exportExcel: string;
    yes: string;
    no: string;
    or: string;
    back: string;
    refresh: string;
  };
  // Statuses
  status: {
    approved: string;
    pending: string;
    rejected: string;
    needs_review: string;
    ready: string;
    processing: string;
    failed: string;
  };
  // Dashboard
  dashboard: {
    title: string;
    totalSpending: string;
    totalSpendingSub: string;
    thisMonth: string;
    thisMonthSub: string;
    thisWeek: string;
    thisWeekSub: string;
    totalBills: string;
    totalBillsSub: string;
    avgBill: string;
    weeklyTrendTitle: string;
    weeklyTrendSub: string;
    topVendorsTitle: string;
    topVendorsSub: string;
    categoryAllocationTitle: string;
    pipelineTitle: string;
    recentInvoicesTitle: string;
    viewAllInvoices: string;
    scanBillCta: string;
    manualBillCta: string;
    noInvoicesYet: string;
  };
  // Invoices Ledger
  invoices: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allStatuses: string;
    allVendors: string;
    allCategories: string;
    columnDate: string;
    columnInvoiceNo: string;
    columnVendor: string;
    columnCategory: string;
    columnAmount: string;
    columnStatus: string;
    columnAction: string;
    viewReview: string;
    manualBadge: string;
    totalCount: string;
    totalSpend: string;
    noInvoicesFound: string;
    clearFilters: string;
  };
  // Manual Bill Entry
  manualBill: {
    title: string;
    subtitle: string;
    backToBills: string;
    billDetailsSection: string;
    vendorNameLabel: string;
    vendorPlaceholder: string;
    invoiceNoLabel: string;
    invoiceNoPlaceholder: string;
    invoiceDateLabel: string;
    dueDateLabel: string;
    categoryLabel: string;
    selectCategory: string;
    customerSection: string;
    customerSub: string;
    customerNameLabel: string;
    customerNamePlaceholder: string;
    customerPhoneLabel: string;
    customerPhonePlaceholder: string;
    lineItemsSection: string;
    lineItemsSub: string;
    addItemButton: string;
    itemDescCol: string;
    itemQtyCol: string;
    itemPriceCol: string;
    itemTotalCol: string;
    subtotal: string;
    taxAmount: string;
    discountAmount: string;
    finalTotal: string;
    notesLabel: string;
    notesPlaceholder: string;
    saveAndApproveButton: string;
    saving: string;
    successMessage: string;
    errorMessage: string;
  };
  // Upload & Scanner
  upload: {
    title: string;
    subtitle: string;
    dropzoneHeading: string;
    dropzoneSub: string;
    selectFileButton: string;
    uploadingMessage: string;
    extractingMessage: string;
    manualBannerHeading: string;
    manualBannerSub: string;
    manualBannerButton: string;
    recentUploadsTitle: string;
  };
  // Review & Approval
  review: {
    title: string;
    subtitle: string;
    originalDocument: string;
    extractedDetails: string;
    vendor: string;
    invoiceNo: string;
    date: string;
    category: string;
    lineItems: string;
    approveInvoice: string;
    rejectInvoice: string;
    reExtract: string;
    confidence: string;
    approvedSuccess: string;
  };
  // Reports & Analytics
  reports: {
    title: string;
    subtitle: string;
    timeframeWeekly: string;
    timeframeMonthly: string;
    timeframeYearly: string;
    timeframeCustom: string;
    vendorFocusLabel: string;
    allVendorsOption: string;
    customRangeLabel: string;
    applyDateFilter: string;
    analysisWindow: string;
    filteringVendor: string;
    clearVendorFilter: string;
    viewAllVendors: string;
    totalPeriodSpend: string;
    vendorSpendSubtitle: string;
    periodSpendSubtitle: string;
    totalInvoices: string;
    invoicesSubtitle: string;
    avgBillSize: string;
    avgBillSubtitle: string;
    highestSingleBill: string;
    spendingTrendTitle: string;
    singleVendorTrendSub: string;
    consolidatedTrendSub: string;
    vendorsMatrixTitle: string;
    singleVendorShareTitle: string;
    clickVendorToIsolate: string;
    categoryAllocationTitle: string;
    detailedBillsTitle: string;
    detailedBillsSub: string;
    noTransactions: string;
    exportCsv: string;
    exportExcel: string;
  };
  // Vendors
  vendors: {
    title: string;
    subtitle: string;
    addVendor: string;
    totalVendors: string;
    searchVendors: string;
    vendorName: string;
    phone: string;
    email: string;
    totalSpend: string;
    totalBills: string;
    noVendorsFound: string;
  };
  // Customers
  customers: {
    title: string;
    subtitle: string;
    addCustomer: string;
    totalCustomers: string;
    searchCustomers: string;
    customerName: string;
    phone: string;
    address: string;
    totalBills: string;
    noCustomersFound: string;
  };
  // Settings
  settings: {
    title: string;
    subtitle: string;
    languageSection: string;
    languageSub: string;
    selectLanguage: string;
    englishOption: string;
    urduOption: string;
    profileSection: string;
    fullName: string;
    emailAddress: string;
    currency: string;
    saveProfile: string;
    categoriesSection: string;
    addCategory: string;
    apiSection: string;
    geminiApiKey: string;
    apiKeyHint: string;
  };
  // Auth
  auth: {
    signInTitle: string;
    signInSub: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    signInButton: string;
    demoButton: string;
    noAccount: string;
    createOne: string;
    registerTitle: string;
    fullNameLabel: string;
    registerButton: string;
    hasAccount: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    brand: {
      name: "Bill Intelligence",
      tagline: "AI Expense Engine",
    },
    nav: {
      menu: "Menu",
      dashboard: "Dashboard",
      invoices: "Invoices & Bills",
      uploadBill: "Upload Bill",
      manualBill: "Add Manual Bill",
      vendors: "Vendors",
      customers: "Customers",
      reports: "Reports & Analytics",
      settings: "Settings",
      signOut: "Sign Out",
      newBadge: "New",
      userAccount: "User Account",
    },
    header: {
      searchPlaceholder: "Search bills, items, vendors...",
      uploadBill: "Upload Bill",
      currencyTag: "PKR (Rs.)",
      language: "Language",
      english: "English",
      urdu: "اردو (Urdu)",
    },
    common: {
      all: "All",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      view: "View",
      apply: "Apply",
      reset: "Reset",
      close: "Close",
      loading: "Loading...",
      processing: "Processing...",
      success: "Success",
      error: "Error",
      actions: "Actions",
      status: "Status",
      date: "Date",
      amount: "Amount",
      total: "Total",
      notes: "Notes",
      search: "Search",
      filter: "Filter",
      exportCsv: "Export CSV",
      exportExcel: "Export Excel",
      yes: "Yes",
      no: "No",
      or: "or",
      back: "Back",
      refresh: "Refresh",
    },
    status: {
      approved: "Approved",
      pending: "Pending",
      rejected: "Rejected",
      needs_review: "Needs Review",
      ready: "Ready",
      processing: "Processing",
      failed: "Failed",
    },
    dashboard: {
      title: "Expense Dashboard",
      totalSpending: "Total Spending",
      totalSpendingSub: "All-time verified expenditures",
      thisMonth: "This Month",
      thisMonthSub: "Current month running total",
      thisWeek: "This Week",
      thisWeekSub: "Current calendar week",
      totalBills: "Total Bills",
      totalBillsSub: "Processed & verified",
      avgBill: "Avg. Bill",
      weeklyTrendTitle: "Weekly Spending Trend",
      weeklyTrendSub: "Expenditure momentum across recent weeks",
      topVendorsTitle: "Top Vendors by Spend",
      topVendorsSub: "Highest expense counter-parties",
      categoryAllocationTitle: "Category Allocation",
      pipelineTitle: "Document Pipeline",
      recentInvoicesTitle: "Recent Invoices",
      viewAllInvoices: "View all invoices →",
      scanBillCta: "Scan Bill",
      manualBillCta: "+ Manual Bill",
      noInvoicesYet: "No invoices recorded yet.",
    },
    invoices: {
      title: "Invoices & Financial Bills",
      subtitle: "Search, review, and manage verified financial documents.",
      searchPlaceholder: "Search by invoice #, vendor, category...",
      allStatuses: "All Statuses",
      allVendors: "All Vendors",
      allCategories: "All Categories",
      columnDate: "Date",
      columnInvoiceNo: "Invoice #",
      columnVendor: "Vendor",
      columnCategory: "Category",
      columnAmount: "Total Amount",
      columnStatus: "Status",
      columnAction: "Action",
      viewReview: "Review →",
      manualBadge: "Manual",
      totalCount: "Invoices Found",
      totalSpend: "Total Spend",
      noInvoicesFound: "No invoices match your search filters.",
      clearFilters: "Clear Filters",
    },
    manualBill: {
      title: "Manual Bill Entry",
      subtitle: "Directly record physical receipts, offline transactions, or custom vendor bills without scanning.",
      backToBills: "← Back to Invoices",
      billDetailsSection: "1. Primary Bill Information",
      vendorNameLabel: "Vendor Name",
      vendorPlaceholder: "e.g. Al-Madina Traders, Shell Fuel Station...",
      invoiceNoLabel: "Invoice / Bill #",
      invoiceNoPlaceholder: "e.g. INV-2026-089",
      invoiceDateLabel: "Bill Date",
      dueDateLabel: "Due Date (Optional)",
      categoryLabel: "Expense Category",
      selectCategory: "Select a Category",
      customerSection: "2. Customer Details (Optional)",
      customerSub: "Assign this bill to a client or recipient if applicable.",
      customerNameLabel: "Customer Name",
      customerNamePlaceholder: "e.g. Ahmed Raza",
      customerPhoneLabel: "Phone Number",
      customerPhonePlaceholder: "0300-1234567",
      lineItemsSection: "3. Bill Items & Breakdown",
      lineItemsSub: "Itemize products, units, and services purchased.",
      addItemButton: "+ Add Line Item",
      itemDescCol: "Item Description",
      itemQtyCol: "Qty",
      itemPriceCol: "Unit Price (PKR)",
      itemTotalCol: "Line Total",
      subtotal: "Subtotal",
      taxAmount: "Tax (PKR)",
      discountAmount: "Discount (PKR)",
      finalTotal: "Grand Total",
      notesLabel: "4. Additional Notes / Memo",
      notesPlaceholder: "Payment method, reference number, or remarks...",
      saveAndApproveButton: "Save & Approve Bill",
      saving: "Saving Bill...",
      successMessage: "Bill recorded and approved successfully!",
      errorMessage: "Failed to create bill. Please check the inputs.",
    },
    upload: {
      title: "Scan & Ingest Document",
      subtitle: "AI OCR extracts structured vendor, line items, and totals automatically.",
      dropzoneHeading: "Click or drag bill image or PDF here",
      dropzoneSub: "Supports PNG, JPG, JPEG, WEBP, PDF up to 20MB",
      selectFileButton: "Select File",
      uploadingMessage: "Uploading file securely...",
      extractingMessage: "AI OCR is parsing and structuring data...",
      manualBannerHeading: "Prefer entering bills by hand?",
      manualBannerSub: "If you have paper slips, handwritten notes, or non-scannable receipts, record them instantly.",
      manualBannerButton: "Create Manual Bill →",
      recentUploadsTitle: "Recent Scans & Processing Status",
    },
    review: {
      title: "Review & Verify Invoice",
      subtitle: "Inspect the original bill alongside AI-extracted fields before approving.",
      originalDocument: "Original Document",
      extractedDetails: "Extracted Invoice Data",
      vendor: "Vendor",
      invoiceNo: "Invoice #",
      date: "Date",
      category: "Category",
      lineItems: "Line Items",
      approveInvoice: "Approve Invoice",
      rejectInvoice: "Reject Invoice",
      reExtract: "Re-extract with AI",
      confidence: "AI Extraction Confidence",
      approvedSuccess: "Invoice approved and locked successfully!",
    },
    reports: {
      title: "Financial Intelligence & Comparison",
      subtitle: "Multi-horizon bill aggregation, vendor comparisons, and momentum curves across Weekly, Monthly, Yearly, and Custom intervals.",
      timeframeWeekly: "Weekly",
      timeframeMonthly: "Monthly",
      timeframeYearly: "Yearly",
      timeframeCustom: "Custom",
      vendorFocusLabel: "Vendor Focus:",
      allVendorsOption: "All Vendors (Consolidated Comparison)",
      customRangeLabel: "Select Date Window:",
      applyDateFilter: "Apply Date Filter",
      analysisWindow: "Analysis Window:",
      filteringVendor: "Filtering:",
      clearVendorFilter: "Clear Vendor Filter",
      viewAllVendors: "View All Vendors",
      totalPeriodSpend: "Total Period Spend",
      vendorSpendSubtitle: "Expenditure with selected vendor",
      periodSpendSubtitle: "Across all verified bills",
      totalInvoices: "Total Invoices",
      invoicesSubtitle: "In this analysis window",
      avgBillSize: "Average Bill Size",
      avgBillSubtitle: "Mean transaction amount",
      highestSingleBill: "Highest Single Bill",
      spendingTrendTitle: "Spending Trend & Timeline Chart",
      singleVendorTrendSub: "Timeline for selected vendor",
      consolidatedTrendSub: "Consolidated Time Series",
      vendorsMatrixTitle: "Vendors Comparison Matrix",
      singleVendorShareTitle: "Single Vendor Share",
      clickVendorToIsolate: "Click vendor to isolate",
      categoryAllocationTitle: "Period Category Allocation",
      detailedBillsTitle: "Detailed Bills in Period",
      detailedBillsSub: "Itemized transactions in this time window",
      noTransactions: "No transactions recorded in this interval.",
      exportCsv: "Export CSV",
      exportExcel: "Export Excel",
    },
    vendors: {
      title: "Vendors Directory",
      subtitle: "Manage suppliers, businesses, and counter-parties.",
      addVendor: "+ Add Vendor",
      totalVendors: "Total Vendors",
      searchVendors: "Search vendors...",
      vendorName: "Vendor Name",
      phone: "Phone",
      email: "Email",
      totalSpend: "Total Spend",
      totalBills: "Bills Count",
      noVendorsFound: "No vendors registered yet.",
    },
    customers: {
      title: "Customers Directory",
      subtitle: "Manage client profiles and recipient accounts.",
      addCustomer: "+ Add Customer",
      totalCustomers: "Total Customers",
      searchCustomers: "Search customers...",
      customerName: "Customer Name",
      phone: "Phone",
      address: "Address",
      totalBills: "Bills Count",
      noCustomersFound: "No customers registered yet.",
    },
    settings: {
      title: "Platform Settings",
      subtitle: "Configure language, profile, currency, and AI extraction keys.",
      languageSection: "Language Preferences",
      languageSub: "Switch the application language. Urdu renders in authentic Jameel Noori Nastaleeq font.",
      selectLanguage: "Interface Language",
      englishOption: "English (Default LTR)",
      urduOption: "اردو - Urdu (Jameel Noori Nastaleeq RTL)",
      profileSection: "User Profile",
      fullName: "Full Name",
      emailAddress: "Email Address",
      currency: "Default Currency",
      saveProfile: "Save Changes",
      categoriesSection: "Expense Categories",
      addCategory: "+ Add Category",
      apiSection: "AI & OCR Configuration",
      geminiApiKey: "Gemini Vision API Key",
      apiKeyHint: "Optional. If not set, system automatically uses fast local universal extraction.",
    },
    auth: {
      signInTitle: "Sign in to your account",
      signInSub: "Manage bills, scan receipts, and track business expenses",
      emailLabel: "Email address",
      emailPlaceholder: "name@company.com",
      passwordLabel: "Password",
      signInButton: "Sign In",
      demoButton: "Quick Demo Login (1-Click)",
      noAccount: "Don't have an account?",
      createOne: "Create account",
      registerTitle: "Create your account",
      fullNameLabel: "Full Name",
      registerButton: "Create Account",
      hasAccount: "Already have an account? Sign in",
    },
  },
  ur: {
    brand: {
      name: "بل انٹیلی جنس",
      tagline: "اے آئی اخراجات مینیجر",
    },
    nav: {
      menu: "مینو",
      dashboard: "ڈیش بورڈ",
      invoices: "بلز اور انوائسز",
      uploadBill: "بل اسکین کریں",
      manualBill: "دستی بل بنائیں",
      vendors: "وینڈرز (فروشندگان)",
      customers: "کسٹمرز (گاہک)",
      reports: "رپورٹس و موازنہ",
      settings: "ترتیبات (سیٹنگز)",
      signOut: "لاگ آؤٹ",
      newBadge: "نیا",
      userAccount: "صارف کا اکاؤنٹ",
    },
    header: {
      searchPlaceholder: "بلز، آئٹمز، وینڈرز تلاش کریں...",
      uploadBill: "بل اپلوڈ کریں",
      currencyTag: "روپے (PKR)",
      language: "زبان",
      english: "English",
      urdu: "اردو",
    },
    common: {
      all: "تمام",
      save: "محفوظ کریں",
      cancel: "منسوخ کریں",
      delete: "حذف کریں",
      edit: "ترمیم کریں",
      view: "دیکھیں",
      apply: "لاگو کریں",
      reset: "ری سیٹ",
      close: "بند کریں",
      loading: "لوڈ ہو رہا ہے...",
      processing: "عمل جاری ہے...",
      success: "کامیابی",
      error: "خرابی",
      actions: "کارروائی",
      status: "کیفیت",
      date: "تاریخ",
      amount: "رقم",
      total: "کل رقم",
      notes: "اضافی نوٹس",
      search: "تلاش کریں",
      filter: "فلٹر",
      exportCsv: "سی ایس وی ڈاؤن لوڈ",
      exportExcel: "ایکسل فائل ڈاؤن لوڈ",
      yes: "ہاں",
      no: "نہیں",
      or: "یا",
      back: "واپس",
      refresh: "تازہ کریں",
    },
    status: {
      approved: "منظور شدہ",
      pending: "زیر التواء",
      rejected: "مسترد شدہ",
      needs_review: "جائزہ درکار",
      ready: "تیار",
      processing: "پراسیسنگ جاری",
      failed: "ناکام",
    },
    dashboard: {
      title: "اخراجات کا ڈیش بورڈ",
      totalSpending: "کل اخراجات",
      totalSpendingSub: "تصدیق شدہ تمام اخراجات کی کل رقم",
      thisMonth: "اس ماہ کا خرچہ",
      thisMonthSub: "موجودہ مہینے کا کل ٹوٹل",
      thisWeek: "اس ہفتے کا خرچہ",
      thisWeekSub: "موجودہ ہفتے کے اخراجات",
      totalBills: "کل بلز کی تعداد",
      totalBillsSub: "تصدیق شدہ اور محفوظ بلز",
      avgBill: "اوسط بل",
      weeklyTrendTitle: "ہفتہ وار اخراجات کا گراف",
      weeklyTrendSub: "حالیہ ہفتوں میں اخراجات کی رفتار",
      topVendorsTitle: "سرفہرست وینڈرز",
      topVendorsSub: "جنہیں سب سے زیادہ رقم ادا کی گئی",
      categoryAllocationTitle: "کیٹیگری کے لحاظ سے اخراجات",
      pipelineTitle: "دستاویزات کی پراسیسنگ کیفیت",
      recentInvoicesTitle: "حالیہ تصدیق شدہ بلز",
      viewAllInvoices: "تمام بلز دیکھیں ←",
      scanBillCta: "بل اسکین کریں",
      manualBillCta: "+ نیا دستی بل",
      noInvoicesYet: "ابھی تک کوئی بل شامل نہیں کیا گیا۔",
    },
    invoices: {
      title: "بلز اور مالیاتی انوائسز",
      subtitle: "تصدیق شدہ دستاویزات تلاش کریں، جائزہ لیں اور منظم کریں۔",
      searchPlaceholder: "بل نمبر، وینڈر یا کیٹیگری سے تلاش کریں...",
      allStatuses: "تمام کیفیات",
      allVendors: "تمام وینڈرز",
      allCategories: "تمام کیٹیگریز",
      columnDate: "تاریخ",
      columnInvoiceNo: "بل نمبر",
      columnVendor: "وینڈر کا نام",
      columnCategory: "کیٹیگری",
      columnAmount: "کل رقم",
      columnStatus: "کیفیت",
      columnAction: "کارروائی",
      viewReview: "جائزہ لیں ←",
      manualBadge: "دستی",
      totalCount: "کل بلز",
      totalSpend: "کل رقم",
      noInvoicesFound: "آپ کے فلٹرز کے مطابق کوئی بل نہیں ملا۔",
      clearFilters: "فلٹرز ختم کریں",
    },
    manualBill: {
      title: "دستی بل کا اندراج",
      subtitle: "بغیر اسکین کیے دستی بل، آف لائن رسیدیں اور اخراجات فوراً درج کریں۔",
      backToBills: "← تمام بلز پر واپس جائیں",
      billDetailsSection: "1۔ بل کی بنیادی تفصیلات",
      vendorNameLabel: "وینڈر / دکاندار کا نام",
      vendorPlaceholder: "مثلاً المدینہ ٹریڈرز، شیل پیٹرول پمپ...",
      invoiceNoLabel: "انوائس / بل نمبر",
      invoiceNoPlaceholder: "مثلاً INV-2026-089",
      invoiceDateLabel: "بل کی تاریخ",
      dueDateLabel: "آخری تاریخ (اختیاری)",
      categoryLabel: "خرچے کی کیٹیگری",
      selectCategory: "کیٹیگری منتخب کریں",
      customerSection: "2۔ کسٹمر / گاہک کی تفصیلات (اختیاری)",
      customerSub: "اگر یہ بل کسی گاہک کے لیے ہے تو اس کی تفصیل درج کریں۔",
      customerNameLabel: "گاہک کا نام",
      customerNamePlaceholder: "مثلاً احمد رضا",
      customerPhoneLabel: "فون نمبر",
      customerPhonePlaceholder: "0300-1234567",
      lineItemsSection: "3۔ اشیاء / آئٹمز کی تفصیل",
      lineItemsSub: "خریدے گئے سامان، آئٹمز اور قیمت کا اندراج کریں۔",
      addItemButton: "+ مزید آئٹم شامل کریں",
      itemDescCol: "آئٹم کی تفصیل",
      itemQtyCol: "تعداد",
      itemPriceCol: "فی یونٹ قیمت (روپے)",
      itemTotalCol: "کل قیمت",
      subtotal: "بنیادی رقم (سب ٹوٹل)",
      taxAmount: "ٹیکس (روپے)",
      discountAmount: "رعایت / ڈسکاؤنٹ (روپے)",
      finalTotal: "حتمی کل رقم",
      notesLabel: "4۔ اضافی نوٹ یا تفصیل",
      notesPlaceholder: "ادائیگی کا طریقہ، رسید کا حوالہ وغیرہ...",
      saveAndApproveButton: "بل محفوظ اور منظور کریں",
      saving: "بل محفوظ ہو رہا ہے...",
      successMessage: "بل کامیابی کے ساتھ درج اور منظور کر لیا گیا ہے!",
      errorMessage: "بل محفوظ کرنے میں خرابی پیش آئی۔ براہ کرم تفصیلات چیک کریں۔",
    },
    upload: {
      title: "بل اسکین اور اپلوڈ کریں",
      subtitle: "آرٹیفیشل انٹیلی جنس (AI) خودکار طور پر وینڈر، آئٹمز اور رقم اخذ کرے گی۔",
      dropzoneHeading: "بل کی تصویر یا پی ڈی ایف یہاں ڈریگ کریں یا کلک کریں",
      dropzoneSub: "معاون فائلیں: PNG, JPG, JPEG, WEBP, PDF (زیادہ سے زیادہ 20 ایم بی)",
      selectFileButton: "فائل منتخب کریں",
      uploadingMessage: "فائل محفوظ طریقے سے اپلوڈ ہو رہی ہے...",
      extractingMessage: "AI ڈیٹا اخذ کر رہا ہے، برائے مہربانی انتظار کریں...",
      manualBannerHeading: "کیا آپ دستی بل درج کرنا چاہتے ہیں؟",
      manualBannerSub: "اگر آپ کے پاس ہاتھ سے لکھی ہوئی پرچی یا رسید ہے تو اسے دستی طور پر ریکارڈ کریں۔",
      manualBannerButton: "دستی بل بنائیں ←",
      recentUploadsTitle: "حالیہ اسکینز اور پراسیسنگ کیفیت",
    },
    review: {
      title: "بل کا جائزہ اور تصدیق",
      subtitle: "منظور کرنے سے پہلے اصل دستاویز کے ساتھ اخذ کردہ ڈیٹا کا موازنہ کریں۔",
      originalDocument: "اصل دستاویز",
      extractedDetails: "اخذ کردہ معلومات",
      vendor: "وینڈر",
      invoiceNo: "بل نمبر",
      date: "تاریخ",
      category: "کیٹیگری",
      lineItems: "آئٹمز کی فہرست",
      approveInvoice: "بل منظور کریں",
      rejectInvoice: "بل مسترد کریں",
      reExtract: "دوبارہ اسکین کریں",
      confidence: "AI اعتماد کا فیصد",
      approvedSuccess: "بل کامیابی سے تصدیق اور منظور ہو گیا!",
    },
    reports: {
      title: "مالیاتی رپورٹس اور تقابلی جائزہ",
      subtitle: "ہفتہ وار، ماہانہ، سالانہ اور اپنی مرضی کے دورانیے میں وینڈرز اور اخراجات کا تفصیلی موازنہ۔",
      timeframeWeekly: "ہفتہ وار",
      timeframeMonthly: "ماہانہ",
      timeframeYearly: "سالانہ",
      timeframeCustom: "اپنی مرضی کی تاریخ",
      vendorFocusLabel: "وینڈر کا انتخاب:",
      allVendorsOption: "تمام وینڈرز (مشترکہ موازنہ)",
      customRangeLabel: "تاریخ منتخب کریں:",
      applyDateFilter: "تاریخ فلٹر لگائیں",
      analysisWindow: "تجزیاتی مدت:",
      filteringVendor: "فلٹر شدہ:",
      clearVendorFilter: "وینڈر فلٹر ختم کریں",
      viewAllVendors: "تمام وینڈرز دیکھیں",
      totalPeriodSpend: "اس مدت کا کل خرچہ",
      vendorSpendSubtitle: "منتخب وینڈر کے اخراجات",
      periodSpendSubtitle: "تمام تصدیق شدہ بلز کا مجموعہ",
      totalInvoices: "کل بلز کی تعداد",
      invoicesSubtitle: "اس مدت کے اندر",
      avgBillSize: "اوسط بل کی رقم",
      avgBillSubtitle: "فی بل اوسط خرچہ",
      highestSingleBill: "سب سے بڑا بل",
      spendingTrendTitle: "اخراجات کا رجحان اور ٹائم لائن گراف",
      singleVendorTrendSub: "منتخب وینڈر کے اخراجات کا ٹائم لائن",
      consolidatedTrendSub: "مجموعی مالیاتی رجحان",
      vendorsMatrixTitle: "وینڈرز کا تقابلی جائزہ (حصص کا فیصد)",
      singleVendorShareTitle: "سنگل وینڈر کا حصہ",
      clickVendorToIsolate: "کسی بھی وینڈر پر کلک کرکے علیحدہ جائزہ لیں",
      categoryAllocationTitle: "کیٹیگری کے لحاظ سے تقسیم",
      detailedBillsTitle: "اس مدت کے تفصیلی بلز",
      detailedBillsSub: "اس دورانیے میں درج کیے گئے انفرادی بلز",
      noTransactions: "اس دورانیے میں کوئی بل ریکارڈ نہیں ہوا۔",
      exportCsv: "سی ایس وی ڈاؤن لوڈ",
      exportExcel: "ایکسل ڈاؤن لوڈ",
    },
    vendors: {
      title: "وینڈرز ڈائریکٹری",
      subtitle: "تمام سپلائرز، دکانداروں اور اداروں کی تفصیلات۔",
      addVendor: "+ نیا وینڈر شامل کریں",
      totalVendors: "کل وینڈرز",
      searchVendors: "وینڈر تلاش کریں...",
      vendorName: "وینڈر کا نام",
      phone: "فون نمبر",
      email: "ای میل",
      totalSpend: "کل خرچہ",
      totalBills: "بلز کی تعداد",
      noVendorsFound: "ابھی تک کوئی وینڈر رجسٹر نہیں ہے۔",
    },
    customers: {
      title: "کسٹمرز ڈائریکٹری",
      subtitle: "تمام گاہکوں اور کلائنٹس کے پروفائلز۔",
      addCustomer: "+ نیا کسٹمر شامل کریں",
      totalCustomers: "کل کسٹمرز",
      searchCustomers: "کسٹمر تلاش کریں...",
      customerName: "گاہک کا نام",
      phone: "فون نمبر",
      address: "پتہ",
      totalBills: "بلز کی تعداد",
      noCustomersFound: "ابھی تک کوئی کسٹمر رجسٹر نہیں ہے۔",
    },
    settings: {
      title: "پلیٹ فارم سیٹنگز",
      subtitle: "زبان، پروفائل، کرنسی اور AI اسکیننگ کی ترتیبات تبدیل کریں۔",
      languageSection: "زبان کا انتخاب (Language Preferences)",
      languageSub: "سسٹم کی زبان تبدیل کریں۔ اردو موڈ میں مستند جمیل نوری نستعلیق فونٹ لاگو ہوگا۔",
      selectLanguage: "انٹرفیس کی زبان",
      englishOption: "English (انگریزی - بائیں سے دائیں)",
      urduOption: "اردو - Jameel Noori Nastaleeq (دائیں سے بائیں)",
      profileSection: "صارف کا پروفائل",
      fullName: "پورا نام",
      emailAddress: "ای میل ایڈریس",
      currency: "بنیادی کرنسی",
      saveProfile: "تبدیلیاں محفوظ کریں",
      categoriesSection: "اخراجات کی کیٹیگریز",
      addCategory: "+ نئی کیٹیگری",
      apiSection: "AI اور OCR کنفیگریشن",
      geminiApiKey: "جیمینائی وژن اے پی آئی کی (Gemini API Key)",
      apiKeyHint: "اختیاری۔ اگر خالی چھوڑا جائے تو سسٹم تیز رفتار لوکل انجن استعمال کرتا ہے۔",
    },
    auth: {
      signInTitle: "اپنے اکاؤنٹ میں داخل ہوں",
      signInSub: "بلز اسکین کریں، رسیدیں منظم کریں اور کاروباری اخراجات پر نظر رکھیں",
      emailLabel: "ای میل ایڈریس",
      emailPlaceholder: "name@company.com",
      passwordLabel: "پاس ورڈ",
      signInButton: "داخل ہوں (لاگ ان)",
      demoButton: "فوری ڈیمو سیشن شروع کریں (1-Click)",
      noAccount: "کیا آپ کا اکاؤنٹ نہیں بنا ہوا؟",
      createOne: "نیا اکاؤنٹ بنائیں",
      registerTitle: "نیا اکاؤنٹ رجسٹر کریں",
      fullNameLabel: "پورا نام",
      registerButton: "اکاؤنٹ بنائیں",
      hasAccount: "پہلے سے اکاؤنٹ موجود ہے؟ لاگ ان کریں",
    },
  },
};
