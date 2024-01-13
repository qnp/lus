import * as fs from 'fs';
import * as path from 'path';
import * as stylusSupremacy from 'stylus-supremacy';
import type { FormattingOptions } from 'stylus-supremacy';

import Glob from 'glob';
const glob = Glob.glob;

const LUS = '\x1b[36mLus:\x1b[0m';
const WARNING = '\x1b[33mwarning\x1b[0m';
const ERROR = '\x1b[31merror\x1b[0m';

/**
 * A simple loggin class
 */
export class Logger {
  private verbose = false;
  constructor(verbose: boolean) {
    this.verbose = verbose;
  }
  log(...args: any) {
    if (this.verbose) {
      console.log(LUS, ...args);
    }
  }
  warn(...args: any) {
    console.warn(LUS, WARNING, ...args);
  }
  error(...args: any) {
    console.error(LUS, ERROR, 'error', ...args);
  }
}

export interface LusOptions {
  /**
   * Verbose output
   */
  verbose: boolean;
  /**
   * The config file name
   */
  config: string;
  /**
   * Ignore files matching these glob patterns
   */
  ignore: string[];
  /**
   * The glob patterns to match files
   */
  globs: string[];
}

/**
 * Lus class
 */
export class Lus {
  private options: LusOptions;
  private logger: Logger;
  private stylusSupremacyOptions: FormattingOptions;

  constructor(options: LusOptions) {
    // Assign options
    this.options = options;
    // Create logger
    this.logger = new Logger(options.verbose);
    // Get stylusrc options
    this.stylusSupremacyOptions = this.getConfigFileOptions();
  }
  /**
   * Get formatting options from a config file
   * @returns The resolved formatting options
   */
  public getConfigFileOptions(): FormattingOptions {
    const currentDir = process.cwd();
    const configFilePath = path.join(currentDir, this.options.config);
    if (fs.existsSync(configFilePath)) {
      this.logger.log('using config file', configFilePath);
      try {
        return JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
      } catch (error: unknown) {
        this.logger.error('Malformed JSON in config file: ' + configFilePath);
        this.logger.error(error);
        return {};
      }
    } else {
      this.logger.warn('No config file found. Using default settings.');
      return {};
    }
  }

  /**
   * Format a file based on its path and the formatting options
   * @param filePath - The file path
   * @param stylusSupremacyOptions - The resolved stylus supremacy options
   * @async
   */
  public async format(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Get file content
        const fileContent = fs.readFileSync(filePath, 'utf-8');

        const styleMatches = [
          ...fileContent.matchAll(/<style[^>]*\s+lang="stylus"[^>]*>/g),
        ];
        let newFileContent = fileContent;
        for (let styleMatch of styleMatches) {
          const startStyleTag = styleMatch?.[0];
          const startStyleIndex = styleMatch?.index;

          if (startStyleTag && startStyleIndex) {
            const endStyleIndex =
              fileContent.slice(startStyleIndex).indexOf('</style>') +
              startStyleIndex;
            const styleContent = fileContent.substring(
              startStyleIndex + startStyleTag.length,
              endStyleIndex
            );
            const formattedStyle = stylusSupremacy.format(
              styleContent,
              this.stylusSupremacyOptions
            );

            // Write new file content
            newFileContent = newFileContent.replace(
              styleContent,
              formattedStyle
            );
          }
        }

        fs.writeFileSync(filePath, newFileContent, 'utf-8');

        resolve();
      } catch (error: any) {
        this.logger.error(error);
        reject(error);
      }
    });
  }

  /**
   * Run the formatter on all files matching the glob pattern
   * @async
   */
  public async run(): Promise<void> {
    // Build glob options
    const globOptions = {
      ignore: ['node_modules/**/*', ...this.options.ignore],
    };
    return new Promise((resolve, reject) => {
      try {
        const files = this.options.globs.flatMap(pattern =>
          glob.sync(pattern, globOptions)
        );
        if (!files.length) resolve();
        files.reduce((seq: Promise<void>, file: string, index: number) => {
          return seq.then(() => {
            this.logger.log('formatting', file);
            if (index === files.length - 1) resolve();
            return this.format(file);
          });
        }, Promise.resolve());
      } catch (error: unknown) {
        this.logger.error(error);
        reject(error);
      }
    });
  }
}
