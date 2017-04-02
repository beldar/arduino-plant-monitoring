'use strict';

const nodemailer = require( 'nodemailer' );
const config = require( '../config' );

const transporter = nodemailer.createTransport({
  service: config.EMAIL_SERVICE,
  auth   : {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_FROM_PASS
  }
});
const mailOptions = {
  from   : process.env.EMAIL_FROM, // sender address
  to     : process.env.EMAIL_TO, // list of receivers
  subject: '[Plant Warning] ', // Subject line
  text   : '', // plain text body
  html   : '' // html body
};

const warnings = {
  temp: {
    min: null,
    max: null
  },
  humidity: {
    min: null,
    max: null
  },
  floatSwitch: null
};

const Alerts = {
  parseReading( sensors ) {
    sensors.forEach( ( sensor ) => {
      const value = sensor.getValue();

      switch ( sensor.type ) {
        case 'temp':
          if ( value && value <= config.TEMP_MIN_LIMIT ) {
            warnings.temp.min = warnings.temp.min ? Math.min( warnings.temp.min, value ) : value;
          }
          if ( value && value >= config.TEMP_MAX_LIMIT ) {
            warnings.temp.max = warnings.temp.max ? Math.max( warnings.temp.max, value ) : value;
          }
          break;
        case 'humidity':
          if ( value && value <= config.HUMIDITY_MIN_LIMIT ) {
            warnings.humidity.min = warnings.humidity.min ? Math.min( warnings.humidity.min, value ) : value;
          }
          if ( value && value >= config.HUMIDITY_MAX_LIMIT ) {
            warnings.humidity.max = warnings.humidity.max ? Math.max( warnings.humidity.max, value ) : value;
          }
          break;
        case 'floatSwitch':
          if ( value === config.FLOAT_ALERT_VALUE ) {
            warnings.floatSwitch = true;
          }
          break;
        default:
      }
    });
  },

  sendAlerts() {
    let subject;

    if ( warnings.temp.min !== null ) {
      subject = `❄️ Temperature reached minimum limit! (${warnings.temp.min}ºC)`;
      this.sendEmail( subject, subject );
      warnings.temp.min = null;
    }

    if ( warnings.temp.max !== null ) {
      subject = `🔥 Temperature reached maximum limit! (${warnings.temp.max}ºC)`;
      this.sendEmail( subject, subject );
      warnings.temp.max = null;
    }

    if ( warnings.humidity.min !== null ) {
      subject = `🌵 Humidity reached minimum limit! (${warnings.humidity.min}%)`;
      this.sendEmail( subject, subject );
      warnings.humidity.min = null;
    }

    if ( warnings.humidity.max !== null ) {
      subject = `🌊 Humidity reached maximum limit! (${warnings.humidity.max}%)`;
      this.sendEmail( subject, subject );
      warnings.humidity.max = null;
    }

    if ( warnings.floatSwitch ) {
      subject = '🏜 Float switch activated!';
      this.sendEmail( subject, subject );
      warnings.floatSwitch = null;
    }
  },

  sendEmail( subject, text ) {
    console.warn( subject );

    if ( !config.SEND_EMAILS ) return;

    if ( !process.env.EMAIL_FROM || !process.env.EMAIL_FROM_PASS || !process.env.EMAIL_TO ) {
      console.error( 'Email env vars are missing, cannot send alert emails' );
      return;
    }

    const mail = Object.assign({}, mailOptions );
    mail.subject += subject;
    mail.text = text;
    mail.html = text;

    transporter.sendMail( mail, ( error, info ) => {
      if ( error ) {
        return console.log( error );
      }
      console.log( 'Message %s sent: %s', info.messageId, info.response );
    });
  }
};

setInterval( () => Alerts.sendAlerts(), config.EMAIL_FREQ );

module.exports = Alerts;
