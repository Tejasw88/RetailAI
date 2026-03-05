export const RTL_LANGUAGES = ["ur", "ks", "sd"];
export const LANGUAGE_LIST = [
    { code: "en", name: "English", native: "English", color: "#2563eb" }, { code: "hi", name: "Hindi", native: "हिंदी", color: "#ff6b00" },
    { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", color: "#dc2626" }, { code: "ta", name: "Tamil", native: "தமிழ்", color: "#16a34a" },
    { code: "te", name: "Telugu", native: "తెలుగు", color: "#7c3aed" }, { code: "ml", name: "Malayalam", native: "മലയാളം", color: "#0891b2" },
    { code: "mr", name: "Marathi", native: "मराठी", color: "#b45309" }, { code: "gu", name: "Gujarati", native: "ગુજરાતી", color: "#0d9488" },
    { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", color: "#65a30d" }, { code: "bn", name: "Bengali", native: "বাংলা", color: "#e11d48" },
    { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", color: "#9333ea" }, { code: "as", name: "Assamese", native: "অসমীয়া", color: "#0284c7" },
    { code: "ur", name: "Urdu", native: "اردو", color: "#15803d" }, { code: "ne", name: "Nepali", native: "नेपाली", color: "#b91c1c" },
    { code: "mai", name: "Maithili", native: "मैथिली", color: "#c2410c" }, { code: "sa", name: "Sanskrit", native: "संस्कृत", color: "#a16207" },
    { code: "kok", name: "Konkani", native: "कोंकणी", color: "#0369a1" }, { code: "sd", name: "Sindhi", native: "سنڌي", color: "#7e22ce" },
    { code: "ks", name: "Kashmiri", native: "کٲشُر", color: "#be185d" }, { code: "doi", name: "Dogri", native: "डोगरी", color: "#065f46" },
    { code: "mni", name: "Manipuri", native: "মৈতৈলোন্", color: "#1e40af" }, { code: "brx", name: "Bodo", native: "बड़ो", color: "#92400e" },
];

const en = {
    appName: "RetailAI", tagline: "Smart Shop Manager",
    goodMorning: "Good Morning", goodAfternoon: "Good Afternoon", goodEvening: "Good Evening",
    shopkeeperKnows: "🧠 The shopkeeper knows their shop.", weKnowFuture: "RetailAI knows their future.",
    orderToday: "Order TODAY", orderSoon: "Order Soon", stockGood: "Stock is Good", tooMuchStock: "Too Much Stock",
    itemsOrderToday: "items — Order TODAY", itemsOrderSoon: "items — Order Soon", itemsAllGood: "items — All Good", saveThisWeek: "Save this week",
    home: "Home", products: "Products", sales: "Sales", todo: "To-Do",
    todaysOrderList: "Today's Order List", daysOfStockLeft: "days of stock left", urgentItems: "Urgent Items",
    orderNow: "Order Now", markDone: "Mark as Done ✓", remindTomorrow: "Remind me tomorrow",
    sendWhatsApp: "Send Order on WhatsApp", installNow: "Install Now", later: "Later", close: "Close", done: "Done",
    allItemsInShop: "All Items in My Shop", searchProducts: "Search products...", allItems: "All Items",
    noProductsFound: "No products found", unitsLeft: "units left", moreDays: "more days",
    stockLevel: "Stock Level", minStock: "Minimum Stock", bestOrderQty: "Best Order Quantity",
    orderWhenReaches: "Order When Stock Reaches", supplierDeliversIn: "Supplier delivers in",
    days: "days", units: "units",
    last7DaysSold: "Last 7 days sold", howShopDoing: "How Your Shop is Doing",
    last7DaysSales: "Sales This Week", salesSubtitle: "Units sold per day",
    bestDay: "Best Day", totalThisWeek: "Total This Week", expectedNextWeek: "Expected Next Week",
    bestSellers: "Your Best Sellers", bestSellersSubtitle: "Items selling fastest this week",
    soldThisWeek: "sold/week", revenue: "revenue",
    mostImportantItems: "Your Most Important Items",
    aItemsTitle: "High Value — Track Daily", aItemsDesc: "These items = 60% of your money",
    bItemsTitle: "Medium — Check Weekly", bItemsDesc: "These items = 30% of your money",
    cItemsTitle: "Small — Count Monthly", cItemsDesc: "Don't stress about these daily",
    shopHealth: "Your Shop Health", shopHealthSubtitle: "How your stock looks today", totalItems: "Total Items",
    todoTitle: "What You Need To Do Today", noAlerts: "Everything is fine today!", noAlertsSubtitle: "Enjoy your day.",
    savesYou: "Saves you", orderBefore: "Order before",
    onlyXDaysLeft: "You only have", daysLeftAlert: "days of stock left!",
    orderXUnits: "Order", unitsBefore: "units before",
    scanAndSell: "Scan & Sell", endOfDayCount: "End of Day Count", cashSale: "Cash Sale",
    countYourShelves: "Count Your Shelves", howManyNow: "How many do you have NOW?",
    youCountedWeDid: "You counted. We calculated. Done!", recordSale: "Record a Sale",
    scanDesc: "Tap product to sell instantly", countDesc: "Count shelves, we calculate sales", cashDesc: "Enter ₹ amount to find product",
    whichDidYouSell: "Which did you sell?", smallItemNote: "Small item (₹5-₹20) — tracked as C-item group",
    sold: "SOLD", unitLabel: "Unit", unitsLabel: "Units", was: "Was",
    chooseLanguage: "Choose Your Language",
    festivalComing: "Festival Season Coming!", lastYearRanOut: "Last year you ran out! Stock up early.",
    deadStockTitle: "💸 Dead Stock Warning", deadStockDesc: "has been sitting for 47 days. ₹3,200 of your money is stuck. Consider a small discount to move it.",
    noInternet: "📵 No internet — showing last saved data", backOnline: "✅ Back online — syncing...",
    installTitle: "📲 Install RetailAI on your phone — works like WhatsApp!",
    alreadyInShop: "Already in your shop!",
    addMoreStock: "Add More Stock",
    bulkCount: "products added today",
    lookUpProduct: "Look Up Product",
    productName: "Product Name",
    enterBarcode: "Enter barcode number",
    addProduct: "Add Product",
    scanBarcode: "Scan Barcode",
    typeBarcode: "Type Barcode Number",
    pointCamera: "Point camera at barcode",
    productFound: "Product Found!",
    productNotFound: "Product not found",
    fillManually: "Fill in details manually",
    howManyHave: "How many do you have now?",
    youPaidPer: "You paid per unit (₹)?",
    youSellFor: "You sell for (₹)?",
    addToShop: "Add to My Shop",
    scanAnother: "Scan Another Product",
    addedSuccess: "added to your shop!",
};

const hi = {
    ...en,
    appName: "रिटेलAI", tagline: "स्मार्ट दुकान मैनेजर",
    goodMorning: "सुप्रभात", goodAfternoon: "नमस्ते", goodEvening: "शुभ संध्या",
    shopkeeperKnows: "🧠 दुकानदार अपनी दुकान जानता है।", weKnowFuture: "RetailAI उनका भविष्य जानता है।",
    orderToday: "आज ही ऑर्डर करें", orderSoon: "जल्दी ऑर्डर करें", stockGood: "स्टॉक ठीक है", tooMuchStock: "बहुत ज़्यादा स्टॉक",
    itemsOrderToday: "सामान — आज ऑर्डर करें", itemsOrderSoon: "सामान — जल्दी ऑर्डर करें", itemsAllGood: "सामान — सब ठीक", saveThisWeek: "इस हफ्ते बचाएं",
    home: "होम", products: "सामान", sales: "बिक्री", todo: "काम",
    todaysOrderList: "आज की ऑर्डर लिस्ट", daysOfStockLeft: "दिन का स्टॉक बचा", urgentItems: "ज़रूरी सामान",
    orderNow: "अभी ऑर्डर करें", markDone: "हो गया ✓", remindTomorrow: "कल याद दिलाएं",
    sendWhatsApp: "WhatsApp पर ऑर्डर भेजें", installNow: "अभी इंस्टॉल करें", later: "बाद में", close: "बंद करें", done: "हो गया",
    allItemsInShop: "मेरी दुकान का सारा सामान", searchProducts: "सामान खोजें...", allItems: "सभी सामान",
    noProductsFound: "कोई सामान नहीं मिला", unitsLeft: "बचा है", moreDays: "दिन चलेगा",
    stockLevel: "स्टॉक स्तर", minStock: "न्यूनतम स्टॉक", bestOrderQty: "सबसे अच्छी मात्रा",
    orderWhenReaches: "इतने पर ऑर्डर करें", supplierDeliversIn: "सप्लायर देता है",
    days: "दिन", units: "यूनिट",
    last7DaysSold: "पिछले 7 दिन बिक्री", howShopDoing: "दुकान कैसी चल रही है",
    last7DaysSales: "इस हफ्ते बिक्री", salesSubtitle: "रोज़ कितना बिका",
    bestDay: "सबसे अच्छा दिन", totalThisWeek: "इस हफ्ते कुल", expectedNextWeek: "अगले हफ्ते अनुमान",
    bestSellers: "सबसे ज़्यादा बिकने वाले", bestSellersSubtitle: "इस हफ्ते सबसे तेज़ बिके",
    soldThisWeek: "बिका/हफ्ता", revenue: "कमाई",
    mostImportantItems: "सबसे ज़रूरी सामान",
    aItemsTitle: "महंगा — रोज़ देखें", aItemsDesc: "ये सामान = आपके 60% पैसे",
    bItemsTitle: "मध्यम — हफ्ते में देखें", bItemsDesc: "ये सामान = आपके 30% पैसे",
    cItemsTitle: "सस्ता — महीने में देखें", cItemsDesc: "इनकी रोज़ चिंता न करें",
    shopHealth: "दुकान की सेहत", shopHealthSubtitle: "आज स्टॉक कैसा है", totalItems: "कुल सामान",
    todoTitle: "आज क्या करना है", noAlerts: "आज सब ठीक है!", noAlertsSubtitle: "अच्छा दिन बिताएं।",
    savesYou: "बचत होगी", orderBefore: "इससे पहले ऑर्डर करें",
    onlyXDaysLeft: "सिर्फ", daysLeftAlert: "दिन बचे हैं!",
    orderXUnits: "ऑर्डर करें", unitsBefore: "यूनिट इससे पहले",
    scanAndSell: "स्कैन करके बेचें", endOfDayCount: "दिन के अंत में गिनती", cashSale: "नकद बिक्री",
    countYourShelves: "अपनी अलमारी गिनें", howManyNow: "अभी कितने हैं?",
    youCountedWeDid: "आपने गिना। हमने हिसाब लगाया। हो गया!", recordSale: "बिक्री दर्ज करें",
    scanDesc: "सामान टैप करें तुरंत बेचें", countDesc: "अलमारी गिनें, हम हिसाब करेंगे", cashDesc: "रुपये डालें सामान खोजें",
    whichDidYouSell: "क्या बेचा?", smallItemNote: "₹5-₹20 का सामान — हफ्ते में गिनें",
    sold: "बेचा", unitLabel: "यूनिट", unitsLabel: "यूनिट", was: "पहले",
    chooseLanguage: "भाषा चुनें",
    festivalComing: "त्योहार आ रहा है!", lastYearRanOut: "पिछले साल खत्म हो गया था! अभी स्टॉक करें।",
    deadStockTitle: "💸 पुराने माल में फंसा पैसा", deadStockDesc: "🧺 Surf Excel 47 दिन से पड़ा है। आपके ₹3,200 फंसे हैं। छूट देकर बेच दें।",
    noInternet: "📵 इंटरनेट नहीं — पुराना डेटा दिख रहा है", backOnline: "✅ इंटरनेट आ गया — सिंक हो रहा है...",
    installTitle: "📲 RetailAI फोन में इंस्टॉल करें — WhatsApp जैसा!",
    alreadyInShop: "दुकान में पहले से मौजूद!",
    addMoreStock: "पुराने स्टॉक में जोड़ें",
    bulkCount: "आज सामान जोड़े गए",
    lookUpProduct: "सामान खोजें",
    productName: "सामान का नाम",
    enterBarcode: "बारकोड नंबर डालें",
    addProduct: "सामान जोड़ें",
    scanBarcode: "स्कैन करें",
    typeBarcode: "बारकोड नंबर डालें",
    pointCamera: "कैमरा बारकोड पर रखें",
    productFound: "सामान मिल गया!",
    productNotFound: "सामान नहीं मिला",
    fillManually: "खुद जानकारी भरें",
    howManyHave: "अभी आपके पास कितने हैं?",
    youPaidPer: "आपने कितने में खरीदा (₹)?",
    youSellFor: "आप कितने में बेचते हैं (₹)?",
    addToShop: "दुकान में जोड़ें",
    scanAnother: "एक और सामान जोड़ें",
    addedSuccess: "दुकान में जोड़ दिया गया!",
    critical: "ज़रूरी", orderSoonLabel: "जल्दी ऑर्डर", allGood: "सब ठीक", tooMuch: "बहुत ज़्यादा",
};

const kn = { ...en, appName: "ರಿಟೇಲ್AI", goodMorning: "ಶುಭೋದಯ", goodAfternoon: "ನಮಸ್ಕಾರ", goodEvening: "ಶುಭ ಸಂಜೆ", shopkeeperKnows: "🧠 ಅಂಗಡಿಯವರು ತಮ್ಮ ಅಂಗಡಿ ಬಲ್ಲರು.", weKnowFuture: "RetailAI ಅವರ ಭವಿಷ್ಯ ಬಲ್ಲದು.", orderToday: "ಇಂದೇ ಆರ್ಡರ್", orderSoon: "ಶೀಘ್ರ ಆರ್ಡರ್", stockGood: "ಸ್ಟಾಕ್ ಸರಿ", tooMuchStock: "ಹೆಚ್ಚು ಸ್ಟಾಕ್", itemsOrderToday: "ವಸ್ತುಗಳು — ಇಂದೇ ಆರ್ಡರ್", itemsOrderSoon: "ವಸ್ತುಗಳು — ಶೀಘ್ರ ಆರ್ಡರ್", itemsAllGood: "ವಸ್ತುಗಳು — ಎಲ್ಲ ಸರಿ", saveThisWeek: "ಈ ವಾರ ಉಳಿಸಿ", home: "ಮನೆ", products: "ವಸ್ತುಗಳು", sales: "ಮಾರಾಟ", todo: "ಕೆಲಸ", todaysOrderList: "ಇಂದಿನ ಆರ್ಡರ್ ಪಟ್ಟಿ", daysOfStockLeft: "ದಿನಗಳ ಸ್ಟಾಕ್ ಉಳಿದಿದೆ", urgentItems: "ತುರ್ತು ವಸ್ತುಗಳು", orderNow: "ಈಗಲೇ ಆರ್ಡರ್", markDone: "ಆಗಿದೆ ✓", remindTomorrow: "ನಾಳೆ ನೆನಪಿಸಿ", sendWhatsApp: "WhatsApp ಆರ್ಡರ್", installNow: "ಇನ್ಸ್ಟಾಲ್", later: "ನಂತರ", close: "ಮುಚ್ಚಿ", done: "ಆಯಿತು", allItemsInShop: "ನನ್ನ ಅಂಗಡಿಯ ಎಲ್ಲ ವಸ್ತುಗಳು", searchProducts: "ವಸ್ತುಗಳನ್ನು ಹುಡುಕಿ...", allItems: "ಎಲ್ಲ ವಸ್ತುಗಳು", days: "ದಿನ", units: "ಯೂನಿಟ್", minStock: "ಕನಿಷ್ಠ ಸ್ಟಾಕ್", bestOrderQty: "ಉತ್ತಮ ಆರ್ಡರ್ ಪ್ರಮಾಣ", orderWhenReaches: "ಇಷ್ಟು ಆಗಲಿ ಆರ್ಡರ್", supplierDeliversIn: "ಸರಬರಾಜುದಾರ ತಲುಪಿಸುವರು", howShopDoing: "ಅಂಗಡಿ ಹೇಗೆ ನಡೆಯುತ್ತಿದೆ", last7DaysSales: "ಈ ವಾರ ಮಾರಾಟ", salesSubtitle: "ಪ್ರತಿ ದಿನ ಎಷ್ಟು ಬಿಕ್ಕಿತು", bestDay: "ಅತ್ಯುತ್ತಮ ದಿನ", totalThisWeek: "ಈ ವಾರ ಒಟ್ಟು", expectedNextWeek: "ಮುಂದಿನ ವಾರ ಅಂದಾಜು", bestSellers: "ಹೆಚ್ಚು ಮಾರಾಟ", bestSellersSubtitle: "ಈ ವಾರ ವೇಗವಾಗಿ ಮಾರಾಟ", soldThisWeek: "ಮಾರಾಟ/ವಾರ", mostImportantItems: "ನಿಮ್ಮ ಪ್ರಮುಖ ವಸ್ತುಗಳು", aItemsTitle: "ಅಮೂಲ್ಯ — ಪ್ರತಿ ದಿನ ನೋಡಿ", aItemsDesc: "ಈ ವಸ್ತುಗಳು = ನಿಮ್ಮ 60% ಹಣ", bItemsTitle: "ಮಧ್ಯಮ — ವಾರದಲ್ಲಿ ನೋಡಿ", bItemsDesc: "ಈ ವಸ್ತುಗಳು = ನಿಮ್ಮ 30% ಹಣ", cItemsTitle: "ಚಿಕ್ಕ — ತಿಂಗಳಿಗೊಮ್ಮೆ", cItemsDesc: "ಪ್ರತಿ ದಿನ ಚಿಂತಿಸಬೇಡಿ", shopHealth: "ಅಂಗಡಿಯ ಆರೋಗ್ಯ", shopHealthSubtitle: "ಇಂದು ಸ್ಟಾಕ್ ಹೇಗಿದೆ", totalItems: "ಒಟ್ಟು ವಸ್ತುಗಳು", todoTitle: "ಇಂದು ಏನು ಮಾಡಬೇಕು", noAlerts: "ಇಂದು ಎಲ್ಲ ಸರಿ!", noAlertsSubtitle: "ಒಳ್ಳೆಯ ದಿನ ಕಳೆಯಿರಿ.", savesYou: "ಉಳಿತಾಯ", orderBefore: "ಮೊದಲು ಆರ್ಡರ್", onlyXDaysLeft: "ಕೇವಲ", daysLeftAlert: "ದಿನ ಉಳಿದಿದೆ!", scanAndSell: "ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಮಾರಿ", endOfDayCount: "ದಿನಾಂತ ಎಣಿಕೆ", cashSale: "ನಗದು ಮಾರಾಟ", countYourShelves: "ಕಪಾಟು ಎಣಿಸಿ", howManyNow: "ಈಗ ಎಷ್ಟಿದೆ?", youCountedWeDid: "ನೀವು ಎಣಿಸಿದಿರಿ. ನಾವು ಲೆಕ್ಕ ಹಾಕಿದೆವು!", recordSale: "ಮಾರಾಟ ದಾಖಲಿಸಿ", scanDesc: "ತಕ್ಷಣ ಮಾರಲು ಟ್ಯಾಪ್ ಮಾಡಿ", countDesc: "ಕಪಾಟು ಎಣಿಸಿ, ನಾವು ಲೆಕ್ಕ ಹಾಕುತ್ತೇವೆ", cashDesc: "₹ ಮೊತ್ತ ನಮೂದಿಸಿ ವಸ್ತು ಹುಡುಕಿ", whichDidYouSell: "ಏನು ಮಾರಿದಿರಿ?", sold: "ಮಾರಿದೆ", chooseLanguage: "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ", festivalComing: "ಹಬ್ಬ ಬರುತ್ತಿದೆ!", lastYearRanOut: "ಕಳೆದ ವರ್ಷ ಖಾಲಿಯಾಗಿತ್ತು! ಈಗಲೇ ಸ್ಟಾಕ್ ಮಾಡಿ.", noInternet: "📵 ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ — ಹಳೆಯ ಮಾಹಿತಿ", backOnline: "✅ ಇಂಟರ್ನೆಟ್ ಬಂತು — ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...", installTitle: "📲 RetailAI ಫೋನ್ನಲ್ಲಿ ಇನ್ಸ್ಟಾಲ್ ಮಾಡಿ!", critical: "ಜರೂರಿ", orderSoonLabel: "ಶೀಘ್ರ ಆರ್ಡರ್", allGood: "ಎಲ್ಲ ಸರಿ", tooMuch: "ಹೆಚ್ಚು", was: "ಮೊದಲು", };
const ta = { ...en, appName: "ரீடெய்ல்AI", goodMorning: "காலை வணக்கம்", goodAfternoon: "மதிய வணக்கம்", goodEvening: "மாலை வணக்கம்", shopkeeperKnows: "🧠 கடைக்காரர் தன் கடையை அறிவார்.", weKnowFuture: "RetailAI எதிர்காலத்தை அறியும்.", orderToday: "இன்றே ஆர்டர்", orderSoon: "விரைவில் ஆர்டர்", stockGood: "இருப்பு நல்லது", tooMuchStock: "அதிக இருப்பு", home: "முகப்பு", products: "பொருட்கள்", sales: "விற்பனை", todo: "செய்ய வேண்டியவை", todaysOrderList: "இன்றைய ஆர்டர் பட்டியல்", daysOfStockLeft: "நாட்கள் இருப்பு", urgentItems: "அவசர பொருட்கள்", orderNow: "இப்போதே ஆர்டர்", markDone: "முடிந்தது ✓", sendWhatsApp: "WhatsApp ஆர்டர்", allItemsInShop: "என் கடையின் அனைத்து பொருட்கள்", searchProducts: "பொருட்களை தேடுங்கள்...", allItems: "அனைத்து", days: "நாட்கள்", units: "யூனிட்", howShopDoing: "கடை எப்படி நடக்கிறது", last7DaysSales: "இந்த வார விற்பனை", bestDay: "சிறந்த நாள்", totalThisWeek: "இந்த வாரம் மொத்தம்", expectedNextWeek: "அடுத்த வார எதிர்பார்ப்பு", bestSellers: "அதிக விற்பனை", shopHealth: "கடை ஆரோக்கியம்", totalItems: "மொத்த பொருட்கள்", todoTitle: "இன்று என்ன செய்ய வேண்டும்", noAlerts: "இன்று எல்லாம் சரி!", savesYou: "சேமிப்பு", chooseLanguage: "மொழி தேர்வு", recordSale: "விற்பனை பதிவு", sold: "விற்றது", noInternet: "📵 இணையம் இல்லை", backOnline: "✅ இணையம் வந்தது", installTitle: "📲 RetailAI போனில் நிறுவுங்கள்!", later: "பின்னர்", close: "மூடு", };
const te = { ...en, appName: "రిటేల్AI", goodMorning: "శుభోదయం", goodAfternoon: "నమస్కారం", goodEvening: "శుభ సాయంత్రం", shopkeeperKnows: "🧠 దుకాణదారుడు తన దుకాణం తెలుసు.", weKnowFuture: "RetailAI భవిష్యత్తు తెలుసు.", orderToday: "ఈరోజే ఆర్డర్", orderSoon: "త్వరలో ఆర్డర్", stockGood: "స్టాక్ బాగుంది", tooMuchStock: "చాలా స్టాక్", home: "హోమ్", products: "వస్తువులు", sales: "అమ్మకాలు", todo: "చేయాల్సినవి", todaysOrderList: "ఈరోజు ఆర్డర్ జాబితా", daysOfStockLeft: "రోజుల స్టాక్ మిగిలింది", urgentItems: "అత్యవసర వస్తువులు", orderNow: "ఇప్పుడే ఆర్డర్", markDone: "అయిపోయింది ✓", sendWhatsApp: "WhatsApp ఆర్డర్", allItemsInShop: "నా షాపులో అన్ని వస్తువులు", searchProducts: "వస్తువులు వెతకండి...", allItems: "అన్నీ", days: "రోజులు", units: "యూనిట్", howShopDoing: "షాపు ఎలా నడుస్తోంది", bestDay: "అత్యుత్తమ రోజు", totalThisWeek: "ఈ వారం మొత్తం", expectedNextWeek: "వచ్చే వారం అంచనా", shopHealth: "షాపు ఆరోగ్యం", totalItems: "మొత్తం వస్తువులు", todoTitle: "ఈరోజు ఏం చేయాలి", noAlerts: "ఈరోజు అంతా బాగుంది!", savesYou: "ఆదా", chooseLanguage: "భాష ఎంచుకోండి", recordSale: "అమ్మకం నమోదు", sold: "అమ్మారు", noInternet: "📵 ఇంటర్నెట్ లేదు", backOnline: "✅ ఇంటర్నెట్ వచ్చింది", later: "తర్వాత", close: "మూసివేయండి", };
const ml = { ...en, appName: "റീടെയ്ൽAI", goodMorning: "സുപ്രഭാതം", goodAfternoon: "ശുഭ ഉച്ച", goodEvening: "ശുഭ സന്ധ്യ", shopkeeperKnows: "🧠 കടക്കാരൻ തന്റെ കട അറിയും.", weKnowFuture: "RetailAI ഭാവി അറിയും.", orderToday: "ഇന്ന് ഓർഡർ", orderSoon: "ഉടൻ ഓർഡർ", stockGood: "സ്റ്റോക്ക് നല്ലത്", tooMuchStock: "സ്റ്റോക്ക് കൂടുതൽ", home: "ഹോം", products: "സാധനങ്ങൾ", sales: "വിൽപ്പന", todo: "ചെയ്യാനുള്ളവ", todaysOrderList: "ഇന്നത്തെ ഓർഡർ ലിസ്റ്റ്", daysOfStockLeft: "ദിവസത്തെ സ്റ്റോക്ക്", urgentItems: "അടിയന്തിര സാധനങ്ങൾ", orderNow: "ഇപ്പോൾ ഓർഡർ", markDone: "കഴിഞ്ഞു ✓", sendWhatsApp: "WhatsApp ഓർഡർ", allItemsInShop: "എന്റെ കടയിലെ എല്ലാ സാധനങ്ങൾ", searchProducts: "സാധനങ്ങൾ തിരയൂ...", allItems: "എല്ലാം", days: "ദിവസം", units: "യൂണിറ്റ്", howShopDoing: "കട എങ്ങനെ നടക്കുന്നു", bestDay: "ഏറ്റവും നല്ല ദിവസം", totalThisWeek: "ഈ ആഴ്ച ആകെ", expectedNextWeek: "അടുത്ത ആഴ്ച പ്രതീക്ഷ", shopHealth: "കടയുടെ ആരോഗ്യം", totalItems: "ആകെ സാധനങ്ങൾ", todoTitle: "ഇന്ന് എന്ത് ചെയ്യണം", noAlerts: "ഇന്ന് എല്ലാം ശരി!", savesYou: "ലാഭം", chooseLanguage: "ഭാഷ തിരഞ്ഞെടുക്കൂ", recordSale: "വിൽപ്പന രേഖപ്പെടുത്തൂ", sold: "വിറ്റു", noInternet: "📵 ഇന്റർനെറ്റ് ഇല്ല", backOnline: "✅ ഇന്റർനെറ്റ് വന്നു", later: "പിന്നീട്", close: "അടയ്ക്കുക", };
const mr = { ...en, appName: "रिटेलAI", goodMorning: "सुप्रभात", goodAfternoon: "नमस्कार", goodEvening: "शुभ संध्याकाळ", shopkeeperKnows: "🧠 दुकानदार आपले दुकान ओळखतो.", weKnowFuture: "RetailAI भविष्य ओळखतो.", orderToday: "आजच ऑर्डर करा", orderSoon: "लवकर ऑर्डर", stockGood: "साठा चांगला", tooMuchStock: "साठा खूप जास्त", home: "मुख्यपृष्ठ", products: "वस्तू", sales: "विक्री", todo: "कामे", todaysOrderList: "आजची ऑर्डर यादी", daysOfStockLeft: "दिवसांचा साठा शिल्लक", urgentItems: "तातडीच्या वस्तू", orderNow: "आत्ता ऑर्डर", markDone: "झाले ✓", sendWhatsApp: "WhatsApp ऑर्डर", allItemsInShop: "माझ्या दुकानातील सर्व वस्तू", searchProducts: "वस्तू शोधा...", allItems: "सर्व वस्तू", days: "दिवस", units: "युनिट", howShopDoing: "दुकान कशी चालली आहे", bestDay: "सर्वोत्तम दिवस", totalThisWeek: "या आठवड्यात एकूण", shopHealth: "दुकानाचे आरोग्य", totalItems: "एकूण वस्तू", todoTitle: "आज काय करायचे", noAlerts: "आज सगळं ठीक!", savesYou: "बचत", chooseLanguage: "भाषा निवडा", recordSale: "विक्री नोंदवा", sold: "विकले", noInternet: "📵 इंटरनेट नाही", backOnline: "✅ इंटरनेट आले", later: "नंतर", close: "बंद करा", };
const gu = { ...en, appName: "રિટેઇલAI", goodMorning: "સુપ્રભાત", goodAfternoon: "નમસ્કાર", goodEvening: "શુભ સાંજ", shopkeeperKnows: "🧠 દુકાનદાર પોતાની દુકાન જાણે છે.", weKnowFuture: "RetailAI ભવિષ્ય જાણે છે.", orderToday: "આજે જ ઓર્ડર", orderSoon: "જલ્દી ઓર્ડર", stockGood: "સ્ટોક સારો", tooMuchStock: "ઘણો સ્ટોક", home: "હોમ", products: "વસ્તુઓ", sales: "વેચાણ", todo: "કામ", todaysOrderList: "આજની ઓર્ડર યાદી", daysOfStockLeft: "દિવસોનો સ્ટોક", urgentItems: "તાકીદની વસ્તુઓ", orderNow: "હમણાં ઓર્ડર", markDone: "થઈ ગયું ✓", sendWhatsApp: "WhatsApp ઓર્ડર", allItemsInShop: "મારી દુકાનની બધી વસ્તુઓ", searchProducts: "વસ્તુઓ શોધો...", allItems: "બધી", days: "દિવસ", units: "યુનિટ", howShopDoing: "દુકાન કેવી ચાલે છે", bestDay: "શ્રેષ્ઠ દિવસ", totalThisWeek: "આ અઠવાડિયે કુલ", shopHealth: "દુકાનનું આરોગ્ય", totalItems: "કુલ વસ્તુઓ", todoTitle: "આજે શું કરવાનું", noAlerts: "આજે બધું સારું!", savesYou: "બચત", chooseLanguage: "ભાષા પસંદ કરો", recordSale: "વેચાણ નોંધો", sold: "વેચ્યું", noInternet: "📵 ઇન્ટરનેટ નથી", backOnline: "✅ ઇન્ટરનેટ આવ્યું", later: "પછી", close: "બંધ", };
const pa = { ...en, appName: "ਰਿਟੇਲAI", goodMorning: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", goodAfternoon: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", goodEvening: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", orderToday: "ਅੱਜ ਹੀ ਆਰਡਰ", orderSoon: "ਜਲਦੀ ਆਰਡਰ", stockGood: "ਸਟਾਕ ਠੀਕ", tooMuchStock: "ਬਹੁਤ ਸਟਾਕ", home: "ਹੋਮ", products: "ਸਮਾਨ", sales: "ਵਿਕਰੀ", todo: "ਕੰਮ", orderNow: "ਹੁਣੇ ਆਰਡਰ", markDone: "ਹੋ ਗਿਆ ✓", allItemsInShop: "ਮੇਰੀ ਦੁਕਾਨ ਦਾ ਸਾਰਾ ਸਮਾਨ", searchProducts: "ਸਮਾਨ ਲੱਭੋ...", allItems: "ਸਾਰਾ", days: "ਦਿਨ", units: "ਯੂਨਿਟ", bestDay: "ਸਭ ਤੋਂ ਵਧੀਆ ਦਿਨ", totalThisWeek: "ਇਸ ਹਫ਼ਤੇ ਕੁੱਲ", shopHealth: "ਦੁਕਾਨ ਦੀ ਸਿਹਤ", totalItems: "ਕੁੱਲ ਸਮਾਨ", todoTitle: "ਅੱਜ ਕੀ ਕਰਨਾ ਹੈ", noAlerts: "ਅੱਜ ਸਭ ਠੀਕ!", savesYou: "ਬੱਚਤ", chooseLanguage: "ਭਾਸ਼ਾ ਚੁਣੋ", sold: "ਵੇਚਿਆ", noInternet: "📵 ਇੰਟਰਨੈੱਟ ਨਹੀਂ", backOnline: "✅ ਇੰਟਰਨੈੱਟ ਆ ਗਿਆ", later: "ਬਾਅਦ ਵਿੱਚ", close: "ਬੰਦ", };
const bn = { ...en, appName: "রিটেলAI", goodMorning: "শুভ সকাল", goodAfternoon: "নমস্কার", goodEvening: "শুভ সন্ধ্যা", orderToday: "আজই অর্ডার", orderSoon: "শীঘ্রই অর্ডার", stockGood: "স্টক ভালো", tooMuchStock: "অনেক স্টক", home: "হোম", products: "পণ্য", sales: "বিক্রয়", todo: "করণীয়", orderNow: "এখনই অর্ডার", markDone: "হয়ে গেছে ✓", allItemsInShop: "আমার দোকানের সব পণ্য", searchProducts: "পণ্য খুঁজুন...", allItems: "সব", days: "দিন", units: "ইউনিট", bestDay: "সেরা দিন", totalThisWeek: "এই সপ্তাহে মোট", shopHealth: "দোকানের স্বাস্থ্য", totalItems: "মোট পণ্য", todoTitle: "আজ কী করতে হবে", noAlerts: "আজ সব ঠিক!", savesYou: "সাশ্রয়", chooseLanguage: "ভাষা বেছে নিন", sold: "বিক্রি", noInternet: "📵 ইন্টারনেট নেই", backOnline: "✅ ইন্টারনেট এসেছে", later: "পরে", close: "বন্ধ", };
const or_ = { ...en, appName: "ରିଟେଲAI", goodMorning: "ସୁପ୍ରଭାତ", orderToday: "ଆଜି ଅର୍ଡର", stockGood: "ଷ୍ଟକ ଭଲ", home: "ହୋମ", products: "ଜିନିଷ", sales: "ବିକ୍ରୀ", todo: "କାମ", orderNow: "ଏବେ ଅର୍ଡର", markDone: "ହୋଇଗଲା ✓", allItems: "ସବୁ", days: "ଦିନ", units: "ୟୁନିଟ", chooseLanguage: "ଭାଷା ବାଛନ୍ତୁ", sold: "ବିକ୍ରି", later: "ପରେ", close: "ବନ୍ଦ", };
const as_ = { ...en, appName: "ৰিটেইলAI", goodMorning: "সুপ্ৰভাত", orderToday: "আজিয়ে অৰ্ডাৰ", home: "হোম", products: "সামগ্ৰী", sales: "বিক্ৰী", todo: "কাম", markDone: "হৈ গ'ল ✓", allItems: "সকলো", chooseLanguage: "ভাষা বাছনি", sold: "বিক্ৰী", later: "পিছত", close: "বন্ধ", };
const ur = { ...en, appName: "ریٹیلAI", goodMorning: "السلام علیکم", goodAfternoon: "السلام علیکم", goodEvening: "السلام علیکم", shopkeeperKnows: "🧠 دکاندار اپنی دکان جانتا ہے۔", weKnowFuture: "RetailAI مستقبل جانتا ہے۔", orderToday: "آج آرڈر کریں", orderSoon: "جلد آرڈر", stockGood: "اسٹاک ٹھیک", tooMuchStock: "بہت زیادہ اسٹاک", home: "ہوم", products: "اشیاء", sales: "فروخت", todo: "کام", orderNow: "ابھی آرڈر", markDone: "ہو گیا ✓", allItemsInShop: "میری دکان کی تمام اشیاء", searchProducts: "اشیاء تلاش کریں...", allItems: "تمام", days: "دن", units: "یونٹ", bestDay: "بہترین دن", totalThisWeek: "اس ہفتے کل", shopHealth: "دکان کی صحت", totalItems: "کل اشیاء", todoTitle: "آج کیا کرنا ہے", noAlerts: "آج سب ٹھیک!", savesYou: "بچت", chooseLanguage: "زبان منتخب کریں", sold: "بیچا", noInternet: "📵 انٹرنیٹ نہیں", backOnline: "✅ انٹرنیٹ آ گیا", sendWhatsApp: "واٹس ایپ آرڈر", later: "بعد میں", close: "بند", installTitle: "📲 RetailAI فون میں انسٹال کریں!", };
const ne = { ...en, appName: "रिटेलAI", goodMorning: "शुभ प्रभात", orderToday: "आज नै अर्डर", home: "गृह", products: "सामान", sales: "बिक्री", todo: "काम", markDone: "भयो ✓", allItems: "सबै", chooseLanguage: "भाषा छान्नुहोस्", sold: "बेच्यो", later: "पछि", close: "बन्द", };
const mai = { ...en, appName: "रिटेलAI", goodMorning: "सुप्रभात", orderToday: "आइये ऑर्डर", home: "घर", products: "सामान", markDone: "भ गेल ✓", chooseLanguage: "भाषा चुनू", sold: "बेचल", };
const sa = { ...en, appName: "रिटेलAI", goodMorning: "सुप्रभातम्", orderToday: "अद्य आदिशतु", home: "गृहम्", products: "वस्तूनि", markDone: "सम्पन्नम् ✓", chooseLanguage: "भाषां चिनोतु", };
const kok = { ...en, appName: "रिटेलAI", goodMorning: "सुप्रभात", orderToday: "आयजच ऑर्डर", home: "घर", products: "सामान", markDone: "जालें ✓", chooseLanguage: "भास निवडात", };
const sd = { ...en, appName: "ريٽيلAI", goodMorning: "صبح جو سلام", orderToday: "اڄ آرڊر", home: "گهر", products: "شيون", markDone: "ٿي ويو ✓", chooseLanguage: "ٻولي چونڊيو", };
const ks = { ...en, appName: "ریٹیلAI", goodMorning: "صبح بخیر", orderToday: "اَز آرڈر", home: "گَر", products: "شَے", markDone: "ہوگَو ✓", chooseLanguage: "زبان چُنِو", };
const doi = { ...en, appName: "रिटेलAI", goodMorning: "सुप्रभात", orderToday: "अज्ज ही ऑर्डर", home: "घर", products: "सामान", markDone: "होई गेआ ✓", chooseLanguage: "भाशा चुनो", };
const mni = { ...en, appName: "রিটেলAI", goodMorning: "নুংশিৎ য়াইফবা", orderToday: "ঙসি ওর্দর", home: "য়ুম", products: "পোৎ", markDone: "লোইরে ✓", chooseLanguage: "লোন খনবিয়ু", };
const brx = { ...en, appName: "रिटेलAI", goodMorning: "सुप्रभात", orderToday: "दिनै अर्डार", home: "नोजोर", products: "बेफोर", markDone: "जादों ✓", chooseLanguage: "रावखौ सायख", };

export const translations = { en, hi, kn, ta, te, ml, mr, gu, pa, bn, or: or_, as: as_, ur, ne, mai, sa, kok, sd, ks, doi, mni, brx };
