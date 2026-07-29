// ─── Rentas Córdoba Commands ────────────────────────────────────────────────

Cypress.Commands.add("gotoRentasCordobaVencimientos", () => {
    cy.visit(`${Cypress.env('rentascordobaUrl')}/cms/vencimientos/`, { timeout: 30000 })
})

Cypress.Commands.add("gotoRentasCordobaMediosDePago", () => {
    cy.visit(`${Cypress.env('rentascordobaUrl')}/cms/formas-de-pago/`, { timeout: 30000 })
})
