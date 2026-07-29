// ─── BlazeDemo Commands ───────────────────────────────────────────────────

Cypress.Commands.add("gotoBDUrl", (route) => {
   cy.visit(`${Cypress.env('blazedemoUrl')}${route}`, { timeout: 120000 })
})
