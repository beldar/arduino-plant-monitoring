const r      = require( 'rethinkdb' ),
      config = require( '../config' );

const DB = {
  conn: false,

  init() {
    this.p = r.connect({
      host: config.RDB_HOST,
      port: config.RDB_PORT,
      db  : config.RDB_DATABASE
    }).then( ( conn ) => {
      // connected to rethinkdb
      console.log( '📂  Rethinkdb connected! 📂' );
      this.conn = conn;
    }).error( err => console.error( '📛 Rethinkdb error!', err ) );
  },

  saveMeasurements( measurements ) {
    const measurement = {
      date: r.epochTime( new Date().getTime() / 1000.0 )
    };

    measurements.forEach( ( sensor ) => {
      measurement[ sensor.type ] = sensor.getValue();
    });

    r
    .table( config.RDB_TABLE )
    .insert( measurement )
    .run( this.conn )
    .error( err => console.error( '📛 Error saving measurement', err ) );
  },

  getMeasurementsOf( type, cb ) {
    r
    .table( config.RDB_TABLE )
    .filter( m => m.hasFields( type ) )
    .limit( 14400 )
    .orderBy( 'date' )
    .map( m => [ m( 'date' ).toEpochTime(), m( type ) || 0 ] )
    .run( this.conn, ( err, measurements ) => {
      if ( err ) return cb( err );
      measurements.toArray( cb );
    })
    .error( err => console.error( `📛 Error getting measurement of ${type}`, err ) );
  },

  getTodayMeasurements( cb ) {
    const today = new Date();

    const todayStart = new Date( today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0 );
    const todayEnd = new Date( today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 0 );

    r
    .table( config.RDB_TABLE )
    .between( r.epochTime( todayStart.getTime() / 1000.0 ), r.epochTime( todayEnd.getTime() / 1000.0 ), { index: 'date' })
    .orderBy( 'date' )
    .run( this.conn, ( err, measurements ) => {
      if ( err ) return cb( err );
      measurements.toArray( cb );
    })
    .error( err => console.error( '📛 Error getting today\'s measurements', err ) );
  },

  savePH( ph ) {
    r
    .table( 'ph' )
    .insert({
      date: r.epochTime( new Date().getTime() / 1000.0 ),
      ph
    })
    .run( this.conn )
    .error( err => console.error( '📛 Error saving ph', err ) );
  },

  saveEntry( entry ) {
    r
    .table( 'journal' )
    .insert({
      date: r.epochTime( new Date().getTime() / 1000.0 ),
      entry
    })
    .run( this.conn )
    .error( err => console.error( '📛 Error saving ph', err ) );
  }
};

module.exports = DB;
