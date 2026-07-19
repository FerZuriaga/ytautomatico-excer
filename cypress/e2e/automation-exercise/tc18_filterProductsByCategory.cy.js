// Test Case 18 - Filter products by category
// Sitio bajo prueba: https://automationexercise.com
//
// Pasos:
// 1. Navigate to home page
// 2. Click on 'Products' button
// 3. Verify categories are visible in the left sidebar
// 4. Click on a random category
// 5. Verify the user is navigated to the category products page with results

import HomePage from '../../pages/automation-exercise/HomePage'
import ProductsPage from '../../pages/automation-exercise/ProductsPage'

describe('Test Case 18 - Filter Products by Category', () => {

    const homePage = new HomePage()
    const productsPage = new ProductsPage()

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
