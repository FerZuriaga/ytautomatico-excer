const fs = require("fs");
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // URLs base por sitio. Default = producción/demo pública actual.
  // Se pueden overridear sin tocar este archivo, ej:
  // CYPRESS_ORANGEHRM_URL=https://staging.orangehrmlive.com npx cypress run
  env: {
    argentinagobarUrl: "https://www.argentina.gob.ar",
    automationExerciseUrl: "https://automationexercise.com",
    automationTestStoreUrl: "https://automationteststore.com",
    blazedemoUrl: "https://blazedemo.com",
    commitqualityUrl: "https://commitquality.com",
    discoUrl: "https://www.disco.com.ar",
    orangehrmUrl: "https://opensource-demo.orangehrmlive.com",
    rentascordobaUrl: "https://www.rentascordoba.gob.ar",
    saucedemoUrl: "https://www.saucedemo.com",
  },
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        // trashAssetsBeforeRuns solo limpia al inicio de la corrida: sin
        // esto, un test de descarga podria "pasar" leyendo el archivo que
        // dejo el test anterior.
        clearDownloads() {
          fs.rmSync(config.downloadsFolder, { recursive: true, force: true });
          return null;
        },
      });
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
