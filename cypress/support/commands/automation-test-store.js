// ─── Automation Test Store Commands ────────────────────────────────────────

import AutomationTestStoreRegisterPage from '../../pages/automation-test-store/AutomationTestStoreRegisterPage'

Cypress.Commands.add("gotoATSUrl", (route) => {
    cy.visit(`${Cypress.env('automationTestStoreUrl')}${route}`, { timeout: 120000 })
})

// Automation Test Store no publica credenciales de demo fijas (a diferencia
// de SauceDemo/OrangeHRM): cada corrida registra su propia cuenta de cliente
// descartable via la UI de registro, y la reutiliza durante todo el spec de
// Login. Devuelve { loginName, password } para que el spec los use.
Cypress.Commands.add("registerATSTestAccount", () => {
    const registerPage = new AutomationTestStoreRegisterPage()
    const uniqueId = Date.now()
    const loginName = `qatester_${uniqueId}`
    const password = 'Qatest123!'

    cy.gotoATSUrl('/index.php?rt=account/create')
    registerPage.fillMandatoryFields({
        firstName: 'QA',
        lastName: 'Tester',
        email: `qatester_${uniqueId}@example.com`,
        address: 'Test Street 123',
        city: 'Buenos Aires',
        postcode: '1000',
        loginName,
        password
    })
    registerPage.submit()
    registerPage.verifyAccountCreated()

    return cy.wrap({ loginName, password })
})
