const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // URLs base por sitio. Default = producción/demo pública actual.
  // Se pueden overridear sin tocar este archivo, ej:
  // CYPRESS_ORANGEHRM_URL=https://staging.orangehrmlive.com npx cypress run
  env: {
    argentinagobarUrl: "https://www.argentina.gob.ar",
    automationExerciseUrl: "https://automationexercise.com",
    blazedemoUrl: "https://blazedemo.com",
    discoUrl: "https://www.disco.com.ar",
    orangehrmUrl: "https://opensource-demo.orangehrmlive.com",
    rentascordobaUrl: "https://www.rentascordoba.gob.ar",
    saucedemoUrl: "https://www.saucedemo.com",
  },
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
