// Test: Verificar todos los productos y detalle del producto con Page Object Model
// Sitio bajo prueba: https://automationexercise.com
// Ticket: SCRUM-34 | TC2 - Ver todos los productos y verificar detalle del producto

import HomePage from '../pages/HomePage'
import ProductsPage from '../pages/ProductsPage'
import ProductDetailPage from '../pages/ProductDetailPage'

describe('[SCRUM-34] TC2 - Ver todos los productos y verificar detalle', () => {

    const homePage = new HomePage()
    const productsPage = new ProductsPage()
    const productDetailPage = new ProductDetailPage()

    beforeEach(() => {
        cy.gotoAEUrl('/')
    })

    it('Debe navegar al catálogo, seleccionar un producto aleatorio y verificar que el detalle coincide con la lista', () => {

        // Paso 1: Verificar que la home page cargó correctamente
        homePage.verifyHomePageVisible()

        // Paso 2: Click en botón "Products"
        productsPage.clickAllProductsButton()

        // Paso 3: Verificar que la página "All Products" cargó correctamente
        productsPage.verifyAllProductsPage()

        // Paso 4: Seleccionar un producto aleatorio y guardar nombre y precio
        productsPage.productCards.then((products) => {
            cy.randomNum(products.length).then((randomIndex) => {
                productsPage.getProductPriceAt(randomIndex).as('expectedPrice')
                productsPage.getProductNameAt(randomIndex).as('expectedName')

                // Paso 5: Click en "View Product" del producto seleccionado
                productsPage.clickViewProductAt(randomIndex)
            })
        })

        // Paso 6: Verificar que estamos en la página de detalle
        productDetailPage.verifyOnDetailPage()

        // Paso 7: Verificar que precio y nombre coinciden con la lista
        cy.get('@expectedPrice').then((price) => {
            productDetailPage.verifyPriceMatches(price)
        })

        cy.get('@expectedName').then((name) => {
            productDetailPage.verifyNameMatches(name)
        })

        // Paso 8: Verificar campos informativos del producto
        productDetailPage.verifyProductInfoLabels()
    })
})
