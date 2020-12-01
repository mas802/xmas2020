#include <Wire.h>

#define I2C_SLAVE_ADDRESS 11

#define PAYLOAD_SIZE 2

const int HOUSE = 0;
const int CAVE = 1;

const int SIGNAL1 = 2;
const int SIGNAL2 = 3;
const int SIGNAL3 = 4;

const int WHITE1 = 5;
const int WHITE2 = 6;

const int WARN = 7;

const int SENSOR1 = 8;
const int SENSOR2 = 9;
const int SENSOR3 = 10;



const int STATUS_OFF       = 0;
const int STATUS_ON        = 1;
const int STATUS_A         = 2;
const int STATUS_GREEN     = 2;
const int STATUS_B         = 3;
const int STATUS_RED       = 3;
const int STATUS_TRANS_OFF = 4;
const int STATUS_TRANS_ON  = 5;


//              H   C  S1  S2  S3  W1  W2   X  S1  S3  S3   N
int status[] {  5,  5,  2,  3,  3,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0};
int value[]  { 50, 50,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0};
int pinA[]   { A3,  A1, 10,  9,  3, 13,  5,  7, A0, A2, A1,  0};
int pinB[]   { -1, -1, 11,  8,  2, 12,  4,  6, -1, -1, -1,  0};



const int delta = 600;
int n = 0;
int state = 0;

// These constants won't change. They're used to give names to the pins used:
const int analogInPin[] = {A0,A2,A1}; 

int   sensorValue[] = {-1,-1,-1 };        // value read from the pot
int   lowRefValue[] = {0,0,0};      
int  highRefValue[] = {600,600,600};      
int sensorCounter[] = {0,0,0};


void setup()
{
  Serial.begin(9600); 
  Serial.println("-------Lego XMAS2020");
  delay(1000);

  Wire.begin(I2C_SLAVE_ADDRESS);
  Wire.onRequest(requestEvents);
  Wire.onReceive(receiveEvents);

  for (int i = 0; i<14; i++) {
    pinMode(i, OUTPUT);
  }

  pinMode(pinA[CAVE], OUTPUT);
  pinMode(pinA[HOUSE], OUTPUT);

  turnGreen(SIGNAL1);
  turnRed(SIGNAL2);
  turnRed(SIGNAL3);

  flickerOn(CAVE, 50);
  flickerOn(HOUSE, 50);
}

void action(int s) {
  Serial.print("action = ");
  Serial.println(s);
  state = s;
  if (s == 0) {
    turnRed(SIGNAL1);
    turnGreen(SIGNAL2);
    turnGreen(SIGNAL3);
    turnOn(WARN);

    toggle(WHITE1);

    flickerOn(HOUSE, 50);
    flickerOff(CAVE, 50);

    sensorCounter[1]=0;
    sensorCounter[2]=0;
  } else if (s==1) {
    turnGreen(SIGNAL1);
    turnRed(SIGNAL2);
    turnRed(SIGNAL3);
    turnOff(WARN);

    toggle(WHITE2);

    flickerOff(HOUSE, 50);
    flickerOn(CAVE, 50);

    sensorCounter[0]=0;
    sensorCounter[2]=0;
  } else if (s==2) {

    sensorCounter[0]=0;
    sensorCounter[1]=0;
  }
}


void requestEvents()
{
    Serial.print(F("requestEvents START -- "));
    for ( int i = 0; i<16; i++ ) {
      Wire.write(status[i]);
      Serial.print(status[i]);
      Serial.print(" ");
    }
    Serial.println(F(" -- requestEvents END"));
}


void receiveEvents(int numBytes)
{
  Serial.print(F("---> recieved events \tnum= "));
  Serial.println(numBytes);

  // clear queue
  while(1 < Wire.available()) // loop through all but the last
  {
    int c = Wire.read();
    Serial.print( "Receive too much: " );
    Serial.println(c);
  }

    int item = Wire.read();

    Serial.print(F("---> recieved events \titem = "));
    Serial.println(item);

    switch (item) {
      case HOUSE:
      case CAVE:
        flickerToggle(item, 50);
        break;
      case WARN:
      case SIGNAL1:
      case SIGNAL2:
      case SIGNAL3:
      case WHITE1:
      case WHITE2:
        toggle(item);
        break;
    }

  Serial.println(F(" receive END -- "));

}


void bigUpdate(int time) {

  if ( status[WARN] == STATUS_ON ) {
    blink(WARN);
  } else if ( status[WARN] != STATUS_OFF ) {
    turnOff(WARN);
  }

}


