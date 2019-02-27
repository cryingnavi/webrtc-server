var express = require('express');
var http = require('http');
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cors = require('cors');
var router = require('./router');
var socket = require('./socket');

var app = express();
app.set('port', process.env.PORT || 11200);
app.set('view engine', 'html');
app.set('layout', 'layout');
app.set('views', './views')
app.engine('html', require('hogan-express'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(express.static('static'));

app.use(cors());
app.use('/', router);

app.use(morgan('combined'));

var server = http.createServer(app);
server.listen(app.get('port'));
socket.createSocket(server);

server.on('error', function(e){
	console.log('express server error. ' + e);
});

server.on('listening', function(){
	console.log('express server listening on port ' + app.get('port'));
});
