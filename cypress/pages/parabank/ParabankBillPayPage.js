import ParabankOverviewPage from './ParabankOverviewPage'

const FIXTURE = 'selectors/parabank/pago.json'
const ACCOUNT_FIXTURE = 'selectors/parabank/cuenta.json'

const T = { timeout: 15000 }

const overview = new ParabankOverviewPage()

// Beneficiario de los TC (los que no son objeto de la prueba).
const PAYEE = {
    name: 'Electricidad UTE',
    street: 'Paraguay 2431',
    city: 'Montevideo',
    state: 'MO',
    zipCode: '11800',
    phone: '08001930'
}

// "Bill Pay": datos del beneficiario, su cuenta confirmada y el monto. La
// pantalla valida antes de enviar; lo que pasa la validación va al banco.
class ParabankBillPayPage {

    // Desde la página de inicio con la sesión iniciada.
    open() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept('POST', sel.billpayRequest).as('billpay')
            cy.fixture(ACCOUNT_FIXTURE).then(account => cy.gotoParabankUrl(account.paths.home))
            cy.get(sel.menuLink, T).click()
            cy.get(sel.form.title, T).should('have.text', sel.texts.title)
            cy.get(`${sel.form.fromAccount} option`, T).should('have.length', 1)
            cy.get(sel.form.fields.name).should('have.value', '')
        })
    }

    // Un campo (clave de "fields" en pago.json).
    type(field, value) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.form.fields[field]).type(value)
            cy.get(sel.form.fields[field]).should('have.value', value)
        })
    }

    // Beneficiario completo salvo los campos en "except" (los que el TC deja
    // vacíos o completa con otro valor).
    fillPayee(except = []) {
        Object.entries(PAYEE).filter(([field]) => !except.includes(field)).forEach(([field, value]) => this.type(field, value))
    }

    fillAccount(account = '12345', verify = account) {
        this.type('account', account)
        this.type('verifyAccount', verify)
    }

    submit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.form.submit).click())
    }

    // Número de la cuenta de origen (la única del cliente).
    fromAccount() {
        return cy.fixture(FIXTURE).then(sel => cy.get(sel.form.fromAccount).invoke('val'))
    }

    verifyComplete(amountText) {
        cy.fixture(FIXTURE).then(sel => {
            this.fromAccount().then(account => {
                cy.wait('@billpay').its('response.statusCode').should('eq', 200)
                cy.get(sel.result.title, T).should('have.text', sel.texts.complete)
                cy.get(sel.result.message).invoke('text').should(text => {
                    expect(text.replace(/\s+/g, ' ').trim()).to.eq(`Bill Payment to ${PAYEE.name} in the amount of ${amountText} from account ${account} was successful.`)
                })
            })
        })
    }

    // Exactamente los avisos dados (claves de "errors"), el formulario en
    // pantalla y ningún pago enviado.
    verifyErrors(keys) {
        cy.fixture(FIXTURE).then(sel => {
            // Algunos avisos traen un espacio final en el HTML ("The amount cannot be empty. ").
            keys.forEach(key => {
                cy.get(sel.form.errors[key]).should('be.visible')
                cy.get(sel.form.errors[key]).invoke('text').should(text => expect(text.trim()).to.eq(sel.texts.errors[key]))
            })
            cy.get(sel.form.visibleErrors).should('have.length', keys.length)
            cy.get(sel.form.container).should('be.visible')
            cy.get('@billpay.all').should('have.length', 0)
        })
    }

    // Pago enviado pero no confirmado (lo que la app muestra en su lugar es
    // un bug aparte).
    verifyNotComplete() {
        cy.fixture(FIXTURE).then(sel => {
            cy.wait('@billpay')
            cy.get(sel.result.container).should('not.be.visible')
        })
    }

    // Saldo de la cuenta de origen en "Accounts Overview".
    verifyBalance(balance) {
        this.fromAccount().then(account => {
            overview.open()
            overview.verifyBalances({ [account]: balance })
        })
    }
}

export default ParabankBillPayPage
