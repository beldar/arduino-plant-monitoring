/* globals measurements */

$( document ).ready( () => {
  let _series1,
      _series2,
      _series3,
      _series4;

  const $temperatureDisplay = $( '#temperature.sensor-values div.temperature' ),
        $lightDisplay = $( '#light.sensor-values div.light' ),
        $humidityDisplay = $( '#humidity.sensor-values div.humidity' ),
        $waterDisplay = $( '#water.sensor-values div.water' ),
        $users = $( '.users' ),
        $temperatureLimits = $( '#temperature-limits.sensor-values div.temperature' ),
        $waterLimits = $( '#water-limits.sensor-values div.water' ),
        $humidityLimits = $( '#humidity-limits.sensor-values div.humidity' );

  const tempData = [],
        lightData = [],
        humidityData = [],
        waterData = [],
        tempLimits = { min: Infinity, max: 0 },
        lightLimits = { min: Infinity, max: 0 },
        humidityLimits = { min: Infinity, max: 0 },
        waterLimits = { min: Infinity },
        MAX_INITIAL_POINTS = 100,
        initialIndex = measurements.length - MAX_INITIAL_POINTS > 0 ? measurements.length - MAX_INITIAL_POINTS : 0;

  measurements
  .forEach( ( p, i ) => {
    const temp = Number( p.temp );
    const light = p.light;
    const humidity = p.humidity;
    const water = p.water;
    const date = new Date( p.date ).getTime();

    if ( temp < tempLimits.min ) tempLimits.min = temp;
    if ( temp > tempLimits.max ) tempLimits.max = temp;
    if ( light < lightLimits.min ) lightLimits.min = light;
    if ( light > lightLimits.max ) lightLimits.max = light;
    if ( humidity < humidityLimits.min ) humidityLimits.min = humidity;
    if ( humidity > humidityLimits.max ) humidityLimits.max = humidity;
    if ( water < waterLimits.min ) waterLimits.min = water;

    if ( temp && i > initialIndex ) tempData.push( [ date, temp ] );
    if ( light && i > initialIndex ) lightData.push( [ date, light ] );
    if ( humidity && i > initialIndex ) humidityData.push( [ date, humidity ] );
    if ( water && i > initialIndex ) waterData.push( [ date, water ] );
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

  function updateWater( value ) {
    $waterDisplay.html( `${value}<span>%</span>` );
  }

  function updateTempLimits( temp ) {
    if ( temp < tempLimits.min ) tempLimits.min = temp;
    if ( temp > tempLimits.max ) tempLimits.max = temp;
    $temperatureLimits.html( `${tempLimits.min}<span>°C</span>/${tempLimits.max}<span>°C</span>` );
  }

  function updateWaterLimits( water ) {
    if ( water < waterLimits.min ) waterLimits.min = water;
    $waterLimits.html( `${waterLimits.min}<span>%</span>` );
  }

  function updateHumidityLimits( humidity ) {
    if ( humidity < humidityLimits.min ) humidityLimits.min = humidity;
    if ( humidity > humidityLimits.max ) humidityLimits.max = humidity;
    $humidityLimits.html( `${humidityLimits.min}<span>%</span>/${humidityLimits.max}<span>%</span>` );
  }

  function updateSensorDisplayValues( temp, light, humidity, water ) {
    if ( temp ) {
      updateTemperature( temp.value );
      updateTempLimits( temp.value );
    }
    if ( light ) {
      updateLight( light.value );
    }
    if ( humidity ) {
      updateHumidity( humidity.value );
      updateHumidityLimits( humidity.value );
    }

    if ( water ) {
      updateWater( water.value );
      updateWaterLimits( water.value );
    }
  }

  const socket = io.connect();
  socket.on( 'chart:data', ( readings ) => {
    if ( !_series1 || !_series2 || !_series3 || !_series4 ) { return; }

    const temp = readings.value.find( v => v.type === 'temp' );
    const light = readings.value.find( v => v.type === 'light' );
    const humidity = readings.value.find( v => v.type === 'humidity' );
    const water = readings.value.find( v => v.type === 'water' );

    if ( temp ) _series1.addPoint( [ readings.date, Number( temp.value ) ], false, true );
    if ( light ) _series2.addPoint( [ readings.date, light.value ], false, true );
    if ( humidity ) _series3.addPoint( [ readings.date, humidity.value ], true, true );
    if ( water ) _series4.addPoint( [ readings.date, water.value ], true, true );

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
          _series4 = this.series[ 3 ];
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
    }, {
      title: {
        text : 'WATER LEVEL',
        style: {
          color: '#5b8bf4',
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
      name : 'HUMIDITY',
      yAxis: 2,
      data : humidityData
    }, {
      name : 'WATER LELVEL',
      yAxis: 3,
      data : waterData
    } ]
  });
});
