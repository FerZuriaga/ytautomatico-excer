// Modulo: Gestion de productos - Eliminar producto
// Sitio bajo prueba: https://commitquality.com
// Ticket Jira: SCRUM-328 (CA-01/CA-02/CA-03/CA-04, Test Cycle SCRUM-329)
//
// Delete SI requiere sesion iniciada (columna "Actions" solo se renderiza
// con isLoggedIn=true). No hay dialogo de confirmacion y no hay backend:
// el borrado vive solo en memoria, se conserva al navegar dentro de la SPA
// y se revierte con un full reload (vuelven los 11 productos seed). Cada
// test arranca con cy.visit -> full load -> 11 seed intactos, por eso el
// borrado de un test no contamina al siguiente.
// Seed: 11 productos (ids 1..11), listado en orden inverso (11 primero),
// paginado de a 10 -> con 11 el id 1 queda oculto detras de "Show More".
// "Product 1" = ids 1, 3, 5, 7, 10.

import CommitQualityLoginPage from '../../pages/commitquality/CommitQualityLoginPage'
import CommitQualityProductListPage from '../../pages/commitquality/CommitQualityProductListPage'

const loginPage = new CommitQualityLoginPage()
const listPage = new CommitQualityProductListPage()

const loginAndVerifyList = () => {
    loginPage.visit()
    loginPage.login('test', 'test')
    loginPage.verifyLoggedIn()
    listPage.verifyRowCount(10)
}

describe('Eliminar producto [SCRUM-328]', () => {

    it('[CA-01][TC-01.1][SCRUM-330] Debe mostrar la accion Delete en cada fila con sesion iniciada', () => {
        loginAndVerifyList()

        listPage.verifyDeleteActionOnEveryRow(10)
    })

    it('[CA-01][TC-01.2][SCRUM-331] No debe mostrar la accion Delete sin sesion iniciada', () => {
        listPage.visit()
        loginPage.verifyStillLoggedOut()

        listPage.verifyNoDeleteActions()
    })

    it('[CA-02][TC-02.1][SCRUM-332] Debe eliminar el producto al instante sin pedir confirmacion', () => {
        const confirmStub = cy.stub()
        cy.on('window:confirm', confirmStub)
        loginAndVerifyList()
        listPage.verifyRowNotExists(1)

        listPage.clickDeleteForProduct(11)

        listPage.verifyRowNotExists(11)
        listPage.verifyRowExists(1)
        listPage.verifyRowCount(10)
        cy.then(() => expect(confirmStub).not.to.have.been.called)
    })

    it('[CA-02][TC-02.2][SCRUM-333] Debe ocultar Show More al quedar 10 productos o menos', () => {
        loginAndVerifyList()
        listPage.verifyShowMoreButtonVisible()

        listPage.clickDeleteForProduct(11)

        listPage.verifyRowNotExists(11)
        listPage.verifyShowMoreButtonNotVisible()
    })

    it('[CA-03][TC-03.1][SCRUM-334] Debe quitar el producto eliminado de la vista filtrada', () => {
        loginAndVerifyList()
        listPage.filterByName('Product 1')
        listPage.verifyRowCount(5)

        listPage.clickDeleteForProduct(10)

        listPage.verifyRowNotExists(10)
        listPage.verifyRowCount(4)
        listPage.verifyOnlyProductsNamed('Product 1')
    })

    it('[CA-03][TC-03.2][SCRUM-335] No debe reaparecer el producto eliminado al resetear el filtro', () => {
        loginAndVerifyList()
        listPage.filterByName('Product 1')
        listPage.clickDeleteForProduct(10)
        listPage.verifyRowCount(4)

        listPage.clickReset()

        listPage.verifyRowCount(10)
        listPage.verifyRowNotExists(10)
        listPage.verifyShowMoreButtonNotVisible()
    })

    it('[CA-04][TC-04.1][SCRUM-336] Debe conservar el borrado al navegar dentro de la app', () => {
        loginAndVerifyList()
        listPage.clickDeleteForProduct(11)
        listPage.verifyRowNotExists(11)

        listPage.goToAddProductFromNavbar()
        cy.url().should('include', '/add-product')
        listPage.goToProductsFromNavbar()

        listPage.verifyRowCount(10)
        listPage.verifyRowNotExists(11)
    })

    it('[CA-04][TC-04.2][SCRUM-337] Debe restaurar los productos seed al recargar la pagina', () => {
        loginAndVerifyList()
        listPage.clickDeleteForProduct(11)
        listPage.verifyRowNotExists(11)

        cy.reload()

        loginPage.verifyLoggedIn()
        listPage.verifyRowExists(11)
        listPage.verifyShowMoreButtonVisible()
    })
})
