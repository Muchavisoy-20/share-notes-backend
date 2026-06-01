require('dotenv').config();
const mysql = require('mysql2/promise');
async function test() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sharenotes'
  });
  const [rows] = await conn.query('SELECT id, name, email FROM users');
  console.table(rows);
  conn.end();
}
test();
