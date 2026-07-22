// Test Case SD-TC-CARRITO - Carrito en SauceDemo
// Sitio bajo prueba: https://www.saucedemo.com
// Ticket Jira: SCRUM-55
//
// Cubre los 4 Test Cases del Modelo Canonico publicados en Zephyr
// (SCRUM-T27 a SCRUM-T30, Test Cycle SCRUM-R4): agregar un producto,
// agregar varios productos, ver el carrito con contenido y ver el carrito
// vacio.

import SauceDemoProductsPage from '../../pages/saucedemo/SauceDemoProductsPage'
import SauceDemoCartPage from '../../pages/saucedemo/SauceDemoCartPage'

const productsPage = new SauceDemoProductsPage()
const cartPage = new SauceDemoCartPage()

describe('SD-TC-CARRITO - Carrito en SauceDemo [SCRUM-55]', () => {

    beforeEach(() => {
        cy.loginAsSDStandardUser()
    })

    it('[SCRUM-T28] Debe agregar un producto al carrito y actualizar el indicador de cantidad', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.verifyCartBadgeCount(1)
    })

    it('[SCRUM-T30] Debe agregar varios productos al carrito y acumular el indicador de cantidad', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.addProductToCart('Sauce Labs Bike Light')
        productsPage.addProductToCart('Sauce Labs Bolt T-Shirt')
        productsPage.verifyCartBadgeCount(3)
    })

    it('[SCRUM-T27] Debe mostrar el producto agregado al ver el carrito', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.goToCart()
        cartPage.verifyProductInCart('Sauce Labs Backpack', '$29.99')
    })

    it('[SCRUM-T29] Debe mostrar el carrito vacio cuando no se agregaron productos', () => {
        productsPage.goToCart()
        cartPage.verifyCartEmpty()
    })
})
