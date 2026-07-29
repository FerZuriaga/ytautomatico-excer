// ─── Disco Online Commands ──────────────────────────────────────────────────

Cypress.Commands.add("gotoDiscoUrl", (route) => {
   cy.visit(`${Cypress.env('discoUrl')}${route}`, { timeout: 120000 })
})
