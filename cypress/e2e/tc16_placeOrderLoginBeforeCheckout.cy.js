// Test Case 16 - Place Order: Login before Checkout
// Sitio bajo prueba: https://automationexercise.com
// Ticket Jira: SCRUM-35

import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import CartPage from '../pages/CartPage'
import CheckoutPage from '../pages/CheckoutPage'

describe('[SCRUM-35] TC16 - Place Order: Login before Checkout', () => {

    const homePage = new HomePage()
    const loginPage = new LoginPage()
    const cartPage = new CartPage()
    const checkoutPage = new CheckoutPage()

    const USER = {
        email: 'testops@test.com',
        password: 'password123',
        username: 'testOps'
    }

    const PAYMENT = {
        nameOnCard: 'Test User',
        cardNumber: '4111111111111111',
        cvc: '123',
        expiryMonth: '12',
        expiryYear: '2027'
    }

    beforeEach(() => {
        cy.intercept({ resourceType: /fetch/ }, { log: false })
        cy.gotoAEUrl('/')
    })

    it('Debe iniciar sesión, agregar producto al carrito y completar el pedido exitosamente', () => {

        // Paso 3: Verificar que la home page es visible
        homePage.verifyHomePageVisible()

        // Paso 4: Click en "Signup / Login"
        homePage.clickSignupLogin()

        // Paso 5: Ingresar credenciales y hacer login
        loginPage.verifyLoginFormVisible()
        loginPage.enterCredentials(USER.email, USER.password)
        loginPage.clickLoginButton()

        // Paso 6: Verificar "Logged in as username"
        loginPage.verifyLoggedIn(USER.username)

        // Paso 7: Agregar producto al carrito
        cartPage.addFirstProductToCart()

        // Paso 8-9: Click en Cart y verificar página del carrito
        cartPage.clickCartButton()
        cartPage.verifyCartPageDisplayed()

        // Paso 10: Click en "Proceed To Checkout"
        cartPage.clickProceedToCheckout()

        // Paso 11: Verificar Address Details y Review Your Order
        checkoutPage.verifyAddressAndOrderDetails()

        // Paso 12: Ingresar comentario y hacer click en "Place Order"
        checkoutPage.enterComment('Automated test order TC16')
        checkoutPage.clickPlaceOrder()

        // Paso 13: Ingresar datos de pago
        checkoutPage.enterPaymentDetails(
            PAYMENT.nameOnCard,
            PAYMENT.cardNumber,
            PAYMENT.cvc,
            PAYMENT.expiryMonth,
            PAYMENT.expiryYear
        )

        // Paso 14: Click en "Pay and Confirm Order"
        checkoutPage.clickPayAndConfirm()

        // Paso 15: Verificar mensaje de éxito
        checkoutPage.verifyOrderPlaced()
    })
})
