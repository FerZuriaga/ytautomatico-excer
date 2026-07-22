// Test Case SD-TC-QUITAR-CARRITO - Quitar producto del carrito en SauceDemo
// Sitio bajo prueba: https://www.saucedemo.com
// Ticket Jira: SCRUM-56
//
// Cubre los 2 Test Cases del Modelo Canonico publicados en Zephyr
// (SCRUM-T31, SCRUM-T32, Test Cycle SCRUM-R5), bajo el criterio CA-01
// (Quitar producto del carrito): quitar desde el listado de productos y
// quitar desde la pagina del carrito.

import SauceDemoProductsPage from '../../pages/saucedemo/SauceDemoProductsPage'
import SauceDemoCartPage from '../../pages/saucedemo/SauceDemoCartPage'

const productsPage = new SauceDemoProductsPage()
const cartPage = new SauceDemoCartPage()

describe('SD-TC-QUITAR-CARRITO - Quitar producto del carrito en SauceDemo [SCRUM-56]', () => {

    beforeEach(() => {
        cy.loginAsSDStandardUser()
    })

    it('[CA-01][TC-01.1][SCRUM-T32] Debe quitar un producto desde el listado de productos', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.verifyCartBadgeCount(1)

        productsPage.removeProductFromCart('Sauce Labs Backpack')

        productsPage.verifyCartBadgeNotVisible()
    })

    it('[CA-01][TC-01.2][SCRUM-T31] Debe quitar un producto desde la pagina del carrito', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.goToCart()
        cartPage.verifyProductInCart('Sauce Labs Backpack', '$29.99')

        cartPage.removeProductFromCart('Sauce Labs Backpack')

        cartPage.verifyCartEmpty()
    })
})
