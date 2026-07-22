// Test Case SD-TC-CARRITO - Carrito en SauceDemo
// Sitio bajo prueba: https://www.saucedemo.com
// Ticket Jira: SCRUM-55
//
// Cubre los 4 Test Cases del Modelo Canonico publicados en Zephyr
// (SCRUM-T27 a SCRUM-T30, Test Cycle SCRUM-R4), reorganizados en 3
// criterios de aceptacion atomicos:
// - CA-01 (Contador de Carrito): TC-01.1 (1 producto), TC-01.2 (varios)
// - CA-02 (Detalle del Carrito): TC-02.1 (nombre/descripcion/precio)
// - CA-03 (Estado Vacio): TC-02.2 (sin indicador, sin items)
//
// Los tags [CA-XX][TC-XX.X] identifican el criterio/caso de prueba
// funcional; el tag [SCRUM-Txx] identifica el Test Case real en Zephyr y
// es el que usa el mecanismo de reporte (--report-results) para resolver
// la Test Execution a actualizar.

import SauceDemoProductsPage from '../../pages/saucedemo/SauceDemoProductsPage'
import SauceDemoCartPage from '../../pages/saucedemo/SauceDemoCartPage'

const productsPage = new SauceDemoProductsPage()
const cartPage = new SauceDemoCartPage()

describe('SD-TC-CARRITO - Carrito en SauceDemo [SCRUM-55]', () => {

    beforeEach(() => {
        cy.loginAsSDStandardUser()
    })

    it('[CA-01][TC-01.1][SCRUM-T28] Debe incrementar el contador al agregar 1 producto', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.verifyCartBadgeCount(1)
    })

    it('[CA-01][TC-01.2][SCRUM-T30] Debe incrementar el contador al agregar varios productos', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.addProductToCart('Sauce Labs Bike Light')
        productsPage.addProductToCart('Sauce Labs Bolt T-Shirt')
        productsPage.verifyCartBadgeCount(3)
    })

    it('[CA-02][TC-02.1][SCRUM-T27] Debe validar nombre, descripcion y precio del producto en el carrito', () => {
        productsPage.addProductToCart('Sauce Labs Backpack')
        productsPage.goToCart()
        cartPage.verifyProductInCart('Sauce Labs Backpack', '$29.99')
    })

    it('[CA-03][TC-02.2][SCRUM-T29] Debe mostrar el carrito vacio si no hay items', () => {
        productsPage.goToCart()
        cartPage.verifyCartEmpty()
    })
})
