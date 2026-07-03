// Test Case BD-TC1 - Busqueda de vuelos con ciudad de origen y destino distintas
// Sitio bajo prueba: https://blazedemo.com
// Ticket Jira: SCRUM-38

describe('BD-TC1 - Busqueda de vuelos con origen y destino distintos [SCRUM-38]', () => {

    // BlazeDemo carga un bootstrap.min.js legacy que arroja un error JS no
    // controlado ajeno a la funcionalidad de busqueda de vuelos. Se ignora
    // para que no interrumpa la validacion del flujo bajo prueba.
    Cypress.on('uncaught:exception', () => false)

    it('Debe mostrar un listado de vuelos disponibles al elegir origen y destino diferentes', () => {

        // Paso 1: Ingresar a la pagina principal de BlazeDemo
        cy.gotoBDUrl('/')

        // Paso 2: Verificar que el formulario de busqueda esta visible
        cy.get('select[name="fromPort"]').should('be.visible')
        cy.get('select[name="toPort"]').should('be.visible')

        // Paso 3: Seleccionar una ciudad de origen
        cy.get('select[name="fromPort"]').select('Boston')

        // Paso 4: Seleccionar una ciudad de destino distinta a la de origen
        cy.get('select[name="toPort"]').select('Cairo')

        // Paso 5: Confirmar la busqueda de vuelos
        cy.get('input[type="submit"]').click()

        // Paso 6: Verificar redireccion a la pagina de resultados
        cy.location('pathname').should('contain', '/reserve.php')

        // Paso 7: Verificar que se muestra el listado de vuelos disponibles
        cy.get('table.table tbody tr').its('length').should('be.gt', 0)

        // Paso 8: Verificar que cada vuelo listado muestra aerolinea, horario y precio
        cy.get('table.table tbody tr').each(($row) => {
            cy.wrap($row).find('td').eq(2).invoke('text').should('not.be.empty') // Aerolinea
            cy.wrap($row).find('td').eq(3).invoke('text').should('not.be.empty') // Horario (salida)
            cy.wrap($row).find('td').eq(5).invoke('text').should('contain', '$') // Precio
        })
    })
})
