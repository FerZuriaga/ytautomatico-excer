// Modulo: Autenticacion - Login
// Sitio bajo prueba: https://commitquality.com
// Ticket Jira: SCRUM-287 (CA-01/CA-02/CA-03, Test Cycle SCRUM-288)
//
// Credenciales fijas del sitio (test/test, hardcodeadas sin backend real
// - ver docs/discovery/commitquality.md).

import CommitQualityLoginPage from '../../pages/commitquality/CommitQualityLoginPage'

const loginPage = new CommitQualityLoginPage()

describe('Login [SCRUM-287]', () => {

    beforeEach(() => {
        loginPage.visit()
        loginPage.verifyFormVisible()
    })

    it('[CA-01][TC-01.1][SCRUM-289] Debe permitir el acceso con credenciales validas', () => {
        loginPage.login('test', 'test')
        loginPage.verifyLoggedIn()
    })

    it('[CA-01][TC-01.2][SCRUM-290] Debe mantener la sesion activa tras recargar la pagina', () => {
        loginPage.login('test', 'test')
        loginPage.verifyLoggedIn()

        cy.reload()

        loginPage.verifyLoggedIn()
    })

    it('[CA-02][TC-02.1][SCRUM-291] Debe rechazar el acceso con contrasena incorrecta', () => {
        loginPage.login('test', 'incorrecta123')
        loginPage.verifyStillOnLoginPage()
        loginPage.verifyErrorMessage('Invalid username or password')
        loginPage.verifyFieldsCleared()
    })

    it('[CA-02][TC-02.2][SCRUM-292] Debe rechazar el acceso con un usuario inexistente', () => {
        loginPage.login('usuario_inexistente', 'test')
        loginPage.verifyStillOnLoginPage()
        loginPage.verifyErrorMessage('Invalid username or password')
        loginPage.verifyFieldsCleared()
    })

    it('[CA-03][TC-03.1][SCRUM-293] Debe rechazar el envio con ambos campos vacios', () => {
        loginPage.login('', '')
        loginPage.verifyStillOnLoginPage()
        loginPage.verifyErrorMessage('Please enter a username and password')
    })

    it('[CA-03][TC-03.2][SCRUM-294] Debe rechazar el envio con la password vacia', () => {
        loginPage.login('test', '')
        loginPage.verifyStillOnLoginPage()
        loginPage.verifyErrorMessage('Please enter a username and password')
    })
})
