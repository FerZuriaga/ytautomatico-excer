class AutomationTestStoreSpecialsPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get pageTitle() { return cy.get('h1.heading1 .maintext') }
    // Igual que en category/search: hay 2 grillas (grid/list) con las
    // mismas clases, la oculta por CSS externo -- se filtra por :visible.
    get thumbnails() { return cy.get('.thumbnails .thumbnail:visible') }
    get oldPrices() { return cy.get('.thumbnails .priceold:visible') }
    get newPrices() { return cy.get('.thumbnails .pricenew:visible') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visit() {
        cy.gotoATSUrl('/index.php?rt=product/special')
    }

    goToProduct(productId) {
        cy.gotoATSUrl(`/index.php?rt=product/product&product_id=${productId}`)
    }

    parsePrice(text) {
        return Number(text.replace('$', '').replace(',', ''))
    }
}

export default AutomationTestStoreSpecialsPage
