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
      console.log( 'rethinkdb connected!' );
      this.conn = conn;
    }).error( ( err ) => {
      console.log( 'Rethinkdb error!' );
      console.log( err );
    });
  },

  saveMeasurements( measurements ) {
    const measurement = {
      date: new Date().getTime()
    };

    measurements.forEach( ( sensor ) => {
      measurement[ sensor.type ] = sensor.getValue();
    });

    r
    .table( 'measurements' )
    .insert( measurement )
    .run( this.conn )
    .error( ( err ) => {
      console.log( 'Error saving measurement!' );
      console.log( err );
    });
  },

  getMeasurementsOf( type, cb ) {
    r
    .table( 'measurements' )
    .filter( m => m.hasFields( type ) )
    .orderBy( 'date' ).map( ( m ) => {
      return [ m( 'date' ), m( type ) || 0 ];
    })
    .run( this.conn, ( err, measurements ) => {
      if ( err ) { return cb( err ); }
      measurements.toArray( cb );
    });
  }
};

module.exports = DB;
