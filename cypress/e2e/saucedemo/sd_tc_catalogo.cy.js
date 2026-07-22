// Test Case SD-TC-CATALOGO - Catalogo de productos en SauceDemo
// Sitio bajo prueba: https://www.saucedemo.com
// Ticket Jira: SCRUM-57
//
// Cubre los 6 Test Cases del Modelo Canonico publicados en Zephyr
// (SCRUM-T34 a SCRUM-T39, Test Cycle SCRUM-R6), en 3 criterios de
// aceptacion atomicos por punto de entrada/UI:
// - CA-01 (Ver el listado de productos): TC-01.1, TC-01.2
// - CA-02 (Ver el detalle de un producto): TC-02.1, TC-02.2
// - CA-03 (Ordenar productos por nombre A-Z): TC-03.1, TC-03.2

import SauceDemoProductsPage from '../../pages/saucedemo/SauceDemoProductsPage'
import SauceDemoProductDetailPage from '../../pages/saucedemo/SauceDemoProductDetailPage'

const productsPage = new SauceDemoProductsPage()
const productDetailPage = new SauceDemoProductDetailPage()

describe('SD-TC-CATALOGO - Catalogo de productos en SauceDemo [SCRUM-57]', () => {

    beforeEach(() => {
        cy.loginAsSDStandardUser()
    })

    it('[CA-01][TC-01.1][SCRUM-T38] Debe mostrar el listado completo de productos', () => {
        productsPage.verifyProductCount(6)
    })

    it('[CA-01][TC-01.2][SCRUM-T37] Debe mostrar la informacion completa de cada producto en el listado', () => {
        productsPage.verifyAllProductsHaveCompleteInfo()
    })

    it('[CA-02][TC-02.1][SCRUM-T34] Debe mostrar el detalle de un producto al seleccionarlo desde el listado', () => {
        productsPage.selectProduct('Sauce Labs Backpack')

        productDetailPage.verifyProductDetail('Sauce Labs Backpack', '$29.99')
    })

    it('[CA-02][TC-02.2][SCRUM-T36] Debe volver al listado desde la vista de detalle', () => {
        productsPage.selectProduct('Sauce Labs Backpack')
        productDetailPage.verifyProductDetail('Sauce Labs Backpack', '$29.99')

        productDetailPage.goBackToProducts()

        productsPage.verifyProductCount(6)
    })

    it('[CA-03][TC-03.1][SCRUM-T35] Debe aplicar el orden alfabetico ascendente (A-Z)', () => {
        productsPage.selectSortOption('az')

        productsPage.verifySortedAscendingByName()
    })

    it('[CA-03][TC-03.2][SCRUM-T39] Debe mantener la integridad de los datos tras aplicar el orden', () => {
        productsPage.getProductPrice('Sauce Labs Backpack').should('have.text', '$29.99')

        productsPage.selectSortOption('az')

        productsPage.getProductPrice('Sauce Labs Backpack').should('have.text', '$29.99')
    })
})
