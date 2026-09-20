class AutomationTestStoreHomePage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get brandCarousel() { return cy.get('#brandcarousal') }
    brandLink(brandName) { return cy.get('#brandcarousal a img[alt="' + brandName + '"]').parent('a') }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    visit() {
        cy.gotoATSUrl('/')
    }

    clickBrand(brandName) {
        this.brandLink(brandName).click()
    }
}

export default AutomationTestStoreHomePage
