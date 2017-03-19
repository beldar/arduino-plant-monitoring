$( () => {
  const socket = io.connect();
  socket.on( 'led:change', ( data ) => {
    console.log( data );
  });

  socket.on( 'chart:data', ( data ) => {
    console.log( data );
  });

  $( '#on' ).on( 'click', () => {
    socket.emit( 'led:on' );
    console.log( 'clicked on' );
  });

  $( '#off' ).on( 'click', () => {
    socket.emit( 'led:off' );
    console.log( 'clicked off' );
  });

  $( '#pulse' ).on( 'click', () => {
    socket.emit( 'led:pulse' );
    console.log( 'clicked pulse' );
  });
});
