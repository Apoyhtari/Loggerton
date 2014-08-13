var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var file = "log.db";
var exists = fs.existsSync(file);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);
var path = require('path');
var selectedDb = "logmessages";
app.get('/', function(req, res){
  res.sendfile('index.html');
});

app.use("/css", express.static(__dirname + '/css'));

db.serialize(function(){
	if(!exists) {
		db.run("CREATE TABLE " + selectedDb +"(info TEXT)");
		console.log('no database exists, creating a new one');
	}

});
io.on('connection', function(socket){
console.log('user connected, inputting older messages');
db.each('SELECT rowid AS id, info FROM ' + selectedDb , function(err, row){
		io.emit('chat message', row.info);
});
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
var stmt = db.prepare('INSERT INTO '+ selectedDb +' VALUES(?)');
stmt.run(msg);
stmt.finalize();
console.log('entry added to database');
	
  });
  socket.on('select', function(select){
		selectedDb = select;
		console.log(selectedDb);
		if(!exists)
			db.run("CREATE TABLE " + selectedDb +"(info TEXT)");
			console.log('no database by this name exists, creating a new one');
	
	db.each('SELECT rowid AS id, info FROM ' + selectedDb , function(err, row){
		io.emit('chat message', row.info);
		console.log('sending out old logs from'+selectedDb);

});
		console.log('database: ' + select + ' selected');
	});
  socket.on('make', function(newDB){
		console.log('got a message to create some life'+newDB);
		db.run("CREATE TABLE " + newDB +"(info TEXT)");
		console.log('doned it');

});
		console.log('database: ' + selectedDb + ' selected');
	
});


http.listen(3000, function(){
  console.log('listening on *:3000');

});

