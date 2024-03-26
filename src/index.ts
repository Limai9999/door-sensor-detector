import { Controller } from 'zigbee-herdsman';
import path from 'path';
import soundPlayer from 'sound-play';
import SysTray, { MenuItem } from 'systray2';
import os from 'os';
import { showConsole, hideConsole } from 'node-hide-console-window';

// pkg . --no-bytecode --public-packages "*" --public --output exe_build\DoorDetector.exe

const isProduction = true;
const processPath = process.cwd();

const preDBPath = isProduction ? '../data/devices.db' : './data/devices.db';
const DBPath = path.resolve(processPath, preDBPath);

const coordinator = new Controller({
  serialPort: { path: 'COM3', adapter: 'ezsp' },
  databasePath: DBPath,
} as any);

async function start() {
  createTrayIcon();
  hideConsole();

  const startResult = await coordinator.start();
  console.log('startResult', startResult);

  await coordinator.permitJoin(true, undefined, 60);
  console.log('Joining permitted for 60 seconds...');

  coordinator.getDevices();

  let savedZoneStatus = -1;

  // @ts-ignore
  coordinator.on('message', async (msg: { type: string, data: object }) => {
    if (msg.type === 'commandStatusChangeNotification') {
      // zonestatus: 0 is closed, 1 is opened
      const data = msg.data as { zonestatus: number, extendedstatus: number };

      if (data.zonestatus === savedZoneStatus) return;
      savedZoneStatus = data.zonestatus;

      if (data.zonestatus === 0) {
        onDoorClosed();
      } else {
        onDoorOpened();
      }
    }
  });
}

function onDoorClosed() {
  console.log('door CLOSED');

  const filePath = path.join(processPath, '../assets/sounds/door_closed.mp3');
  soundPlayer.play(filePath, 0.3);
}

function onDoorOpened() {
  console.log('door OPENED');

  const filePath = path.join(processPath, '../assets/sounds/door_opened.mp3');
  soundPlayer.play(filePath, 0.3);
}

function createTrayIcon() {
  const itemShowConsole = {
    title: 'Show Console',
    tooltip: 'Show Console',
    checked: false,
    enabled: true,
    click: () => {
      showConsole();
    },
  };

  const itemHideConsole = {
    title: 'Hide Console',
    tooltip: 'Hide Console',
    checked: false,
    enabled: true,
    click: () => {
      hideConsole();
    },
  };

  const itemExit = {
    title: 'Exit',
    tooltip: 'Close the application',
    checked: false,
    enabled: true,
    click: () => {
      systray.kill();
    },
  };

  const iconPath = path.join(processPath, '../assets/images/icon.ico');

  const systray = new SysTray({
    menu: {
      icon: iconPath,
      isTemplateIcon: os.platform() === 'darwin',
      title: 'Door Detector',
      tooltip: 'Door Detector',
      items: [
        itemShowConsole,
        itemHideConsole,
        itemExit,
      ],
    },
    debug: false,
    copyDir: true,
  });

  systray.onClick(action => {
    // @ts-ignore
    if (action.item.click != null) {
      // @ts-ignore
      action.item.click();
    }
  });

  // Systray.ready is a promise which resolves when the tray is ready.
  systray.ready().then(() => {
    console.log('systray started!');
  }).catch((err) => {
    console.log('systray failed to start: ' + err.message);
  });
}

start();
