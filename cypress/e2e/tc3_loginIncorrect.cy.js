// Test Case 3 - Login User with Incorrect Email and Password
// Sitio bajo prueba: https://automationexercise.com
// Ticket Jira: SCRUM-27
// Fuente oficial: https://automationexercise.com/test_cases

import LoginPage from '../pages/LoginPage'
import HomePage from '../pages/HomePage'

const loginPage = new LoginPage()
const homePage = new HomePage()

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
