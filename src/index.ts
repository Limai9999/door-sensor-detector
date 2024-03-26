import 'colors';
import { Controller } from 'zigbee-herdsman';
import path from 'path';
import soundPlayer from 'sound-play';
import SysTray from 'systray2';
import os from 'os';
import { showConsole, hideConsole } from 'node-hide-console-window';
import robot from 'robotjs';

import { mainConfig } from './utils/getConfig';

import { MainConfig } from './types/Configs/MainConfig';
import { Device } from 'zigbee-herdsman/dist/controller/model';

// pkg . --no-bytecode --public-packages "*" --public --output exe_build\DoorDetector.exe

// eslint-disable-next-line prefer-const
let { configData, saveConfig } = mainConfig();

const isProduction = true;
const processPath = process.cwd();

const preDBPath = isProduction ? '../data/devices.db' : './data/devices.db';
const DBPath = path.resolve(processPath, preDBPath);

const coordinator = new Controller({
  serialPort: { path: configData.COM, adapter: 'ezsp' },
  databasePath: DBPath,
} as any);

async function start() {
  createTrayIcon();
  if (!configData.showConsole) hideConsole();

  const startResult = await coordinator.start();
  console.log('Start Result Code:', startResult);

  await coordinator.permitJoin(true, undefined, 60);
  console.log('Joining permitted for 60 seconds... Now you can pair your sensor.'.yellow);

  let devices = coordinator.getDevices();
  if (devices.length <= 1) showConsole();

  const logDevices = (devices: Device[]) => {
    console.log('Connected Devices:', devices.map((device, index) => `${index + 1}. ${device.type}: ${device.manufacturerName || 'Invalid Manufacturer Name'} - ${device.modelID || 'Invalid Model ID'}`).join(', '));
  };
  logDevices(devices);

  setInterval(() => {
    const newDevices = coordinator.getDevices();
    if (devices.length !== newDevices.length) logDevices(newDevices);

    devices = newDevices;
  }, 3000);

  setTimeout(() => {
    console.log('Pairing is no longer available. Restart the application if you haven\'t paired your sensor.'.yellow);
  }, 1000 * 60);

  let savedZoneStatus = -1;

  // @ts-ignore
  coordinator.on('message', async (msg: { type: string, data: object }) => {
    if (msg.type === 'commandStatusChangeNotification') {
      // zonestatus: 0 is closed, 1 is opened
      const data = msg.data as { zonestatus: number, extendedstatus: number };

      if (data.zonestatus === savedZoneStatus) return;
      savedZoneStatus = data.zonestatus;

      data.zonestatus === 0 ? onDoorClosed() : onDoorOpened();
    }
  });
}

function updateConfig(config: MainConfig) {
  saveConfig(config);
  configData = config;
}

function onDoorClosed() {
  console.log('Door has been CLOSED'.green);

  if (configData.playSound) {
    const filePath = path.join(processPath, '../assets/sounds/door_closed.mp3');
    soundPlayer.play(filePath, configData.volume.close);
  }
}

function onDoorOpened() {
  console.log('Door has been OPENED'.red);

  if (configData.playSound) {
    const filePath = path.join(processPath, '../assets/sounds/door_opened.mp3');
    soundPlayer.play(filePath, configData.volume.open);
  }

  if (configData.pressEscapeButton) {
    robot.keyTap('escape');
  }

  if (configData.hideAllWindows) {
    robot.keyTap('d', ['command']);
  }
}

function createTrayIcon() {
  const itemShowHideConsole = {
    title: `${configData.showConsole ? 'Hide' : 'Show'} Console`,
    tooltip: `${configData.showConsole ? 'Hide' : 'Show'} Console`,
    checked: false,
    enabled: true,
    click: () => {
      configData.showConsole ? hideConsole() : showConsole();

      configData.showConsole = !configData.showConsole;
      updateConfig(configData);

      itemShowHideConsole.title = `${configData.showConsole ? 'Hide' : 'Show'} Console`;
      itemShowHideConsole.tooltip = `${configData.showConsole ? 'Hide' : 'Show'} Console`;
      systray.sendAction({
        type: 'update-item',
        item: itemShowHideConsole,
      });
    },
  };

  const itemPlaySound = {
    title: 'Play Sound',
    tooltip: 'Play Sound',
    checked: configData.playSound,
    enabled: true,
    click: () => {
      configData.playSound = !configData.playSound;
      updateConfig(configData);

      itemPlaySound.checked = configData.playSound;

      systray.sendAction({
        type: 'update-item',
        item: itemPlaySound,
      });
    },
  };

  const itemPressEscapeButton = {
    title: 'Press "Escape" Button when opened',
    tooltip: 'Press "Escape" Button when opened',
    checked: configData.pressEscapeButton,
    enabled: true,
    click: () => {
      configData.pressEscapeButton = !configData.pressEscapeButton;
      updateConfig(configData);

      itemPressEscapeButton.checked = configData.pressEscapeButton;

      systray.sendAction({
        type: 'update-item',
        item: itemPressEscapeButton,
      });
    },
  };

  const itemHideAllWindows = {
    title: 'Hide all windows (Show Desktop) when opened',
    tooltip: 'Hide all windows (Show Desktop) when opened',
    checked: configData.hideAllWindows,
    enabled: true,
    click: () => {
      configData.hideAllWindows = !configData.hideAllWindows;
      updateConfig(configData);

      itemHideAllWindows.checked = configData.hideAllWindows;

      systray.sendAction({
        type: 'update-item',
        item: itemHideAllWindows,
      });
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
        itemShowHideConsole,
        SysTray.separator,
        itemPlaySound,
        itemPressEscapeButton,
        itemHideAllWindows,
        SysTray.separator,
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
    console.log('System Tray Icon started!');
  }).catch((err) => {
    console.log('System Tray Icon failed to start: ' + err.message);
  });
}

start();
