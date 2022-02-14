import * as fs from 'fs';
import * as path from 'path';
import * as stylusSupremacy from 'stylus-supremacy';
import type { FormattingOptions } from 'stylus-supremacy';

import glob from 'glob';

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
   * The glob pattern to match files
   */
  glob: string;
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
   */
  public format(filePath: string) {
    try {
      // Get file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Select text that is contained between <style lang="stylus"> and </style>
      const startStyleMatch = fileContent.match(/<style\s+lang="stylus"\s*>/);
      const startStyleTag = startStyleMatch?.[0];
      const startStyle = startStyleMatch?.index;
      if (startStyleTag && startStyle) {
        const endStyle = fileContent.indexOf('</style>');
        const styleContent = fileContent.substring(
          startStyle + startStyleTag.length,
          endStyle
        );
        const formattedStyle = stylusSupremacy.format(
          styleContent,
          this.stylusSupremacyOptions
        );

        // Write new file content
        const newFileContent = fileContent.replace(
          styleContent,
          formattedStyle
        );
        fs.writeFileSync(filePath, newFileContent, 'utf-8');
      }
    } catch (error: any) {
      this.logger.error(error);
    }
  }

  /**
   * Run the formatter on all files matching the glob pattern
   */
  public run() {
    // Build glob options
    const globOptions = {
      ignore: ['node_modules/**/*', ...this.options.ignore],
    };
    glob.glob(
      this.options.glob,
      globOptions,
      (err: Error | null, files: string[]) => {
        if (err) this.logger.error(err);
        else {
          for (const file of files) {
            this.logger.log('formatting', file);
            this.format(file);
          }
        }
      }
    );
  }
}
