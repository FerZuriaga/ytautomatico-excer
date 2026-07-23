class SauceDemoMenuPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get menuButton() {
        return cy.get('#react-burger-menu-btn')
    }

    get logoutLink() {
        return cy.get('#logout_sidebar_link')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    logout() {
        this.menuButton.click()
        this.logoutLink.should('be.visible').click()
    }
}

export default SauceDemoMenuPage
