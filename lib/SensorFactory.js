const SensorFactory = {
  Sensor( props ) {
    if ( !this.bundle[ props.type ] ) throw new Error( `Unkown type of sensor: ${props.type}` );

    const propsDef = {
      type: {
        value: props.type
      },
      label: {
        value: props.label
      },
      color: {
        value: props.color
      },
      unit: {
        value: props.unit
      },
      sensor: {
        value: props.sensor
      }
    };

    return Object.create( this.bundle[ props.type ], propsDef );
  },

  bundle: {
    temp: {
      getValue() {
        return Number( this.sensor.thermometer.celsius.toFixed( 1 ) );
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
    },
    floatSwitch: {
      getValue() {
        return this.sensor.boolean;
      }
    }
  }
};

module.exports = SensorFactory;
