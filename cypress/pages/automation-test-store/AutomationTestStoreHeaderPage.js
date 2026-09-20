class AutomationTestStoreHeaderPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get currencyLabel() { return cy.get('ul.nav.language .dropdown-toggle span') }
    currencyLink(code) { return cy.get(`ul.dropdown-menu.currency a[href*="currency=${code}"]`) }

    // ─── Acciones ─────────────────────────────────────────────────────────────
    // El dropdown de moneda es CSS-only (visible solo en :hover), sin toggle
    // por JS -- se hace click con force para no depender de simular el hover.

    selectCurrency(code) {
        this.currencyLink(code).click({ force: true })
    }
}

export default AutomationTestStoreHeaderPage
