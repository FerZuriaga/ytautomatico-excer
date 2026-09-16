// Modulo: Autenticacion y cuenta - Recuperar contrasena olvidada
// Sitio bajo prueba: https://automationteststore.com
// Ticket Jira: SCRUM-158 (CA-01/CA-02, Test Cycle SCRUM-159)
//
// Automation Test Store no publica credenciales de demo fijas: el before()
// registra una cuenta de cliente descartable via la UI de registro y la
// reutiliza en todo el spec (ver cy.registerATSTestAccount, comandos custom
// del proyecto).

import AutomationTestStoreForgottenPasswordPage from '../../pages/automation-test-store/AutomationTestStoreForgottenPasswordPage'

const forgottenPasswordPage = new AutomationTestStoreForgottenPasswordPage()
const NOT_FOUND_ERROR = 'No records found matching information your provided, please check your information and try again!'
const LOGINNAME_MISSING_ERROR = 'The Login name was not provided or not found in our records, please try again!'
const EMAIL_MISSING_ERROR = 'The Email address was not provided or not found in our records, please try again!'

describe('Recuperar contrasena olvidada [SCRUM-158]', () => {

    let account

    before(() => {
        cy.registerATSTestAccount().then((acc) => {
            account = acc
        })
    })

    beforeEach(() => {
        forgottenPasswordPage.visit()
    })

    it('[CA-01][TC-01.1][SCRUM-160] Debe enviar el enlace de restablecimiento con nombre de usuario y correo correctos', () => {
        forgottenPasswordPage.enterData(account.loginName, account.email)
        forgottenPasswordPage.submit()
        forgottenPasswordPage.verifySuccess()
    })

    it('[CA-01][TC-01.2][SCRUM-161] Debe rechazar la solicitud cuando el correo no corresponde al nombre de usuario ingresado', () => {
        forgottenPasswordPage.enterData(account.loginName, `noexiste_${Date.now()}@example.com`)
        forgottenPasswordPage.submit()
        forgottenPasswordPage.verifyStillOnForm()
        forgottenPasswordPage.verifyErrorMessage(NOT_FOUND_ERROR)
    })

    it('[CA-01][TC-01.3][SCRUM-162] Debe rechazar la solicitud cuando el nombre de usuario no corresponde al correo ingresado', () => {
        forgottenPasswordPage.enterData(`usuario_inexistente_${Date.now()}`, account.email)
        forgottenPasswordPage.submit()
        forgottenPasswordPage.verifyStillOnForm()
        forgottenPasswordPage.verifyErrorMessage(NOT_FOUND_ERROR)
    })

    it('[CA-01][TC-01.4][SCRUM-163] Debe rechazar la solicitud cuando el nombre de usuario no fue completado', () => {
        forgottenPasswordPage.enterData('', account.email)
        forgottenPasswordPage.submit()
        forgottenPasswordPage.verifyStillOnForm()
        forgottenPasswordPage.verifyErrorMessage(LOGINNAME_MISSING_ERROR)
    })

    it('[CA-01][TC-01.5][SCRUM-164] Debe rechazar la solicitud cuando el correo electronico no fue completado', () => {
        forgottenPasswordPage.enterData(account.loginName, '')
        forgottenPasswordPage.submit()
        forgottenPasswordPage.verifyStillOnForm()
        forgottenPasswordPage.verifyErrorMessage(EMAIL_MISSING_ERROR)
    })

    it('[CA-02][TC-02.1][SCRUM-165] Debe reconocer el nombre de usuario sin distinguir mayusculas de minusculas', () => {
        forgottenPasswordPage.enterData(account.loginName.toUpperCase(), account.email)
        forgottenPasswordPage.submit()
        forgottenPasswordPage.verifySuccess()
    })

    it('[CA-02][TC-02.2][SCRUM-166] Debe rechazar el nombre de usuario cuando lleva espacios en blanco al inicio y al fin', () => {
        forgottenPasswordPage.enterData(`  ${account.loginName}  `, account.email)
        forgottenPasswordPage.submit()
        forgottenPasswordPage.verifyStillOnForm()
        forgottenPasswordPage.verifyErrorMessage(NOT_FOUND_ERROR)
    })
})
