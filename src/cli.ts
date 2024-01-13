#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

import { Command } from 'commander';

// Using .js for dist ESM to work because TS does not add it at compilation
import { Lus } from './lib.js';
import type { LusOptions } from './lib.js';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

const { version } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

program
  .name('lus')
  .description(
    'Format Vue SFC files that uses stylus, based on stylus-supremacy'
  )
  .version(version);

program
  .argument('<files/globs...>', 'Files or globs to format on')
  .option('-v, --verbose', 'verbose output', false)
  .option('-c, --config <config>', 'the config file to use', '.stylusrc')
  .option('-C, --check', 'only check if files are formatted', false)
  .option(
    '-i, --ignore <globs>',
    'ignore files using these comma-separated glob patterns',
    (value: string) => value.split(','),
    []
  ).action((globs: string[], options: Omit<LusOptions, 'globs'>) => {
    const lusOptions: LusOptions = {
      ...options,
      globs,
    }
    const lus = new Lus(lusOptions);

    lus.run().catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });

  })

program.parse();
