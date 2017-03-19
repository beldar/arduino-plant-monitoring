'use strict';

// node express and rethinkdb
const express = require( 'express' );
const path = require( 'path' );
const favicon = require( 'serve-favicon' );
const logger = require( 'morgan' );
const cookieParser = require( 'cookie-parser' );
const bodyParser = require( 'body-parser' );
const r = require( 'rethinkdb' );
let dbConnection = null;

const app = express();

// defining sensor variables
let led,
    moistureSensor,
    tempSensor,
    lightSensor;

// MKR1000 stuffs
const httpServer = require( 'http' ).Server( app );
const io = require( 'socket.io' )( httpServer );
const net = require( 'net' );
const five = require( 'johnny-five' );
const firmata = require( 'firmata' );

httpServer.listen( 3000 );

// set options to match Firmata config for wifi
// using MKR1000 with WiFi101
const options = {
  host: '192.168.1.9',
  port: 3030
};

// connection starts here
net.connect( options, function () { // 'connect' listener
  console.log( 'connected to server!' );

  const socketClient = this;

  // use the socketClient instead of a serial port for transport
  const boardIo = new firmata.Board( socketClient );

  boardIo.once( 'ready', () => {
    console.log( 'boardIo ready' );

    boardIo.isReady = true;

    const board = new five.Board({ io: boardIo, repl: true });

    /* RethinkDB stuffs */
    const p = r.connect({
      host: 'localhost',
      port: 28015,
      db  : 'plant_monitoring_system'
    });

    dbConnection = null;

    p.then( ( conn ) => {
      // connected to rethinkdb
      console.log( 'rethinkdb connected!' );
      dbConnection = conn;

      r.table( 'measurements' ).run( conn, ( err, cursor ) => {
        // cursor.each(console.log)
      });
    }).error( ( err ) => {
      console.log( 'Rethinkdb error!' );
      console.log( err );
    });

    board.on( 'ready', () => {
      // full Johnny-Five support here
      console.log( 'five ready' );

      // setup led on pin 6 --> led pin for MKR1000
      led = new five.Led( 6 );

      // pulse led to indicate the board is communicating
      pulseLed( led, 2000, () => {
        console.log( 'LED √' );
      });

      // setup temperature sensor LM35
      tempSensor = new five.Thermometer({
        controller: 'LM35',
        pin       : 'A1',
        freq      : 250
      });

      // setup moisture sensor to correct pin
      moistureSensor = new five.Sensor({
        pin : 'A2',
        freq: 250
      });

      // setup light sensor to correct pin
      lightSensor = new five.Sensor({
        pin : 'A3',
        freq: 250
      });

      io.on( 'connection', ( socket ) => {
        console.log( socket.id );

        // emit usersCount on new connection
        emitUsersCount( io );

        // emit usersCount when connection is closed
        socket.on( 'disconnect', () => {
          emitUsersCount( io );
        });
      });

      // emit chart data on each interval
      setInterval( () => {
        emitChartData( io, tempSensor, lightSensor, moistureSensor );
      }, 1000 );

      // save measurement to rethinkdb on each interval
      setInterval( () => {
        saveMeasurements( dbConnection, tempSensor, lightSensor, moistureSensor );
      }, 10000 );
    });
  });
}).on( 'error', ( err ) => {
  console.log( 'Unable to connect!' );
  console.log( 'Please make sure you have the latest StandardFirmataWifi sketch loaded on the MKR1000' );
});

// emit usersCount to all sockets
function emitUsersCount( io ) {
  io.sockets.emit( 'usersCount', {
    totalUsers: io.engine.clientsCount
  });
}

// emit chart data to all sockets
function emitChartData( io, tempSensor, lightSensor, moistureSensor ) {
  io.sockets.emit( 'chart:data', {
    date : new Date().getTime(),
    value: [ getTemp( tempSensor ), getLight( lightSensor ), getMoisture( moistureSensor ) ]
  });
}

// save measurements to RethinkDB
function saveMeasurements( connection, tempSensor, lightSensor, moistureSensor ) {
  const measurement = {
    date    : new Date().getTime(),
    temp    : getTemp( tempSensor ),
    light   : getLight( lightSensor ),
    moisture: getMoisture( moistureSensor )
  };

  r.table( 'measurements' ).insert( measurement ).run( connection )
  .then()
  .error( ( err ) => {
    console.log( 'Error saving measurement!' );
    console.log( err );
  });
}

// get temperature measurement
function getTemp( tempSensor ) {
  return Math.round( tempSensor.fahrenheit - 25 );
}

// get light measurement
function getLight( lightSensor ) {
  return Math.round( lightSensor.value / 1023 * 100 );
}

// get moisture measurement
function getMoisture( moisture ) {
  return Math.round( moisture.value / 1023 * 100 );
}

// pulse led
function pulseLed( led, duration, cb ) {
  led.blink();
  setTimeout( () => {
    led.stop().off();
    cb();
  }, duration );
}

// setting app stuff
app.locals.title = 'MKR1000';

// view engine setup
app.set( 'views', path.join( __dirname, 'views' ) );
app.set( 'view engine', 'jade' );

app.use( favicon( path.join( __dirname, 'public', 'favicon.ico' ) ) );
app.use( logger( 'dev' ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: false }) );
app.use( cookieParser() );
app.use( require( 'node-sass-middleware' )({
  src           : path.join( __dirname, 'public' ),
  dest          : path.join( __dirname, 'public' ),
  indentedSyntax: true,
  sourceMap     : true
}) );
app.use( express.static( path.join( __dirname, 'public' ) ) );

// get random int in range of min and max --> was used to mock out data
function getRandomInt( min, max ) {
  return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
}

// get all measurements of certain type
function getAllMeasurementsOfCertainType( type, cb ) {
  r.table( 'measurements' )
      .filter( m => m.hasFields( type ) )
      .orderBy( 'date' ).map( ( m ) => {
        return [ m( 'date' ), m( type ) || 0 ];
      })
      .run( dbConnection, ( err, measurements ) => {
        if ( err ) { return cb( err ); }
        measurements.toArray( cb );
      });
}

// get all temperature measurements
function getAllTemperatureMeasurements( cb ) {
  return getAllMeasurementsOfCertainType( 'temp', cb );
}

// get all temperature measurements
function getAllLightMeasurements( cb ) {
  return getAllMeasurementsOfCertainType( 'light', cb );
}

// get all temperature measurements
function getAllMoistureMeasurements( cb ) {
  return getAllMeasurementsOfCertainType( 'moisture', cb );
}


// Routes
app.get( '/', ( req, res, next ) => {
  res.render( 'index' );
});

app.get( '/temperature', ( req, res, next ) => {
  res.render( 'temperature' );
});

app.get( '/light', ( req, res, next ) => {
  res.render( 'light' );
});

app.get( '/moisture', ( req, res, next ) => {
  res.render( 'moisture' );
});


// Routes for data
app.get( '/api/temps', ( req, res, next ) => {
  getAllTemperatureMeasurements( ( err, measurements ) => {
    if ( err ) { console.log( err ); }

    res.write( JSON.stringify( measurements ) );
    res.end();
  });
});

app.get( '/api/light', ( req, res, next ) => {
  getAllLightMeasurements( ( err, measurements ) => {
    if ( err ) { console.log( err ); }

    res.write( JSON.stringify( measurements ) );
    res.end();
  });
});

app.get( '/api/moisture', ( req, res, next ) => {
  getAllMoistureMeasurements( ( err, measurements ) => {
    if ( err ) { console.log( err ); }

    res.write( JSON.stringify( measurements ) );
    res.end();
  });
});

