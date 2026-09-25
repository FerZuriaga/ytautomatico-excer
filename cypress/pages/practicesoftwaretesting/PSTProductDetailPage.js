const FIXTURE = 'selectors/practicesoftwaretesting/detalle-producto.json'

const T = { timeout: 15000 }

const normalize = (text) => text.replace(/\s+/g, ' ').trim()

// Ficha de producto (venta y alquiler).
class PSTProductDetailPage {

    // ─── Datos del producto ───────────────────────────────────────────────────

    verifyProductName(name) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.productName, T).should($n => expect(normalize($n.text())).to.contain(name))
        })
    }

    verifyMainData({ name, price, category, brand }) {
        cy.fixture(FIXTURE).then(sel => {
            this.verifyProductName(name)
            cy.get(sel.unitPrice).should($p => expect(normalize($p.text())).to.contain(price))
            cy.get(sel.categoryBadge).should($c => expect(normalize($c.text())).to.equal(category))
            cy.get(sel.brandBadge).should($b => expect(normalize($b.text())).to.equal(brand))
            cy.get(sel.description).invoke('text').should('not.be.empty')
        })
    }

    // spec: { slug: 'head-weight', value: '4500', unit: 'g' }
    verifySpec({ slug, value, unit }) {
        cy.fixture(FIXTURE).then(sel => {
            const row = sel.specRowPattern.replace('{slug}', slug)
            cy.get(row, T).find(sel.specValue).should($v => expect(normalize($v.text())).to.equal(value))
            if (unit) cy.get(row).find(sel.specUnit).should($u => expect(normalize($u.text())).to.equal(unit))
        })
    }

    verifyRelatedProducts({ include, exclude }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.relatedTitle, sel.texts.relatedTitle, T).parent().find(sel.relatedCardTitle).should($titles => {
                const names = [...$titles].map(el => normalize(el.innerText))
                include.forEach(name => expect(names, 'relacionados').to.include(name))
                expect(names, 'relacionados').not.to.include(exclude)
            })
        })
    }

    // ─── Cantidad ─────────────────────────────────────────────────────────────

    increaseQuantity() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.increaseQuantity).click())
    }

    decreaseQuantity() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.decreaseQuantity).click())
    }

    // La app corrige el valor en cada evento "input": escribir tecla por
    // tecla mezcla la corrección con los dígitos siguientes (borrar deja 1 y
    // "0" termina en "10"). Se carga el valor completo y se dispara un único
    // "input", igual que al pegar el número en el campo.
    enterQuantity(value) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.quantityInput).invoke('val', value).trigger('input')
        })
    }

    verifyQuantity(value) {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.quantityInput, T).should('have.value', String(value)))
    }

    verifyNoQuantityField() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.quantityInput).should('not.exist'))
    }

    // ─── Carrito ──────────────────────────────────────────────────────────────

    addToCart() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.addToCart).click())
    }

    verifyAddToCartEnabled() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.addToCart, T).should('be.enabled'))
    }

    verifyAddToCartDisabled() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.addToCart, T).should('be.disabled'))
    }

    verifyOutOfStock() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.outOfStock, T).should($o => expect(normalize($o.text())).to.equal(sel.texts.outOfStock))
        })
    }

    verifyNoOutOfStock() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.outOfStock).should('not.exist'))
    }

    verifyToast(textKey) {
        cy.fixture(FIXTURE).then(sel => cy.contains(sel.toastMessage, sel.texts[textKey], T).should('be.visible'))
    }

    verifyCartQuantity(count) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.cartQuantity, T).should($c => expect(normalize($c.text())).to.equal(String(count)))
        })
    }

    // ─── Alquiler ─────────────────────────────────────────────────────────────

    verifyPerHourPrice() {
        cy.fixture(FIXTURE).then(sel => cy.contains(sel.texts.perHour, T).should('be.visible'))
    }

    verifyDuration(hours) {
        cy.fixture(FIXTURE).then(sel => {
            cy.contains(sel.rentalDurationLabel, sel.texts.durationPrefix, T).should($l => {
                expect(normalize($l.text())).to.equal(sel.texts.duration.replace('{n}', hours))
            })
        })
    }

    // El control de duración (ngx-slider) se opera con el teclado.
    pressDurationKey(key, times = 1) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.rentalSliderPointer).focus()
            Cypress._.times(times, () => cy.get(sel.rentalSliderPointer).type(`{${key}}`))
        })
    }
}

export default PSTProductDetailPage
