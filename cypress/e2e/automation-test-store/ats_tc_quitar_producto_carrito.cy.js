// Modulo: Compra - Quitar un producto del carrito
// Sitio bajo prueba: https://automationteststore.com
// Ticket Jira: SCRUM-188 (CA-01/CA-02, Test Cycle SCRUM-189)
// HU separada de "Editar cantidad" por ser una accion destructiva sobre el
// carrito (regla HU & CA GRANULARITY de CLAUDE.md).
// Selectores relevados en PASO 1 (cy.reconPage) y persistidos en
// cypress/fixtures/selectors/carrito.json.

import AutomationTestStoreCartPage from '../../pages/automation-test-store/AutomationTestStoreCartPage'
import AutomationTestStoreProductPage from '../../pages/automation-test-store/AutomationTestStoreProductPage'
import AutomationTestStoreProductListPage from '../../pages/automation-test-store/AutomationTestStoreProductListPage'

const cartPage = new AutomationTestStoreCartPage()
const productPage = new AutomationTestStoreProductPage()
const productListPage = new AutomationTestStoreProductListPage()

const PRODUCT_A_ID = 68
const PRODUCT_A_NAME = 'Absolute Anti-Age Spot Replenishing Unifying TreatmentSPF 15'

const PRODUCT_B_ID = 50
const PRODUCT_B_NAME = 'Skinsheen Bronzer Stick'
const PRODUCT_B_PRICE = '$29.50'

describe('Quitar un producto del carrito de compras [SCRUM-188]', () => {

    it('[CA-01][TC-01.1][SCRUM-190] Debe dejar el carrito vacio al quitar el unico producto', () => {
        productPage.visit(PRODUCT_A_ID)
        productPage.addToCart()
        cy.url().should('include', 'rt=checkout/cart')

        cartPage.removeProduct(PRODUCT_A_ID)
        cartPage.verifyEmpty()
    })

    it('[CA-01][TC-01.2][SCRUM-191] Debe permitir seguir comprando desde el carrito vacio tras quitar el unico producto', () => {
        productPage.visit(PRODUCT_A_ID)
        productPage.addToCart()
        cy.url().should('include', 'rt=checkout/cart')

        cartPage.removeProduct(PRODUCT_A_ID)
        cartPage.clickContinueShopping()
        cartPage.verifyRedirectedToHome()
    })

    it('[CA-02][TC-02.1][SCRUM-192] Debe conservar los productos restantes al quitar uno de varios', () => {
        productPage.visit(PRODUCT_A_ID)
        productPage.addToCart()
        productListPage.visitHome()
        productListPage.quickAddToCart(PRODUCT_B_ID)

        cartPage.visit()
        cartPage.removeProduct(PRODUCT_A_ID)

        cartPage.verifyProductNotInCart(PRODUCT_A_NAME)
        cartPage.verifyProductInCart(PRODUCT_B_NAME, 1)
    })

    it('[CA-02][TC-02.2][SCRUM-193] Debe recalcular el total general sin incluir el producto quitado', () => {
        productPage.visit(PRODUCT_A_ID)
        productPage.addToCart()
        productListPage.visitHome()
        productListPage.quickAddToCart(PRODUCT_B_ID)

        cartPage.visit()
        cartPage.removeProduct(PRODUCT_A_ID)

        cartPage.verifySubTotal(PRODUCT_B_PRICE)
    })
})
