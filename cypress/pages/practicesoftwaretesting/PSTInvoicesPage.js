import PSTLoginPage from './PSTLoginPage'

const FIXTURE = 'selectors/practicesoftwaretesting/facturas.json'

const T = { timeout: 15000 }

const JSON_HEADERS = { Accept: 'application/json' }

// Dirección de facturación: el servicio exige que coincida con el código
// postal (AR 5000 del servicio simulado de la demo).
const BILLING = {
    billing_street: 'Eduardo Points', billing_city: 'North Gudrun', billing_state: 'Illinois',
    billing_country: 'AR', billing_postal_code: '5000'
}

export const CASH = { method: 'cash-on-delivery', details: {} }
export const CARD = {
    method: 'credit-card',
    details: { credit_card_number: '4111-1111-1111-1111', expiration_date: '12/2030', cvv: '123', card_holder_name: 'Qa Perfil' }
}

const normalize = (text) => text.replace(/\s+/g, ' ').trim()

// Facturas del cliente: listado "Invoices" y detalle de cada compra. Cada
// test registra su propio cliente y sus compras por API (el primer Confirm
// del checkout no crea el pedido, Bug SCRUM-525), en el orden indicado.
class PSTInvoicesPage {

    constructor() {
        this.login = new PSTLoginPage()
    }

    // ─── Precondiciones por API ───────────────────────────────────────────────

    // Cada compra: { items: [{ name, quantity }], payment: CASH | CARD }.
    // Devuelve las facturas creadas, en el orden de compra.
    createPurchases(customer, purchases) {
        const invoices = []
        return cy.fixture(FIXTURE).then(sel => {
            this.login.apiLogin(customer.email, customer.password, 200).then(({ access_token }) => {
                const headers = { ...JSON_HEADERS, Authorization: `Bearer ${access_token}` }
                purchases.forEach(({ items, payment }) => {
                    cy.pstSeedCart(items).then(cartId => {
                        cy.request({
                            method: 'POST', url: `https://${sel.api.host}${sel.api.invoicesPath}`, headers,
                            body: { ...BILLING, payment_method: payment.method, payment_details: payment.details, cart_id: cartId }
                        }).then(({ status, body }) => {
                            expect(status, 'factura creada').to.eq(201)
                            // Los datos tal como los devuelve la consulta (total, fecha).
                            cy.request({ url: `https://${sel.api.host}${sel.api.invoicesPath}/${body.id}`, headers })
                                .then(({ body: invoice }) => invoices.push(invoice))
                        })
                    })
                })
            })
            return cy.wrap(invoices)
        })
    }

    // Cliente propio con sus compras y la sesión lista para la primera carga.
    prepareCustomer(purchases = []) {
        return this.login.createCustomer().then(customer => {
            this.createPurchases(customer, purchases).then(invoices => {
                customer.invoices = invoices
            })
            this.login.prepareSession(customer)
            return cy.wrap(customer)
        })
    }

    // Factura de otro cliente (sin sesión en el navegador).
    createForeignInvoice(purchase) {
        return this.login.createCustomer().then(other => this.createPurchases(other, [purchase]).then(invoices => invoices[0]))
    }

