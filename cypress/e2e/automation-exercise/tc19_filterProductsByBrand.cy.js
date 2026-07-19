// Test Case 19 - Filter products by brand
// Sitio bajo prueba: https://automationexercise.com
//
// Pasos:
// 1. Navigate to home page
// 2. Click on 'Products' button
// 3. Verify brands are visible in the left sidebar
// 4. Click on a random brand
// 5. Verify the user is navigated to the brand products page
// 6. Verify the page title matches the selected brand and the product count matches

import HomePage from '../../pages/automation-exercise/HomePage'
import ProductsPage from '../../pages/automation-exercise/ProductsPage'

describe('Test Case 19 - Filter Products by Brand', () => {

    const homePage = new HomePage()
    const productsPage = new ProductsPage()

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
