const fs = require('fs-extra');
const path = require('path');
const config = require('../config/config');

class Logger {
  constructor() {
    this.logFile = path.join(config.paths.logs, 'execution.log');
    fs.ensureDirSync(config.paths.logs);
  }

  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  log(message) {
    this.info(message);
  }

  info(message) {
    const formatted = this.formatMessage('INFO', message);
    console.log(formatted);
    fs.appendFileSync(this.logFile, formatted + '\n');
  }

  warn(message) {
    const formatted = this.formatMessage('WARN', message);
    console.warn(formatted);
    fs.appendFileSync(this.logFile, formatted + '\n');
  }

  error(message, error = null) {
    let errStr = message;
    if (error && error.stack) {
      errStr += ` | Stack: ${error.stack}`;
    } else if (error) {
      errStr += ` | Error: ${error}`;
    }
    const formatted = this.formatMessage('ERROR', errStr);
    console.error(formatted);
    fs.appendFileSync(this.logFile, formatted + '\n');
  }

  clear() {
    if (fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, '');
    }
  }
}

module.exports = new Logger();
