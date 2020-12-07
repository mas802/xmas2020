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
    "5" : "ON",
    "99" : "failed"
});

// BOUNDARY I2C

const i2c = require('i2c-bus');
const I2C_ADDR1 = 0x0b;
const rbuffer = Buffer.alloc(16);
const wbuffer = Buffer.alloc(16);

const i2c1 = i2c.open(1, true, function (err) {
    if (err)  console.log(err);
});

lastread = 0;
readI2C = function() {
  if ( Date.now()-lastread > 1000) {
    lastread = Date.now();
    i2c1.i2cRead(I2C_ADDR1, 16, rbuffer, function (err,n) {
      if (err) { 
        console.log(err);
        for (i=0; i<16; i++) {
          rbuffer[i] = 99;
        }
      }
      console.log(rbuffer);
    });
  }
}

sendI2C = function(item) {
  wbuffer[0] = item;
  i2c1.i2cWrite(I2C_ADDR1, 1, wbuffer, function (err,i) {
    if (err)  console.log(err);
  });
}

// BOUNDARY POWEREDUP

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


// BOUNDARY WEBSOCKET
var W3CWebSocket = require('websocket').w3cwebsocket;
var client = new W3CWebSocket('ws://localhost:8080/trainws/xmas');

client.onerror = function() {
    console.log(Date.now() + 'Connection Error');
};

client.onopen = function() {
    console.log(Date.now() + 'WebSocket Client Connected');
};

client.onclose = function() {
    console.log(Date.now() + 'WebSocket Client Closed');
};

client.onmessage = function(e) {
    if (typeof e.data === 'string') {
        receiveMsg(e.data);
    }
};



function sendMsg(msg) {
    if (client.readyState === client.OPEN) {
        client.send(msg);
    }
}

function receiveMsg(message) {
    console.log(Date.now() + " Received: '" + message + "'");
    cmd = message.split(":");
    if (cmd[0] === "toggle") {
            if (message === 'toggle:TRAIN') {
                if (motorA) {
                  if (!motorAtoggle) {
                    motorA.setPower(-50);
                    motorAtoggle = true;
                    setTimeout( function () {
                      motorA.setPower(0);
                      motorAtoggle = false;
                    }, 15000);
                  } else {
                    motorA.setPower(0);
                    motorAtoggle = false;
                  }
                }
            } else if (message === 'toggle:HOUSE') {
                sendI2C(itemMap.get('HOUSE'));
            } else if (message === 'toggle:CAVE') {
                sendI2C(itemMap.get('CAVE'));
            } else if (message === 'toggle:SIGNAL1') {
                sendI2C(itemMap.get('SIGNAL1'));
            } else if (message === 'toggle:SIGNAL2') {
                sendI2C(itemMap.get('SIGNAL2'));
            } else if (message === 'toggle:SIGNAL3') {
                sendI2C(itemMap.get('SIGNAL3'));
            } else if (message === 'toggle:WHITE1') {
                sendI2C(itemMap.get('WHITE1'));
            } else if (message === 'toggle:WHITE2') {
                sendI2C(itemMap.get('WHITE2'));
            } else if (message === 'toggle:WARN') {
                sendI2C(itemMap.get('WARN'));
            }
            setTimeout( function() {
                healthCheck();
                statusSync(false);
            }, 300);
    }
    if (cmd[0] === "info") {
      statusSync(true, cmd[1]);
    }
}

// CONTROL

function healthCheck() {
    const hubs = poweredUP.getHubs(); // Get an array of all connected hubs
    hubs.forEach(async (hub) => {
        const led = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
        led.setColor(1); // Set the color
        console.log(Date.now() + " battery level: " + hub.batteryLevel);
        setTimeout(() => {led.setColor(0)}, 10);
    })
    sendMsg(Date.now() + "alive");
}

statusSync = function(forceall, forceditem) {
  readI2C();
  setTimeout( function() {
    for (i = 0; i<10; i++) {
      item = itemMap.revGet(i);
      sold = status[item];
      snew = rbuffer[i];
      console.log(Date.now() + " STATE: "  + item + ":" + statusMap.get(snew) + ":" + i + ":" + sold + ":" + snew);
      if (forceall || sold!=snew || forceditem===item) {
        status[item] = snew;
          sendMsg("state:" + item + ":" + statusMap.get(snew));
          console.log("sent");
      }
    }
    if (motorA) {
      sendMsg("state:TRAIN:ON");
    } else {
      sendMsg("state:TRAIN:failed");
    }
  }, 300);
}

console.log(Date.now() + " deley startupa bit to make sure everything is ready");
setTimeout( function() {
  poweredUP.scan(); // Start scanning for Hubs
  console.log(Date.now() + "Scanning for Hubs...");
  setTimeout( function() {statusSync(true)}, 1000);
}, 1000);


setInterval(() => {
  healthCheck();
}, 3600000);

