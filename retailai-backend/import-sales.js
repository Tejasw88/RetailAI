// Import Sales Report: Updates inventory + generates sales history + forecasts + alerts
// Usage: node import-sales.js

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// ── Sales report CSV parsed as objects ────────────────────────
const SALES_DATA = [
    { product: "24 Mantra Organic Sugar 500g", brand: "24 Mantra", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "24 Mantra Organic Toor Dal 500g", brand: "24 Mantra", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Aashirvaad Atta 5kg", brand: "Aashirvaad", category: "Staples", initial: 100, sold: 52, remaining: 48, demand: "High" },
    { product: "Aashirvaad Atta Whole Wheat 10kg", brand: "ITC", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Aashirvaad Atta Whole Wheat 5kg", brand: "ITC", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Aashirvaad Besan 500g", brand: "ITC", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Aashirvaad Salt 1kg", brand: "ITC", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Aashirvaad Select Sharbati Atta 5kg", brand: "ITC", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Aashirvaad Suji Rawa 500g", brand: "ITC", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Butter 100g", brand: "Amul", category: "Dairy", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Butter 500g", brand: "Amul", category: "Dairy", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Cheese Slices 200g", brand: "Amul", category: "Dairy", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Ghee 1 Litre", brand: "Amul", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Ghee 500ml", brand: "Amul", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Ice Cream Vanilla 500ml", brand: "Amul", category: "Dairy", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Kool Milk Chocolate 200ml", brand: "Amul", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Masti Dahi 400g", brand: "Amul", category: "Dairy", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Mithai Mate 400g", brand: "Amul", category: "Dairy", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Processed Cheese 400g", brand: "Amul", category: "Dairy", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Taaza Baby UHT Milk 200ml", brand: "Amul", category: "Baby", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Amul Taaza Toned Milk 500ml", brand: "Amul", category: "Dairy", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Appy Fizz Apple Drink 250ml", brand: "Parle Agro", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Ariel Matic Powder 1kg", brand: "P&G", category: "Household", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bailey Water 1L", brand: "Parle Agro", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Basmati Rice 5kg", brand: "Unknown", category: "Staples", initial: 100, sold: 88, remaining: 12, demand: "High" },
    { product: "Bingo Hashtag Achaari Murmura 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Hashtag Cheese Murmura 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Hashtag Masala Murmura 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Mad Angles Achaari Masti 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Mad Angles Achaari Masti 90g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Mad Angles Cheese 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Mad Angles Cheese 90g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Mad Angles Desi Beats 90g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Mad Angles Himachali Kahani 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Mad Angles Himachali Kahani 90g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Mad Angles Masaledar Tukda 90g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Mad Angles Party Pack 200g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Multipack Assorted 6pk", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo No Rulz Masala 36g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo No Rulz Masala 72g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo No Rulz Spicy Achari 36g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo No Rulz Spicy Achari 72g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Original Style Chilli 26g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Original Style Chilli 52g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Original Style Cream Onion 26g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Original Style Cream Onion 52g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Original Style Masala 26g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Original Style Masala 52g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Original Style Party Pack 200g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Original Style Salted 26g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Original Style Salted 52g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Star Cheese 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Star Masala 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tangles Achaari 50g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tangles Cheese 50g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tangles Original 50g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tedhe Medhe Chatpata 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tedhe Medhe Chatpata 60g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tedhe Medhe Masala 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tedhe Medhe Masala 60g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tedhe Medhe Noodle Chaap 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tedhe Medhe Noodle Chaap 60g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tedhe Medhe Party Pack 200g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tedhe Medhe Too Tedha 30g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Tedhe Medhe Too Tedha 60g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Yumitos Chilli Sprinkled 26g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Yumitos Chilli Sprinkled 52g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Yumitos International Style 26g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Yumitos International Style 52g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Yumitos Latin Style 26g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bingo Yumitos Latin Style 52g", brand: "ITC Bingo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bisleri Limonata 300ml", brand: "Bisleri", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bisleri Water 1L", brand: "Bisleri", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bisleri Water 500ml", brand: "Bisleri", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Bisleri Water 5L", brand: "Bisleri", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Brooke Bond Red Label Tea 1kg", brand: "HUL", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Brooke Bond Red Label Tea 250g", brand: "HUL", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Brooke Bond Red Label Tea 500g", brand: "HUL", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Cadbury 5 Star 40g", brand: "Cadbury", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Cadbury Bournvita 1kg", brand: "Cadbury", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Cadbury Bournvita 500g", brand: "Cadbury", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Cadbury Dairy Milk 36g", brand: "Cadbury", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Cadbury Dairy Milk 65g", brand: "Cadbury", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Cadbury Dairy Milk Silk 60g", brand: "Cadbury", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Cadbury Eclairs Candy 50pk", brand: "Cadbury", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Cadbury Gems 22g", brand: "Cadbury", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Catch Black Pepper Powder 50g", brand: "DS Foods", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Catch Turmeric Powder 100g", brand: "DS Foods", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Cello Gripper Ball Pen Blue", brand: "Cello", category: "Stationery", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Cinthol Soap 100g", brand: "Godrej", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Classmate Notebook 200 Pages", brand: "ITC", category: "Stationery", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Clinic Plus Shampoo 175ml", brand: "HUL", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Clinic Plus Shampoo 80ml", brand: "HUL", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Colgate 360 Toothbrush Medium", brand: "Colgate", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Colgate MaxFresh Toothpaste 150g", brand: "Colgate", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Colgate MaxFresh Toothpaste 300g", brand: "Colgate", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Colgate Strong Teeth 200g", brand: "Colgate", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Colgate Toothpaste", brand: "Colgate", category: "Personal Care", initial: 100, sold: 45, remaining: 55, demand: "High" },
    { product: "Colgate Total Toothpaste 120g", brand: "Colgate", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dabur Chyawanprash 500g", brand: "Dabur", category: "Health", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dabur Honey 1kg", brand: "Dabur", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dabur Honey 500g", brand: "Dabur", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dabur Lal Tail 50ml", brand: "Dabur", category: "Health", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dabur Pudin Hara 30ml", brand: "Dabur", category: "Health", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dabur Real Mango Juice 1L", brand: "Dabur", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dabur Real Orange Juice 1L", brand: "Dabur", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dabur Red Toothpaste 200g", brand: "Dabur", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dabur Vatika Hair Oil 300ml", brand: "Dabur", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dettol Antiseptic Liquid 100ml", brand: "Reckitt", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dettol First Aid Antiseptic 60ml", brand: "Reckitt", category: "Health", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dettol Original Handwash 200ml", brand: "Reckitt", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dettol Original Soap 125g", brand: "Reckitt", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dettol Soap 4 Pack 75g each", brand: "Reckitt", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dettol Soap 4pk", brand: "Reckitt", category: "Personal Care", initial: 100, sold: 27, remaining: 73, demand: "Low" },
    { product: "Dhara Mustard Oil 1L", brand: "Mother Dairy", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Doritos Nacho Cheese 70g", brand: "PepsiCo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Dove Beauty Bar 100g", brand: "HUL", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Everest Chicken Masala 100g", brand: "Everest", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Everest Garam Masala 100g", brand: "Everest", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Everest Pav Bhaji Masala 100g", brand: "Everest", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Ezee Liquid Detergent 500ml", brand: "Godrej", category: "Household", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Faber-Castell Eraser 2pk", brand: "Faber-Castell", category: "Stationery", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Fair & Lovely Cream 50g", brand: "HUL", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Fortune Biryani Special Basmati 5kg", brand: "Adani Wilmar", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Fortune Rozana Basmati Rice 5kg", brand: "Adani Wilmar", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Fortune Soyabean Oil 1L", brand: "Adani Wilmar", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Fortune Sunflower Oil 1L", brand: "Adani Wilmar", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Fortune Sunflower Oil 5L", brand: "Adani Wilmar", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Frooti Mango Drink 1L", brand: "Parle Agro", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Frooti Mango Drink 200ml", brand: "Parle Agro", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Gillette Mach3 Razor 1pc", brand: "P&G", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Godrej Expert Hair Colour 20g", brand: "Godrej", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Godrej No.1 Soap 100g", brand: "Godrej", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Goodknight Power Activ+ Refill", brand: "Godrej", category: "Household", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Hajmola Candy 100 pieces", brand: "Dabur", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Haldiram Aloo Bhujia 200g", brand: "Haldiram", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Haldiram Aloo Bhujia 400g", brand: "Haldiram", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Haldiram Bhujia Sev 200g", brand: "Haldiram", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Haldiram Mixture 200g", brand: "Haldiram", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Haldiram Moong Dal 200g", brand: "Haldiram", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Haldiram Namkeen", brand: "Haldiram", category: "Snacks", initial: 100, sold: 0, remaining: 100, demand: "Very Low" },
    { product: "Haldiram Navratan Mix 200g", brand: "Haldiram", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Haldiram Peanuts Masala 200g", brand: "Haldiram", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Haldiram Rasgulla 1kg", brand: "Haldiram", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Haldiram Soan Papdi 250g", brand: "Haldiram", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Harpic Power Plus 500ml", brand: "Reckitt", category: "Household", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Head & Shoulders Shampoo 180ml", brand: "P&G", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Hit Mosquito Spray 200ml", brand: "Godrej", category: "Household", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "India Gate Basmati Rice 1kg", brand: "KRBL", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "India Gate Basmati Rice 5kg", brand: "KRBL", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "India Gate Classic Basmati 5kg", brand: "KRBL", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Johnson Baby Powder 100g", brand: "J&J", category: "Baby", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Johnson Baby Shampoo 200ml", brand: "J&J", category: "Baby", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Kissan Mixed Fruit Jam 500g", brand: "HUL", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "KitKat 4 Finger Chocolate 41.5g", brand: "Nestle", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Knorr Tomato Soup 53g", brand: "HUL", category: "Instant Food", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Kurkure Chilli Chatka 90g", brand: "PepsiCo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Kurkure Masala Munch 90g", brand: "PepsiCo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Lays Classic Salted 26g", brand: "PepsiCo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Lays Classic Salted 52g", brand: "PepsiCo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Lays Cream & Onion 52g", brand: "PepsiCo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Lays Magic Masala 26g", brand: "PepsiCo", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Lifebuoy Soap 4 Pack 100g each", brand: "HUL", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Lifebuoy Total 10 Soap 100g", brand: "HUL", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Lipton Yellow Label Tea 250g", brand: "HUL", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Lizol Disinfectant 500ml", brand: "Reckitt", category: "Household", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Lux Beauty Soap 100g", brand: "HUL", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "MDH Chole Masala 100g", brand: "MDH", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "MDH Chunky Chat Masala 100g", brand: "MDH", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "MDH Garam Masala 100g", brand: "MDH", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "MDH Kitchen King 100g", brand: "MDH", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "MDH Rajma Masala 100g", brand: "MDH", category: "Cooking", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Maggi 2-Minute Noodles 12pk", brand: "Nestle", category: "Instant Food", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Maggi 2-Minute Noodles Masala 70g", brand: "Nestle", category: "Instant Food", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Maggi Masala Noodles 140g", brand: "Nestle", category: "Instant Food", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Maggi Noodles 12pk", brand: "Unknown", category: "Instant Food", initial: 100, sold: 8, remaining: 92, demand: "Low" },
    { product: "Mortein Mosquito Coil 10pk", brand: "Reckitt", category: "Household", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Mother Dairy Sugar 1kg", brand: "Mother Dairy", category: "Staples", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Munch Chocolate 35g", brand: "Nestle", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Munch Pop Choc 50g", brand: "Nestle", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Natraj HB Pencil 10pk", brand: "Natraj", category: "Stationery", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Nescafe 3-in-1 Sachet 25pk", brand: "Nestle", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Nescafe Classic Coffee 100g", brand: "Nestle", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Nescafe Classic Coffee 50g", brand: "Nestle", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Nestle Cerelac Rice 300g", brand: "Nestle", category: "Baby", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Nestle Milkmaid Condensed Milk 400g", brand: "Nestle", category: "Dairy", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Nestle Milo Drink Powder 400g", brand: "Nestle", category: "Beverages", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Nihar Shanti Amla Hair Oil 200ml", brand: "Marico", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Odomos Mosquito Repellent Cream 50g", brand: "Dabur", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Oral-B Toothbrush Soft", brand: "P&G", category: "Personal Care", initial: 100, sold: 100, remaining: 0, demand: "High" },
    { product: "Oreo Original Biscuits 120g", brand: "Cadbury", category: "Snacks", initial: 100, sold: 100, remaining: 0, demand: "High" },
    // Products not in sales report get default values
];

// Distribute total sold across 30 days with realistic variance
function distributeSales(totalSold, days = 30) {
    if (totalSold === 0) return new Array(days).fill(0);
    const avgDaily = totalSold / days;
    const dailySales = [];
    let remaining = totalSold;

    for (let i = 0; i < days - 1; i++) {
        // Add randomness: ±40% variance, weekend boost
        const dayOfWeek = (new Date().getDay() + i) % 7;
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0;
        const variance = 0.6 + Math.random() * 0.8; // 0.6x to 1.4x
        let daySales = Math.round(avgDaily * variance * weekendFactor);
        daySales = Math.max(0, Math.min(daySales, remaining));
        dailySales.push(daySales);
        remaining -= daySales;
    }
    dailySales.push(Math.max(0, remaining)); // Last day gets remainder
    return dailySales;
}

async function importSales() {
    try {
        const client = await pool.connect();
        console.log("✅ Connected to Neon PostgreSQL");

        // Clear old sales + forecast + alerts data
        await client.query("DELETE FROM sales_history");
        await client.query("DELETE FROM forecasts");
        await client.query("DELETE FROM alerts");
        console.log("🗑️  Cleared old sales_history, forecasts, alerts");

        let matched = 0, unmatched = 0, salesInserted = 0;

        for (const item of SALES_DATA) {
            // Find product by name (fuzzy match)
            const result = await client.query(
                `SELECT p.id, p.selling_price FROM products p WHERE LOWER(p.name) = LOWER($1) LIMIT 1`,
                [item.product]
            );

            let productId;
            let sellingPrice;

            if (result.rows.length) {
                productId = result.rows[0].id;
                sellingPrice = parseFloat(result.rows[0].selling_price);
                matched++;
            } else {
                // Try partial match
                const partial = await client.query(
                    `SELECT p.id, p.selling_price FROM products p WHERE LOWER(p.name) LIKE $1 LIMIT 1`,
                    [`%${item.product.toLowerCase().substring(0, 20)}%`]
                );
                if (partial.rows.length) {
                    productId = partial.rows[0].id;
                    sellingPrice = parseFloat(partial.rows[0].selling_price);
                    matched++;
                } else {
                    console.warn(`  ⚠️  No match for: ${item.product}`);
                    unmatched++;
                    continue;
                }
            }

            // Update inventory current_stock
            await client.query(
                `UPDATE inventory SET current_stock = $1, updated_at = NOW() WHERE product_id = $2`,
                [item.remaining, productId]
            );

            // Generate 30 days of sales_history
            const dailySales = distributeSales(item.sold);
            for (let day = 0; day < 30; day++) {
                if (dailySales[day] === 0) continue;
                const saleDate = new Date();
                saleDate.setDate(saleDate.getDate() - (30 - day));
                const dateStr = saleDate.toISOString().split('T')[0];
                const revenue = dailySales[day] * sellingPrice;

                await client.query(
                    `INSERT INTO sales_history (product_id, sale_date, units_sold, revenue)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (product_id, sale_date) DO UPDATE SET units_sold = $3, revenue = $4`,
                    [productId, dateStr, dailySales[day], revenue]
                );
                salesInserted++;
            }

            // Generate 7-day forecast based on demand
            const demandMultiplier = item.demand === "Very Low" ? 0.1 : item.demand === "Low" ? 0.5 : 1.0;
            const avgDaily = Math.round((item.sold / 30) * demandMultiplier) || 1;

            for (let day = 1; day <= 7; day++) {
                const forecastDate = new Date();
                forecastDate.setDate(forecastDate.getDate() + day);
                const dateStr = forecastDate.toISOString().split('T')[0];
                const predicted = Math.round(avgDaily * (0.8 + Math.random() * 0.4));
                const lower = Math.max(0, predicted - Math.round(avgDaily * 0.3));
                const upper = predicted + Math.round(avgDaily * 0.3);

                await client.query(
                    `INSERT INTO forecasts (product_id, forecast_date, predicted_units, lower_bound, upper_bound)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (product_id, forecast_date) DO UPDATE SET predicted_units = $3, lower_bound = $4, upper_bound = $5`,
                    [productId, dateStr, predicted, lower, upper]
                );
            }

            // Generate alert if stock is critical or low
            if (item.remaining === 0) {
                const savings = Math.round(avgDaily * 7 * sellingPrice);
                await client.query(
                    `INSERT INTO alerts (product_id, status, potential_savings, recommended_order, message)
           VALUES ($1, 'CRITICAL', $2, $3, $4)`,
                    [productId, savings, Math.round(avgDaily * 14),
                        `OUT OF STOCK — ${item.product}. ${item.sold} sold last month. Reorder ${Math.round(avgDaily * 14)} units immediately.`]
                );
            } else if (item.remaining < 20) {
                const savings = Math.round(avgDaily * 5 * sellingPrice);
                await client.query(
                    `INSERT INTO alerts (product_id, status, potential_savings, recommended_order, message)
           VALUES ($1, 'LOW', $2, $3, $4)`,
                    [productId, savings, Math.round(avgDaily * 14),
                        `LOW STOCK — ${item.product}. Only ${item.remaining} left. Reorder soon.`]
                );
            } else if (item.remaining >= 90 && item.sold < 10) {
                await client.query(
                    `INSERT INTO alerts (product_id, status, potential_savings, recommended_order, message)
           VALUES ($1, 'OVERSTOCK', $2, 0, $3)`,
                    [productId, Math.round(item.remaining * sellingPrice * 0.1),
                        `OVERSTOCK — ${item.product}. ${item.remaining} units, only ${item.sold} sold. Consider discounts.`]
                );
            }
        }

        console.log(`\n🎉 Import complete!`);
        console.log(`   ✅ Matched: ${matched} products`);
        console.log(`   ⚠️  Unmatched: ${unmatched} products`);
        console.log(`   📊 Sales records: ${salesInserted}`);
        console.log(`   📆 Forecasts: ${matched * 7}`);

        client.release();
    } catch (err) {
        console.error("❌ Import failed:", err.message);
    } finally {
        await pool.end();
    }
}

importSales();
