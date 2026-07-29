// ─── Argentina.gob.ar Commands ──────────────────────────────────────────────

Cypress.Commands.add("gotoArgentinaFeriados", (anio) => {
    const query = anio ? `?year=${anio}` : ''
    cy.visit(`${Cypress.env('argentinagobarUrl')}/feriados${query}`, { timeout: 30000 })
})
