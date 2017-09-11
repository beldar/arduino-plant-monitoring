/* globals sensor */

let data;

$( document ).ready( () => {
  $.get( `/api/${sensor.type}`, ( measurements ) => {
    data = ( JSON.parse( measurements ) || [] ).map( ( d ) => {
      d[ 0 ] *= 1000;
      return d;
    });

		// Create the chart
    Highcharts.stockChart( 'master-container', {
      chart: {
        zoomType: 'x',
        style   : { fontFamily: '"Source Sans Pro", sans-serif' }
      },

      rangeSelector: {

        buttons: [ {
          type : 'day',
          count: 1,
          text : '1d'
        }, {
          type : 'week',
          count: 1,
          text : '1w'
        }, {
          type : 'month',
          count: 1,
          text : '1m'
        }, {
          type : 'month',
          count: 6,
          text : '6m'
        }, {
          type : 'year',
          count: 1,
          text : '1y'
        }, {
          type: 'all',
          text: 'All'
        } ],
        selected: 0
      },

      yAxis: {
        title: {
          text: `${sensor.label} (${sensor.unit})`
        }
      },

      title: {
        text: sensor.label
      },

      series: [ {
        name   : sensor.label,
        data,
        tooltip: {
          valueDecimals: 1,
          valueSuffix  : sensor.unit
        },
        color: sensor.color
      } ]

    });
  });
});

const now = new Date();
