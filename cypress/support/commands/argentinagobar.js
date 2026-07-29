// ─── Argentina.gob.ar Commands ──────────────────────────────────────────────

Cypress.Commands.add("gotoArgentinaFeriados", (anio) => {
    const query = anio ? `?year=${anio}` : ''
    cy.visit(`${Cypress.env('argentinagobarUrl')}/feriados${query}`, { timeout: 30000 })
})

Cypress.Commands.add("gotoArgentinaDocumentacion", () => {
    cy.visit(`${Cypress.env('argentinagobarUrl')}/tema/documentacion`, { timeout: 30000 })
})

Cypress.Commands.add("gotoArgentinaEmergencias", () => {
    cy.visit(`${Cypress.env('argentinagobarUrl')}/tema/emergencias`, { timeout: 30000 })
})

Cypress.Commands.add("gotoArgentinaEducacion", () => {
    cy.visit(`${Cypress.env('argentinagobarUrl')}/tema/educacion`, { timeout: 30000 })
})

Cypress.Commands.add("gotoArgentinaTransporte", () => {
    cy.visit(`${Cypress.env('argentinagobarUrl')}/tema/transito-transporte`, { timeout: 30000 })
})

Cypress.Commands.add("gotoArgentinaDiscapacidad", () => {
    cy.visit(`${Cypress.env('argentinagobarUrl')}/salud/senadis`, { timeout: 30000 })
})
