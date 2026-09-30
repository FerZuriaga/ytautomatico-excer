// ─── Automation Test Store Commands ────────────────────────────────────────

import AutomationTestStoreRegisterPage from '../../pages/automation-test-store/AutomationTestStoreRegisterPage'

Cypress.Commands.add("gotoATSUrl", (route) => {
    cy.visit(`${Cypress.env('automationTestStoreUrl')}${route}`, { timeout: 120000 })
})

// Automation Test Store no publica credenciales de demo fijas (a diferencia
// de SauceDemo/OrangeHRM): cada corrida registra su propia cuenta de cliente
// descartable via la UI de registro, y la reutiliza durante el spec que la
// necesite (Login, Registro, etc). Devuelve { loginName, password, email }.
Cypress.Commands.add("registerATSTestAccount", () => {
    const registerPage = new AutomationTestStoreRegisterPage()
    const uniqueId = Date.now()
    const loginName = `qatester_${uniqueId}`
    const password = 'Qatest123!'
    const email = `qatester_${uniqueId}@example.com`

    cy.gotoATSUrl('/index.php?rt=account/create')
    registerPage.fillMandatoryFields({
        firstName: 'QA',
        lastName: 'Tester',
        email,
        address: 'Test Street 123',
        city: 'Buenos Aires',
        postcode: '1000',
        loginName,
        password
    })
    registerPage.submit()
    registerPage.verifyAccountCreated()

    // El sitio deja la sesión iniciada después del registro, y las páginas de
    // login, registro y recuperación redirigen a "My Account" con sesión. El
    // comando solo crea credenciales: sale sin sesión. Lo llama un before(),
    // que corre dentro del primer test después de la limpieza de Cypress
    // (2026-09-29: fallaba el primer test de 4 specs).
    cy.clearCookies()

    return cy.wrap({ loginName, password, email, lastName: 'Tester' })
})
