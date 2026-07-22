// ─── SauceDemo Commands ─────────────────────────────────────────────────────

Cypress.Commands.add("gotoSDUrl", (route) => {
   cy.visit(`https://www.saucedemo.com${route}`, { timeout: 120000 })
})
