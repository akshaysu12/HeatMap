var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'root',
  password        : 'sqlpassword',
  database        : 'league'
});

module.exports.pool = pool;
