import SignupPage from '../../pages/automation-exercise/SignupPage'
import HomePage from '../../pages/automation-exercise/HomePage'

const signupPage = new SignupPage()
const homePage = new HomePage()

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
