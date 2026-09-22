// ─── CommitQuality Commands ─────────────────────────────────────────────────

import CommitQualityLoginPage from '../../pages/commitquality/CommitQualityLoginPage'

Cypress.Commands.add("gotoCQUrl", (route) => {
    cy.visit(`${Cypress.env('commitqualityUrl')}${route}`)
})

// Credenciales fijas del sitio (test/test, hardcodeadas sin backend real).
// La accion "Edit" del listado de productos solo aparece con sesion iniciada.
Cypress.Commands.add("cqLogin", () => {
    const loginPage = new CommitQualityLoginPage()
    loginPage.visit()
    loginPage.login('test', 'test')
    loginPage.verifyLoggedIn()
})
