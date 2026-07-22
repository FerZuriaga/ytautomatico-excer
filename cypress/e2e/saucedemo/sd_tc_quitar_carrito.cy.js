// Test Case SD-TC-QUITAR-CARRITO - Quitar producto del carrito en SauceDemo
// Sitio bajo prueba: https://www.saucedemo.com
// Ticket Jira: SCRUM-56
//
// Cubre los 3 Test Cases del Modelo Canonico publicados en Zephyr
// (SCRUM-T31, SCRUM-T32, SCRUM-T33, Test Cycle SCRUM-R5), reorganizados en
// 3 criterios de aceptacion atomicos por punto de entrada/UI:
// - CA-01 (Quitar desde Inventario): TC-01.1
// - CA-02 (Quitar desde vista del Carrito): TC-02.1
// - CA-03 (Estado Vacio tras remover): TC-03.1

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

    it('[CA-02][TC-02.1][SCRUM-T31] Debe quitar un producto desde la pagina del carrito', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.goToCart()
        cartPage.verifyProductInCart('Sauce Labs Backpack', '$29.99')

        cartPage.removeProductFromCart('Sauce Labs Backpack')

        cartPage.verifyCartEmpty()
    })

    it('[CA-03][TC-03.1][SCRUM-T33] Debe dejar el carrito vacio al remover todos los productos agregados', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.addProductToCart('Sauce Labs Bike Light')
        productsPage.verifyCartBadgeCount(2)

        productsPage.goToCart()
        cartPage.removeProductFromCart('Sauce Labs Backpack')
        cartPage.removeProductFromCart('Sauce Labs Bike Light')

        cartPage.verifyCartEmpty()
    })
})
