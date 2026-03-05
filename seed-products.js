// Seed script: Insert all Indian products into Neon PostgreSQL
// Usage: node seed-products.js

require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Read and parse the indianProducts.js file
function loadProducts() {
    const filePath = path.join(__dirname, "..", "retailai-frontend", "src", "data", "indianProducts.js");
    let content = fs.readFileSync(filePath, "utf-8");

    // Strip 'export const INDIAN_PRODUCTS_DB = ' and trailing ';'
    content = content
        .replace(/export\s+const\s+INDIAN_PRODUCTS_DB\s*=\s*/, "")
        .replace(/;\s*$/, "")
        .replace(/\/\/.*$/gm, ""); // Remove single-line comments

    // Convert JS object to JSON (add quotes around keys)
    content = content.replace(/(\s)(\w+):/g, '$1"$2":');

    // The file uses single-quotes and template-style — normalize
    // Actually, the keys are already quoted strings like "8901719110069"
    // and values use unquoted property names like name:, brand:, etc.
    // Let's use a simpler eval approach

    // Actually, let's just use a Function constructor (safe since we control the file)
    const moduleContent = fs.readFileSync(filePath, "utf-8");
    const wrapped = moduleContent
        .replace("export const INDIAN_PRODUCTS_DB =", "const INDIAN_PRODUCTS_DB =")
        + "\nmodule.exports = INDIAN_PRODUCTS_DB;";

    const tmpFile = path.join(__dirname, "_tmp_products.js");
    fs.writeFileSync(tmpFile, wrapped);
    const products = require(tmpFile);
    fs.unlinkSync(tmpFile);

    return products;
}

async function seed() {
    try {
        await pool.connect();
        console.log("✅ Connected to Neon PostgreSQL");

        // Ensure columns exist
        await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50)`);
        await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100)`);
        await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS emoji VARCHAR(10)`);
        await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp NUMERIC(10,2)`);

        const products = loadProducts();
        const entries = Object.entries(products);
        console.log(`📦 Found ${entries.length} products to seed`);

        // Get the current max product ID number
        const maxId = await pool.query(`SELECT id FROM products ORDER BY id DESC LIMIT 1`);
        let nextNum = 1;
        if (maxId.rows.length) {
            const num = parseInt(maxId.rows[0].id.replace(/\D/g, ''));
            nextNum = num + 1;
        }

        let inserted = 0;
        let skipped = 0;

        for (const [barcode, product] of entries) {
            // Check if product with this barcode already exists
            const existing = await pool.query(`SELECT id FROM products WHERE barcode = $1`, [barcode]);
            if (existing.rows.length > 0) {
                // Update existing product with new fields
                await pool.query(
                    `UPDATE products SET brand = $1, emoji = $2, mrp = $3 WHERE barcode = $4`,
                    [product.brand || null, product.emoji || '📦', product.mrp || null, barcode]
                );
                skipped++;
                continue;
            }

            const productId = `P${String(nextNum).padStart(3, '0')}`;
            const unitCost = product.mrp ? Math.round(product.mrp * 0.8) : 0;
            const sellingPrice = product.mrp || 0;

            await pool.query(
                `INSERT INTO products (id, name, category, barcode, unit_cost, selling_price, brand, emoji, mrp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [productId, product.name, product.category, barcode, unitCost, sellingPrice, product.brand || null, product.emoji || '📦', product.mrp || null]
            );

            // Create inventory entry with default values
            const eoq = Math.max(50, Math.round(Math.sqrt((2 * 365 * 30 * unitCost) / (unitCost * 0.25 || 1))));
            const safety = Math.max(5, Math.round(eoq * 0.15));
            const reorder = Math.round(safety + 150); // avg_daily approx * lead_time

            await pool.query(
                `INSERT INTO inventory (product_id, current_stock, safety_stock, reorder_point, eoq, lead_time_days)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [productId, 0, safety, reorder, eoq, 5]
            );

            nextNum++;
            inserted++;

            if (inserted % 50 === 0) {
                console.log(`  ✅ Inserted ${inserted} products...`);
            }
        }

        console.log(`\n🎉 Seeding complete!`);
        console.log(`   ✅ Inserted: ${inserted} new products`);
        console.log(`   🔄 Updated: ${skipped} existing products`);
        console.log(`   📦 Total in DB: ${inserted + skipped}`);

    } catch (err) {
        console.error("❌ Seed failed:", err.message);
    } finally {
        await pool.end();
    }
}

seed();
