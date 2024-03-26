import Config from '../modules/Config';

import { MainConfig } from '../types/Configs/MainConfig';

export function mainConfig() {
  const config = new Config('main.json');
  const data = config.getData() as MainConfig;

  return {
    config,
    configData: data,
    saveConfig: (data: MainConfig) => config.saveData(data),
  };
}