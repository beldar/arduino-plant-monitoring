module.exports = {
  PORT              : 3000, // Application port (i.e. localhost:3000)
  ARDUINO_IP        : '192.168.1.113', // IP configured on your arduino's Firmata WiFi
  ARDUINO_PORT      : 3030, // Port configured on your arduino's Firmata WiFi
  TEMP_MIN_LIMIT    : 20, // Min temperature limit to send an Alert
  TEMP_MAX_LIMIT    : 30, // Max temperature limit to send an Alert
  HUMIDITY_MIN_LIMIT: 40, // Min humidity limit to send an Alert
  HUMIDITY_MAX_LIMIT: 70, // Max humidity limit to send an Alert
  SEND_EMAILS       : false, // Set to true if you want email Alerts to be sent
  EMAIL_FREQ        : 60 * 1000, // (1min) How often to check the limits for the Alerts
  EMAIL_SERVICE     : 'gmail', // Which email service to use
  MEASUREMENT_FREQ  : 60 * 1000, // (1min) How often to sample data from sensors
  NGROK_ENABLED     : true, // Set to true if you want to automatically create an ngrok tunnel
  RDB_DATABASE      : 'plant_monitoring_system', // Rethinkdb database name
  RDB_HOST          : 'localhost', // Rethinkdb host name
  RDB_TABLE         : 'measurements', // Rethinkdb table name
  RDB_PORT          : 28015  // Rethinkdb port
};
