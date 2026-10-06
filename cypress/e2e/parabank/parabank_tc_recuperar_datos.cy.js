// Modulo: Cuenta - Recuperar mis datos de ingreso (Customer Lookup)
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-991 (CA-41..CA-43, Test Cycle SCRUM-992)
//
// Buscar no cambia datos: los clientes se preparan una vez en before, cada
// uno con un SSN propio (los de prueba comparten 123-45-6789 y un SSN
// repetido no se encuentra, SCRUM-1002). Cada test arranca sin sesión.
// Quedan en it.skip el SSN compartido (SCRUM-1002) y el SSN correcto con
// otros datos personales (SCRUM-1000).

import ParabankLookupPage from '../../pages/parabank/ParabankLookupPage'
import ParabankOverviewPage from '../../pages/parabank/ParabankOverviewPage'

const lookup = new ParabankLookupPage()
const overview = new ParabankOverviewPage()

// Los datos personales con los que se registra cualquier cliente de prueba.
const PERSONAL = { firstName: 'Qa', lastName: 'Parabank', street: 'Calle 123', city: 'Montevideo', state: 'MO', zipCode: '11000' }

// Cliente con un SSN que no tiene nadie más.
let customer
// Dos clientes con el mismo SSN.
let shared

// Pasos 1 a 9: abrir "Customer Lookup", completar los datos y buscar.
const find = (data) => {
    lookup.open()
    lookup.fill(data)
    lookup.submit()
}

describe('[SCRUM-991] ParaBank - Recuperar mis datos de ingreso', () => {

    before(() => {
        cy.pbNewSsn().then(ssn => cy.pbRegisterCustomer({ ssn })).then(registered => { customer = registered })
        cy.pbNewSsn().then(ssn => {
            cy.pbRegisterCustomer({ ssn })
            cy.pbRegisterCustomer({ ssn }).then(registered => { shared = registered })
        })
    })

    // CA-41: Con sus datos personales y su SSN, el cliente ve "Your login information was located successfully. You are now logged in." con su usuario y queda con la sesión iniciada en la banca.

    it('[CA-41][TC-41.1][SCRUM-993] Recuperar el usuario con los datos del cliente', () => {
        find({ ...PERSONAL, ssn: customer.ssn })
        lookup.verifyLocated(customer.username)
    })

    it('[CA-41][TC-41.2][SCRUM-994] Entrar a la banca al recuperar los datos', () => {
        find({ ...PERSONAL, ssn: customer.ssn })
        lookup.verifyLocated(customer.username)
        overview.open()
        overview.verifyAccountCount(1)
        cy.pbAccounts(customer).then(([account]) => overview.verifyBalances({ [account]: '$515.50' }))
    })

    it.skip('[CA-41][TC-41.3][SCRUM-995] Recuperar los datos de un cliente cuyo SSN tiene otro cliente (bug conocido: SCRUM-1002)', () => {
        find({ ...PERSONAL, ssn: shared.ssn })
        lookup.verifyLocated(shared.username)
    })

    // CA-42: En "Customer Lookup", cada dato vacío se avisa con su mensaje debajo del campo (por ejemplo "Social Security Number is required.") y no se busca al cliente.

    it('[CA-42][TC-42.1][SCRUM-996] Buscar con el formulario vacío', () => {
        find({})
        lookup.verifyRequired(['firstName', 'lastName', 'street', 'city', 'state', 'zipCode', 'ssn'])
    })

    it('[CA-42][TC-42.2][SCRUM-997] Buscar sin SSN', () => {
        find(PERSONAL)
        lookup.verifyRequired(['ssn'])
    })

    // CA-43: En "Customer Lookup", datos que no corresponden a un cliente se rechazan con "Error!" y "The customer information provided could not be found." y no se entra a la banca.

    it('[CA-43][TC-43.1][SCRUM-998] Buscar con un SSN que no existe', () => {
        find({ ...PERSONAL, ssn: '000-00-0000' })
        lookup.verifyNotFound()
    })

    it.skip('[CA-43][TC-43.2][SCRUM-999] Buscar con el SSN de un cliente y otros datos personales (bug conocido: SCRUM-1000)', () => {
        find({ ...PERSONAL, firstName: 'Otro', lastName: 'Cliente', zipCode: '99999', ssn: customer.ssn })
        lookup.verifyNotFound()
    })
})
