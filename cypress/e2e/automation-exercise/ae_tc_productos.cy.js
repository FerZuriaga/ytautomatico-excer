// Modulo: Catalogo y Detalle de Productos - AutomationExercise
// Sitio bajo prueba: https://automationexercise.com
// Agrupa: TC2 [SCRUM-34], TC8, TC9, TC18, TC19, TC22 [SCRUM-33]

import HomePage from '../../pages/automation-exercise/HomePage'
import ProductsPage from '../../pages/automation-exercise/ProductsPage'
import ProductDetailPage from '../../pages/automation-exercise/ProductDetailPage'

const homePage = new HomePage()
const productsPage = new ProductsPage()
const productDetailPage = new ProductDetailPage()

describe('[SCRUM-34] TC2 - Ver todos los productos y verificar detalle', () => {

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

describe('TC8 - Verify All Products and Product Detail Page', () => {

    beforeEach(() => {
        // Paso 1-2: Launch browser y navegar a la home
        cy.gotoAEUrl('/')
    })

    it('Debe navegar a All Products, listar productos y verificar el detalle del primer producto', () => {

        // Paso 3: Verificar que la home page es visible
        homePage.verifyHomePageVisible()

        // Paso 4: Click en botón 'Products' en la barra de navegación
        productsPage.clickAllProductsButton()

        // Paso 5: Verificar que el usuario navega a la página ALL PRODUCTS
        cy.validateAEUrl('/products')

        // Paso 6: Verificar que el título es 'All Products' y la lista de productos es visible
        productsPage.verifyAllProductsPage()

        // Paso 7: Click en 'View Product' del primer producto
        productsPage.clickFirstProductViewLink()

        // Paso 8: Verificar que el usuario llega a la página de detalle del producto
        cy.validateAEUrl('/product_details')

        // Paso 9: Verificar que el detalle contiene: nombre, categoría, precio, disponibilidad, condición, marca
        productsPage.verifyProductDetailPage()
    })
})

describe('Test Case 9 - Search Product', () => {

    const PRODUCT_TO_SEARCH = 'Blue Top'

    beforeEach(() => {
        // Step 1-3: Navigate to home page and verify it is visible
        cy.gotoAEUrl('/')
        cy.get('body').should('be.visible')
    })

    it('Should search for a product and verify all results are related to the search term', () => {

        // Step 4: Click on 'Products' button
        productsPage.clickAllProductsButton()

        // Step 5: Verify user is navigated to ALL PRODUCTS page
        productsPage.verifyAllProductsPage()
        cy.validateAEUrl('/products')

        // Step 6: Enter product name in search input and click search button
        productsPage.searchProduct(PRODUCT_TO_SEARCH)

        // Step 7: Verify 'SEARCHED PRODUCTS' is visible
        productsPage.verifySearchedProductsTitle()

        // Step 8: Verify all the products related to search are visible
        productsPage.verifyProductsContain(PRODUCT_TO_SEARCH)
    })
})

describe('Test Case 18 - Filter Products by Category', () => {

    beforeEach(() => {
        cy.gotoAEUrl('/')
    })

    it('Debe filtrar productos por una categoria aleatoria y mostrar resultados', () => {

        homePage.verifyHomePageVisible()

        productsPage.clickAllProductsButton()
        productsPage.verifyAllProductsPage()

        productsPage.clickRandomCategory()
        productsPage.verifyCategoryProductsPage()
    })
})

describe('Test Case 19 - Filter Products by Brand', () => {

    beforeEach(() => {
        cy.gotoAEUrl('/')
    })

    it('Debe filtrar productos por una marca aleatoria y verificar titulo y cantidad de resultados', () => {

        homePage.verifyHomePageVisible()

        productsPage.clickAllProductsButton()
        productsPage.verifyAllProductsPage()

        productsPage.clickRandomBrand()
        productsPage.verifyBrandProductsPage()
    })
})

describe('[SCRUM-33] TC22 - Add Review on Product', () => {

    beforeEach(() => {
        cy.gotoAEUrl('/')
    })

    it('Debe permitir agregar una review en un producto y mostrar mensaje de éxito', () => {

        // Paso 1 y 2: Navegar a la URL base (ejecutado en beforeEach)

        // Paso 3: Verificar que la home page cargó correctamente
        homePage.verifyHomePageVisible()

        // Paso 4: Click en el botón "Products" del menú de navegación
        homePage.clickProducts()

        // Paso 5: Verificar que estamos en la página "ALL PRODUCTS"
        productsPage.verifyAllProductsPage()

        // Paso 6: Click en "View Product" del primer producto
        productsPage.clickViewProduct()

        // Verificar que la URL corresponde a una página de detalle de producto
        cy.validateAEUrl('/product_details/')

        // Paso 7: Verificar que el heading "Write Your Review" es visible
        productDetailPage.verifyWriteYourReviewVisible()

        // Paso 8: Ingresar nombre, email y review
        productDetailPage.fillReviewForm(
            'Test User',
            'testuser@example.com',
            'Great product! Highly recommended.'
        )

        // Paso 9: Click en el botón Submit
        productDetailPage.submitReview()

        // Paso 10: Verificar mensaje de éxito "Thank you for your review."
        productDetailPage.verifySuccessMessage()
    })
})
