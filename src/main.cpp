#include <Arduino.h>
#include <string.h>
using namespace std;

void printPinStates() {
  char pinStates[4];
  pinStates[0] = digitalRead(2);
  pinStates[1] = digitalRead(3);
  pinStates[2] = digitalRead(4);
  pinStates[3] = digitalRead(5);
  String printText = "Pin states: ";
  for (int i = 0; i < 4; i++) {
    const char* pinState = pinStates[i] == HIGH ? "HIGH " : "low ";
    printText += pinState;
  }
  Serial.println(printText);
  
}

void setup() {
  pinMode(2, OUTPUT);
  pinMode(3, OUTPUT);
  pinMode(4, OUTPUT);
  pinMode(5, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  static int currentPin = 2;
  static int previousPin = 5;
  static bool negative = false;

  digitalWrite(previousPin, LOW);
  digitalWrite(currentPin, HIGH);

  previousPin = currentPin;
  if (negative) {
    currentPin--;
  } else {
    currentPin++;
  }

  if (currentPin > 5) {
    currentPin = 5;
    negative = true;
  } else if (currentPin < 2) {
    currentPin = 2;
    negative = false;
  }

  printPinStates();
  delay(250);
}