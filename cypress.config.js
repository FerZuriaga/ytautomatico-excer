const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    pageLoadTimeout: 20000,
    retries: {
      runMode: 1,
      openMode: 0,
    },
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: true,
  },
});
