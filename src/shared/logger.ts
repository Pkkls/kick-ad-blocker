import { EXT_PREFIX } from './constants';

type Level = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  scope: string;
  enabled?: boolean;
}

export class Logger {
  private scope: string;
  private enabled: boolean;

  constructor(opts: LoggerOptions) {
    this.scope = opts.scope;
    this.enabled = opts.enabled ?? true;
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  child(scope: string): Logger {
    return new Logger({ scope: `${this.scope}/${scope}`, enabled: this.enabled });
  }

  debug(...args: unknown[]): void {
    if (this.enabled) this.write('debug', args);
  }
  info(...args: unknown[]): void {
    if (this.enabled) this.write('info', args);
  }
  warn(...args: unknown[]): void {
    this.write('warn', args);
  }
  error(...args: unknown[]): void {
    this.write('error', args);
  }

  private write(level: Level, args: unknown[]): void {
    const tag = `${EXT_PREFIX}[${this.scope}]`;
    // eslint-disable-next-line no-console
    const fn = level === 'debug' ? console.debug : console[level];
    fn(tag, ...args);
  }
}

export const rootLogger = new Logger({ scope: 'core' });
