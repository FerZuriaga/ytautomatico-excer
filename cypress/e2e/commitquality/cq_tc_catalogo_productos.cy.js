// Modulo: Catalogo - Listado y filtro de productos
// Sitio bajo prueba: https://commitquality.com
// Ticket Jira: SCRUM-295 (CA-01/CA-02/CA-03/CA-04, Test Cycle SCRUM-296)
//
// El catalogo trae 11 productos seed fijos en memoria (sin backend, se
// resetea en cada carga completa). Vista por defecto: 10 productos,
// boton "Show More" carga el resto - ver docs/discovery/commitquality.md.

import CommitQualityProductListPage from '../../pages/commitquality/CommitQualityProductListPage'

const listPage = new CommitQualityProductListPage()

describe('Catalogo: listado y filtro de productos [SCRUM-295]', () => {

    beforeEach(() => {
        listPage.visit()
    })

    it('[CA-01][TC-01.1][SCRUM-297] Debe filtrar productos por nombre exacto', () => {
        listPage.filterByName('Product 1')
        listPage.verifyOnlyProductsNamed('Product 1')
    })

    it('[CA-01][TC-01.2][SCRUM-298] Debe filtrar sin distinguir mayusculas de minusculas', () => {
        listPage.filterByName('PRODUCT 2')
        listPage.verifyOnlyProductsNamed('Product 2')
    })

    it('[CA-02][TC-02.1][SCRUM-299] Debe mostrar "No products found" con un texto sin coincidencias', () => {
        listPage.filterByName('ProductoXYZ')
        listPage.verifyNoProductsMessage()
    })

    it('[CA-02][TC-02.2][SCRUM-300] Debe mostrar "No products found" con caracteres especiales sin coincidencias', () => {
        listPage.filterByName('999###')
        listPage.verifyNoProductsMessage()
    })

    it('[CA-03][TC-03.1][SCRUM-301] El boton Reset debe restaurar el listado completo tras filtrar', () => {
        listPage.filterByName('Product 1')
        listPage.verifyOnlyProductsNamed('Product 1')

        listPage.clickReset()

        listPage.verifyFilterInputEmpty()
        listPage.verifyRowCount(10)
        listPage.verifyContainsProductNamed('Product 2')
    })

    it('[CA-03][TC-03.2][SCRUM-302] El boton Reset no debe alterar el listado si no se filtro antes', () => {
        listPage.verifyRowCount(10)

        listPage.clickReset()

        listPage.verifyFilterInputEmpty()
        listPage.verifyRowCount(10)
    })

    it('[CA-04][TC-04.1][SCRUM-303] Debe mostrar 10 productos y el boton Show More por defecto', () => {
        listPage.verifyRowCount(10)
        listPage.verifyShowMoreButtonVisible()
    })

    it('[CA-04][TC-04.2][SCRUM-304] Show More debe cargar el resto de los productos y luego ocultarse', () => {
        listPage.verifyRowCount(10)

        listPage.clickShowMore()

        listPage.verifyRowCount(11)
        listPage.verifyShowMoreButtonNotVisible()
    })
})
