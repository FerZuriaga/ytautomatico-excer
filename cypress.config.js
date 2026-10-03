const fs = require("fs");
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  // URLs base por sitio. Default = producción/demo pública actual.
  // Se pueden overridear sin tocar este archivo, ej:
  // CYPRESS_expandtestingNotesUrl=https://staging.example.com npx cypress run
  env: {
    automationTestStoreUrl: "https://automationteststore.com",
    commitqualityUrl: "https://commitquality.com",
    expandtestingNotesUrl: "https://practice.expandtesting.com",
    practicesoftwaretestingUrl: "https://practicesoftwaretesting.com",
    restfulBookerPlatformUrl: "https://automationintesting.online",
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
