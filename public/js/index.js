var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var file = "log.db";
var exists = fs.existsSync(file);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);
var path = require('path');


app.get('/', function(req, res){
  res.sendfile('index.html');


});
function handleStaticPages(pathName, res) {
    var ext = path.extname(pathName);
    switch(ext) {
        case '.css':
            res.writeHead(200, {"Content-Type": "text/css"});
            fs.readFile('./' + pathName, 'utf8', function(err, fd) {
                res.end(fd);
            });
            console.log('Routed for Cascading Style Sheet '+ pathName +' Successfully\n');
        break;
        case '.js':
            res.writeHead(200, {"Content-Type": "text/javascript"});
            fs.readFile('./' + pathName, 'utf8', function(err, fd) {
                res.end(fd);
            });
            console.log('Routed for Javascript '+ pathName +' Successfully\n');
        break;
    }
}

db.serialize(function(){
	if(!exists) {
		db.run("CREATE TABLE logmessages(info TEXT)");
		console.log('no database exists, creating a new one');
	}

});
io.on('connection', function(socket){
console.log('user connected, inputting older messages');
db.each('SELECT rowid AS id, info FROM logmessages', function(err, row){
		io.emit('chat message', row.info)
});
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
var stmt = db.prepare('INSERT INTO logmessages VALUES(?)');
stmt.run(msg);
stmt.finalize();
console.log('entry added to database');
	socket.on('connection', function(msg){

	});
	
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');

});

