class ArgentinaDocumentacionPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get breadcrumb() {
        return cy.get('ol.breadcrumb')
    }

    get titulo() {
        return cy.get('#encabezado h1')
    }

    get preguntas() {
        return cy.get('details.ar-details')
    }

    preguntaPorTexto(texto) {
        return cy.contains('summary.ar-details__title', texto).parents('details.ar-details')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    togglePregunta(texto) {
        cy.contains('summary.ar-details__title', texto).click()
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyTituloYBreadcrumb() {
        this.titulo.should('have.text', 'Documentación ciudadana')
        this.breadcrumb.should('contain.text', 'Inicio')
        this.breadcrumb.should('contain.text', 'Temas y servicios')
        this.breadcrumb.should('contain.text', 'Documentación ciudadana')
    }

    verifyTodasColapsadas() {
        this.preguntas.each(($pregunta) => {
            cy.wrap($pregunta).should('not.have.attr', 'open')
        })
    }

    verifyPreguntaExpandida(texto) {
        this.preguntaPorTexto(texto).should('have.attr', 'open')
    }

    verifyPreguntaColapsada(texto) {
        this.preguntaPorTexto(texto).should('not.have.attr', 'open')
    }

    verifyContenidoTieneEnlace(texto) {
        this.preguntaPorTexto(texto).find('.ar-details__content a').should('have.length.greaterThan', 0)
    }
}

export default ArgentinaDocumentacionPage
