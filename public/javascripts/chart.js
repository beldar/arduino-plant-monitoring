$( document ).ready( () => {
  let _series1,
      _series2,
      _series3;

  const totalPoints = 100,
        $delay = 1000,
        $temperatureDisplay = $( 'div.sensor-values div.temperature' ),
        $lightDisplay = $( 'div.sensor-values div.light' ),
        $humidityDisplay = $( 'div.sensor-values div.humidity' ),
        $users = $( '.users' );

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

  function updateSensorDisplayValues( temp, light, humidity ) {
    if ( temp ) updateTemperature( temp.value );
    if ( light ) updateLight( light.value );
    if ( humidity ) updateHumidity( humidity.value );
  }

  const socket = io.connect();
  socket.on( 'chart:data', ( readings ) => {
    if ( !_series1 || !_series2 || !_series3 ) { return; }

    const temp = readings.value.find( v => v.type === 'temp' );
    const light = readings.value.find( v => v.type === 'light' );
    const humidity = readings.value.find( v => v.type === 'humidity' );

    if ( temp ) _series1.addPoint( [ readings.date, temp.value ], false, true );
    if ( light ) _series2.addPoint( [ readings.date, light.value ], false, true );
    if ( humidity ) _series3.addPoint( [ readings.date, humidity.value ], true, true );

    updateSensorDisplayValues( temp, light, humidity );
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
      enabled: false
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
        const unitOfMeasurement = this.series.name === 'TEMPERATURE' ? '  °F' : ' %';
        return `<b>${this.series.name}</b><br/>${
        Highcharts.numberFormat( this.y, 1 )}${unitOfMeasurement}`;
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
      data: ( function () {
        // generate an array of random data
        const data = [],
              time = ( new Date() ).getTime();

        for ( let i = -totalPoints; i <= 0; i += 1 ) {
          data.push({
            x: time + ( i * $delay ),
            y: 0
          });
        }
        return data;
      }() )
    }, {
      name : 'LIGHT',
      yAxis: 1,
      data : ( function () {
        // generate an array of random data
        const data = [],
              time = ( new Date() ).getTime();

        for ( let i = -totalPoints; i <= 0; i += 1 ) {
          data.push({
            x: time + ( i * $delay ),
            y: 0
          });
        }
        return data;
      }() )
    }, {
      name : 'Humidity',
      yAxis: 2,
      data : ( function () {
        // generate an array of random data
        const data = [],
              time = ( new Date() ).getTime();

        for ( let i = -totalPoints; i <= 0; i += 1 ) {
          data.push({
            x: time + ( i * $delay ),
            y: 0
          });
        }
        return data;
      }() )
    } ]
  });
});
