'use strict';

const fs = require( 'fs' );

if ( !fs.existsSync( `${__dirname}/config.js` ) ) {
  console.error( '📛  Configuration file is missing, copy config.example.js to config.js and change it as required' );
  process.exit( 1 );
}

const express = require( 'express' );
const path = require( 'path' );
const favicon = require( 'serve-favicon' );
const logger = require( 'morgan' );
const cookieParser = require( 'cookie-parser' );
const bodyParser = require( 'body-parser' );
const net = require( 'net' );
const five = require( 'johnny-five' );
const firmata = require( 'firmata' );
const ngrok = require( 'ngrok' );

const DB = require( './lib/DB' );
const SensorFactory = require( './lib/SensorFactory' );
const ws = require( './lib/ws' );
const Alerts = require( './lib/Alerts' );
const config = require( './config' );


const app = express();
const httpServer = require( 'http' ).Server( app );
const io = require( 'socket.io' )( httpServer );

httpServer.listen( config.PORT );

const sensors = [];

const pulseLed = ( led, duration, cb ) => {
  led.blink();
  setTimeout( () => {
    led.stop().off();
    if ( cb ) cb();
  }, duration );
};

// set options to match Firmata config for wifi
// using MKR1000 with WiFi101
const options = {
  host: config.ARDUINO_IP,
  port: config.ARDUINO_PORT
};

net.connect( options, function () {
  console.log( '📡  Connected to MKR1000! 📡' );

  const socketClient = this;

  // use the socketClient instead of a serial port for transport
  const boardIo = new firmata.Board( socketClient );

  boardIo.once( 'ready', () => {
    console.log( '🔌  Connection board wired 🔌' );

    boardIo.isReady = true;

    const board = new five.Board({ io: boardIo, repl: false });
    board.on( 'ready', () => {
      console.log( '⚡  Board is ready  ⚡' );

      // Init RethinkDB stuff
      DB.init();

      // const led = new five.Led( 13 );
      // pulseLed( led, 2000 );

      const multi = new five.Multi({
        controller: 'BME280',
        address   : 0x76,
        freq      : 250
      });

      const lightSensor = new five.Light({
        pin : 'A0',
        freq: 250
      });

      sensors.push( SensorFactory.Sensor( 'temp', multi ) );
      sensors.push( SensorFactory.Sensor( 'humidity', multi ) );
      sensors.push( SensorFactory.Sensor( 'light', lightSensor ) );

      io.on( 'connection', ( socket ) => {
        // emit usersCount on new connection
        ws.emitUsersCount( io );
        // emit chart data to have initial values
        ws.emitChartData( io, sensors );

        // emit usersCount when connection is closed
        socket.on( 'disconnect', () => ws.emitUsersCount( io ) );
      });

      setInterval( () => {
        // emit chart data on each measurement
        ws.emitChartData( io, sensors );
        // save measurement to rethinkdb on each measurement
        DB.saveMeasurements( sensors );
        // parse readings for email alerts on each interval
        Alerts.parseReading( sensors );
      }, config.MEASUREMENT_FREQ );

      if ( config.NGROK_ENABLED ) {
        ngrok.connect( config.PORT, ( err, url ) => {
          if ( err ) return console.error( '📛 ngrok tunnel failed', err );
          console.log( '⚡  ngrok tunnel established! ⚡', url );
        });
      }
    });
  });
});

// setting app stuff
app.locals.title = 'Plant monitor';

// view engine setup
app.set( 'views', path.join( __dirname, 'views' ) );
app.set( 'view engine', 'jade' );

app.use( favicon( path.join( __dirname, 'public', 'favicon.ico' ) ) );
app.use( logger( 'dev' ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: false }) );
app.use( cookieParser() );
app.use( express.static( path.join( __dirname, 'public' ) ) );

// Routes
app.get( '/', ( req, res ) => {
  DB.getTodayMeasurements( ( err, measurements ) => {
    if ( err ) console.error( err );

    res.render( 'index', { measurements });
  });
});
app.get( '/temperature', ( req, res ) => res.render( 'temperature' ) );
app.get( '/light', ( req, res ) => res.render( 'light' ) );
app.get( '/humidity', ( req, res ) => res.render( 'humidity' ) );

// API
app.get( '/api/temps', ( req, res ) => {
  DB.getMeasurementsOf( 'temp', ( err, measurements ) => {
    if ( err ) console.error( err );

    res.write( JSON.stringify( err || measurements ) );
    res.end();
  });
});

app.get( '/api/light', ( req, res ) => {
  DB.getMeasurementsOf( 'light', ( err, measurements ) => {
    if ( err ) console.error( err );

    res.write( JSON.stringify( err || measurements ) );
    res.end();
  });
});

app.get( '/api/humidity', ( req, res ) => {
  DB.getMeasurementsOf( 'humidity', ( err, measurements ) => {
    if ( err ) console.error( err );

    res.write( JSON.stringify( err || measurements ) );
    res.end();
  });
});
