// ─── Disco Online Commands ──────────────────────────────────────────────────

Cypress.Commands.add("gotoDiscoUrl", (route) => {
   cy.visit(`https://www.disco.com.ar${route}`, { timeout: 120000 })
})
