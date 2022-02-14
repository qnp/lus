# @fifteen/loco-redis

Service to fetch loco and store translations in a redis database. To be used in a nodeJS server.

## Installation

- `npm install --save @fifteen/loco-redis`
- `yarn add @fifteen/loco-redis`

## Usage

```js
import LocoRedis from '@fifteen/loco-redis';

// Create service instance with your config (see docs for implementation)
const locoRedisService = new LocoRedis({
  /* configuration */
});

// Connect and disconnect to redis db
locoRedisService.connectRedisClient();
locoRedisService.disconnectRedisClient();

// Manage translations, for instance in an Express controller or a Fastify handler
// (see docs for full implementation)
locoRedisService.manageTranslations({
  lang: 'en',
  localFilesDirPath: './translations',
});

// In a build process, build local translation files
locoRedisService.buildTranslationFiles('en', './translations');
```

For more details, see [docs](docs).

## Development and contribution

- Write your functionalites or fixes.
- Write new tests for any new functionality.
- Run `yarn test` to verify that everything is passing.
- Generate new doc using `yarn doc` and commit the changes of DOCUMENTATION.md file.
- You can build the lib using `yarn build`
- After having commit all your changes you can run `make release` to properly test, build, create a git tag and publish to npm
