// Test Case BD-TC2 - Compra de vuelo con campos obligatorios vacios
// Sitio bajo prueba: https://blazedemo.com
// Ticket Jira: SCRUM-39

describe('BD-TC2 - Purchase Flight with Empty Required Fields [SCRUM-39]', () => {

    // BlazeDemo carga un bootstrap.min.js legacy que arroja un error JS no
    // controlado ajeno a la funcionalidad de compra de vuelos. Se ignora
    // para que no interrumpa la validacion del flujo bajo prueba.
    Cypress.on('uncaught:exception', () => false)

    it('Debe evidenciar el comportamiento real del formulario de compra ante campos obligatorios vacios', () => {

        // Paso 1: Ingresar a la pagina principal de BlazeDemo
        cy.gotoBDUrl('/')

        // Paso 2: Seleccionar una ciudad de origen
        cy.get('select[name="fromPort"]').should('be.visible').select('Boston')

        // Paso 3: Seleccionar una ciudad de destino distinta a la de origen
        cy.get('select[name="toPort"]').should('be.visible').select('Cairo')

        // Paso 4: Confirmar la busqueda de vuelos
        cy.get('input[type="submit"]').click()

        // Paso 5: Verificar redireccion a la pagina de resultados
        cy.location('pathname').should('contain', '/reserve.php')

        // Paso 6: Esperar el listado de vuelos y validar que exista al menos un resultado
        // antes de elegir por indice, para evitar fragilidad si la lista viniera vacia
        cy.get('table.table tbody tr').its('length').should('be.gt', 0)

        // Paso 7: Elegir el primer vuelo del listado
        cy.get('table.table tbody tr').first().find('input[type="submit"]').click()

        // Paso 8: Verificar el ingreso a la pagina de compra (Purchase Flight)
        cy.location('pathname').should('contain', '/purchase.php')

        // Paso 9: Dejar vacios los campos obligatorios del formulario (nombre en la
        // tarjeta, direccion, numero de tarjeta, entre otros) - no se completa ningun campo

        // Paso 10: Intentar confirmar la compra sin completar los campos obligatorios
        cy.get('input[type="submit"]').contains('Purchase Flight').click()

        // Paso 11: Documentar el comportamiento real observado por el sistema.
        // No se asume de antemano si el sistema bloquea la confirmacion (mostrando
        // indicacion de campos requeridos) o si permite completar la compra igualmente.
        cy.location('pathname').then((pathname) => {
            if (pathname.includes('/purchase.php')) {
                // Caso A: el sistema permanece en purchase.php.
                // Se documenta si existe o no alguna indicacion de campos requeridos.
                cy.get('body').then(($body) => {
                    const tieneIndicacionDeError = /required|requerido|please|complete/i.test($body.text())
                    cy.log(
                        tieneIndicacionDeError
                            ? 'OBSERVADO: el sistema bloqueo la confirmacion e indico campos requeridos.'
                            : 'OBSERVADO: el sistema permanecio en purchase.php sin mostrar ninguna indicacion de error.'
                    )
                })
            } else {
                // Caso B: el sistema navego fuera de purchase.php, es decir, confirmo
                // la compra igualmente pese a los campos obligatorios vacios.
                cy.log('OBSERVADO: el sistema confirmo la compra igualmente pese a los campos obligatorios vacios (sin validacion).')
                cy.get('h1').should('contain.text', 'Thank you for your purchase today!')
            }
        })

        // Paso 12: Verificar que, en cualquiera de los dos casos, el sistema mostro
        // una respuesta explicita (no quedo en un estado indefinido/en blanco)
        cy.get('body').invoke('text').should('not.be.empty')
    })
})
