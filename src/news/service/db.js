const mysql = require('mysql2');

// 필수 환경 변수 목록
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT'];

// 환경 변수 누락 검사
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        console.warn(`ENV "${key}" not found`);
    }
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

pool.on('error', (err) => {
    console.error('❌ MySQL Pool Error:', err.message);
});

// 연결 테스트 함수 (서버 시작 시 호출 가능)
async function testConnection() {
    try {
        const conn = await pool.promise().getConnection();
        console.log('[*] DB Connection Success');
        conn.release();
    } catch (err) {
        console.error('[X] DB Connection Fail', err.message);
    }
}

module.exports = {
    db: pool.promise(),
    testConnection
};