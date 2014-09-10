var express = require('express');
var app = express();
var http = require('http').Server(app);

var io = require('socket.io')(http);
var fs = require('fs');
var forever = require('forever-monitor');

var dbFile = "data.db";
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

var path = require('path');

var child = new(forever.Monitor)('app.js', {
    max: 3,
    silent: true,
    options: []
});
child.on('exit', function() {
    console.log('crashed and exited after 3 restarts');
});
//child.start();

app.set('view engine', 'jade')
app.set('views', './views')
app.use("/css", express.static(__dirname + '/css'));
app.use("/css/pure", express.static(__dirname + '/css/pure'));

app.get('/', function(req, res) {
    db.all('SELECT name FROM Channels', function(err, rows) {
        var channels = rows.map(function(row) {return row.name});
        //console.log(channels);
        res.render('index', {channels: channels});
        
    });
});
app.get('/channel/', function(req, res) {

});

db.serialize(function() {
    if (!exists) {
        // first run
        db.run("CREATE TABLE Channels (id INTEGER PRIMARY KEY AUTOINCREMENT, \
                                       name TEXT NOT NULL UNIQUE)");
        db.run("INSERT INTO Channels(name) VALUES('global');"); // atleast for now

        db.run("CREATE TABLE Messages (id INTEGER PRIMARY KEY AUTOINCREMENT, \
                                       text TEXT, \
                                       channel INTEGER NOT NULL DEFAULT 0, \
                                       FOREIGN KEY (channel) REFERENCES Channels(id) \
                                           ON DELETE CASCADE)");

        console.log('no database exists, creating a new one');
    }
});


io.on('connection', function(socket) {
    console.log('user connected, inputting older messages');
    db.each('SELECT id, text FROM Messages', function(err, row) {
        io.emit('chat message', row.text);
    });
    socket.on('chat message', function(msg) {
        io.emit('chat message', msg);
        var stmt = db.prepare('INSERT INTO Messages(text) VALUES(?)');
        stmt.run(msg);
        stmt.finalize();
        console.log('entry added to database');

    });
    socket.on('select', function(select) {
        console.log(select);

        db.each('SELECT id, text FROM Messages', function(err, row) {
            io.emit('chat message', row.info);
            console.log('sending out old logs from' + select);
        });
        console.log('database: ' + select + ' selected');
    });
    socket.on('make', function(newDB) {
        console.log('got a message to create some life' + newDB);
        if (!exists)
            db.run("CREATE TABLE " + newDB + "(info TEXT)");
        console.log('doned it');

    });
});

http.listen(3000, function() {
    console.log('listening on *:3000');

});