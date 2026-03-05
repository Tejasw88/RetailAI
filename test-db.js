require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const p = await pool.query('SELECT COUNT(*) FROM products');
        const b = await pool.query('SELECT COUNT(*) FROM barcode_products');
        console.log('Products:', p.rows[0].count, 'Barcode Products:', b.rows[0].count);

        // Also show the data from barcode_products
        const bData = await pool.query('SELECT * FROM barcode_products');
        console.log('Barcode Products Data:', bData.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
