const SensorFactory = {
  Sensor( type, sensor ) {
    if ( !this.bundle[ type ] ) throw new Error( `Unkown type of sensor: ${type}` );

    const propsDef = {
      type: {
        value: type
      },
      sensor: {
        value: sensor
      }
    };

    return Object.create( this.bundle[ type ], propsDef );
  },

  bundle: {
    temp: {
      getValue() {
        return this.sensor.thermometer.celsius.toFixed( 1 );
      }
    },
    humidity: {
      getValue() {
        return Math.round( this.sensor.hygrometer.relativeHumidity );
      }
    },
    light: {
      getValue() {
        return Math.round( this.sensor.level * 100 );
      }
    }
  }
};

module.exports = SensorFactory;
