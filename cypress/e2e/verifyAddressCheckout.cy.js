// Test Case 23 - Verify address details in checkout page
// Sitio bajo prueba: https://automationexercise.com
//
// Pasos:
// 1. Launch browser
// 2. Navigate to url 'http://automationexercise.com'
// 3. Verify that home page is visible successfully
// 4. Click 'Signup / Login' button
// 5. Fill all details in Signup and create account
// 6. Verify 'ACCOUNT CREATED!' and click 'Continue' button
// 7. Verify 'Logged in as username' at top
// 8. Add products to cart
// 9. Click 'Cart' button
// 10. Verify that cart page is displayed
// 11. Click Proceed To Checkout
// 12. Verify that the delivery address matches the registration address
// 13. Verify that the billing address matches the registration address
// 14. Click 'Delete Account' button
// 15. Verify 'ACCOUNT DELETED!' and click 'Continue' button

import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import SignupPage from '../pages/SignupPage'
import CheckoutPage from '../pages/CheckoutPage'

describe('Test Case 23 - Verify address details in checkout page', () => {

    const homePage = new HomePage()
    const loginPage = new LoginPage()
    const signupPage = new SignupPage()
    const checkoutPage = new CheckoutPage()

    const timestamp = Date.now()
    const USER = {
        name: `QAUser23_${timestamp}`,
        email: `qauser23_${timestamp}@test.com`,
        password: 'Password123',
        day: '10',
        month: 'January',
        year: '1990',
        firstName: 'QA',
        lastName: 'User23',
        address: '123 Test Street',
        country: 'United States',
        state: 'California',
        city: 'Los Angeles',
        zipcode: '90001',
        mobile: '5551234567'
    }

    beforeEach(() => {
        cy.intercept({ resourceType: /fetch/ }, { log: false })
        cy.gotoAEUrl('/')
    })

    it('Debe verificar que las direcciones en checkout coinciden con los datos de registro', () => {

        // Paso 3: Verificar que la home page es visible
        homePage.verifyHomePageVisible()

        // Paso 4: Click en "Signup / Login"
        homePage.clickSignupLogin()

        // Paso 5: Completar nombre y email del signup inicial
        signupPage.fillSignupName(USER.name)
        signupPage.fillSignupEmail(USER.email)
        signupPage.clickSignupButton()

        // Completar formulario de detalle de cuenta
        signupPage.fillAccountDetails(USER)
        signupPage.clickCreateAccount()

        // Paso 6: Verificar 'Account Created!' y click en 'Continue'
        signupPage.verifyAccountCreated()
        signupPage.clickContinue()

        // Paso 7: Verificar 'Logged in as username'
        loginPage.verifyLoggedIn(USER.name)

        // Paso 8: Agregar un producto al carrito
        cy.gotoAEUrl('/products')
        cy.get('.product-image-wrapper').first()
            .find('.productinfo a')
            .should('have.text', 'Add to cart')
            .click()

        cy.get('#cartModal').should('be.visible')
        cy.get('#cartModal [data-dismiss="modal"]').click()

        // Paso 9-10: Navegar al carrito y verificar
        checkoutPage.clickCartLink()
        checkoutPage.verifyCartPageDisplayed()

        // Paso 11: Click en Proceed To Checkout
        checkoutPage.clickProceedToCheckout()

        // Paso 12: Verificar delivery address
        checkoutPage.verifyDeliveryAddress(USER)

        // Paso 13: Verificar billing address
        checkoutPage.verifyBillingAddress(USER)

        // Paso 14-15: Eliminar cuenta
        cy.gotoAEUrl('/')
        signupPage.clickDeleteAccount()
        signupPage.verifyAccountDeleted()
        signupPage.clickContinue()
    })
})
