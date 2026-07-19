// [SCRUM-23] TC12 - Add Products in Cart
// https://automationexercise.com/test_cases
//
// Pasos:
// 1. Launch browser
// 2. Navigate to url 'http://automationexercise.com'
// 3. Verify that home page is visible successfully
// 4. Click on 'Products' button
// 5. Hover over first product and click 'Add to cart'
// 6. Click 'Continue Shopping' button
// 7. Hover over second product and click 'Add to cart'
// 8. Click 'View Cart' button
// 9. Verify both products are added to Cart
// 10. Verify their prices, quantity and total price

import ProductsPage from '../../pages/automation-exercise/ProductsPage'
import CartPage from '../../pages/automation-exercise/CartPage'
import HomePage from '../../pages/automation-exercise/HomePage'

const productsPage = new ProductsPage()
const cartPage = new CartPage()
const homePage = new HomePage()

describe('[SCRUM-23] TC12 - Add Products in Cart', () => {

    beforeEach(() => {
        // Step 1 & 2: Launch browser and navigate to automationexercise.com
        cy.gotoAEUrl('/')
    })

    it('should add two products to cart and verify prices, quantity and total', () => {

        // Step 3: Verify that home page is visible successfully
        homePage.verifyHomePageVisible()

        // Step 4: Click on 'Products' button
        productsPage.clickAllProductsButton()
        productsPage.verifyAllProductsPage()

        // Step 5: Hover over first product and click 'Add to cart'
        productsPage.hoverAndAddToCart(0)

        // Step 6: Click 'Continue Shopping' button
        productsPage.clickContinueShopping()

        // Step 7: Hover over second product and click 'Add to cart'
        productsPage.hoverAndAddToCart(1)

        // Step 8: Click 'View Cart' button
        productsPage.clickViewCartFromModal()

        // Step 9: Verify both products are added to Cart
        cartPage.verifyCartPageVisible()
        cartPage.verifyCartHasProducts(2)

        // Step 10: Verify prices, quantity and total price for each product
        // Quantity of each product must be 1
        cartPage.verifyAllProductsQuantityIsOne()

        // Total price of each product must match its unit price (quantity = 1)
        cartPage.verifyProductTotalMatchesUnitPrice(0)
        cartPage.verifyProductTotalMatchesUnitPrice(1)
    })
})
