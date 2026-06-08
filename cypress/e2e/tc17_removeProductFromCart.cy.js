/**
 * Test Case 17 - Remove Products From Cart
 * JIRA: SCRUM-12
 * Branch: feature/SCRUM-12-tc17-remove-products-from-cart
 *
 * Steps:
 * 1. Launch browser
 * 2. Navigate to http://automationexercise.com
 * 3. Verify home page is loaded
 * 4. Add products to cart
 * 5. Click Cart button
 * 6. Verify Cart page is shown
 * 7. Click 'X' button to remove a product
 * 8. Verify product is removed from cart
 */

describe('Test Case 17 - Remove Products From Cart', () => {
  it('Should remove a product from cart and verify cart is empty', () => {
    // Step 1-3: Navigate to home page and verify it loads
    cy.gotoAEUrl('/')
    cy.get('body').should('be.visible')
    cy.get('.logo').should('be.visible')

    // Step 4: Add a product to cart from the products page
    cy.gotoAEUrl('/products')
    cy.get('.product-image-wrapper').should('have.length.greaterThan', 0)

    // Add the first product to cart
    cy.get('.product-image-wrapper').first().within(() => {
      cy.get('.productinfo a.btn').click()
    })

    // Dismiss the modal
    cy.get('#cartModal .modal-confirm').should('be.visible')
    cy.get('#cartModal .modal-confirm [data-dismiss="modal"]').click()

    // Step 5: Click Cart button
    cy.get('.shop-menu ul li a[href*="cart"]').click()

    // Step 6: Verify Cart page is shown
    cy.validateAEUrl('/view_cart')
    cy.get('#cart_info').should('be.visible')
    cy.get('#cart_info_table tbody tr').should('have.length.greaterThan', 0)

    // Step 7: Click 'X' button to remove the product
    cy.get('#cart_info_table tbody tr').first().within(() => {
      cy.get('.cart_delete a.cart_quantity_delete').click()
    })

    // Step 8: Verify product is removed - cart should be empty
    cy.get('#empty_cart').should('be.visible')
    cy.get('#empty_cart p').should('contain', 'Cart is empty!')
  })
})
