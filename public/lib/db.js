const mysql = require("mysql");

const mysqlConnection = mysql.createConnection({
    host:'us-cdbr-east-03.cleardb.com',
    user:'bd90389038c837',
    password:'8f816f80',
    database:'heroku_09a0187dc7dd1e7',
  })

mysqlConnection.connect(function(error){
	if(!!error) {
		console.log(error);
	} else {
		console.log('Database connected!');
	}
});
module.exports = mysqlConnection;