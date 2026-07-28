class MediosDePagoPage {

    // ─── Selectores ───────────────────────────────────────────────────────────
    // El widget de pestañas está duplicado en el DOM (variante desktop/mobile);
    // ":visible" filtra la variante realmente renderizada según el viewport.

    get tabButtons() {
        return cy.get('li.eael-tab-item-trigger:visible')
    }

    get activeTabButton() {
        return cy.get('li.eael-tab-item-trigger.active:visible')
    }

    get visiblePanels() {
        return cy.get('.eael-tab-content-item:visible')
    }

    get activePanel() {
        return cy.get('.eael-tab-content-item.active:visible')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    seleccionarPestana(nombre) {
        this.tabButtons.contains(nombre).click()
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyPestanaActivaEs(nombre) {
        this.activeTabButton.should('contain.text', nombre)
    }

    verifyContenidoActivoContiene(texto) {
        this.activePanel.should('contain.text', texto)
    }

    verifyUnicoPanelVisible() {
        this.visiblePanels.should('have.length', 1)
    }
}

export default MediosDePagoPage
