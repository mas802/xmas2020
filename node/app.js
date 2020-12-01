function TwoWayMap(map) {
   this.map = map;
   this.reverseMap = {};
   for(var key in map) {
      var value = map[key];
      this.reverseMap[value] = key;
   }
}

TwoWayMap.prototype.get = function(key){ return this.map[key]; };
TwoWayMap.prototype.revGet = function(key){ return this.reverseMap[key]; };

var itemMap = new TwoWayMap({
   'TRAIN' : '99',
   'HOUSE' : '0',
   'CAVE' : '1',
   'SIGNAL1' : '2',
   'SIGNAL2' : '3',
   'SIGNAL3' : '4',
   'WHITE1' : '5',
   'WHITE2' : '6',
   'WARN' : '7',
   'SENSOR1' : '8',
   'SENSOR2' : '9',
   'SENSOR3' : '10'
});

var status = [{
   'HOUSE' : 1,
   'CAVE' : 1,
   'SIGNAL1' : 2,
   'SIGNAL2' : 3,
   'SIGNAL3' : 2,
   'WHITE1' : 2,
   'WHITE2' : 3,
   'WARN' : 0,
   'SENSOR1' : 0,
   'SENSOR2' : 0,
   'SENSOR3' : 0
}]

var statusMap = new TwoWayMap( {
    "0" : "OFF",
    "1" : "ON",
    "2" : "A",
    "3" : "B",
    "4" : "OFF",
    "5" : "ON"
});

var WebSocketClient = require('websocket').client;

const i2c = require('i2c-bus');
const I2C_ADDR1 = 0x0b;
const rbuffer = Buffer.alloc(16);
const wbuffer = Buffer.alloc(16);

const i2c1 = i2c.open(1, true, function (err) {
    if (err)  console.log(err);
});

readI2C = function() {
  i2c1.i2cRead(I2C_ADDR1, 16, rbuffer, function (err,n) {
    if (err)  console.log(err);
    console.log(rbuffer);
  });
}

sendI2C = function(item) {
  wbuffer[0] = item;
  i2c1.i2cWrite(I2C_ADDR1, 1, wbuffer, function (err,i) {
    if (err)  console.log(err);
  });
}

const PoweredUP = require("node-poweredup");
const poweredUP = new PoweredUP.PoweredUP();
let motorA;
let motorAtoggle = false;

poweredUP.on("discover", async (hub) => { // Wait to discover a Hub
    console.log(Date.now() + ` Discovered 1 ${hub.name}!`);
    await hub.connect(); // Connect to the Hub
    console.log(Date.now() + " Connected 1");
    motorA = await hub.waitForDeviceAtPort("A"); // Make sure a motor is plugged into port A
    console.log(Date.now() + " Connected");
    console.log(Date.now() + "battery level: " + hub.batteryLevel);
});




var client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log(Date.now() + ' Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log(Date.now() + " Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log(Date.now() + ' echo-protocol Connection Closed');
//        setTimeout(function() {
//          connect();
//        }, 1000);
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log(Date.now() + " Received: '" + message.utf8Data + "'");
            if (message.utf8Data === 'toggle:TRAIN') {
                if (motorA) {
                  if (!motorAtoggle) {
                    motorA.setPower(-50);
                    motorAtoggle = true;
                    setTimeout( function () {
                      motorA.setPower(0);
                      motorAtoggle = false;
                    }, 15000
                    );
                  } else {
                    motorA.setPower(0);
                    motorAtoggle = false;
                  }
                }
            } else if (message.utf8Data === 'toggle:HOUSE') {
                sendI2C(itemMap.get('HOUSE'));
            } else if (message.utf8Data === 'toggle:CAVE') {
                sendI2C(itemMap.get('CAVE'));
            } else if (message.utf8Data === 'toggle:SIGNAL1') {
                sendI2C(itemMap.get('SIGNAL1'));
            } else if (message.utf8Data === 'toggle:SIGNAL2') {
                sendI2C(itemMap.get('SIGNAL2'));
            } else if (message.utf8Data === 'toggle:SIGNAL3') {
                sendI2C(itemMap.get('SIGNAL3'));
            } else if (message.utf8Data === 'toggle:WHITE1') {
                sendI2C(itemMap.get('WHITE1'));
            } else if (message.utf8Data === 'toggle:WHITE2') {
                sendI2C(itemMap.get('WHITE2'));
            } else if (message.utf8Data === 'toggle:WARN') {
                sendI2C(itemMap.get('WARN'));
                setTimeout( function() {
                   healthCheck();
                   statusSync(true);
                }, 500);
            }
        }
    });

    function sendNumber() {
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            connection.sendUTF(Date.now() + " still alive: " + number.toString());
            setTimeout(sendNumber, 120000);
        }
    }
    sendNumber();
});

console.log(Date.now() + " deley startup by 20 seconds to make sure everything is ready");
setTimeout( function() {
  client.connect('ws://localhost:8080/trainws/xmas');
  poweredUP.scan(); // Start scanning for Hubs
  console.log(Date.now() + "Scanning for Hubs...");
}, 1000);



let color = 1;
setInterval(() => {
  healthCheck();
}, 300000);

function healthCheck() {

    const hubs = poweredUP.getHubs(); // Get an array of all connected hubs
    hubs.forEach(async (hub) => {
        const led = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
        led.setColor(color); // Set the color
        console.log(Date.now() + " battery level: " + hub.batteryLevel);
        setTimeout(() => {led.setColor(0)}, 10);
    })
    color++;
    if (color > 10) {
        color = 1;
    }
}

statusSync = function(force) {
  readI2C();
  setTimeout( function() {
    for (i = 0; i<10; i++) {
      item = itemMap.revGet(i);
      sold = status[item];
      snew = rbuffer[i];
      console.log(Date.now() + " STATE: "  + item + ":" + statusMap.get(snew) + ":" + i + ":" + sold + ":" + snew);
      if (force || sold!=snew) {
        status[item] = snew;
//          client.send("state:" + itemMap.revGet(i) + ":" + statusMap.get(i));
      }
    }
  }, 1000);
}
