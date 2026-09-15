// Modulo: Autenticacion y cuenta - Logout
// Sitio bajo prueba: https://automationteststore.com
// Ticket Jira: SCRUM-150 (CA-01 a CA-03, Test Cycle SCRUM-151)
//
// El registro (cy.registerATSTestAccount) deja la sesion ya autenticada
// (auto-login tras crear la cuenta), asi que cada test arranca logueado
// sin necesidad de un paso de login explicito. El login explicito solo
// hace falta para volver a entrar despues de haber cerrado sesion.

import AutomationTestStoreLoginPage from '../../pages/automation-test-store/AutomationTestStoreLoginPage'
import AutomationTestStoreAccountPage from '../../pages/automation-test-store/AutomationTestStoreAccountPage'

const loginPage = new AutomationTestStoreLoginPage()
const accountPage = new AutomationTestStoreAccountPage()
const PRODUCT_ID = 50
const PRODUCT_NAME = 'Skinsheen Bronzer Stick'

function loginAs(credentials) {
    cy.gotoATSUrl('/index.php?rt=account/login')
    loginPage.enterCredentials(credentials.loginName, credentials.password)
    loginPage.clickLoginButton()
    loginPage.verifyLoggedIn()
}

describe('Logout de cuenta [SCRUM-150]', () => {

    it('[CA-01][TC-01.1][SCRUM-152] Debe cerrar la sesion exitosamente desde una cuenta autenticada', () => {
        cy.registerATSTestAccount().then(() => {
            accountPage.verifyLoggedInHeader()

            accountPage.logout()
            accountPage.verifyLoggedOut()
        })
    })

    it('[CA-01][TC-01.2][SCRUM-153] Debe permitir continuar navegando desde la confirmacion de cierre de sesion', () => {
        cy.registerATSTestAccount().then(() => {
            accountPage.logout()
            accountPage.verifyLoggedOut()

            accountPage.continueButton.click()
            cy.url().should('eq', 'https://automationteststore.com/')
        })
    })

    it('[CA-02][TC-02.1][SCRUM-154] Debe redirigir al login al intentar acceder a Mi Cuenta por URL directa tras cerrar sesion', () => {
        cy.registerATSTestAccount().then(() => {
            accountPage.logout()
            accountPage.verifyLoggedOut()

            cy.gotoATSUrl('/index.php?rt=account/account')
            accountPage.verifyRedirectedToLogin()
        })
    })

    it('[CA-02][TC-02.2][SCRUM-155] No debe quedar disponible el acceso de navegacion a la cuenta tras cerrar sesion', () => {
        cy.registerATSTestAccount().then(() => {
            accountPage.logout()
            accountPage.verifyLoggedOut()

            cy.gotoATSUrl('/')
            accountPage.verifyNoAuthenticatedNavigationAvailable()
        })
    })

    it('[CA-03][TC-03.1][SCRUM-156] El carrito con un producto debe conservarse y restaurarse al volver a iniciar sesion', () => {
        cy.registerATSTestAccount().then((credentials) => {
            accountPage.addProductToCart(PRODUCT_ID)
            accountPage.verifyCartContainsProduct(PRODUCT_NAME)

            accountPage.logout()
            accountPage.verifyLoggedOut()

            loginAs(credentials)
            accountPage.goToCart()
            accountPage.verifyCartContainsProduct(PRODUCT_NAME)
        })
    })

    it('[CA-03][TC-03.2][SCRUM-157] El carrito vacio debe permanecer vacio al volver a iniciar sesion', () => {
        cy.registerATSTestAccount().then((credentials) => {
            accountPage.goToCart()
            accountPage.verifyCartIsEmpty()

            accountPage.logout()
            accountPage.verifyLoggedOut()

            loginAs(credentials)
            accountPage.goToCart()
            accountPage.verifyCartIsEmpty()
        })
    })
})
