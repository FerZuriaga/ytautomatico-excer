// Test: Agregar review en un producto con Page Object Model
// Sitio bajo prueba: https://automationexercise.com
// Ticket: SCRUM-33 | TC22 - Add Review on Product

import HomePage from '../../pages/automation-exercise/HomePage'
import ProductsPage from '../../pages/automation-exercise/ProductsPage'
import ProductDetailPage from '../../pages/automation-exercise/ProductDetailPage'

describe('[SCRUM-33] TC22 - Add Review on Product', () => {

    const homePage = new HomePage()
    const productsPage = new ProductsPage()
    const productDetailPage = new ProductDetailPage()

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
