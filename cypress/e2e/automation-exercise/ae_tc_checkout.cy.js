// Modulo: Checkout y Ordenes - AutomationExercise
// Sitio bajo prueba: https://automationexercise.com
// Agrupa: TC14 [SCRUM-13], TC15 [SCRUM-8], TC16 [SCRUM-35], TC23 (verificacion de direcciones)

import HomePage from '../../pages/automation-exercise/HomePage'
import CartPage from '../../pages/automation-exercise/CartPage'
import SignupPage from '../../pages/automation-exercise/SignupPage'
import LoginPage from '../../pages/automation-exercise/LoginPage'
import CheckoutPage from '../../pages/automation-exercise/CheckoutPage'

const homePage = new HomePage()
const cartPage = new CartPage()
const signupPage = new SignupPage()
const loginPage = new LoginPage()
const checkoutPage = new CheckoutPage()

describe('TC14 - Place Order: Register while Checkout', () => {

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
        signupPage.fillAddressDetails({
            firstName   : USER.firstName,
            lastName    : USER.lastName,
            address1    : USER.address,
            country     : 'United States',
            state       : USER.state,
            city        : USER.city,
            zipcode     : USER.zipcode,
            mobileNumber: USER.mobile
        })
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

describe('TC15 - Place Order: Register before Checkout', () => {

    // Datos de prueba: usuario nuevo con timestamp para evitar colisiones
    const timestamp = Date.now()
    const USER = {
        name: `TestUser${timestamp}`,
        email: `testuser${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        address: '123 Automation Street',
        country: 'United States',
        state: 'California',
        city: 'Los Angeles',
        zipcode: '90001',
        mobile: '5551234567',
        day: '15',
        month: 'March',
        year: '1990'
    }

    // Datos de prueba: tarjeta de pago
    const PAYMENT = {
        nameOnCard: 'Test User',
        cardNumber: '4111111111111111',
        cvc: '123',
        expiryMonth: '12',
        expiryYear: '2027'
    }

    // Producto a agregar al carrito (primer producto disponible)
    const PRODUCT_INDEX = 0

    beforeEach(() => {
        // Interceptar recursos innecesarios para mejorar performance
        cy.intercept({ resourceType: /fetch/ }, { log: false })
        // Navegar a la home antes de cada test
        cy.gotoAEUrl('/')
    })

    it('Debe registrar usuario, completar checkout y confirmar la orden exitosamente', () => {

        // Paso 1-3: Verificar que la home page es visible
        homePage.verifyHomePageVisible()

        // Paso 4: Click en boton "Signup / Login"
        homePage.clickSignupLogin()

        // Paso 5: Completar el formulario de registro (nombre y email)
        signupPage.fillSignupNameAndEmail(USER.name, USER.email)

        // Verificar que se muestra el formulario de informacion de cuenta
        signupPage.verifyAccountInfoForm()

        // Completar el formulario detallado de informacion de cuenta
        signupPage.fillAccountDetails({
            password: USER.password,
            day: USER.day,
            month: USER.month,
            year: USER.year,
            firstName: USER.firstName,
            lastName: USER.lastName,
            address: USER.address,
            country: USER.country,
            state: USER.state,
            city: USER.city,
            zipcode: USER.zipcode,
            mobile: USER.mobile
        })

        // Hacer click en "Create Account"
        signupPage.clickCreateAccount()

        // Paso 6: Verificar "ACCOUNT CREATED!" y hacer click en Continue
        signupPage.verifyAccountCreatedAndContinue()

        // Paso 7: Verificar que "Logged in as username" es visible en la parte superior
        cy.get('.shop-menu li a').last()
            .should('contain.text', `Logged in as ${USER.name}`)

        // Paso 8: Agregar un producto al carrito desde la pagina de productos
        cy.gotoAEUrl('/products')
        cy.get('.product-image-wrapper').eq(PRODUCT_INDEX)
            .find('.productinfo a')
            .should('have.text', 'Add to cart')
            .click()

        // Cerrar el modal de confirmacion con "Continue Shopping"
        cy.get('#cartModal').should('be.visible')
        cy.get('#cartModal [data-dismiss="modal"]').click()

        // Paso 9-10: Click en boton "Cart" y verificar que la pagina del carrito se muestra
        checkoutPage.clickCartButton()
        checkoutPage.verifyCartPageDisplayed()

        // Paso 11: Click en "Proceed To Checkout"
        checkoutPage.clickProceedToCheckout()

        // Paso 12: Verificar Address Details y Review de la orden
        checkoutPage.verifyAddressDetails()
        cy.get('#cart_info').should('exist').and('be.visible')

        // Paso 13: Ingresar comentario y hacer click en "Place Order"
        checkoutPage.enterCommentAndPlaceOrder('Automated test order - please process')

        // Paso 14: Ingresar datos de pago
        checkoutPage.fillPaymentDetails(PAYMENT)

        // Paso 15: Click en "Pay and Confirm Order"
        checkoutPage.clickPayAndConfirm()

        // Paso 16: Verificar mensaje de exito "Your order has been placed successfully!"
        checkoutPage.verifyOrderPlacedSuccessfully()

        // Paso 17: Click en "Delete Account"
        signupPage.clickDeleteAccount()

        // Paso 18: Verificar "ACCOUNT DELETED!" y hacer click en Continue
        signupPage.verifyAccountDeletedAndContinue()

        // Verificar que redirige a la home despues de eliminar la cuenta
        cy.validateAEUrl('/')
    })
})

describe('[SCRUM-35] TC16 - Place Order: Login before Checkout', () => {

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

describe('Test Case 23 - Verify address details in checkout page', () => {

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
