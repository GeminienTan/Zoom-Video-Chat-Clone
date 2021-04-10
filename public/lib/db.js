const mysql = require("mysql");

const mysqlConnection = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'video_conferencing',
    multipleStatements: true
  
  })

mysqlConnection.connect(function(error){
	if(!!error) {
		console.log(error);
	} else {
		console.log('Database connected');
	}
});

module.exports = mysqlConnection;