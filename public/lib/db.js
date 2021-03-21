const mysql = require("mysql");

const mysqlConnection = mysql.createPool({
    host:'us-cdbr-east-03.cleardb.com',
    user:'bd90389038c837',
    password:'8f816f80',
    database:'heroku_09a0187dc7dd1e7',
  })

module.exports = mysqlConnection;