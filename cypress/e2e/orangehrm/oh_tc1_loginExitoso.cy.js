// Test Case OH-TC1 - Login exitoso con credenciales validas
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Ticket Jira: SCRUM-43

import OrangeHRMLoginPage from '../../pages/orangehrm/OrangeHRMLoginPage'

const loginPage = new OrangeHRMLoginPage()

describe('OH-TC1 - Login Exitoso con Credenciales Validas [SCRUM-43]', () => {

    it('Debe autenticar al usuario y redirigirlo al Dashboard con credenciales validas', () => {

        // Paso 1: Ingresar a la pagina de login de OrangeHRM Demo
        cy.gotoOHUrl('/web/index.php/auth/login')

        // Paso 2: Verificar que el formulario de login es visible
        loginPage.verifyLoginFormVisible()

        // Paso 3: Ingresar un username y password validos
        loginPage.enterCredentials('Admin', 'admin123')

        // Paso 4: Confirmar el login
        loginPage.clickLoginButton()

        // Paso 5: Verificar que el sistema autentica y redirige al Dashboard,
        // mostrando el menu principal de navegacion
        loginPage.verifyDashboardVisible()
    })
})
