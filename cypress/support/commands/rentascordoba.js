// ─── Rentas Córdoba Commands ────────────────────────────────────────────────

Cypress.Commands.add("gotoRentasCordobaVencimientos", () => {
    cy.visit("https://www.rentascordoba.gob.ar/cms/vencimientos/", { timeout: 30000 })
})
