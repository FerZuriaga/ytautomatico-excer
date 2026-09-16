// Modulo: Autenticacion y cuenta - Login
// Sitio bajo prueba: https://automationteststore.com
// Ticket Jira: SCRUM-120 (CA-01/CA-02/CA-03, Test Cycle SCRUM-121)
//
// Automation Test Store no publica credenciales de demo fijas: el before()
// registra una cuenta de cliente descartable via la UI de registro y la
// reutiliza en todo el spec (ver cy.registerATSTestAccount, comandos custom
// del proyecto).

import AutomationTestStoreLoginPage from '../../pages/automation-test-store/AutomationTestStoreLoginPage'

const loginPage = new AutomationTestStoreLoginPage()
const CREDENTIAL_ERROR = 'Error: Incorrect login or password provided.'

describe('Login de cliente registrado [SCRUM-120]', () => {

    let credentials

    before(() => {
        cy.registerATSTestAccount().then((creds) => {
            credentials = creds
        })
    })

    beforeEach(() => {
        cy.gotoATSUrl('/index.php?rt=account/login')
        loginPage.verifyLoginFormVisible()
    })

    it('[CA-01][TC-01.1][SCRUM-134] Debe permitir el acceso a la cuenta con credenciales validas', () => {
        loginPage.enterCredentials(credentials.loginName, credentials.password)
        loginPage.clickLoginButton()
        loginPage.verifyLoggedIn()
    })

    it('[CA-01][TC-01.2][SCRUM-131] Debe rechazar el acceso con contrasena incorrecta', () => {
        loginPage.enterCredentials(credentials.loginName, 'contrasena_incorrecta')
        loginPage.clickLoginButton()
        loginPage.verifyStillOnLoginPage()
        loginPage.verifyErrorMessage(CREDENTIAL_ERROR)
    })

    it('[CA-01][TC-01.3][SCRUM-132] Debe rechazar el acceso con un usuario inexistente', () => {
        loginPage.enterCredentials('usuario_inexistente_999', 'cualquiera123')
        loginPage.clickLoginButton()
        loginPage.verifyStillOnLoginPage()
        loginPage.verifyErrorMessage(CREDENTIAL_ERROR)
    })

    it('[CA-01][TC-01.4][SCRUM-122] Debe permitir el acceso con el Login Name en distinta capitalizacion', () => {
        loginPage.enterCredentials(credentials.loginName.toUpperCase(), credentials.password)
        loginPage.clickLoginButton()
        loginPage.verifyLoggedIn()
    })

    it('[CA-01][TC-01.5][SCRUM-126] Debe rechazar el acceso cuando las credenciales llevan espacios en blanco al inicio y al fin', () => {
        loginPage.enterCredentials(` ${credentials.loginName} `, ` ${credentials.password} `)
        loginPage.clickLoginButton()
        loginPage.verifyStillOnLoginPage()
        loginPage.verifyErrorMessage(CREDENTIAL_ERROR)
    })

    it('[CA-02][TC-02.1][SCRUM-128] Debe rechazar el envio del login con ambos campos vacios', () => {
        loginPage.enterCredentials('', '')
        loginPage.clickLoginButton()
        loginPage.verifyStillOnLoginPage()
        loginPage.verifyErrorMessage(CREDENTIAL_ERROR)
    })

    it('[CA-02][TC-02.2][SCRUM-125] Debe rechazar el envio del login con el Login Name vacio', () => {
        loginPage.enterCredentials('', 'cualquiera123')
        loginPage.clickLoginButton()
        loginPage.verifyStillOnLoginPage()
        loginPage.verifyErrorMessage(CREDENTIAL_ERROR)
    })

    it('[CA-02][TC-02.3][SCRUM-127] Debe rechazar el envio del login con la Password vacia', () => {
        loginPage.enterCredentials('cualquiera123', '')
        loginPage.clickLoginButton()
        loginPage.verifyStillOnLoginPage()
        loginPage.verifyErrorMessage(CREDENTIAL_ERROR)
    })

    it('[CA-03][TC-03.1][SCRUM-123] Debe redirigir al login al intentar acceder a la cuenta sin sesion iniciada', () => {
        cy.gotoATSUrl('/index.php?rt=account/account')
        cy.url().should('include', 'rt=account/login')
    })

    it('[CA-03][TC-03.2][SCRUM-133] Debe mantener la sesion activa tras recargar la pagina de la cuenta', () => {
        loginPage.enterCredentials(credentials.loginName, credentials.password)
        loginPage.clickLoginButton()
        loginPage.verifyLoggedIn()

        cy.reload()

        loginPage.verifyLoggedIn()
    })
})
