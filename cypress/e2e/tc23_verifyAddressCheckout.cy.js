// Test Case 23 - Verify address details in checkout page
// Sitio bajo prueba: https://automationexercise.com
// SCRUM-11

import HomePage from '../pages/HomePage'
import SignupPage from '../pages/SignupPage'
import CheckoutPage from '../pages/CheckoutPage'

describe('TC23 - Verify address details in checkout page', () => {

    // Instancias de los Page Objects
    const homePage = new HomePage()
    const signupPage = new SignupPage()
    const checkoutPage = new CheckoutPage()

    // Datos de prueba: usuario nuevo con timestamp para evitar colisiones
    const timestamp = Date.now()
    const USER = {
        name: `TestUser${timestamp}`,
        email: `testuser${timestamp}@test.com`,
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        address: '456 Test Avenue',
        country: 'United States',
        state: 'New York',
        city: 'New York',
        zipcode: '10001',
        mobile: '5559876543',
        day: '10',
        month: 'June',
        year: '1992'
    }

    // Primer producto del listado
    const PRODUCT_INDEX = 0

    beforeEach(() => {
        // Interceptar recursos innecesarios para mejorar performance
        cy.intercept({ resourceType: /fetch/ }, { log: false })
        // Navegar a la home antes de cada test
        cy.gotoAEUrl('/')
    })

    it('Debe registrar usuario, ir al checkout y verificar que la direccion de entrega y facturacion coinciden con la del registro', () => {

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

        // Paso 12-13: Verificar que la direccion de entrega y facturacion coinciden
        // con la direccion registrada al crear la cuenta
        checkoutPage.verifyAddressContent({
            firstName: USER.firstName,
            lastName: USER.lastName,
            address: USER.address,
            city: USER.city,
            state: USER.state,
            zipcode: USER.zipcode,
            country: USER.country,
            mobile: USER.mobile
        })

        // Paso 14: Click en "Delete Account"
        signupPage.clickDeleteAccount()

        // Paso 15: Verificar "ACCOUNT DELETED!" y hacer click en Continue
        signupPage.verifyAccountDeletedAndContinue()

        // Verificar que redirige a la home despues de eliminar la cuenta
        cy.validateAEUrl('/')
    })
})
