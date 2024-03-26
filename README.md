# A simple Node JS application for Zigbee Door Sensor with Sound Notifications

If you sit at a computer with headphones on and sit so that you can’t see the door, so you don’t hear when someone comes in, then this application is for you!

# Requirements 
* USB Zigbee Dongle, tested with [SONOFF Zigbee 3.0 USB Dongle Plus-E](https://ozon.ru/t/nbLbl1d)
* Door & Window Sensor, tested with Tuya Smart Zigbee Door Sensor

# Installation
* Clone this repo
* Install dependencies: ```npm i```
* Open Device Manager and find your dongle COM port. Look into Ports (COM & LPT) list.
* Put this COM port to the 17 line in src/index.ts: ```serialPort: { path: 'YOUR_COM_PORT_HERE, EXAMPLE: COM3', adapter: 'ezsp' },```
* Build application: ```npm run build```
* Create EXE File: ```pkg . --no-bytecode --public-packages "*" --public --output exe_build\DoorDetector.exe```

That's it!
You can put EXE in autorun and now you can sit with your headphones on and listen to whatever you want without the fear of someone sneaking up behind you.
