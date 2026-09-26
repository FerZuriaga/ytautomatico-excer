// Modulo: Catalogo - Busqueda de productos
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-381 (CA-01/CA-02/CA-03, Test Cycle SCRUM-382)
//
// La busqueda coincide por inicio de palabra, sin distinguir mayusculas,
// y solo se envia con terminos de 3 a 40 caracteres. Se evita el termino
// "hammer" a proposito: Bug SCRUM-415. Ver
// docs/discovery/practicesoftwaretesting.md.

import PSTCatalogPage from '../../pages/practicesoftwaretesting/PSTCatalogPage'

const catalog = new PSTCatalogPage()

const PLIERS = ['Combination Pliers', 'Pliers', 'Long Nose Pliers', 'Slip Joint Pliers']

describe('Catalogo: busqueda de productos [SCRUM-381]', () => {

    beforeEach(() => {
        catalog.visit()
        catalog.verifyInitialCatalog()
    })

    it('[CA-01][TC-01.1][SCRUM-383] Debe mostrar los productos que coinciden con el nombre buscado', () => {
        catalog.search('pliers')

        catalog.verifySearchCaption('pliers')
        catalog.verifyResultCount(4, 'pliers')
        catalog.verifyExactProducts(PLIERS)
    })

    it('[CA-01][TC-01.2][SCRUM-384] Debe encontrar coincidencias por el inicio de una palabra', () => {
        catalog.search('Pli')

        catalog.verifySearchCaption('Pli')
        catalog.verifyResultCount(4, 'Pli')
        catalog.verifyExactProducts(PLIERS)
    })

    it('[CA-01][TC-01.3][SCRUM-385] Debe buscar sin distinguir mayusculas de minusculas', () => {
        catalog.search('PLIERS')

        catalog.verifyResultCount(4, 'PLIERS')
        catalog.verifyExactProducts(PLIERS)
    })

    it('[CA-01][TC-01.4][SCRUM-386] Debe encontrar el producto con varias palabras en cualquier orden', () => {
        catalog.search('pliers long')

        catalog.verifyResultCount(1, 'pliers long')
        catalog.verifyExactProducts(['Long Nose Pliers'])
    })

    it('[CA-01][TC-01.5][SCRUM-387] Debe informar que no hay productos cuando la busqueda no tiene coincidencias', () => {
        catalog.search('xyzzy')

        catalog.verifySearchCaption('xyzzy')
        catalog.verifyNoResults()
    })

    it('[CA-02][TC-02.1][SCRUM-388] No debe buscar con el campo vacio', () => {
        catalog.search('')

        catalog.verifySearchNotPerformed()
    })

    it('[CA-02][TC-02.2][SCRUM-389] No debe buscar con menos de 3 caracteres', () => {
        catalog.search('ab')

        catalog.verifySearchNotPerformed()
    })

    it('[CA-02][TC-02.3][SCRUM-390] No debe buscar con mas de 40 caracteres', () => {
        catalog.search('pliers pliers pliers pliers pliers pliers')

        catalog.verifySearchNotPerformed()
    })

    it('[CA-02][TC-02.4][SCRUM-391] Debe buscar con exactamente 3 caracteres', () => {
        catalog.search('Tho')

        catalog.verifyResultCount(1, 'Tho')
        catalog.verifyExactProducts(['Thor Hammer'])
    })

    it('[CA-03][TC-03.1][SCRUM-392] Descartar una busqueda con resultados debe volver al catalogo completo', () => {
        catalog.search('pliers')
        catalog.verifyResultCount(4, 'pliers')
        catalog.verifyProductCount(4)

        catalog.clearSearch()

        catalog.verifyNoSearchCaption()
        catalog.verifyProductCount(9)
        catalog.verifyFullCatalogPagination()
    })

    it('[CA-03][TC-03.2][SCRUM-393] Descartar una busqueda sin resultados debe volver al catalogo completo', () => {
        catalog.search('xyzzy')
        catalog.verifyNoResults()

        catalog.clearSearch()

        catalog.verifyNoSearchCaption()
        catalog.verifyProductCount(9)
        catalog.verifyFullCatalogPagination()
    })
})
