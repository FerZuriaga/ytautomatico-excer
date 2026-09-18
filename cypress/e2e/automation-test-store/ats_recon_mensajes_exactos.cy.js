// Recon de precision: releva el texto EXACTO (sin truncar, sin
// parafrasear) de los mensajes reales del sitio para poder redactar con
// precision los Datos/Resultado Esperado de los Test Cases en Xray
// (Logout, Recuperar contrasena, Consultar pedido invitado).

import AutomationTestStoreForgottenPasswordPage from '../../pages/automation-test-store/AutomationTestStoreForgottenPasswordPage'
import AutomationTestStoreAccountPage from '../../pages/automation-test-store/AutomationTestStoreAccountPage'

const forgottenPasswordPage = new AutomationTestStoreForgottenPasswordPage()
const accountPage = new AutomationTestStoreAccountPage()
const results = {}

describe('Recon - mensajes exactos (Logout / Recuperar contrasena)', () => {

    it('releva mensajes de Recuperar contrasena (campos vacios y no encontrado)', () => {
        forgottenPasswordPage.visit()
        forgottenPasswordPage.enterData('', 'cualquiera@example.com')
        forgottenPasswordPage.submit()
        forgottenPasswordPage.message.then($m => { results.loginNameEmptyMessage = $m.text().trim() })

        forgottenPasswordPage.visit()
        forgottenPasswordPage.enterData('cualquiera_999', '')
        forgottenPasswordPage.submit()
        forgottenPasswordPage.message.then($m => { results.emailEmptyMessage = $m.text().trim() })

        forgottenPasswordPage.visit()
        forgottenPasswordPage.enterData('usuario_inexistente_999', 'noexiste@example.com')
        forgottenPasswordPage.submit()
        forgottenPasswordPage.message.then($m => { results.notFoundMessage = $m.text().trim() })

        cy.then(() => cy.writeFile('cypress/fixtures/selectors/_recon_mensajes.json', results))
    })

    it('releva el mensaje de exito de Recuperar contrasena (logueado antes, deslogueado despues)', () => {
        cy.registerATSTestAccount().then((creds) => {
            accountPage.logout()
            cy.url().should('include', 'rt=account/logout')

            forgottenPasswordPage.visit()
            cy.url().then(u => { results.forgottenUrlAfterVisit = u })
            forgottenPasswordPage.enterData(creds.loginName, creds.email)
            forgottenPasswordPage.submit()
            cy.get('body').then($body => {
                results.forgottenSuccessMessage = $body.find('.alert').first().text().trim()
                results.forgottenSuccessUrl = window.location.href
            })
        })

        cy.then(() => cy.writeFile('cypress/fixtures/selectors/_recon_mensajes.json', results))
    })

    it('releva el mensaje de Logout', () => {
        cy.registerATSTestAccount().then(() => {
            accountPage.logout()
            cy.get('body').then($body => {
                results.logoutHeading = $body.find('h1.heading1').first().text().trim()
                results.logoutMessage = $body.find('.contentpanel').first().text().trim()
            })
        })

        cy.then(() => cy.writeFile('cypress/fixtures/selectors/_recon_mensajes.json', results))
    })
})
