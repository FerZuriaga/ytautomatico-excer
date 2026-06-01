// Test Case 4 - Logout User
// Sitio bajo prueba: https://automationexercise.com

import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'

describe('Logout User - Page Object Model', () => {

    // Instancias de los Page Objects
    const homePage = new HomePage()
    const loginPage = new LoginPage()

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
