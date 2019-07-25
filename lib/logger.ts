import winston from 'winston';
import split from 'split';

const { LOG_PATH } = process.env;
const transports = [];

function fileConfig (level: string, logFile: string): winston.FileTransportOptions {
  return { name: level, level, filename: `${LOG_PATH}/${logFile}` };
}
if (LOG_PATH) {
  transports.push(new winston.transports.File(fileConfig('info', 'output.log')));
} else {
  transports.push(new winston.transports.Console({ colorize: true, json: false, handleExceptions: true }));
}

export const logger = new winston.Logger({ transports });
export const stream = split().on('data', logger.info);
