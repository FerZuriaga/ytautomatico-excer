// Test Case BD-TC3 - Purchase Flight con datos validos completos (Happy Path)
// Sitio bajo prueba: https://blazedemo.com
// Ticket Jira: SCRUM-41

describe('BD-TC3 - Purchase Flight with Valid Data (Happy Path) [SCRUM-41]', () => {

    // BlazeDemo carga un bootstrap.min.js legacy que arroja un error JS no
    // controlado ajeno a la funcionalidad de compra de vuelos. Se ignora
    // para que no interrumpa la validacion del flujo bajo prueba.
    Cypress.on('uncaught:exception', () => false)

    it('Debe completar el flujo de compra de un vuelo con datos validos y confirmar la compra', () => {

        // Paso 1: Ingresar a la pagina principal de BlazeDemo
        cy.gotoBDUrl('/')

        // Paso 2: Seleccionar una ciudad de origen
        cy.get('select[name="fromPort"]').should('be.visible').select('Boston')

        // Paso 3: Seleccionar una ciudad de destino distinta a la de origen
        cy.get('select[name="toPort"]').should('be.visible').select('Cairo')

        // Paso 4: Confirmar la busqueda de vuelos (Find Flights)
        cy.get('input[type="submit"]').click()

        // Verificar redireccion a la pagina de resultados
        cy.location('pathname').should('contain', '/reserve.php')

        // Paso 5: Verificar que se muestra el listado de vuelos disponibles
        // (al menos un resultado), esperando el listado antes de indexar por
        // posicion para evitar fragilidad si la lista viniera vacia o demorara
        cy.get('table.table tbody tr').its('length').should('be.gt', 0)

        // Paso 6: Seleccionar uno de los vuelos del listado (Choose This Flight)
        cy.get('table.table tbody tr').first().find('input[type="submit"]').click()

        // Verificar el ingreso a la pagina de compra (Purchase Flight)
        cy.location('pathname').should('contain', '/purchase.php')

        // Paso 7: Completar todos los campos obligatorios del formulario de
        // compra con datos validos
        const datosCompra = {
            nameOnCard: 'John Smith',
            address: '123 Main St.',
            city: 'Anytown',
            state: 'California',
            zipCode: '12345',
            cardType: 'visa',
            creditCardNumber: '4111111111111111',
            creditCardMonth: '11',
            creditCardYear: '2028'
        }

        cy.get('#inputName').should('be.visible').type(datosCompra.nameOnCard)
        cy.get('#address').type(datosCompra.address)
        cy.get('#city').type(datosCompra.city)
        cy.get('#state').type(datosCompra.state)
        cy.get('#zipCode').type(datosCompra.zipCode)
        cy.get('#cardType').select(datosCompra.cardType)
        cy.get('#creditCardNumber').type(datosCompra.creditCardNumber)
        cy.get('#creditCardMonth').clear().type(datosCompra.creditCardMonth)
        cy.get('#creditCardYear').clear().type(datosCompra.creditCardYear)
        cy.get('#nameOnCard').type(datosCompra.nameOnCard)

        // Paso 8: Confirmar la compra (Purchase Flight)
        cy.get('input[type="submit"]').contains('Purchase Flight').click()

        // Verificar redireccion a la pagina de confirmacion sin bloqueos
        cy.location('pathname').should('contain', '/confirmation.php')

        // Verificar el mensaje de compra exitosa
        cy.get('h1').should('contain.text', 'Thank you for your purchase today!')

        // NOTA IMPORTANTE: BlazeDemo simula la pasarela de pago con contenido
        // estatico en purchase.php y confirmation.php. Se confirmo en vivo
        // (con multiples vuelos y multiples formularios distintos) que ni el
        // vuelo elegido ni los datos ingresados por el usuario (nombre,
        // direccion, tipo/numero de tarjeta, vencimiento) se propagan al
        // resumen de confirmacion: el sistema siempre devuelve el mismo
        // resultado fijo (Amount, Card Number, Expiration y Auth Code no
        // varian sin importar la seleccion ni el formulario enviado). Por lo
        // tanto no se valida aqui que el resumen sea consistente con los
        // datos ingresados por el usuario, ya que la aplicacion no lo
        // garantiza. En su lugar se valida que la tabla de confirmacion
        // muestra los campos esperados con un formato valido.
        cy.get('table.table tbody').within(() => {
            // Id: numerico
            cy.contains('td', 'Id').next('td').invoke('text').should('match', /^\d+$/)

            // Status: no vacio
            cy.contains('td', 'Status').next('td').invoke('text').should('not.be.empty')

            // Amount: formato moneda (numero seguido de codigo de moneda, ej. "555 USD")
            cy.contains('td', 'Amount').next('td').invoke('text').should('match', /\d+(\.\d+)?\s?[A-Z]{3}/)

            // Card Number: enmascarado, terminado en 4 digitos
            cy.contains('td', 'Card Number').next('td').invoke('text').should('match', /x+\d{4}$/)

            // Expiration: formato mes/anio
            cy.contains('td', 'Expiration').next('td').invoke('text').should('match', /\d{1,2}\s*\/\s*\d{4}/)

            // Auth Code: no vacio
            cy.contains('td', 'Auth Code').next('td').invoke('text').should('not.be.empty')
        })
    })
})
