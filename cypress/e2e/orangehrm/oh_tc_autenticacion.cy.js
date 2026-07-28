// Modulo: Autenticacion (Login / Logout) - OrangeHRM
// Sitio bajo prueba: https://opensource-demo.orangehrmlive.com
// Agrupa: OH-TC1 [SCRUM-43], OH-TC2 [SCRUM-44], OH-TC6 [SCRUM-45]

import OrangeHRMLoginPage from '../../pages/orangehrm/OrangeHRMLoginPage'
import OrangeHRMDashboardPage from '../../pages/orangehrm/OrangeHRMDashboardPage'

const loginPage = new OrangeHRMLoginPage()
const dashboardPage = new OrangeHRMDashboardPage()

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
