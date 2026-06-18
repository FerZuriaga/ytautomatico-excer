// [SCRUM-22] TC13 - Verify Product quantity in Cart
// https://automationexercise.com/test_cases
//
// Pasos:
// 1. Launch browser
// 2. Navigate to url 'http://automationexercise.com'
// 3. Verify that home page is visible successfully
// 4. Click 'View Product' for any product on home page
// 5. Verify product detail is opened
// 6. Increase quantity to 4
// 7. Click 'Add to cart' button
// 8. Click 'View Cart' button
// 9. Verify that product is displayed in cart page with exact quantity

import ProductDetailPage from '../pages/ProductDetailPage'
import CartPage from '../pages/CartPage'
import HomePage from '../pages/HomePage'

const productDetailPage = new ProductDetailPage()
const cartPage = new CartPage()
const homePage = new HomePage()

const EXPECTED_QUANTITY = 4

describe('[SCRUM-22] TC13 - Verify Product quantity in Cart', () => {

    beforeEach(() => {
        // Step 1 & 2: Launch browser and navigate to automationexercise.com
        cy.gotoAEUrl('/')
    })

    it('should display the product in cart with the exact quantity set on detail page', () => {

        // Step 3: Verify that home page is visible successfully
        homePage.verifyHomePageVisible()

        // Step 4: Click 'View Product' for the first product on home page
        cy.get('.features_items .product-image-wrapper').first().within(() => {
            cy.contains('View Product').click()
        })

        // Step 5: Verify product detail is opened
        productDetailPage.verifyProductDetailVisible()

        // Step 6: Increase quantity to 4
        productDetailPage.setQuantity(EXPECTED_QUANTITY)

        // Verify the input reflects the new quantity before submitting
        productDetailPage.quantityInput.should('have.value', String(EXPECTED_QUANTITY))

        // Step 7: Click 'Add to cart' button
        productDetailPage.clickAddToCart()

        // Step 8: Click 'View Cart' button (inside the confirmation modal)
        productDetailPage.clickViewCart()

        // Step 9: Verify that product is displayed in cart page with exact quantity
        cartPage.verifyCartPageVisible()
        cartPage.verifyCartNotEmpty()
        cartPage.verifyProductQuantity(EXPECTED_QUANTITY)
    })
})
