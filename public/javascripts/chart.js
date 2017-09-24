/* globals measurements */

$( document ).ready( () => {
  let _series1,
      _series2,
      _series3;

  const $temperatureDisplay = $( '#temperature.sensor-values div.temperature' ),
        $lightDisplay = $( '#light.sensor-values div.light' ),
        $humidityDisplay = $( '#humidity.sensor-values div.humidity' ),
        $users = $( '.users' ),
        $temperatureLimits = $( '#temperature-limits.sensor-values div.temperature' ),
        $lightLimits = $( '#light-limits.sensor-values div.light' ),
        $humidityLimits = $( '#humidity-limits.sensor-values div.humidity' ),
        $waterLevel = $( '#water-level.sensor-values div.water' );

  const tempData = [],
        lightData = [],
        humidityData = [],
        tempLimits = { min: Infinity, max: 0 },
        lightLimits = { min: Infinity, max: 0 },
        humidityLimits = { min: Infinity, max: 0 },
        MAX_INITIAL_POINTS = 100,
        initialIndex = measurements.length - MAX_INITIAL_POINTS > 0 ? measurements.length - MAX_INITIAL_POINTS : 0;

  let waterLevel = false;

  measurements
  .forEach( ( p, i ) => {
    const temp = Number( p.temp );
    const light = p.light;
    const humidity = p.humidity;
    const date = new Date( p.date ).getTime();
    waterLevel = p.floatSwitch;

    if ( temp < tempLimits.min ) tempLimits.min = temp;
    if ( temp > tempLimits.max ) tempLimits.max = temp;
    if ( light < lightLimits.min ) lightLimits.min = light;
    if ( light > lightLimits.max ) lightLimits.max = light;
    if ( humidity < humidityLimits.min ) humidityLimits.min = humidity;
    if ( humidity > humidityLimits.max ) humidityLimits.max = humidity;

    if ( temp && i > initialIndex ) tempData.push( [ date, temp ] );
    if ( light && i > initialIndex ) lightData.push( [ date, light ] );
    if ( humidity && i > initialIndex ) humidityData.push( [ date, humidity ] );
  });

  function updateUsersCount( total ) {
    $users.html( total );
  }

  function updateTemperature( value ) {
    $temperatureDisplay.html( `${value}<span> °C</span>` );
  }

  function updateLight( value ) {
    $lightDisplay.html( `${value}<span>%</span>` );
  }

  function updateHumidity( value ) {
    $humidityDisplay.html( `${value}<span>%</span>` );
  }

  function updateTempLimits( temp ) {
    if ( temp < tempLimits.min ) tempLimits.min = temp;
    if ( temp > tempLimits.max ) tempLimits.max = temp;
    $temperatureLimits.html( `${tempLimits.min}<span>°C</span>/${tempLimits.max}<span>°C</span>` );
  }

  function updateLightLimits( light ) {
    if ( light < lightLimits.min ) lightLimits.min = light;
    if ( light > lightLimits.max ) lightLimits.max = light;
    $lightLimits.html( `${lightLimits.min}<span>%</span>/${lightLimits.max}<span>%</span>` );
  }

  function updateHumidityLimits( humidity ) {
    if ( humidity < humidityLimits.min ) humidityLimits.min = humidity;
    if ( humidity > humidityLimits.max ) humidityLimits.max = humidity;
    $humidityLimits.html( `${humidityLimits.min}<span>%</span>/${humidityLimits.max}<span>%</span>` );
  }

  function updateWaterLevel( lvl ) {
    waterLevel = lvl;
    const display = waterLevel ? '👎' : '👍';
    $waterLevel.html( display );
  }

  function updateSensorDisplayValues( temp, light, humidity, water ) {
    if ( temp ) {
      updateTemperature( temp.value );
      updateTempLimits( temp.value );
    }
    if ( light ) {
      updateLight( light.value );
      updateLightLimits( light.value );
    }
    if ( humidity ) {
      updateHumidity( humidity.value );
      updateHumidityLimits( humidity.value );
    }
    if ( water !== waterLevel ) {
      updateWaterLevel( water.value );
    }
  }

  const socket = io.connect();
  socket.on( 'chart:data', ( readings ) => {
    if ( !_series1 || !_series2 || !_series3 ) { return; }

    const temp = readings.value.find( v => v.type === 'temp' );
    const light = readings.value.find( v => v.type === 'light' );
    const humidity = readings.value.find( v => v.type === 'humidity' );
    const water = readings.value.find( v => v.type === 'floatSwitch' );

    if ( temp ) _series1.addPoint( [ readings.date, Number( temp.value ) ], false, true );
    if ( light ) _series2.addPoint( [ readings.date, light.value ], false, true );
    if ( humidity ) _series3.addPoint( [ readings.date, humidity.value ], true, true );

    updateSensorDisplayValues( temp, light, humidity, water );
  });

  socket.on( 'usersCount', ( total ) => {
    updateUsersCount( total.totalUsers );
  });

  Highcharts.setOptions({
    global: {
      useUTC: true
    },
    plotOptions: {
      series: {
        marker: {
          enabled: false
        }
      }
    },
    tooltip: {
      enabled: true
    }
  });

  $( '#sensorData' ).highcharts({
    chart: {
      type  : 'spline',
      events: {
        load() {
          // set each series for updating with web socket event
          _series1 = this.series[ 0 ];
          _series2 = this.series[ 1 ];
          _series3 = this.series[ 2 ];
        }
      },
      style: {
        fontFamily: 'Source Sans Pro'
      }
    },
    credits: false,
    title  : {
      text: 'Sensor Data'
    },
    xAxis: {
      type             : 'datetime',
      tickPixelInterval: 1000
    },
    yAxis: [ {
      title: {
        text : 'TEMPERATURE',
        style: {
          color: '#2b908f',
          font : '13px sans-serif'
        }
      },
      min      : 0,
      max      : 40,
      plotLines: [ {
        value: 0,
        width: 1,
        color: '#808080'
      } ]
    }, {
      title: {
        text : 'LIGHT',
        style: {
          color: '#90ee7e',
          font : '13px sans-serif'
        }
      },
      min      : 0,
      max      : 100,
      opposite : true,
      plotLines: [ {
        value: 0,
        width: 1,
        color: '#808080'
      } ]
    }, {
      title: {
        text : 'HUMIDITY',
        style: {
          color: '#f45b5b',
          font : '13px sans-serif'
        }
      },
      // omitting min and max to auto scale humidity axis yAxis
      min      : 0,
      max      : 100,
      opposite : true,
      plotLines: [ {
        value: 0,
        width: 1,
        color: '#808080'
      } ]
    } ],
    tooltip: {
      formatter() {
        const unitOfMeasurement = this.series.name === 'TEMPERATURE' ? '  °C' : ' %';
        const date = new Date( this.x );
        return `<b>${this.series.name}</b>
        <br/>${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}<br/>
        ${Highcharts.numberFormat( this.y, 1 )}${unitOfMeasurement}`;
      }
    },
    legend: {
      enabled: true
    },
    exporting: {
      enabled: false
    },
    series: [ {
      name : 'TEMPERATURE',
      yAxis: 0,
      style: {
        color: '#2b908f'
      },
      data: tempData
    }, {
      name : 'LIGHT',
      yAxis: 1,
      data : lightData
    }, {
      name : 'Humidity',
      yAxis: 2,
      data : humidityData
    } ]
  });
});
