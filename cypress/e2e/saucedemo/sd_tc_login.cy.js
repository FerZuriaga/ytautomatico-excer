// Test Case SD-TC-LOGIN - Login en SauceDemo
// Sitio bajo prueba: https://www.saucedemo.com
// Ticket Jira: SCRUM-54
//
// Cubre los 7 Test Cases del Modelo Canonico publicados en Zephyr
// (SCRUM-T20 a SCRUM-T26, Test Cycle SCRUM-R3): login exitoso, persistencia
// de sesion, usuario bloqueado (denegacion + mensaje), contraseña incorrecta
// (denegacion + mensaje) y usuario inexistente.

import SauceDemoLoginPage from '../../pages/saucedemo/SauceDemoLoginPage'

const loginPage = new SauceDemoLoginPage()

describe('SD-TC-LOGIN - Login en SauceDemo [SCRUM-54]', () => {

    beforeEach(() => {
        cy.gotoSDUrl('/')
        loginPage.verifyLoginFormVisible()
    })

    it('[SCRUM-T22] Debe redirigir al inventario de productos con credenciales validas', () => {
        loginPage.enterCredentials('standard_user', 'secret_sauce')
        loginPage.clickLoginButton()
        loginPage.verifyInventoryVisible()
    })

    it('[SCRUM-T24] Debe mantener la sesion activa tras recargar la pagina', () => {
        loginPage.enterCredentials('standard_user', 'secret_sauce')
        loginPage.clickLoginButton()
        loginPage.verifyInventoryVisible()

        cy.reload()

        loginPage.verifyInventoryVisible()
    })

    it('[SCRUM-T23] Debe denegar el acceso a un usuario bloqueado', () => {
        loginPage.enterCredentials('locked_out_user', 'secret_sauce')
        loginPage.clickLoginButton()
        loginPage.verifyStillOnLoginPage()
    })

    it('[SCRUM-T20] Debe mostrar un mensaje de error indicando que el usuario fue bloqueado', () => {
        loginPage.enterCredentials('locked_out_user', 'secret_sauce')
        loginPage.clickLoginButton()
        loginPage.verifyErrorMessage('Sorry, this user has been locked out.')
    })

    it('[SCRUM-T26] Debe denegar el acceso con una contrasena incorrecta', () => {
        loginPage.enterCredentials('standard_user', 'wrong_password')
        loginPage.clickLoginButton()
        loginPage.verifyStillOnLoginPage()
    })

    it('[SCRUM-T21] Debe mostrar un mensaje de error cuando las credenciales no coinciden', () => {
        loginPage.enterCredentials('standard_user', 'wrong_password')
        loginPage.clickLoginButton()
        loginPage.verifyErrorMessage('Username and password do not match any user in this service')
    })

    it('[SCRUM-T25] Debe denegar el acceso con un usuario inexistente', () => {
        loginPage.enterCredentials('usuario_inexistente_123', 'cualquier_valor')
        loginPage.clickLoginButton()
        loginPage.verifyErrorMessage('Username and password do not match any user in this service')
    })
})
