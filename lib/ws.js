const ws = {
  emitUsersCount( io ) {
    io.sockets.emit( 'usersCount', {
      totalUsers: io.engine.clientsCount
    });
  },

  emitChartData( io, sensors ) {
    io.sockets.emit( 'chart:data', {
      date : new Date().getTime(),
      value: sensors.map( s => ({
        type : s.type,
        value: s.getValue()
      }) )
    });
  }
};

module.exports = ws;
