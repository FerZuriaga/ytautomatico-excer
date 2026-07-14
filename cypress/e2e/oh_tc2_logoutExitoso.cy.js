// Test Case OH-TC2 - Logout exitoso desde el Dashboard
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Ticket Jira: SCRUM-44

import OrangeHRMLoginPage from '../pages/OrangeHRMLoginPage'
import OrangeHRMDashboardPage from '../pages/OrangeHRMDashboardPage'

// Se sigue usando para verifyLoginFormVisible() al final del test; el login
// en si se hace via el custom command cy.loginAsOHAdmin()
const loginPage = new OrangeHRMLoginPage()
const dashboardPage = new OrangeHRMDashboardPage()

describe('OH-TC2 - Logout Exitoso desde el Dashboard [SCRUM-44]', () => {

    // Defecto conocido de la aplicacion, documentado en el ticket SCRUM-45
    // (https://ferzuriaga1.atlassian.net/browse/SCRUM-45, relacionado a SCRUM-44):
    // al hacer Logout mientras los widgets del Dashboard aun tienen llamadas XHR en segundo plano
    // (algunas de las cuales responden 401), la app lanza una excepcion JS no controlada
    // (TypeError: Cannot read properties of undefined (reading 'response')) en su interceptor de
    // peticiones al intentar leer error.response sobre un request abortado por la navegacion.
    // Esta excepcion es ajena a la automatizacion y no impide validar el criterio funcional real
    // del escenario (redireccion al login), por lo que se evita que Cypress falle el test por este
    // ruido puntual de la aplicacion, sin debilitar ninguna verificacion funcional del caso de prueba.
    Cypress.on('uncaught:exception', (err) => {
        if (err.message.includes("reading 'response'")) {
            return false
        }
        return true
    })

    it('Debe cerrar la sesion del usuario y redirigirlo a la pantalla de login', () => {

        // Paso 1: Iniciar sesion con credenciales validas y verificar que el
        // usuario queda autenticado en el Dashboard (precondicion)
        cy.loginAsOHAdmin()

        // Paso 2: Abrir el menu de usuario y seleccionar la opcion "Logout"
        dashboardPage.logout()

        // Paso 3: Verificar que el sistema cierra la sesion y redirige al login,
        // mostrando nuevamente el formulario de acceso
        loginPage.verifyLoginFormVisible()
    })
})
