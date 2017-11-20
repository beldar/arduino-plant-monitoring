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

const sensors = [],
      RECORD_PH = 'record.ph',
      LOG_ENTRY = 'log.entry';

const Particle = require( 'particle-io' );

const board = new five.Board({
  io: new Particle({
    token   : process.env.PARTICLE_TOKEN,
    deviceId: process.env.PARTICLE_DEVICE_ID
  })
});

const setSensors = function () {
  // Sensor initialisation
  const multi = new five.Multi({
    controller: 'BME280',
    address   : 0x76,
    freq      : 250,
    delay     : 250
  });

  const lightSensor = new five.Light({
    pin : 'A0',
    freq: 250
  });

  // const floatSwitch = new five.Sensor({
  //   pin: 'A1'
  // });

  // Sensor definition
  sensors.push( SensorFactory.Sensor({
    type  : 'temp',
    label : 'Temperature',
    unit  : 'ºC',
    sensor: multi,
    color : '#2b908f'
  }) );

  sensors.push( SensorFactory.Sensor({
    type  : 'humidity',
    label : 'Humidity',
    unit  : '%',
    sensor: multi,
    color : '#f45b5b'
  }) );

  sensors.push( SensorFactory.Sensor({
    type  : 'light',
    label : 'Light Exposure',
    unit  : '%',
    sensor: lightSensor,
    color : '#90ee7e'
  }) );

  // sensors.push( SensorFactory.Sensor({
  //   type  : 'floatSwitch',
  //   label : 'Float Switch',
  //   unit  : '',
  //   sensor: floatSwitch,
  //   color : ''
  // }) );

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
};

const safelySetSensors = function () {
  try {
    setSensors();
  } catch ( e ) {
    console.error( 'Error while trying to init sensors', e );
    setTimeout( () => {
      console.log( 'Trying again...' );
      safelySetSensors();
    }, 2000 );
  }
};

board.on( 'ready', () => {
  console.log( '⚡  Board is ready  ⚡' );

  // Init RethinkDB stuff
  DB.init();

  safelySetSensors();
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

app.get( '/detail/:type', ( req, res ) => {
  const type = req.params.type;
  const sensor = sensors.find( s => s.type === type );

  if ( !sensor ) {
    res.status( 404 ).send( 'Not found' );
    return;
  }

  const sensorProps = {
    type : sensor.type,
    label: sensor.label,
    unit : sensor.unit,
    color: sensor.color
  };

  res.render( 'detail', { sensor: sensorProps });
});

// API
app.get( '/api/:sensor', ( req, res ) => {
  DB.getMeasurementsOf( req.params.sensor, ( err, measurements ) => {
    if ( err ) console.error( err );

    res.write( JSON.stringify( err || measurements ) );
    res.end();
  });
});

// Google actions Webhook
app.post( '/webhook', ( req, res ) => {
  console.log( req.body );
  const result = req.body.result || false;

  if ( result ) {
    const { action, resolvedQuery, parameters } = result;

    switch ( action ) {
      case RECORD_PH:
        if ( parameters.ph && parameters.ph.length ) {
          DB.savePH( parameters.ph );
        }
        break;
      case LOG_ENTRY:
        if ( parameters.entry && parameters.entry.length ) {
          DB.saveEntry( parameters.entry );
        }
        break;
    }
  }
});

app.get( '/restart', ( req, res ) => {
  process.exit();
});
