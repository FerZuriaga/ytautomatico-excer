import PSTCatalogPage from './PSTCatalogPage'

const FIXTURE = 'selectors/practicesoftwaretesting/carrito.json'

const T = { timeout: 15000 }

const normalize = (text) => text.replace(/\s+/g, ' ').trim()
const exact = (name) => new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`)

// Paso 1 del checkout ("Cart"). El carrito vive en el servidor; el
// navegador solo guarda cart_id / cart_quantity en sessionStorage.
class PSTCartPage {

    // Precondición por API: arma el carrito (cy.pstSeedCart), carga en la
    // sesión lo mismo que guarda la app al agregar un producto (cart_id y
    // cart_quantity; sin cart_quantity el menú no muestra el carrito), entra
    // por la Home y abre el carrito desde el menú.
    openWithItems(items) {
        const catalog = new PSTCatalogPage()
        const units = items.reduce((sum, item) => sum + item.quantity, 0)
        cy.fixture(FIXTURE).then(sel => {
            cy.pstSeedCart(items).then(cartId => catalog.visit({
                sessionStorage: { [sel.api.sessionCartId]: cartId, [sel.api.sessionCartQuantity]: String(units) }
            }))
        })
        catalog.verifyInitialCatalog()
        this.open()
    }

    // Registra los alias de la API del carrito antes de entrar: cada cambio
    // de cantidad (PUT) o eliminación (DELETE) se espera antes de afirmar.
    open() {
        cy.fixture(FIXTURE).then(sel => {
            cy.intercept({ method: 'PUT', hostname: sel.api.host, pathname: /\/carts\/[^/]+\/product\/quantity$/ }).as('cartUpdate')
            cy.intercept({ method: 'DELETE', hostname: sel.api.host, pathname: /\/carts\/[^/]+\/product\/[^/]+$/ }).as('cartDelete')
            cy.get(sel.navCart).click()
        })
    }

    rowOf(name) {
        return cy.fixture(FIXTURE).then(sel =>
            cy.contains(`${sel.cartRow} ${sel.productTitle}`, exact(name), T).parents(sel.cartRow.split(' ').pop()))
    }

    // La app corrige la cantidad en el evento "change" (ngModel se
    // actualiza con "input"): se carga el valor completo y se disparan
    // ambos, como al escribir y salir del campo.
    changeQuantity(name, value) {
        cy.fixture(FIXTURE).then(sel => {
            this.rowOf(name).find(sel.quantityInput).invoke('val', value).trigger('input').trigger('change')
            cy.wait('@cartUpdate', T)
        })
    }

    removeProduct(name) {
        cy.fixture(FIXTURE).then(sel => {
            this.rowOf(name).find(sel.removeButton).click()
            cy.wait('@cartDelete', T)
        })
    }

    continueShopping() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.continueShopping).click())
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyLine(name, { quantity, unitPrice, lineTotal }) {
        cy.fixture(FIXTURE).then(sel => {
            this.rowOf(name).within(() => {
                if (quantity !== undefined) cy.get(sel.quantityInput).should('have.value', String(quantity))
                if (unitPrice) cy.get(sel.unitPrice).should($p => expect(normalize($p.text())).to.equal(unitPrice))
                if (lineTotal) cy.get(sel.linePrice).should($p => expect(normalize($p.text())).to.equal(lineTotal))
            })
        })
    }

    verifyProducts(names) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(`${sel.cartRow} ${sel.productTitle}`, T).should($t => {
                expect([...$t].map(el => normalize(el.innerText)).sort()).to.deep.equal([...names].sort())
            })
        })
    }

    verifyTotal(total) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.total, T).should($t => expect(normalize($t.text())).to.equal(total))
        })
    }

    verifyNoDiscountRows() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.subtotal).should('not.exist')
            cy.get(sel.discount).should('not.exist')
            cy.get(sel.ecoDiscount).should('not.exist')
        })
    }

    verifyEcoDiscount({ subtotal, eco, total }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.subtotal, T).should($s => expect(normalize($s.text())).to.equal(subtotal))
            cy.get(sel.ecoDiscount).should($e => expect(normalize($e.text())).to.equal(eco))
            this.verifyTotal(total)
        })
    }

    verifyEmpty() {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.texts.empty, T).should('be.visible')
            cy.get(sel.productTitle).should('not.exist')
            cy.get(sel.proceedToCheckout).should('not.exist')
        })
    }

    verifyToast(textKey) {
        cy.fixture(FIXTURE).then(sel => cy.contains(sel.toastMessage, sel.texts[textKey], T).should('be.visible'))
    }

    verifyCartBadge(count) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.cartQuantity, T).should($c => expect(normalize($c.text())).to.equal(String(count)))
        })
    }
}

export default PSTCartPage
