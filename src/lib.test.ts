import fs from 'fs';
import { Logger, Lus } from './lib';
import type { LusOptions } from './lib';

const testLusOptions: LusOptions = {
  verbose: true,
  config: '.test/.stylusrc',
  globs: ['**/*.vue'],
};

const testFormattingConfig = {
  insertColons: false,
  insertSemicolons: false,
  insertBraces: false,
  sortProperties: false,
  alwaysUseZeroWithoutUnit: true,
  selectorSeparator: ',\n',
  insertNewLineBeforeElse: true,
  tabStopChar: '  ',
  newLineChar: '\n',
};

const testVueContent = (style: string) => `<template lang="pug">
.Test Hello
</template>

<style lang="stylus">
${style}
</style>

<style lang="stylus" scoped>
${style}
</style>

<style lang="stylus" rel="stylesheet/stylus">
${style}
</style>

<script setup lang="ts">
// silence is golden
</script>
`;

const inputStyle = `.Test {
	padding 10px;
	color red;
}`;

const outputStyleDefault = `.Test {
	padding: 10px;
	color: red;
}`;

const outputStyleWithConfig = `.Test
  padding 10px
  color red`;

beforeAll(() => {
  if (!fs.existsSync('.test')) fs.mkdirSync('.test');
  fs.writeFileSync(
    '.test/.stylusrc',
    JSON.stringify(testFormattingConfig),
    'utf-8'
  );
});

afterAll(() => {
  fs.rmdirSync('.test', { recursive: true });
});

describe('Lus logger', () => {
  const consoleLog = jest
    .spyOn(global.console, 'log')
    .mockImplementation(() => {});
  const consoleWarn = jest
    .spyOn(global.console, 'warn')
    .mockImplementation(() => {});
  const consoleError = jest
    .spyOn(global.console, 'error')
    .mockImplementation(() => {});
  it('does not log when not verbose', () => {
    const logger = new Logger(false);
    logger.log('test');
    expect(consoleLog).not.toHaveBeenCalled();
  });
  it('logs in verbose mode', () => {
    const logger = new Logger(true);
    logger.log('test');
    expect(consoleLog).toHaveBeenCalled();
  });
  it('warns in any case', () => {
    const loggerVerbose = new Logger(true);
    const loggerSilent = new Logger(false);
    loggerVerbose.warn('test');
    loggerSilent.warn('test');
    expect(consoleWarn).toHaveBeenCalledTimes(2);
  });
  it('logs error in any case', () => {
    const loggerVerbose = new Logger(true);
    const loggerSilent = new Logger(false);
    loggerVerbose.error('test');
    loggerSilent.error('test');
    expect(consoleError).toHaveBeenCalledTimes(2);
  });
});

describe('Lus options resolver', () => {
  it('warns about missing config file and outputs empty config', () => {
    const consoleWarn = jest
      .spyOn(global.console, 'warn')
      .mockImplementation(() => {});
    const defaultTestLus = new Lus({ ...testLusOptions, config: '.missingrc' });
    expect(defaultTestLus.getConfigFileOptions()).toEqual({});
    expect(consoleWarn).toHaveBeenCalled();
  });

  it('gets the config from .stylusrc', () => {
    const defaultTestLus = new Lus(testLusOptions);
    expect(defaultTestLus.getConfigFileOptions()).toEqual(testFormattingConfig);
  });
});

describe('Lus formatter', () => {
  it('formats file with default options', async () => {
    fs.writeFileSync('.test/Test.vue', testVueContent(inputStyle), 'utf-8');
    const defaultTestLus = new Lus({ ...testLusOptions, config: '.missingrc' });
    await defaultTestLus.format('.test/Test.vue');
    expect(fs.readFileSync('.test/Test.vue', 'utf-8')).toEqual(
      testVueContent(outputStyleDefault)
    );
  });

  it('formats file with the config from .stylusrc', async () => {
    fs.writeFileSync('.test/Test.vue', testVueContent(inputStyle), 'utf-8');
    const defaultTestLus = new Lus(testLusOptions);
    await defaultTestLus.format('.test/Test.vue');
    expect(fs.readFileSync('.test/Test.vue', 'utf-8')).toEqual(
      testVueContent(outputStyleWithConfig)
    );
  });
});

describe('Lus runner', () => {
  it('runs on found files with glob .**/*.vue', async () => {
    fs.writeFileSync('.test/Test.vue', testVueContent(inputStyle), 'utf-8');
    const defaultTestLus = new Lus({
      ...testLusOptions,
      globs: ['.**/*.vue'],
    });
    await defaultTestLus.run();
    expect(fs.readFileSync('.test/Test.vue', 'utf-8')).toEqual(
      testVueContent(outputStyleWithConfig)
    );
  });
  it('runs on a given file path', async () => {
    fs.writeFileSync('.test/Test.vue', testVueContent(inputStyle), 'utf-8');
    const defaultTestLus = new Lus({
      ...testLusOptions,
      globs: ['.test/Test.vue'],
    });
    await defaultTestLus.run();
    expect(fs.readFileSync('.test/Test.vue', 'utf-8')).toEqual(
      testVueContent(outputStyleWithConfig)
    );
  });
  it('runs on multiple globs or file paths', async () => {
    fs.writeFileSync('.test/Test1.vue', testVueContent(inputStyle), 'utf-8');
    fs.writeFileSync('.test/Test2.vue', testVueContent(inputStyle), 'utf-8');
    const defaultTestLus = new Lus({
      ...testLusOptions,
      globs: ['.test/Test1.vue', '.test/*2.vue'],
    });
    await defaultTestLus.run();
    expect(fs.readFileSync('.test/Test1.vue', 'utf-8')).toEqual(
      testVueContent(outputStyleWithConfig)
    );
    expect(fs.readFileSync('.test/Test2.vue', 'utf-8')).toEqual(
      testVueContent(outputStyleWithConfig)
    );
  });
});
