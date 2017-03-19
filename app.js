'use strict'

// node express and rethinkdb
const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const net = require('net')
const five = require('johnny-five')
const firmata = require('firmata')
const DB = require('./lib/DB')
const SensorFactory = require('./lib/SensorFactory')
const ws = require( './lib/ws')

const app = express()
const httpServer = require('http').Server(app)
const io = require('socket.io')(httpServer)

httpServer.listen(3000)

const board = new five.Board()
const sensors = [];
const EMIT_FREQ = 1000;
const SAVE_FREQ = 10000;

board.on('ready', function() {
  // full Johnny-Five support here
  console.log('five ready')

  //Init RethinkDB stuff
  DB.init();

  const led = new five.Led(13)
  // pulse led to indicate the board is communicating
  pulseLed(led, 2000, function () {
    console.log('LED √')
  })

  const multi = new five.Multi({
    controller: "BME280",
    address: 0x76,
    freq: 250
  });

  const lightSensor = new five.Light({
    pin: 'A0',
    freq: 250
  })

  sensors.push(SensorFactory.Sensor( 'temp', multi ));
  sensors.push(SensorFactory.Sensor( 'humidity', multi ));
  sensors.push(SensorFactory.Sensor( 'light', lightSensor ));

  io.on('connection', function (socket) {
    // emit usersCount on new connection
    ws.emitUsersCount(io)

    // emit usersCount when connection is closed
    socket.on('disconnect', () => ws.emitUsersCount(io) );
  })

  // emit chart data on each interval
  setInterval(() => ws.emitChartData(io, sensors), EMIT_FREQ);

  // save measurement to rethinkdb on each interval
  setInterval(() => DB.saveMeasurements(sensors), SAVE_FREQ);
})

// pulse led
function pulseLed(led, duration, cb) {
  led.blink()
  setTimeout(function () {
    led.stop().off()
    cb()
  }, duration)
}

// setting app stuff
app.locals.title = 'Plant monitor'

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true,
  sourceMap: true
}))
app.use(express.static(path.join(__dirname, 'public')))

// Routes
app.get('/', (req, res, next) => res.render('index') )
app.get('/temperature', (req, res, next) => res.render('temperature') )
app.get('/light', (req, res, next) => res.render('light') )
app.get('/humidity', (req, res, next) => res.render('humidity') )

// API
app.get('/api/temps', function (req, res, next) {
  DB.getMeasurementsOf('temp', function (err, measurements) {
    if (err) { console.log(err) }

    res.write(JSON.stringify(measurements))
    res.end()
  })
})

app.get('/api/light', function (req, res, next) {
  DB.getMeasurementsOf('light', function (err, measurements) {
    if (err) { console.log(err) }

    res.write(JSON.stringify(measurements))
    res.end()
  })
})

app.get('/api/humidity', function (req, res, next) {
  DB.getMeasurementsOf('humidity', function (err, measurements) {
    if (err) { console.log(err) }

    res.write(JSON.stringify(measurements))
    res.end()
  })
})
