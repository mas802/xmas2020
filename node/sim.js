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
   'TRAIN' : '11',
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

const rbuffer = Buffer.alloc(16);

sendI2C = function(item) {
    sold = +status[itemMap.revGet(item)];
    switch (sold) {
      case 0:
      case 4:
        rbuffer[item] = 1;
        break;
      case 1:
      case 5:
        rbuffer[item] = 0;
        break;
      case 2:
        rbuffer[item] = 3;
        break;
      case 3:
        rbuffer[item] = 2;
        break;
    }
    console.log(sold);
    console.log(item);
    console.log(rbuffer);
}

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
                sendI2C(itemMap.get('TRAIN'));
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
            }, 100);
    }
    if (cmd[0] === "info") {
                statusSync(true);
    }
}

// CONTROL

function healthCheck() {
    sendMsg(Date.now() + "alive");
}

statusSync = function(force) {
  setTimeout( function() {
    for (i = 0; i<10; i++) {
      item = itemMap.revGet(i);
      sold = status[item];
      snew = rbuffer[i];
      console.log(Date.now() + " STATE: "  + item + ":" + statusMap.get(snew) + ":" + i + ":" + sold + ":" + snew);
      if (force || sold!=snew) {
        status[item] = snew;
          sendMsg("state:" + item + ":" + statusMap.get(snew));
          console.log("sent");
      }
    }
  }, 200);
}

console.log(Date.now() + " deley startupa bit to make sure everything is ready");
setTimeout( function() {
  console.log(Date.now() + "Scanning for Hubs...");
  setTimeout( function() {statusSync(true)}, 1000);
}, 1000);


setInterval(() => {
  healthCheck();
}, 300000);

