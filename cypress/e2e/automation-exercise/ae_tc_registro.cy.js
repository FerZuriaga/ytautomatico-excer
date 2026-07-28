// Modulo: Registro de Usuario (Signup) - AutomationExercise
// Sitio bajo prueba: https://automationexercise.com
// Agrupa: TC1 - Register User [SCRUM-24], TC5 - Register with Existing Email

import HomePage from '../../pages/automation-exercise/HomePage'
import SignupPage from '../../pages/automation-exercise/SignupPage'
import LoginPage from '../../pages/automation-exercise/LoginPage'

const homePage = new HomePage()
const signupPage = new SignupPage()
const loginPage = new LoginPage()

describe('Register User - Page Object Model [SCRUM-24]', () => {

    // Datos de prueba — email con timestamp para garantizar unicidad
    const TIMESTAMP   = Date.now()
    const USERNAME    = `testUser${TIMESTAMP}`
    const EMAIL       = `testuser${TIMESTAMP}@testqa.com`
    const PASSWORD    = 'TestPass123!'

    const ADDRESS_DATA = {
        firstName   : 'Test',
        lastName    : 'User',
        company     : 'QA Corp',
        address1    : '123 Test Street',
        address2    : 'Suite 456',
        country     : 'United States',
        state       : 'California',
        city        : 'Los Angeles',
        zipcode     : '90001',
        mobileNumber: '5551234567'
    }

    beforeEach(() => {
        // Paso 1-2: Lanzar navegador y navegar a la URL
        cy.gotoAEUrl('/')
    })

    it('Debe registrar un nuevo usuario y eliminar la cuenta correctamente', () => {

        // Paso 3: Verificar que la home page es visible
        homePage.verifyHomePageVisible()

        // Paso 4: Click en "Signup / Login"
        homePage.clickSignupLogin()

        // Paso 5: Verificar que "New User Signup!" es visible
        signupPage.verifyNewUserSignupVisible()

        // Paso 6: Ingresar nombre y email
        signupPage.enterSignupNameAndEmail(USERNAME, EMAIL)

        // Paso 7: Click en "Signup"
        signupPage.clickSignupButton()

        // Paso 8: Verificar que "ENTER ACCOUNT INFORMATION" es visible
        signupPage.verifyAccountInfoFormVisible()

        // Paso 9: Llenar datos: Title, Name, Email, Password, Date of birth
        signupPage.fillAccountInfo(PASSWORD)

        // Paso 10: Seleccionar checkbox "Sign up for our newsletter!"
        // Paso 11: Seleccionar checkbox "Receive special offers from our partners!"
        signupPage.selectNewsletterAndOffers()

        // Paso 12: Llenar datos de dirección
        signupPage.fillAddressDetails(ADDRESS_DATA)

        // Paso 13: Click en "Create Account"
        signupPage.clickCreateAccount()

        // Paso 14: Verificar que "ACCOUNT CREATED!" es visible
        signupPage.verifyAccountCreated()

        // Paso 15: Click en "Continue"
        signupPage.clickContinue()

        // Paso 16: Verificar que "Logged in as username" es visible
        loginPage.verifyLoggedIn(USERNAME)

        // Paso 17: Click en "Delete Account"
        signupPage.clickDeleteAccount()

        // Paso 18: Verificar que "ACCOUNT DELETED!" es visible
        signupPage.verifyAccountDeleted()

        // Click Continue final para completar el flujo
        signupPage.clickContinue()
    })
})

describe('TC5 - Register User with Existing Email', () => {
  it('should show error when registering with an already registered email', () => {
    // Paso 1-2: navegar y verificar home
    cy.visit('https://automationexercise.com')
    homePage.verifyHomePageVisible()

    // Paso 3: click Signup/Login
    homePage.clickSignupLogin()

    // Paso 4: verificar sección New User Signup visible
    signupPage.verifyNewUserSignupVisible()

    // Paso 5-6: ingresar nombre y email ya registrado, hacer click en Signup
    signupPage.enterSignupNameAndEmail('Test User', 'testops@test.com')
    signupPage.clickSignupButton()

    // Paso 7: verificar mensaje de error email ya existe
    signupPage.verifyEmailAlreadyExists()
  })
})
