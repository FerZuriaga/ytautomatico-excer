// Test Case 14 - Place Order: Register while Checkout
// Sitio bajo prueba: https://automationexercise.com
// Ticket Jira: SCRUM-13

import HomePage from '../pages/HomePage'
import CartPage from '../pages/CartPage'
import SignupPage from '../pages/SignupPage'
import LoginPage from '../pages/LoginPage'
import CheckoutPage from '../pages/CheckoutPage'

describe('TC14 - Place Order: Register while Checkout', () => {

    const homePage = new HomePage()
    const cartPage = new CartPage()
    const signupPage = new SignupPage()
    const loginPage = new LoginPage()
    const checkoutPage = new CheckoutPage()

    // Datos de usuario únicos para evitar conflictos entre ejecuciones
    const timestamp = Date.now()
    const USER = {
        name: `TestUser${timestamp}`,
        email: `testuser${timestamp}@test.com`,
        password: 'Password123',
        firstName: 'Test',
        lastName: 'User',
        address: '123 Test Street',
        state: 'California',
        city: 'Los Angeles',
        zipcode: '90001',
        mobile: '1234567890'
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

    it('Debe registrarse durante el checkout y completar el pedido exitosamente', () => {

        // Paso 3: Verificar que la home page es visible
        homePage.verifyHomePageVisible()

        // Pasos 4-5: Agregar producto al carrito y navegar al carrito
        cartPage.addFirstProductToCart()
        cartPage.clickCartButton()

        // Paso 6: Verificar que la página del carrito es visible
        cartPage.verifyCartPageDisplayed()

        // Paso 7: Click en "Proceed To Checkout"
        cartPage.clickProceedToCheckout()

        // Paso 8: Click en "Register / Login" button (modal que aparece)
        cartPage.clickRegisterLogin()

        // Paso 9: Completar el formulario de signup
        cy.validateAEUrl('/login')
        signupPage.enterSignupDetails(USER.name, USER.email)
        signupPage.clickSignupButton()

        // Formulario de registro completo
        signupPage.fillAccountInformation(USER.password)
        signupPage.fillAddressDetails(
            USER.firstName,
            USER.lastName,
            USER.address,
            USER.state,
            USER.city,
            USER.zipcode,
            USER.mobile
        )
        signupPage.clickCreateAccount()

        // Paso 10: Verificar "ACCOUNT CREATED!" y click Continue
        signupPage.verifyAccountCreated()
        signupPage.clickContinue()

        // Paso 11: Verificar "Logged in as username"
        loginPage.verifyLoggedIn(USER.name)

        // Paso 12: Click en Cart button
        cartPage.clickCartButton()

        // Paso 13: Click en "Proceed To Checkout"
        cartPage.verifyCartPageDisplayed()
        cartPage.clickProceedToCheckout()

        // Paso 14: Verificar Address Details y Review Your Order
        checkoutPage.verifyAddressAndOrderDetails()

        // Paso 15: Ingresar comentario y click Place Order
        checkoutPage.enterComment('Test order comment')
        checkoutPage.clickPlaceOrder()

        // Paso 16: Ingresar datos de pago
        checkoutPage.enterPaymentDetails(
            PAYMENT.nameOnCard,
            PAYMENT.cardNumber,
            PAYMENT.cvc,
            PAYMENT.expiryMonth,
            PAYMENT.expiryYear
        )

        // Paso 17: Click "Pay and Confirm Order"
        checkoutPage.clickPayAndConfirm()

        // Paso 18: Verificar mensaje de éxito
        checkoutPage.verifyOrderPlaced()

        // Paso 19: Click en "Delete Account"
        signupPage.clickDeleteAccount()

        // Paso 20: Verificar "ACCOUNT DELETED!" y click Continue
        signupPage.verifyAccountDeleted()
        signupPage.clickContinue()
    })
})
