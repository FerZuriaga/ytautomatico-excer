// Test Case OH-TC6 - Bug: Logout inmediato tras el login (sin esperar carga de widgets)
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Ticket Jira: SCRUM-45

import OrangeHRMLoginPage from '../pages/OrangeHRMLoginPage'
import OrangeHRMDashboardPage from '../pages/OrangeHRMDashboardPage'

// Se sigue usando para verifyLoginFormVisible() al final del test; el login
// en si se hace via el custom command cy.loginAsOHAdmin()
const loginPage = new OrangeHRMLoginPage()
const dashboardPage = new OrangeHRMDashboardPage()

describe('OH-TC6 - Bug Logout Inmediato desde el Dashboard [SCRUM-45]', () => {

    // Defecto reportado en SCRUM-45 (detectado durante la automatizacion de SCRUM-44):
    // si el usuario hace Logout inmediatamente despues de ingresar al Dashboard, sin esperar
    // a que terminen de cargar los widgets en segundo plano (algunas de esas llamadas XHR
    // responden 401 justo antes del error), la app lanza una excepcion JS no controlada
    // (TypeError: Cannot read properties of undefined (reading 'response')).
    //
    // El ticket dejo abierta una pregunta funcional: pese a ese error, ¿la redireccion final
    // a la pantalla de login se completa o no? Este spec reproduce la condicion exacta del bug
    // (sin ningun cy.wait() que le de tiempo a la app a terminar de cargar los widgets) y
    // responde esa pregunta con evidencia, ejecutando el escenario 5 veces de forma
    // independiente para relevar su reproducibilidad.
    //
    // Se generan 5 it() independientes (en vez de un unico it() con loop interno) porque un
    // fallo dentro de un mismo it() aborta ese test completo: con 5 it() separados, Mocha
    // continua ejecutando los intentos restantes aunque alguno falle, y cada intento queda
    // registrado como pass/fail individual en el resultado de la corrida.
    for (let i = 1; i <= 5; i++) {

        it(`Intento ${i}/5 - Logout inmediato: debe redirigir al login pese al error de consola conocido`, () => {

            let exceptionOccurred = false

            Cypress.on('uncaught:exception', (err) => {
                if (err.message.includes("reading 'response'")) {
                    exceptionOccurred = true
                    return false
                }
                return true
            })

            // Paso 1: Iniciar sesion con credenciales validas y verificar que el
            // usuario queda autenticado en el Dashboard (precondicion)
            cy.loginAsOHAdmin()

            // Paso 2: Cerrar sesion INMEDIATAMENTE, sin esperar a que terminen de cargar
            // los widgets en segundo plano, para reproducir la condicion exacta del bug
            dashboardPage.logout()

            // Paso 3 (assert funcional que responde la pregunta abierta del ticket):
            // verificar si, pese al posible error de consola, el sistema redirige
            // igualmente al formulario de login
            loginPage.verifyLoginFormVisible()

            cy.then(() => {
                cy.log(`Intento ${i}/5 - exceptionOccurred: ${exceptionOccurred}`)
            })
        })
    }
})