void smallUpdate( int counter ) {
  
  // READ SENSORS
  for (int s = 0; s<2; s++) {
    sensorValue[s] = analogRead(analogInPin[s]);

    if ( sensorValue[s] > highRefValue[s] ) {
      sensorCounter[s]++;
      action(s);
      highRefValue[s] = 1000;
      lowRefValue[s] = 10;
    }

    if ( sensorValue[s] < lowRefValue[s] ) {
      highRefValue[s] = 600;
      lowRefValue[s] = -1;
    }
  }

  // FLICKER HOUSE ON
  if ( status[HOUSE] == STATUS_TRANS_ON) {
    value[HOUSE]--;
    digitalWrite(pinA[HOUSE], random(0, 2));
    if ( value[HOUSE] < 0 ) {
       turnOn(HOUSE);
    }
  }

  // FLICKER HOUSE OFF
  if ( status[HOUSE] == STATUS_TRANS_OFF) {
    value[HOUSE]--;
    digitalWrite(pinA[HOUSE], random(0, 2));
    if ( value[HOUSE] < 0 ) {
       turnOff(HOUSE);
    }
  }

  // FLICKER CAVE ON
  if ( status[CAVE] == STATUS_TRANS_ON) {
    value[CAVE]--;
    digitalWrite(pinA[CAVE], random(0, 2));
    if ( value[CAVE] < 0 ) {
       turnOn(CAVE);
    }
  }

  // FLICKER CAVE OFF
  if ( status[CAVE] == STATUS_TRANS_OFF) {
    value[CAVE]--;
    digitalWrite(pinA[CAVE], random(0, 2));
    if ( value[CAVE] < 0 ) {
       turnOff(CAVE);
    }
  }
}


int maincounter = 0;

int smalldelta = 20;
int bigdelta = 1000/smalldelta;

void loop() {
  maincounter++;

  if ( maincounter % bigdelta == 0 ) {
     bigUpdate( maincounter );
  }

  smallUpdate( maincounter );

  delay(smalldelta);
}


void turnOn( int item ) {
  Serial.print("Turn item on: "); Serial.println(item);
  switch (item) {
    case SIGNAL1:
    case SIGNAL2:
    case SIGNAL3:
    case WHITE1:
    case WHITE2:
      turnA( item );
      status[item]=STATUS_A;      
      break;
    case WARN:
      blink( item );
      status[item]=STATUS_ON;
      break;
    default:
      digitalWrite(pinA[item], HIGH);
      status[item]=STATUS_ON;
    }
}

void turnOff( int item ) {
  Serial.print("Turn item off: "); Serial.println(item);
  digitalWrite(pinA[item], LOW);
  if (pinB[item]!=-1) digitalWrite(pinB[item], LOW);
  status[item]=STATUS_OFF;
}

void turnA( int item ) {
  Serial.print("Turn item A: "); Serial.println(item);
  digitalWrite(pinA[item], HIGH);
  digitalWrite(pinB[item], LOW);
  status[item]=STATUS_A;
}

void turnB( int item ) {
  Serial.print("Turn item B: "); Serial.println(item);
  digitalWrite(pinA[item], LOW);
  digitalWrite(pinB[item], HIGH);
  status[item]=STATUS_B;
}

void turnGreen( int item ) {
  turnA(item);
}

void turnRed( int item ) {
  turnB(item);
}

void flickerOn( int item, int duration ) {
  if ( status[item] != STATUS_ON ) {
      status[item] = STATUS_TRANS_ON;
      value[item] = duration;
  }
}

void flickerOff( int item, int duration ) {
  if ( status[item] != STATUS_OFF ) {
      status[item] = STATUS_TRANS_OFF;
      value[item] = duration;
  }
}

void blink( int item ) {
  value[item] = !value[item];
  digitalWrite(pinA[item], value[item]);
  digitalWrite(pinB[item], !value[item]);
}

void toggle( int item ) {
  Serial.println("Toggle item: "); Serial.println(item);
  switch ( status[item] ) {
    case STATUS_ON:
    case STATUS_TRANS_ON:
      turnOff(item);
      break;
    case STATUS_OFF:
    case STATUS_TRANS_OFF:
      turnOn(item);
      break;
    case STATUS_A: // GREEN
      turnB(item);
      break;
    case STATUS_B: // RED
      turnA(item);
      break;
  }
}



void flickerToggle( int item, int duration ) {
  Serial.println("Toggle item flicker: "); Serial.println(item);
  switch ( status[item] ) {
    case STATUS_ON:
    case STATUS_TRANS_ON:
      status[item] = STATUS_TRANS_OFF;
      value[item] = duration;
      break;
    case STATUS_OFF:
    case STATUS_TRANS_OFF:
      status[item] = STATUS_TRANS_ON;
      value[item] = duration;
      break;
  }
}
