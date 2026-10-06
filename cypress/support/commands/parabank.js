// ─── ParaBank Commands ──────────────────────────────────────────────────────

// Usuario único por test, con mayúsculas (los casos de mayúsculas lo usan).
const newUsername = () => `QaPb${Date.now().toString(36)}${Cypress._.random(10, 99)}`

Cypress.Commands.add("gotoParabankUrl", (route, options = {}) => {
    cy.visit(`${Cypress.env('parabankUrl')}${route}`, options)
})

// Cliente nuevo registrado por el mismo formulario que usa la pantalla (no
// hay endpoint REST de alta): GET para la cookie de sesión y POST del
// formulario. La base es compartida y cualquiera la puede borrar, así que
// cada test crea el suyo. Por defecto termina SIN sesión (logout), para
// probar el login o repetir el usuario; con { keepSession: true } el
// navegador queda con la sesión del cliente iniciada.
Cypress.Commands.add("pbRegisterCustomer", ({ keepSession = false } = {}) => {
    const base = Cypress.env('parabankUrl')
    const customer = {
        firstName: 'Qa',
        lastName: 'Parabank',
        street: 'Calle 123',
        city: 'Montevideo',
        state: 'MO',
        zipCode: '11000',
        phone: '099111222',
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
            'customer.address.street': customer.street,
            'customer.address.city': customer.city,
            'customer.address.state': customer.state,
            'customer.address.zipCode': customer.zipCode,
            'customer.phoneNumber': customer.phone,
            'customer.ssn': '123-45-6789',
            'customer.username': customer.username,
            'customer.password': customer.password,
            repeatedPassword: customer.password
        }
    }).its('body').should('contain', `Welcome ${customer.username}`)
    if (!keepSession) cy.request(`${base}/logout.htm`)
    return cy.wrap(customer)
})

Cypress.Commands.add("pbNewUsername", () => cy.wrap(newUsername()))

// Sesión del cliente en el navegador sin pasar por la pantalla de login (el
// mismo formulario: GET para la cookie y POST). Para tests que comparten un
// cliente preparado una sola vez (la demo limita la cantidad de pedidos).
Cypress.Commands.add("pbLogin", (customer) => {
    const base = Cypress.env('parabankUrl')
    cy.request(`${base}/index.htm`)
    cy.request({ method: 'POST', url: `${base}/login.htm`, form: true, body: { username: customer.username, password: customer.password } })
        .its('body').should('contain', 'Log Out')
})

// Transferencia por la API del banco (datos de prueba, no la pantalla).
Cypress.Commands.add("pbTransfer", (fromAccountId, toAccountId, amount) => {
    cy.request({ method: 'POST', url: `${Cypress.env('parabankUrl')}/services/bank/transfer`, qs: { fromAccountId, toAccountId, amount } })
})

// Movimientos de una cuenta por la API: [{ id, type, amount, description,
// day }] con day = fecha del banco (UTC) en MM-DD-YYYY, el formato de la
// búsqueda. La pantalla la muestra corrida según la zona horaria (SCRUM-938).
Cypress.Commands.add("pbTransactions", (accountId) => {
    cy.request({ url: `${Cypress.env('parabankUrl')}/services/bank/accounts/${accountId}/transactions`, headers: { Accept: 'application/json' } })
        .its('body').then(transactions => transactions.map(t => {
            const date = new Date(t.date)
            const pad = n => String(n).padStart(2, '0')
            return { ...t, day: `${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}-${date.getUTCFullYear()}` }
        }))
})

// Números de las cuentas del cliente por la API del banco, en el orden del
// resumen (la inicial primero).
Cypress.Commands.add("pbAccounts", (customer) => {
    const api = `${Cypress.env('parabankUrl')}/services/bank`
    const json = { Accept: 'application/json' }
    cy.request({ url: `${api}/login/${encodeURIComponent(customer.username)}/${encodeURIComponent(customer.password)}`, headers: json })
        .its('body.id').then(customerId => {
            cy.request({ url: `${api}/customers/${customerId}/accounts`, headers: json })
                .its('body').then(accounts => cy.wrap(accounts.map(a => a.id)))
        })
})

// Segunda cuenta (CHECKING) del cliente por la API del banco, fondeada con
// $100.00 desde la inicial (que queda en $415.50). Devuelve los números de
// ambas: { initial, second }.
Cypress.Commands.add("pbOpenSecondAccount", (customer) => {
    const api = `${Cypress.env('parabankUrl')}/services/bank`
    const json = { Accept: 'application/json' }
    cy.request({ url: `${api}/login/${encodeURIComponent(customer.username)}/${encodeURIComponent(customer.password)}`, headers: json })
        .its('body.id').then(customerId => {
            cy.request({ url: `${api}/customers/${customerId}/accounts`, headers: json }).its('body.0.id').then(initial => {
                cy.request({ method: 'POST', url: `${api}/createAccount`, headers: json, qs: { customerId, newAccountType: 0, fromAccountId: initial } })
                    .its('body.id').then(second => cy.wrap({ initial, second }))
            })
        })
})
