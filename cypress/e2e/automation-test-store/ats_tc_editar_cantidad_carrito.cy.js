// Modulo: Compra - Editar la cantidad de un producto en el carrito
// Sitio bajo prueba: https://automationteststore.com
// Ticket Jira: SCRUM-182 (CA-01/CA-02, Test Cycle SCRUM-183)
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
const PRODUCT_A_UNIT_PRICE = 42.00

const PRODUCT_B_ID = 50
const PRODUCT_B_PRICE = '$29.50'

const money = n => `$${n.toFixed(2)}`

describe('Editar la cantidad de un producto en el carrito [SCRUM-182]', () => {

    beforeEach(() => {
        productPage.visit(PRODUCT_A_ID)
        productPage.addToCart()
        cy.url().should('include', 'rt=checkout/cart')
    })

    it('[CA-01][TC-01.1][SCRUM-184] Debe recalcular el importe de la linea al aumentar la cantidad', () => {
        cartPage.updateQuantity(PRODUCT_A_ID, 4)
        cartPage.verifyProductInCart(PRODUCT_A_NAME, 4)
        cartPage.verifyProductRowTotal(PRODUCT_A_NAME, money(PRODUCT_A_UNIT_PRICE * 4))
    })

    it('[CA-01][TC-01.2][SCRUM-185] Debe recalcular el importe de la linea al disminuir la cantidad', () => {
        cartPage.updateQuantity(PRODUCT_A_ID, 4)
        cartPage.updateQuantity(PRODUCT_A_ID, 2)
        cartPage.verifyProductInCart(PRODUCT_A_NAME, 2)
        cartPage.verifyProductRowTotal(PRODUCT_A_NAME, money(PRODUCT_A_UNIT_PRICE * 2))
    })

    it('[CA-02][TC-02.1][SCRUM-186] Debe recalcular el total general del carrito al actualizar la cantidad', () => {
        cartPage.updateQuantity(PRODUCT_A_ID, 4)
        cartPage.verifySubTotal(money(PRODUCT_A_UNIT_PRICE * 4))
    })

    it('[CA-02][TC-02.2][SCRUM-187] El total general debe seguir sumando todas las lineas tras editar una de ellas', () => {
        productListPage.visitHome()
        productListPage.quickAddToCart(PRODUCT_B_ID)

        cartPage.visit()
        cartPage.updateQuantity(PRODUCT_A_ID, 3)

        const expectedSubTotal = money(PRODUCT_A_UNIT_PRICE * 3 + 29.50)
        cartPage.verifySubTotal(expectedSubTotal)
    })
})
