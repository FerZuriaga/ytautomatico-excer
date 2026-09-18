// Modulo: Autenticacion y cuenta - Recuperar login name olvidado
// Sitio bajo prueba: https://automationteststore.com
// Ticket Jira: SCRUM-194 (CA-01/CA-02, Test Cycle SCRUM-195)
//
// Automation Test Store no publica credenciales de demo fijas: el before()
// registra una cuenta de cliente descartable via la UI de registro y la
// reutiliza en todo el spec (ver cy.registerATSTestAccount, comandos custom
// del proyecto).

import AutomationTestStoreForgottenLoginNamePage from '../../pages/automation-test-store/AutomationTestStoreForgottenLoginNamePage'

const forgottenLoginNamePage = new AutomationTestStoreForgottenLoginNamePage()
const NOT_FOUND_ERROR = 'No records found matching information your provided, please check your information and try again!'
const LASTNAME_MISSING_ERROR = 'The Last name was not provided or not found in our records, please try again!'
const EMAIL_MISSING_ERROR = 'The Email address was not provided or not found in our records, please try again!'

describe('Recuperar login name olvidado [SCRUM-194]', () => {

    let account

    before(() => {
        cy.registerATSTestAccount().then((acc) => {
            account = acc
        })
    })

    beforeEach(() => {
        forgottenLoginNamePage.visit()
    })

    it('[CA-01][TC-01.1][SCRUM-196] Debe enviar el recordatorio de login name con apellido y email correctos', () => {
        forgottenLoginNamePage.enterData(account.lastName, account.email)
        forgottenLoginNamePage.submit()
        forgottenLoginNamePage.verifySuccess()
    })

    it('[CA-01][TC-01.2][SCRUM-197] Debe rechazar la solicitud cuando el email no corresponde al apellido ingresado', () => {
        forgottenLoginNamePage.enterData(account.lastName, `noexiste_${Date.now()}@example.com`)
        forgottenLoginNamePage.submit()
        forgottenLoginNamePage.verifyStillOnForm()
        forgottenLoginNamePage.verifyErrorMessage(NOT_FOUND_ERROR)
    })

    it('[CA-01][TC-01.3][SCRUM-198] Debe rechazar la solicitud cuando el apellido no corresponde al email ingresado', () => {
        forgottenLoginNamePage.enterData(`ApellidoInexistente${Date.now()}`, account.email)
        forgottenLoginNamePage.submit()
        forgottenLoginNamePage.verifyStillOnForm()
        forgottenLoginNamePage.verifyErrorMessage(NOT_FOUND_ERROR)
    })

    it('[CA-01][TC-01.4][SCRUM-199] Debe rechazar la solicitud cuando el apellido no fue completado', () => {
        forgottenLoginNamePage.enterData('', account.email)
        forgottenLoginNamePage.submit()
        forgottenLoginNamePage.verifyStillOnForm()
        forgottenLoginNamePage.verifyErrorMessage(LASTNAME_MISSING_ERROR)
    })

    it('[CA-01][TC-01.5][SCRUM-200] Debe rechazar la solicitud cuando el email no fue completado', () => {
        forgottenLoginNamePage.enterData(account.lastName, '')
        forgottenLoginNamePage.submit()
        forgottenLoginNamePage.verifyStillOnForm()
        forgottenLoginNamePage.verifyErrorMessage(EMAIL_MISSING_ERROR)
    })

    it('[CA-02][TC-02.1][SCRUM-201] Debe reconocer el apellido sin distinguir mayusculas de minusculas', () => {
        forgottenLoginNamePage.enterData(account.lastName.toUpperCase(), account.email)
        forgottenLoginNamePage.submit()
        forgottenLoginNamePage.verifySuccess()
    })

    it('[CA-02][TC-02.2][SCRUM-202] Debe rechazar el apellido cuando lleva espacios en blanco al inicio y al fin', () => {
        forgottenLoginNamePage.enterData(`  ${account.lastName}  `, account.email)
        forgottenLoginNamePage.submit()
        forgottenLoginNamePage.verifyStillOnForm()
        forgottenLoginNamePage.verifyErrorMessage(NOT_FOUND_ERROR)
    })
})
