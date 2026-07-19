/**
 * Test Case 9 - Search Product
 * JIRA: SCRUM-2
 * Branch: feature/SCRUM-2-tc9-search-product
 *
 * Steps:
 * 1. Launch browser
 * 2. Navigate to url 'http://automationexercise.com'
 * 3. Verify that home page is visible successfully
 * 4. Click on 'Products' button
 * 5. Verify user is navigated to ALL PRODUCTS page successfully
 * 6. Enter product name in search input and click search button
 * 7. Verify 'SEARCHED PRODUCTS' is visible
 * 8. Verify all the products related to search are visible
 */

import ProductsPage from '../../pages/automation-exercise/ProductsPage'

describe('Test Case 9 - Search Product', () => {

    const productsPage = new ProductsPage()

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
