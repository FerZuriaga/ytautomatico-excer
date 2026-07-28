// Modulo: Autenticacion (Login / Logout) - AutomationExercise
// Sitio bajo prueba: https://automationexercise.com
// Agrupa: Login Exitoso, TC3 - Login Incorrecto [SCRUM-27], TC4 - Logout

import HomePage from '../../pages/automation-exercise/HomePage'
import LoginPage from '../../pages/automation-exercise/LoginPage'

const homePage = new HomePage()
const loginPage = new LoginPage()

describe('Login page', () => {
    it('Test case 1 : Login con correcto user', () => {
        cy.gotoAEUrl("/login")
        cy.get('[data-qa= "login-email"]').type("testops@test.com")
        cy.get('[data-qa= "login-password"]').type("password123")
        cy.get('[data-qa= "login-button"]').click()
        cy.get('.shop-menu li a').last().should("have.text", " Logged in as testOps")
        cy.get('li [href="/logout"]').should("have.text", " Logout")
    })
})

describe('TC3 - Login User with Incorrect Email and Password', () => {

    it('should show error message when login with incorrect credentials', () => {

        // Paso 1-2: Lanzar navegador y navegar a la URL
        cy.gotoAEUrl('/')

        // Paso 3: Verificar que la home page es visible
        homePage.verifyHomePageVisible()

        // Paso 4: Click en "Signup / Login"
        homePage.clickSignupLogin()

        // Paso 5: Verificar que el formulario de Login está visible
        loginPage.verifyLoginFormVisible()

        // Paso 6: Ingresar credenciales incorrectas
        loginPage.enterCredentials('wrongemail@test.com', 'wrongpassword123')

        // Paso 6 (cont.): Click en "Login"
        loginPage.clickLoginButton()

        // Paso 7: Verificar que el mensaje de error aparece
        loginPage.verifyLoginError()
    })
})

describe('Logout User - Page Object Model', () => {

    // Credenciales de prueba
    const EMAIL = 'testops@test.com'
    const PASSWORD = 'password123'
    const USERNAME = 'testOps'

    beforeEach(() => {
        // Navegar a la home antes de cada test usando el comando custom del proyecto
        cy.gotoAEUrl('/')
    })

    it('Debe hacer logout correctamente y redirigir a la página de login', () => {

        // Paso 1-3: Verificar que la home page es visible
        homePage.verifyHomePageVisible()

        // Paso 4: Click en botón "Signup / Login"
        homePage.clickSignupLogin()

        // Paso 5: Verificar que "Login to your account" es visible
        loginPage.verifyLoginFormVisible()

        // Paso 6: Ingresar email y password correctos
        loginPage.enterCredentials(EMAIL, PASSWORD)

        // Paso 7: Click en botón "Login"
        loginPage.clickLoginButton()

        // Paso 8: Verificar que "Logged in as username" es visible
        loginPage.verifyLoggedIn(USERNAME)

        // Paso 9: Click en botón "Logout"
        loginPage.clickLogout()

        // Paso 10: Verificar que el usuario es redirigido a la página de login
        cy.validateAEUrl('/login')
        loginPage.verifyLoginFormVisible()
    })
})