    registerAliases() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: sel.api.invoicesPath }).as('invoicesList')
            cy.intercept({ method: 'GET', hostname: sel.api.host, pathname: new RegExp(`^${sel.api.invoicesPath}/[^/]+$`) }).as('invoiceDetail')
        })
    }

    // ─── Listado ──────────────────────────────────────────────────────────────

    visitHome() {
        this.registerAliases()
        cy.gotoPSTUrl('/')
        cy.fixture(FIXTURE).then(sel => cy.get(sel.navMenu, T).should('be.visible'))
    }

    openUserMenu() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navMenu, T).click()
            cy.get(sel.navMyInvoices, T).should('be.visible').and('contain.text', 'My invoices')
        })
    }

    clickMyInvoices() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.navMyInvoices).click()
            cy.wait('@invoicesList', T)
            cy.location('pathname').should('eq', sel.path)
            cy.get(sel.pageTitle, T).should('have.text', sel.texts.title)
        })
    }

    openFromMenu() {
        this.openUserMenu()
        this.clickMyInvoices()
    }

    // Filas exactas del listado, en orden: número, dirección, fecha y total
    // de cada factura, con su botón "Details".
    verifyList(invoices) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.list.rows, T).should('have.length', invoices.length)
            invoices.forEach((invoice, i) => {
                cy.get(sel.list.rows).eq(i).find('td').then($cells => {
                    const cells = [...$cells].map(td => normalize(td.innerText))
                    expect(cells.slice(0, 4)).to.deep.equal([
                        invoice.invoice_number, BILLING.billing_street, invoiceDate(invoice), `$${invoice.total.toFixed(2)}`
                    ])
                    expect(cells[4]).to.equal(sel.texts.detailsButton)
                })
            })
        })
    }

    verifyEmptyList() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains('th', 'Invoice Number').should('be.visible')
            cy.get(sel.list.rows).should('not.exist')
            cy.contains(sel.texts.detailsButton).should('not.exist')
        })
    }

    openDetails(invoice) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(`${sel.list.rows} td`, invoice.invoice_number, T).parents('tr').find(sel.list.detailsLink).click()
            cy.wait('@invoiceDetail', T).its('response.statusCode').should('eq', 200)
            cy.location('pathname').should('eq', `${sel.path}/${invoice.id}`)
        })
    }

    // ─── Detalle ──────────────────────────────────────────────────────────────

    // `subtotal` y `eco` solo si la compra tuvo descuento; `lines`:
    // [cantidad, producto, precio, total de la línea].
    verifyDetail(invoice, { total, subtotal, eco, paymentMethod, lines }) {
        cy.fixture(FIXTURE).then(sel => {
            const d = sel.detail
            cy.get(d.invoiceNumber, T).should('have.value', invoice.invoice_number)
            cy.get(d.invoiceDate).should('have.value', invoiceDate(invoice))
            // El subtotal y el total comparten data-test: el total es el último.
            cy.get(d.total).last().should('have.value', `$ ${total}`)
            if (subtotal) {
                cy.get(d.total).should('have.length', 2).first().should('have.value', `$ ${subtotal}`)
                cy.contains('label', sel.texts.ecoLabel).should('be.visible')
                cy.get(d.ecoDiscount).should('have.value', `$ ${eco}`)
            } else {
                cy.get(d.total).should('have.length', 1)
                cy.get(d.ecoDiscount).should('not.exist')
            }
            cy.get(d.street).should('have.value', BILLING.billing_street)
            cy.get(d.postalCode).should('have.value', BILLING.billing_postal_code)
            cy.get(d.city).should('have.value', BILLING.billing_city)
            cy.get(d.state).should('have.value', BILLING.billing_state)
            cy.get(d.country).should('have.value', BILLING.billing_country)
            cy.get(d.paymentMethod).should('have.value', paymentMethod)
            cy.get(d.productRows).should('have.length', lines.length)
            lines.forEach((line, i) => {
                cy.get(d.productRows).eq(i).find('td').then($cells => {
                    expect([...$cells].map(td => normalize(td.innerText))).to.deep.equal(line)
                })
            })
        })
    }

    // Dirección de una factura escrita en el navegador (la sesión sigue en
    // localStorage).
    visitInvoice(id) {
        this.registerAliases()
        cy.fixture(FIXTURE).then(sel => cy.gotoPSTUrl(`${sel.path}/${id}`))
    }

    verifyNotExist() {
        cy.wait('@invoiceDetail', T).its('response.statusCode').should('eq', 404)
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.texts.notExist, T).should('be.visible')
            cy.get(sel.detail.invoiceNumber).should('not.exist')
            cy.get(sel.detail.total).should('not.exist')
            cy.get(sel.detail.street).should('not.exist')
        })
    }

    // ─── Datos de la tarjeta ──────────────────────────────────────────────────

    // Ningún valor de la factura contiene el número completo de la tarjeta.
    verifyCardNumberHidden() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.detail.paymentMethod, T).should('have.value', 'Credit Card')
            cy.get('input').each($input => expect($input.val()).not.to.contain(CARD.details.credit_card_number))
            cy.contains(CARD.details.credit_card_number).should('not.exist')
        })
    }

    verifyCvvHidden() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.detail.paymentMethod, T).should('have.value', 'Credit Card')
            cy.contains('label', /^\s*cvv\s*$/i).should('not.exist')
            cy.get('input').each($input => expect($input.val()).not.to.equal(CARD.details.cvv))
        })
    }
}

// La pantalla muestra la fecha tal como la devuelve la consulta
// ("YYYY-MM-DD HH:MM:SS").
function invoiceDate(invoice) {
    return invoice.invoice_date
}

export default PSTInvoicesPage
