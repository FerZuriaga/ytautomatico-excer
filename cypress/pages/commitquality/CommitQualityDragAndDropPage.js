const FIXTURE = 'selectors/commitquality/practice-drag-and-drop.json'

class CommitQualityDragAndDropPage {

    // ─── Navegación ───────────────────────────────────────────────────────────

    visit() {
        cy.gotoCQUrl('/practice-drag-and-drop')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // DnD nativo de HTML5: el sitio guarda el id de la caja en
    // dataTransfer en "dragstart" y lo lee en "drop", asi que ambos eventos
    // deben compartir el MISMO DataTransfer, creado en la ventana de la app.
    // Se lee siempre dentro de cy.then(): al encolar los comandos todavia
    // no existe.
    startDrag() {
        cy.fixture(FIXTURE).then(sel => {
            cy.window().then(win => {
                this.dataTransfer = new win.DataTransfer()
                cy.get(sel.smallBox).trigger('dragstart', { dataTransfer: this.dataTransfer })
            })
        })
    }

    dropOnLargeBox() {
        cy.fixture(FIXTURE).then(sel => {
            cy.then(() => {
                const dataTransfer = this.dataTransfer
                cy.get(sel.largeBox)
                    .trigger('dragenter', { dataTransfer })
                    .trigger('dragover', { dataTransfer })
                    .trigger('drop', { dataTransfer })
                cy.get(sel.smallBox).trigger('dragend', { dataTransfer })
            })
        })
    }

    // Soltar fuera del destino: el arrastre termina sin pasar por la caja grande.
    dropOutside() {
        cy.fixture(FIXTURE).then(sel => {
            cy.then(() => cy.get(sel.smallBox).trigger('dragend', { dataTransfer: this.dataTransfer }))
        })
    }

    dragAndDropInside() {
        this.startDrag()
        this.dropOnLargeBox()
    }

    dragAndDropOutside() {
        this.startDrag()
        this.dropOutside()
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyInitialState() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.smallBox).should('be.visible').and('have.text', sel.texts.smallBox)
            this.verifyInstructionShown()
            this.verifySmallBoxNotDragging()
        })
    }

    verifyInstructionShown() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.largeBox).should('have.text', sel.texts.instruction).and('not.have.class', sel.insideClass)
        })
    }

    verifySuccess() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.largeBox).should('have.text', sel.texts.success).and('have.class', sel.insideClass)
        })
    }

    verifySmallBoxDragging() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.smallBox).should('have.class', sel.draggingClass))
    }

    verifySmallBoxNotDragging() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.smallBox).should('not.have.class', sel.draggingClass))
    }
}

export default CommitQualityDragAndDropPage
