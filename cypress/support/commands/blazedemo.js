// ─── BlazeDemo Commands ───────────────────────────────────────────────────

Cypress.Commands.add("gotoBDUrl", (route) => {
   cy.visit(`https://blazedemo.com${route}`, { timeout: 120000 })
})
