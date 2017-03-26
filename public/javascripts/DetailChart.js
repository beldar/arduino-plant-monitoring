/* globals sensor */

let data;

$( document ).ready( () => {
  let detailChart;

  // create the detail chart
  function createDetail( masterChart ) {
    // render last 5,000 points for top chart
    const detailData = data.slice( -5000 );

    // create a detail chart referenced by a global variable
    detailChart = $( '#detail-container' ).highcharts({
      chart: {
        reflow: true,
        style : {
          fontFamily: 'Source Sans Pro'
        }
      },
      credits: false,
      title  : {
        text : `${sensor.label} Data`,
        style: {
          fontSize: '3em',
          color   : sensor.color
        }
      },
      subtitle: {
        text : 'Select an area by dragging across the <span style="text-decoration: underline">lower</span> chart',
        style: {
          fontSize: '2em'
        }
      },
      xAxis: {
        type: 'datetime'
      },
      yAxis: {
        title: {
          text: null
        },
        maxZoom: 0.1
      },
      tooltip: {
        formatter() {
          const point = this.points[ 0 ];
          return `${Highcharts.dateFormat( '%A %B %e %Y %H:%M', this.x )}:<br/>${
          point.y} ${sensor.unit} ${sensor.label}`;
        },
        style: {
          fontSize  : '1em',
          lineHeight: '36px',
          padding   : '30px'
        },
        shared: true
      },
      legend: {
        enabled: false
      },
      plotOptions: {
        series: {
          marker: {
            enabled: false,
            states : {
              hover: {
                enabled: true,
                radius : 3
              }
            }
          }
        }
      },
      series: [ {
        name : sensor.label,
        data : detailData,
        color: sensor.color
      } ],

      exporting: {
        enabled: false
      }

    }).highcharts(); // return chart
  }

  // create the master chart
  function createMaster( _data ) {
    data = _data.map( ( r ) => {
      r[ 1 ] = Number( r[ 1 ] );
      r[ 0 ] *= 1000.0;
      return r;
    });
    $( '#master-container' ).highcharts({
      chart: {
        reflow: true,
        style : {
          fontFamily: 'Source Sans Pro'
        },
        zoomType: 'x',
        events  : {
          // listen to the selection event on the master chart to update the
          // extremes of the detail chart
          selection( event ) {
            let extremesObject = event.xAxis[ 0 ],
                min = extremesObject.min,
                max = extremesObject.max,
                detailData = [],
                xAxis = this.xAxis[ 0 ];

            // reverse engineer the last part of the data
            $.each( this.series[ 0 ].data, function () {
              if ( this.x > min && this.x < max ) {
                detailData.push( [ this.x, this.y ] );
              }
            });

            // move the plot bands to reflect the new detail span
            xAxis.removePlotBand( 'mask-before' );
            xAxis.addPlotBand({
              id   : 'mask-before',
              from : data[ 0 ][ 0 ],
              to   : min,
              color: 'rgba(0, 0, 0, 0.2)'
            });

            xAxis.removePlotBand( 'mask-after' );
            xAxis.addPlotBand({
              id   : 'mask-after',
              from : max,
              to   : data[ data.length - 1 ][ 0 ],
              color: 'rgba(0, 0, 0, 0.2)'
            });

            detailChart.series[ 0 ].setData( detailData );

            return false;
          }
        }
      },
      title: {
        text : Number( data.length ).toLocaleString( 'en' ),
        style: {
          fontSize: '2em',
          color   : sensor.color
        }
      },
      subtitle: {
        text : 'Total Measurements',
        style: {
          fontSize: '2em'
        }
      },
      xAxis: {
        type             : 'datetime',
        showLastTickLabel: true,
        // maxZoom: 14 * 24 * 3600000, // fourteen days
        plotBands        : [ {
          id   : 'mask-before',
          from : data[ 0 ][ 0 ],
          to   : data[ data.length - 1 ][ 0 ],
          color: 'rgba(0, 0, 0, 0.2)'
        } ],
        title: {
          text: null
        }
      },
      yAxis: {
        gridLineWidth: 0,
        labels       : {
          enabled: false
        },
        title: {
          text: null
        },
        min           : 0.6,
        showFirstLabel: false
      },
      tooltip: {
        formatter() {
          return false;
        }
      },
      legend: {
        enabled: false
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        series: {
          fillColor: {
            linearGradient: [ 0, 0, 0, 70 ],
            stops         : [
              [ 0, sensor.color ],
              [ 1, 'rgba(255,255,255,0)' ]
            ]
          },
          lineWidth: 1,
          marker   : {
            enabled: false
          },
          shadow: false,
          states: {
            hover: {
              lineWidth: 1
            }
          },
          enableMouseTracking: false
        }
      },

      series: [ {
        type         : 'area',
        name         : sensor.label,
        pointInterval: 24 * 3600 * 1000,
        pointStart   : data[ 0 ][ 0 ],
        data,
        color        : sensor.color
      } ],

      exporting: {
        enabled: false
      }

    }, ( masterChart ) => {
      createDetail( masterChart );
    })
    .highcharts(); // return chart instance
  }

  $.get( `/api/${sensor.type}`, ( measurements ) => {
    data = JSON.parse( measurements );
    // create master and in its callback, create the detail chart
    createMaster( data );
  });
});