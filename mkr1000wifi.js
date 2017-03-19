'use strict';

const net = require( 'net' );
const five = require( 'johnny-five' );
const firmata = require( 'firmata' );

// set options to match Firmata config for wifi
// using mkr1000 with WiFi101
// currently using static ip
const options = {
  host: '192.168.1.9',
  port: 3030
};


function blinkLed( led, duration ) {
  led.blink();
  setTimeout( () => {
    led.stop().off();
  }, duration );
}

module.exports = net.connect( options, function () { // 'connect' listener
  console.log( 'connected to server!' );

  const socketClient = this;

    // we can use the socketClient instead of a serial port as our transport
  const io = new firmata.Board( socketClient );

  io.once( 'ready', () => {
    console.log( 'io ready' );
    io.isReady = true;

    const board = new five.Board({ io, repl: true });

    board.on( 'ready', () => {
            // Full Johnny-Five support here
      console.log( 'five ready' );

      const led = new five.Led( 6 );

      setInterval( () => {
        blinkLed( led, 2000 );
      }, 4000 );
    });
  });
});
