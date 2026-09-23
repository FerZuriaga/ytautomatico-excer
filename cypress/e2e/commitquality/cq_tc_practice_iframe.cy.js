// Modulo: Practice - IFrame
// Sitio bajo prueba: https://commitquality.com/practice-iframe
// Ticket Jira: SCRUM-349 (CA-01/CA-02/CA-03, Test Cycle SCRUM-350)
//
// El iframe embebe la Home del MISMO origen (catalogo con sus propios 11
// productos seed): su contentDocument es accesible sin plugins. La app
// embebida comparte localStorage con la pagina contenedora, por eso con
// sesion iniciada muestra la columna Actions.

import CommitQualityIframePage from '../../pages/commitquality/CommitQualityIframePage'

const iframePage = new CommitQualityIframePage()

const openIframe = () => {
    iframePage.visit()
    iframePage.verifyLoaded()
}

describe('Practice: catalogo embebido en IFrame [SCRUM-349]', () => {

    it('[CA-01][TC-01.1][SCRUM-351] Debe mostrar el catalogo embebido con su estado inicial', () => {
        openIframe()

        iframePage.verifyIframeInitialCatalog()
    })

    it('[CA-01][TC-01.2][SCRUM-352] La tabla de productos debe existir solo dentro del iframe', () => {
        openIframe()
        iframePage.verifyIframeRowCount(10)

        iframePage.verifyContainerHasNoProductTable()
    })

    it('[CA-02][TC-02.1][SCRUM-353] Debe filtrar productos por nombre dentro del iframe', () => {
        openIframe()

        iframePage.filterByNameInIframe('Product 1')

        iframePage.verifyIframeRowCount(5)
        iframePage.verifyIframeOnlyProductsNamed('Product 1')
    })

    it('[CA-02][TC-02.2][SCRUM-354] Debe resetear el filtro dentro del iframe', () => {
        openIframe()
        iframePage.filterByNameInIframe('Product 1')
        iframePage.verifyIframeRowCount(5)

        iframePage.clickResetInIframe()

        iframePage.verifyIframeFilterEmpty()
        iframePage.verifyIframeRowCount(10)
    })

    it('[CA-02][TC-02.3][SCRUM-355] Debe cargar el resto de los productos con Show More dentro del iframe', () => {
        openIframe()

        iframePage.clickShowMoreInIframe()

        iframePage.verifyIframeRowCount(11)
        iframePage.verifyIframeShowMoreNotVisible()
    })

    it('[CA-03][TC-03.1][SCRUM-356] Sin sesion el catalogo embebido no debe mostrar acciones de edicion', () => {
        openIframe()

        iframePage.verifyIframeNoActions()
    })

    it('[CA-03][TC-03.2][SCRUM-357] Con sesion el catalogo embebido debe mostrar Edit | Delete', () => {
        cy.cqLogin()
        openIframe()

        iframePage.verifyIframeActionsOnEveryRow(10)
    })
})
