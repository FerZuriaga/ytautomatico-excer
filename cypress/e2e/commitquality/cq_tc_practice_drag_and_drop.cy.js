// Modulo: Practice - Drag and Drop
// Sitio bajo prueba: https://commitquality.com/practice-drag-and-drop
// Ticket Jira: SCRUM-358 (CA-01/CA-02/CA-03, Test Cycle SCRUM-359)
//
// DnD nativo de HTML5 simulado con cy.trigger + un DataTransfer compartido
// entre dragstart y drop (ver CommitQualityDragAndDropPage).
// Hallazgo (NO automatizado como esperado): "dragenter" sobre la caja
// grande ya muestra "Success!" sin soltar nada -- ver
// docs/discovery/commitquality.md.

import CommitQualityDragAndDropPage from '../../pages/commitquality/CommitQualityDragAndDropPage'

const dndPage = new CommitQualityDragAndDropPage()

describe('Practice: Drag and Drop [SCRUM-358]', () => {

    beforeEach(() => {
        dndPage.visit()
        dndPage.verifyInitialState()
    })

    it('[CA-01][TC-01.1][SCRUM-360] Debe iniciar con la instruccion y sin estilos de arrastre ni exito', () => {
        dndPage.verifyInstructionShown()
        dndPage.verifySmallBoxNotDragging()
    })

    it('[CA-01][TC-01.2][SCRUM-361] Debe volver al estado inicial al recargar despues del exito', () => {
        dndPage.dragAndDropInside()
        dndPage.verifySuccess()

        cy.reload()

        dndPage.verifyInitialState()
    })

    it('[CA-02][TC-02.1][SCRUM-362] Debe mostrar Success! al soltar la caja chica dentro de la grande', () => {
        dndPage.dragAndDropInside()

        dndPage.verifySuccess()
    })

    it('[CA-02][TC-02.2][SCRUM-363] La caja chica debe indicar el arrastre y dejar de hacerlo al soltarla', () => {
        dndPage.startDrag()
        dndPage.verifySmallBoxDragging()

        dndPage.dropOnLargeBox()

        dndPage.verifySuccess()
        dndPage.verifySmallBoxNotDragging()
    })

    it('[CA-03][TC-03.1][SCRUM-364] No debe marcar exito al soltar la caja chica fuera de la grande', () => {
        dndPage.startDrag()
        dndPage.verifySmallBoxDragging()

        dndPage.dropOutside()

        dndPage.verifyInstructionShown()
        dndPage.verifySmallBoxNotDragging()
    })

    it('[CA-03][TC-03.2][SCRUM-365] Debe permitir reintentar despues de soltar fuera', () => {
        dndPage.dragAndDropOutside()
        dndPage.verifyInstructionShown()

        dndPage.dragAndDropInside()

        dndPage.verifySuccess()
    })
})
