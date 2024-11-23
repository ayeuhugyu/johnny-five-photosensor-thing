// very useful website!!! https://johnny-five.io/examples

import five from 'johnny-five';
import * as log from "../lib/log.js";
import chalk from 'chalk';
const { Board, Sensor, Led, Servo } = five;
const board = new Board({ port: "COM7" });

board.on("ready", () => {
    const photoresistor = new Sensor({
        pin: "A2",
        freq: 250
    });

    const servo = new five.Servo({
        id: "ItemDetectedServo",     // User defined id
        pin: 9,           // Which pin is it attached to?
        type: "standard",  // Default: "standard". Use "continuous" for continuous rotation servos
        range: [0,180],    // Default: 0-180
        fps: 100,          // Used to calculate rate of movement between positions
        invert: false,     // Invert all specified positions
        startAt: 90,       // Immediately move to a degree
        center: true,      // overrides startAt if true and moves the servo to the center of the range
    });

    const isDifferentLED = new Led(13);
    const sampleSizeSmallLED = new Led(12);
    const thingDetectedLED = new Led(11);

    board.repl.inject({
        pot: photoresistor
    });
    
    let environmentLightValue = 980; // value recorded at 11 AM, has no significance.
    let values = [];
    const sampleSize = 100;
    const sampleMin = 20;
    const sensitivity = 5;
    const differentLimit = 50;
    const thingDetectionLimit = 5;

    let differentCounter = 0;
    let thingDetected = false;
    let previousThingDetectedState = false;
    photoresistor.on("data", () => {
        if (differentCounter > differentLimit) {
            log.error(chalk.red("value detected different for extended period, clearing sample data"))
            values = [];
            thingDetectedLED.off();
            servo.to(90);
            differentCounter = 0;
            return;
        }
        if (values.length < sampleMin) {
            sampleSizeSmallLED.on();
            log.warn("sample size too small: ", values.length);
        } else {
            sampleSizeSmallLED.off();
        }
        thingDetected = differentCounter >= thingDetectionLimit - 1;
        if (thingDetected) {
            thingDetectedLED.on();
            servo.to(0);
        }
        if (thingDetected && !previousThingDetectedState) {
            setTimeout(() => {
                if (!thingDetected) {
                    thingDetectedLED.off();
                    servo.to(90);
                }
            }, 5000);
        }
        previousThingDetectedState = thingDetected;
        if ((photoresistor.value > environmentLightValue + sensitivity) || (photoresistor.value < environmentLightValue - sensitivity)) {
            if (values.length > sampleMin) {
                log.info(chalk.blue("value detected different: "), parseInt(photoresistor.value.toFixed(0)), "current average: ", parseInt(environmentLightValue.toFixed(0)), "differentCounter: ", differentCounter);
                isDifferentLED.on();
                differentCounter++;
                return;
            }
        }
        differentCounter = 0;
        isDifferentLED.off();
        values.push(photoresistor.value);
        if (values.length > sampleSize) {
            values.shift();
        }
        const sum = values.reduce((a, b) => a + b, 0);
        environmentLightValue = sum / values.length;
        log.info(chalk.green("no significant change detected,"), "current value: ", parseInt(environmentLightValue.toFixed(0)), "current average: ", parseInt(environmentLightValue.toFixed(0)));
    });
});