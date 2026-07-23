// Test Case SD-TC-LOGOUT - Logout en SauceDemo
// Sitio bajo prueba: https://www.saucedemo.com
// Ticket Jira: SCRUM-59
//
// Cubre los 6 Test Cases del Modelo Canonico publicados en Zephyr
// (SCRUM-T47, T49, T50, T51, T52, T53, Test Cycle SCRUM-R8),
// organizados en 3 criterios de aceptacion atomicos:
// - CA-01 (Cierre de sesion desde el menu lateral): TC-01.1 (desde el
//   listado de productos), TC-01.2 (desde el carrito)
// - CA-02 (Bloqueo de acceso a rutas protegidas tras logout): TC-02.1
//   (acceso directo bloqueado), TC-02.2 (reinicio de sesion tras el bloqueo)
// - CA-03 (Persistencia del carrito entre sesiones): TC-03.1 (con
//   productos), TC-03.2 (vacio)

import SauceDemoProductsPage from '../../pages/saucedemo/SauceDemoProductsPage'
import SauceDemoCartPage from '../../pages/saucedemo/SauceDemoCartPage'
import SauceDemoMenuPage from '../../pages/saucedemo/SauceDemoMenuPage'
import SauceDemoLoginPage from '../../pages/saucedemo/SauceDemoLoginPage'

const productsPage = new SauceDemoProductsPage()
const cartPage = new SauceDemoCartPage()
const menuPage = new SauceDemoMenuPage()
const loginPage = new SauceDemoLoginPage()

describe('SD-TC-LOGOUT - Logout en SauceDemo [SCRUM-59]', () => {

    beforeEach(() => {
        cy.loginAsSDStandardUser()
    })

    it('[CA-01][TC-01.1][SCRUM-T47] Debe cerrar sesion desde el listado de productos y redirigir al login', () => {
        menuPage.logout()

        loginPage.verifyStillOnLoginPage()
    })

    it('[CA-01][TC-01.2][SCRUM-T52] Debe cerrar sesion desde el carrito y redirigir al login', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.goToCart()

        menuPage.logout()

        loginPage.verifyStillOnLoginPage()
    })

    it('[CA-02][TC-02.1][SCRUM-T53] Debe bloquear el acceso directo a una ruta protegida tras cerrar sesion', () => {
        menuPage.logout()

        cy.visit('https://www.saucedemo.com/inventory.html', { failOnStatusCode: false })

        loginPage.verifyStillOnLoginPage()
        loginPage.verifyErrorMessage('You can only access')
    })

    it('[CA-02][TC-02.2][SCRUM-T51] Debe permitir reiniciar sesion con credenciales validas tras el bloqueo', () => {
        menuPage.logout()
        cy.visit('https://www.saucedemo.com/inventory.html', { failOnStatusCode: false })
        loginPage.verifyStillOnLoginPage()

        loginPage.enterCredentials('standard_user', 'secret_sauce')
        loginPage.clickLoginButton()

        loginPage.verifyInventoryVisible()
    })

    it('[CA-03][TC-03.1][SCRUM-T49] Debe mantener el contenido del carrito tras cerrar e iniciar sesion nuevamente', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.verifyCartBadgeCount(1)

        menuPage.logout()
        cy.loginAsSDStandardUser()

        productsPage.verifyCartBadgeCount(1)
    })

    it('[CA-03][TC-03.2][SCRUM-T50] Debe mantener el carrito vacio tras cerrar e iniciar sesion nuevamente', () => {
        productsPage.verifyCartBadgeNotVisible()

        menuPage.logout()
        cy.loginAsSDStandardUser()

        productsPage.verifyCartBadgeNotVisible()
    })
})
