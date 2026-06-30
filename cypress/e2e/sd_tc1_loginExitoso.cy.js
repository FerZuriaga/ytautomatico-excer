// Test Case SD-TC1 - Login exitoso en SauceDemo
// Sitio bajo prueba: https://www.saucedemo.com
// Ticket Jira: SCRUM-37

describe('SD-TC1 - Login exitoso en SauceDemo [SCRUM-37]', () => {

    it('Debe redirigir al inventario al ingresar credenciales validas', () => {

        // Paso 1: Navegar a SauceDemo
        cy.gotoSDUrl('/')

        // Paso 2: Verificar que la pagina de login cargo correctamente
        cy.get('#user-name').should('be.visible')
        cy.get('#password').should('be.visible')
        cy.get('#login-button').should('be.visible')

        // Paso 3: Ingresar credenciales validas
        cy.get('#user-name').type('standard_user')
        cy.get('#password').type('secret_sauce')

        // Paso 4: Click en el boton Login
        cy.get('#login-button').click()

        // Paso 5: Verificar redireccion a la pagina de inventario
        cy.location('pathname').should('contain', '/inventory.html')

        // Paso 6: Verificar que el contenedor de productos es visible
        cy.get('.inventory_container').should('be.visible')

        // Paso 7: Verificar que el logo de la app confirma sesion activa
        cy.get('.app_logo').should('be.visible')
    })
})
