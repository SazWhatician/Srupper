const{Pool} = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'swarupper_db',
    password: 'root123',
    port: 5432,
});




module.exports = {
    query: (text, params)=> pool.query(text, params),
};