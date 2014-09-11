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
var bodyParser = require('body-parser')
var validator = require('validator');

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
app.use("/js", express.static(__dirname + '/js'));

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function(req, res) {
    db.all('SELECT id, name FROM Channels', function(err, chans) {
        db.all('SELECT text FROM Messages WHERE channel=1', function(err, msgs) {

            res.render('index', {channels: chans, messages: msgs});
        });
    });
});
app.post('/channel/', function(req, res) {
    var stmt = db.prepare("INSERT INTO Channels(name) VALUES(?)");
    stmt.run(req.body.newChannel, function(err) {
        console.log("new channel: " + req.body.newChannel);
        
        // TODO: make checks for the stmt and send false if stmt fails. (this.changes > 0)

        // return this.lastID
        var data = {};
        if (this.changes > 0) {
            data.success = true;
            data.lastID = this.lastID
            data.name = req.body.newChannel;
            
        } else {
            data.success = false;
        }
        res.json(data); 

    });

});

app.post('/channel/:id', function(req, res) {
    var id = req.params.id;
    var msg = validator.escape(req.body.message);

    if (msg) {
        var stmt = db.prepare("INSERT INTO Messages(text, channel) VALUES(?, ?)");
        stmt.run(msg, id, function(err) {
            console.log("new message: '" + msg + "' on channel: " + id);

            // TODO: make checks for the stmt and send false if stmt fails.

            res.json({success: true, message: msg});
            
        });
    }
});

app.get('/channel/:id', function(req, res) {

    // TODO: clean this shit up. prepare statement and so forth.
    db.all("SELECT * from Messages WHERE channel=" + req.params.id, function(err, rows) {
        var data = {success: true, messages: rows};
        res.json(data);
    });
});

db.serialize(function() {
    if (!exists) {
        console.log('no database exists, creating a new one');
        // first run
        db.run("CREATE TABLE Channels (id INTEGER PRIMARY KEY AUTOINCREMENT, \
                                       name TEXT NOT NULL UNIQUE)");
        db.run("INSERT INTO Channels(name) VALUES('global');"); // atleast for now

        db.run("CREATE TABLE Messages (id INTEGER PRIMARY KEY AUTOINCREMENT, \
                                       text TEXT, \
                                       channel INTEGER NOT NULL DEFAULT 1, \
                                       FOREIGN KEY (channel) REFERENCES Channels(id) \
                                           ON DELETE CASCADE)");
    }
});


// io.on('connection', function(socket) {
//     console.log('user connected, inputting older messages');
//     db.each('SELECT id, text FROM Messages', function(err, row) {
//         io.emit('chat message', row.text);
//     });
//     socket.on('chat message', function(msg) {
//         io.emit('chat message', msg);
//         var stmt = db.prepare('INSERT INTO Messages(text) VALUES(?)');
//         stmt.run(msg);
//         stmt.finalize();
//         console.log('entry added to database');

//     });
//     socket.on('select', function(select) {
//         console.log(select);

//         db.each('SELECT id, text FROM Messages', function(err, row) {
//             io.emit('chat message', row.info);
//             console.log('sending out old logs from' + select);
//         });
//         console.log('database: ' + select + ' selected');
//     });
//     socket.on('make', function(newDB) {
//         console.log('got a message to create some life' + newDB);
//         if (!exists)
//             db.run("CREATE TABLE " + newDB + "(info TEXT)");
//         console.log('doned it');

//     });
// });

http.listen(3000, function() {
    console.log('listening on *:3000');

});