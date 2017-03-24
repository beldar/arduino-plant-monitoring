const r = require( 'rethinkdb' );

const DB = {
  database: 'plant_monitoring_system',
  host    : 'localhost',
  conn    : false,

  init() {
    this.p = r.connect({
      host: this.host,
      port: 28015,
      db  : this.database
    }).then( ( conn ) => {
      // connected to rethinkdb
      console.log( '📂  Rethinkdb connected! 📂' );
      this.conn = conn;
    }).error( err => console.error( '📛 Rethinkdb error!', error ) );
  },

  saveMeasurements( measurements ) {
    const measurement = {
      date: r.epochTime( new Date().getTime() / 1000.0 )
    };

    measurements.forEach( ( sensor ) => {
      measurement[ sensor.type ] = sensor.getValue();
    });

    r
    .table( 'measurements' )
    .insert( measurement )
    .run( this.conn )
    .error( err => console.error( '📛 Error saving measurement', error ) );
  },

  getMeasurementsOf( type, cb ) {
    r
    .table( 'measurements' )
    .filter( m => m.hasFields( type ) )
    .orderBy( 'date' )
    .map( m => [ m( 'date' ).toEpochTime(), m( type ) || 0 ] )
    .run( this.conn, ( err, measurements ) => {
      if ( err ) return cb( err );
      measurements.toArray( cb );
    })
    .error( err => console.error( `📛 Error getting measurement of ${type}`, error ) );
  },

  getTodayMeasurements( cb ) {
    const today = new Date();

    r
    .table( 'measurements' )
    .filter( m => m( 'date' ) >= r.time( today.getFullYear(), today.getMonth(), today.getDate(), 'Z' ) )
    .orderBy( 'date' )
    .run( this.conn, ( err, measurements ) => {
      if ( err ) return cb( err );
      measurements.toArray( cb );
    })
    .error( err => console.error( '📛 Error getting today\'s measurements', error ) );
  }
};

module.exports = DB;
