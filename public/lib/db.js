const mysql = require("mysql");

const mysqlConnection = mysql.createConnection({
const mysqlConnection = mysql.createPool({
    host:'us-cdbr-east-03.cleardb.com',
    user:'bf0341eb7f4f7d',
    password:'8a18f453',
    database:'heroku_e846e0cbb8faabc',
  })

mysqlConnection.connect(function(error){
	if(!!error) {
		console.log(error);
	} else {
		console.log('Database connected!');
	}
});
module.exports = mysqlConnection; 