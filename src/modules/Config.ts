import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';

export default class Config {
  name: string;
  path: string;

  constructor(fileName: string) {
    this.name = fileName;
    this.path = path.join(process.cwd(), '../data', fileName);
  }

  getData(): any {
    const data = readFileSync(this.path, 'utf-8');
    return JSON.parse(data);
  }

  saveData(data: any, log = true): boolean {
    try {
      const stringifiedData = JSON.stringify(data, null, 2);
      writeFileSync(this.path, stringifiedData);

      if (log) console.log(`Config ${this.name} has been saved.`.green);

      return true;
    } catch (error) {
      console.log(`An error occurred while saving the config ${this.name}. Error:`.red, error);
      return false;
    }
  }

  static getFilePath(filename: string) {
    return path.join(process.cwd(), '../data', filename);
  }
}
