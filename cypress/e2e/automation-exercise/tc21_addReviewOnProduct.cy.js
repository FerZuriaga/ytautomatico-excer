// Test Case 21 - Add Review on Product
// Sitio bajo prueba: https://automationexercise.com
// Ticket Jira: SCRUM-21
// Rama: feature/SCRUM-21-tc21-add-review-product

import ProductsPage from '../../pages/automation-exercise/ProductsPage'
import ProductDetailPage from '../../pages/automation-exercise/ProductDetailPage'

describe('[SCRUM-21] TC21 - Add Review on Product', () => {

    const productsPage = new ProductsPage()
    const productDetailPage = new ProductDetailPage()

    // Datos de prueba para la resena
    const REVIEWER_NAME = 'Test User QA'
    const REVIEWER_EMAIL = 'qatest@automationexercise.com'
    const REVIEW_TEXT = 'This is an automated review submitted by QA Automation. Great product!'

    beforeEach(() => {
        // Paso 1-2: Launch browser y navegar a la home
        cy.gotoAEUrl('/')
    })

    it('Debe agregar una resena a un producto y verificar mensaje de exito', () => {

        // Paso 3: Click en Products button
        productsPage.clickAllProductsButton()

        // Paso 4: Verificar que estamos en la pagina ALL PRODUCTS
        productsPage.verifyAllProductsPage()

        // Paso 5: Click en "View Product" del primer producto
        cy.get('.choose a').first().click()

        // Paso 6: Verificar que "Write Your Review" es visible
        productDetailPage.verifyWriteReviewVisible()

        // Paso 7-8: Ingresar nombre, email, review y hacer click en Submit
        productDetailPage.submitReview(REVIEWER_NAME, REVIEWER_EMAIL, REVIEW_TEXT)

        // Paso 9: Verificar mensaje de exito "Thank you for your review."
        productDetailPage.verifyReviewSuccessMessage()
    })
})
