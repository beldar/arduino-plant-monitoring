module.exports = {
  PORT              : 3000,
  TEMP_MIN_LIMIT    : 20,
  TEMP_MAX_LIMIT    : 30,
  HUMIDITY_MIN_LIMIT: 40,
  HUMIDITY_MAX_LIMIT: 70,
  SEND_EMAILS       : false,
  EMAIL_FREQ        : 60 * 1000, // 1min
  EMAIL_SERVICE     : 'gmail',
  MEASUREMENT_FREQ  : 60 * 1000, // 1min
  NGROK_ENABLED     : true,
  RDB_DATABASE      : 'plant_monitoring_system',
  RDB_HOST          : 'localhost',
  RDB_TABLE         : 'measurements',
  RDB_PORT          : 28015
};

/**
 * * Temp * *
 * Veg: 20-30C
 * Flower: 18-26C
 *
 * * Humidity * *
 * Veg: 40-70%
 * Flower: 40-50%
 * Final weeks: < 40%
 */
