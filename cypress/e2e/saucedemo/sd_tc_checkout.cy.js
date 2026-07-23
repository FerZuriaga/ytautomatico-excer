// Test Case SD-TC-CHECKOUT - Checkout en SauceDemo
// Sitio bajo prueba: https://www.saucedemo.com
// Ticket Jira: SCRUM-58
//
// Cubre los 7 Test Cases del Modelo Canonico publicados en Zephyr
// (SCRUM-T40, T41, T42, T43, T44, T45, T46, Test Cycle SCRUM-R7),
// organizados en 3 criterios de aceptacion atomicos:
// - CA-01 (Informacion del comprador): TC-01.1 (avanza con los 3 campos),
//   TC-01.2 (falta nombre), TC-01.3 (falta codigo postal)
// - CA-02 (Resumen de la orden): TC-02.1 (1 producto), TC-02.2 (varios)
// - CA-03 (Confirmacion de compra): TC-03.1 (mensaje de confirmacion),
//   TC-03.2 (carrito vacio tras finalizar)

import SauceDemoProductsPage from '../../pages/saucedemo/SauceDemoProductsPage'
import SauceDemoCartPage from '../../pages/saucedemo/SauceDemoCartPage'
import SauceDemoCheckoutPage from '../../pages/saucedemo/SauceDemoCheckoutPage'

const productsPage = new SauceDemoProductsPage()
const cartPage = new SauceDemoCartPage()
const checkoutPage = new SauceDemoCheckoutPage()

describe('SD-TC-CHECKOUT - Checkout en SauceDemo [SCRUM-58]', () => {

    beforeEach(() => {
        cy.loginAsSDStandardUser()
    })

    it('[CA-01][TC-01.1][SCRUM-T42] Debe avanzar al resumen de la orden completando los 3 campos requeridos', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.goToCart()
        cartPage.clickCheckout()

        checkoutPage.fillBuyerInformation('John', 'Doe', '12345')
        checkoutPage.clickContinue()

        checkoutPage.verifyOnOrderSummary()
    })

    it('[CA-01][TC-01.2][SCRUM-T45] Debe mostrar error y no avanzar si falta el nombre', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.goToCart()
        cartPage.clickCheckout()

        checkoutPage.fillBuyerInformation('', 'Doe', '12345')
        checkoutPage.clickContinue()

        checkoutPage.verifyErrorMessage('First Name is required')
    })

    it('[CA-01][TC-01.3][SCRUM-T46] Debe mostrar error y no avanzar si falta el codigo postal', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.goToCart()
        cartPage.clickCheckout()

        checkoutPage.fillBuyerInformation('John', 'Doe', '')
        checkoutPage.clickContinue()

        checkoutPage.verifyErrorMessage('Postal Code is required')
    })

    it('[CA-02][TC-02.1][SCRUM-T44] Debe calcular correctamente el resumen con 1 producto', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.goToCart()
        cartPage.clickCheckout()
        checkoutPage.fillBuyerInformation('John', 'Doe', '12345')
        checkoutPage.clickContinue()

        checkoutPage.verifySubtotalMatchesItemsSum()
        checkoutPage.verifyTotalEqualsSubtotalPlusTax()
    })

    it('[CA-02][TC-02.2][SCRUM-T41] Debe calcular correctamente el resumen con varios productos', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.addProductToCart('Sauce Labs Bike Light')
        productsPage.addProductToCart('Sauce Labs Bolt T-Shirt')
        productsPage.goToCart()
        cartPage.clickCheckout()
        checkoutPage.fillBuyerInformation('John', 'Doe', '12345')
        checkoutPage.clickContinue()

        checkoutPage.verifySubtotalMatchesItemsSum()
        checkoutPage.verifyTotalEqualsSubtotalPlusTax()
    })

    it('[CA-03][TC-03.1][SCRUM-T40] Debe mostrar la confirmacion de compra al finalizar', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.goToCart()
        cartPage.clickCheckout()
        checkoutPage.fillBuyerInformation('John', 'Doe', '12345')
        checkoutPage.clickContinue()
        checkoutPage.clickFinish()

        checkoutPage.verifyOrderConfirmation()
    })

    it('[CA-03][TC-03.2][SCRUM-T43] Debe dejar el carrito vacio tras finalizar la compra', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.goToCart()
        cartPage.clickCheckout()
        checkoutPage.fillBuyerInformation('John', 'Doe', '12345')
        checkoutPage.clickContinue()
        checkoutPage.clickFinish()

        checkoutPage.goBackToProducts()
        productsPage.verifyCartBadgeNotVisible()
    })
})
