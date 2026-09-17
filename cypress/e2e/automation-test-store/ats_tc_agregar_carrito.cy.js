// Modulo: Compra - Agregar un producto al carrito
// Sitio bajo prueba: https://automationteststore.com
// Ticket Jira: SCRUM-174 (CA-01/CA-02/CA-03, Test Cycle SCRUM-175)
//
// Cubre los 2 puntos de entrada reales del sitio para agregar un producto
// al carrito: la accion rapida del listado (AJAX, sin cantidad) y el form
// real del detalle del producto (POST, con cantidad elegible). Editar
// cantidad y quitar un producto ya agregado quedan fuera de esta HU (accion
// destructiva/de edicion, HU aparte segun granularidad ya definida en el
// proyecto).

import AutomationTestStoreCartPage from '../../pages/automation-test-store/AutomationTestStoreCartPage'
import AutomationTestStoreProductPage from '../../pages/automation-test-store/AutomationTestStoreProductPage'
import AutomationTestStoreProductListPage from '../../pages/automation-test-store/AutomationTestStoreProductListPage'

const cartPage = new AutomationTestStoreCartPage()
const productPage = new AutomationTestStoreProductPage()
const productListPage = new AutomationTestStoreProductListPage()

const LISTADO_PRODUCT_ID = 50
const LISTADO_PRODUCT_NAME = 'Skinsheen Bronzer Stick'
const LISTADO_PRODUCT_PRICE = '$29.50'

const DETALLE_PRODUCT_ID = 68
const DETALLE_PRODUCT_NAME = 'Absolute Anti-Age Spot Replenishing Unifying TreatmentSPF 15'
const DETALLE_PRODUCT_UNIT_PRICE = 42.00

describe('Agregar un producto al carrito de compras [SCRUM-174]', () => {

    it('[CA-01][TC-01.1][SCRUM-176] Debe mostrar el carrito vacio antes de agregar productos', () => {
        cartPage.visit()
        cartPage.verifyEmpty()
    })

    it('[CA-01][TC-01.2][SCRUM-177] Debe volver al inicio desde el carrito vacio', () => {
        cartPage.visit()
        cartPage.clickContinueShopping()
        cartPage.verifyRedirectedToHome()
    })

    it('[CA-02][TC-02.1][SCRUM-178] Debe agregar 1 unidad desde el listado sin solicitar cantidad', () => {
        productListPage.visitHome()
        productListPage.quickAddToCart(LISTADO_PRODUCT_ID)
        cartPage.verifyHeaderCount(1, LISTADO_PRODUCT_PRICE)
    })

    it('[CA-02][TC-02.2][SCRUM-179] Debe reflejar en el carrito el producto agregado desde el listado', () => {
        productListPage.visitHome()
        productListPage.quickAddToCart(LISTADO_PRODUCT_ID)
        cartPage.visit()
        cartPage.verifyProductInCart(LISTADO_PRODUCT_NAME, 1)
        cartPage.verifyProductRowTotal(LISTADO_PRODUCT_NAME, LISTADO_PRODUCT_PRICE)
    })

    it('[CA-03][TC-03.1][SCRUM-180] Debe agregar 1 unidad desde el detalle dejando la cantidad por defecto', () => {
        productPage.visit(DETALLE_PRODUCT_ID)
        productPage.addToCart()
        cy.url().should('include', 'rt=checkout/cart')
        cartPage.verifyProductInCart(DETALLE_PRODUCT_NAME, 1)
        cartPage.verifyProductRowTotal(DETALLE_PRODUCT_NAME, `$${DETALLE_PRODUCT_UNIT_PRICE.toFixed(2)}`)
    })

    it('[CA-03][TC-03.2][SCRUM-181] Debe respetar una cantidad mayor a 1 indicada en el detalle', () => {
        const quantity = 5
        const expectedTotal = `$${(DETALLE_PRODUCT_UNIT_PRICE * quantity).toFixed(2)}`

        productPage.visit(DETALLE_PRODUCT_ID)
        productPage.setQuantity(quantity)
        productPage.addToCart()
        cy.url().should('include', 'rt=checkout/cart')
        cartPage.verifyProductInCart(DETALLE_PRODUCT_NAME, quantity)
        cartPage.verifyProductRowTotal(DETALLE_PRODUCT_NAME, expectedTotal)
    })
})
