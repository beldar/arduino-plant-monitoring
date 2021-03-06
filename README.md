# Arduino Plant Monitoring System

Plant monitoring system using Arduino MKR1000, Standard Firmata WiFi, Johnny-five.io, and Node

Based on [https://github.com/ryanjgill/mkr1000](https://github.com/ryanjgill/mkr1000)

## Features

* Connects to MKR1000 via WiFi and gets sensor data
* Provides webserver with real-time charts (using websockets)
* Historical data stored on RethinkDB
* Combined data chart updating in real time
* Individual measurements charts
* Min/Max measurements by day
* Min/Max email alerts with configurable limits (requires Gmail account)
* External access via [ngrok](https://ngrok.com/) tunnel

## Install

You need to perform 3 major tasks in order to get the software up and running

1. Install and start a RethinkDB server to store our measurements.

2. Install Standard Firmata Wifi sketch on the MKR1000 and make sure it is connected to your home network.

3. Install Node.js to run our express web sever for both johnny-five and the client UI.

4. Create your configuration file

### 1. Installing RethinkDB

Go to https://www.rethinkdb.com/docs/install/ and click the appropriate installation depending on your operating system.

Follow the installation instruction on the rethinkdb website.

Once the installation has finished, you can start rethinkdb from the terminal by simply typing 'rethinkdb'. If you are on windows you will need to execute the rethinkdb.exe file that was unpacked during the installation. Simply open the cmd line and change directories to the location of the rethinkdb.exe. Then type `rethinkdb.exe` to start the rethinkdb server.

Now that the rethinkdb server is running, we can open our web broswser and go to `localhost:8080`. This is the rethinkdb web interface where you can manage your cluster. Here we will need to create the database `plant_monitoring_system` and a table to store our measurements named `measurements`.

To create a database, we can use the web interface. Open the web browser and go to `localhost:8080/tables`. Then click `add Database` button to create our database for this project. Type `plant_monitoring_system` with the underscores in the name. Then click create.

Next click the `Add table` button. Then type `measurements` and click create.

We now have a RethinkDB server running with our database `plant_monitoring_system` and our table `measurements`.

We only need to go to the UI, Data Explorer and run this query to create a date index:

`r.db('plant_monitoring_system').table('measurements').indexCreate('date')`

### 2. Installing Standard Firmata Wifi

Open Arduino IDE and go to `File` --> `Examples` --> `Firmata` --> `StandardFirmataWifi`.
This sketch will open a new Arduino IDE window with 2 tabs. The first tab is the `StandardFirmataWifi` sketch and the 2nd tab is the `wifiConfig` file. We need to change a few settings inside the wifi config and then upload this sketch to the MKR1000.

Click the `wifiConfig.h` tab.
Comment out Option A by add '//' in front of '#define ARDUINO_WIFI_SHIELD`
It should look like this when done.

`//#define ARDUINO_WIFI_SHIELD`

Scroll down and uncomment Option B by removing the leading `// on line `//#define WIFI_101`
It should look like below when done.

`#define WIFI_101`

Add you wifi ssid to the following line where it says 'your_network_name'

`char ssid[] = "Wish I had Google Fiber";`

Uncomment the line `// #define STATIC_IP_ADDRESS 192,168,1,113`
It should look like below when done.

`#define STATIC_IP_ADDRESS 192,168,1,113`

Enter you wifi password where it says `your_wpa_passphrase`;

`char wpa_passphrase[] = "mkr1000wifi";`

If you are using WEP then enter you password in the other option listed below in the next lines of the config.

That finishes up the settings for the StandFirmataWifi sketch. Now we need to compile the sketch and upload it to the MKR1000.

Connect the MKR1000 to the computer with the usb cable. Then select it in the Arduino IDE. Then `verify` the sketch by clicking the checkmark icon.
Once verified, Click the arrow icon to `upload` the sketch to the MKR1000.
The upload should complete and log some information about the size of the sketch.
You are now ready to connect to the MKR1000 using the firmata protocol.

### 3. Installing Node.js

Go to https://nodejs.org/en/ and click the big green button for the LTS (Long Term Support) version. This will download the installer for Node.js. Run the installer and follow the wizard.

Once installed you should be able to open up the command line and type `node -v` and it should return `v6.10.1` or whatever version you installed earlier. You should also be able to check the version of NPM with `npm -v`.

We will now install the Node.js app and start communicating using Johnny-Five.

Go to my repo and click download ZIP. Then extract the folder to a place you want to store the project. Now open the command line and 'cd' in to that folder of the project.
Once at the root of the project, we will need to install the dependencies and then start our app.

Run `npm install`. This installs all dependencies listed in our package.json file.

Once all dependencies are installed, run `npm start` to start our web server. At this point we will need to have already started our rethinkdb server as well as having the MKR1000 up and running the StandardFirmataWifi sketch and connected to your network.

### 4. Create your configuration file

Copy `config.example.js` from the root of this project to a new file called `config.js`.

Now edit these options as needed, each is described on the file:

```javascript
module.exports = {
  PORT              : 3000, // Application port (i.e. localhost:3000)
  REPL              : false, // Set to true if you want J5 board REPL
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
```


#### Email alerts

To enable email alerts in addition to activate it on the config you need to set *3 environment variables* wherever you run this code:

```bash
EMAIL_FROM=email@gmail.com  # email from where the alerts are going to be sent
EMAIL_FROM_PASS=password    # password for that email
EMAIL_TOP=another@gmail.com # email to sent the alerts to
```

These are kept outside of the code for security reasons.

Depending on which email service you use you may need to change `EMAIL_SERVICE` from `config.js`.

### Wiring

![Wiring](plant-monitor_bb.png "Wiring")
