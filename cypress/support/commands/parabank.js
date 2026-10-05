// ─── ParaBank Commands ──────────────────────────────────────────────────────

// Usuario único por test, con mayúsculas (los casos de mayúsculas lo usan).
const newUsername = () => `QaPb${Date.now().toString(36)}${Cypress._.random(10, 99)}`

Cypress.Commands.add("gotoParabankUrl", (route) => {
    cy.visit(`${Cypress.env('parabankUrl')}${route}`)
})

// Cliente nuevo registrado por el mismo formulario que usa la pantalla (no
// hay endpoint REST de alta): GET para la cookie de sesión y POST del
// formulario. La base es compartida y cualquiera la puede borrar, así que
// cada test crea el suyo. Termina SIN sesión (logout), para probar el login
// o repetir el usuario.
Cypress.Commands.add("pbRegisterCustomer", () => {
    const base = Cypress.env('parabankUrl')
    const customer = {
        firstName: 'Qa',
        lastName: 'Parabank',
        username: newUsername(),
        password: 'Qa!Pb2026'
    }
    cy.request(`${base}/register.htm`)
    cy.request({
        method: 'POST',
        url: `${base}/register.htm`,
        form: true,
        body: {
            'customer.firstName': customer.firstName,
            'customer.lastName': customer.lastName,
            'customer.address.street': 'Calle 123',
            'customer.address.city': 'Montevideo',
            'customer.address.state': 'MO',
            'customer.address.zipCode': '11000',
            'customer.phoneNumber': '',
            'customer.ssn': '123-45-6789',
            'customer.username': customer.username,
            'customer.password': customer.password,
            repeatedPassword: customer.password
        }
    }).its('body').should('contain', `Welcome ${customer.username}`)
    cy.request(`${base}/logout.htm`)
    return cy.wrap(customer)
})

Cypress.Commands.add("pbNewUsername", () => cy.wrap(newUsername()))
