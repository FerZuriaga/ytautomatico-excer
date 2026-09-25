// Modulo: Catalogo - Ordenamiento por precio y nombre
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-394 (CA-01/CA-02/CA-03, Test Cycle SCRUM-395)
//
// El catalogo arranca con el rango de precio 1 - 100, por eso el primero
// de "Price (High - Low)" es Drawer Tool Cabinet ($89.55) y no un producto
// de mas de $100. Ver docs/discovery/practicesoftwaretesting.md.

import PSTCatalogPage from '../../pages/practicesoftwaretesting/PSTCatalogPage'

const catalog = new PSTCatalogPage()

describe('Catalogo: ordenamiento por precio y nombre [SCRUM-394]', () => {

    beforeEach(() => {
        catalog.visit()
        catalog.verifyInitialCatalog()
    })

    it('[CA-01][TC-01.1][SCRUM-396] Debe ordenar por precio de menor a mayor', () => {
        catalog.sortBy('priceAsc')

        catalog.verifyFirstProduct('Washers')
        catalog.verifyFirstProductPrice(3.55)
        catalog.verifyProductCount(9)
        catalog.verifyPricesSorted('asc')
    })

    it('[CA-01][TC-01.2][SCRUM-397] Debe ordenar por precio de mayor a menor', () => {
        catalog.sortBy('priceDesc')

        catalog.verifyFirstProduct('Drawer Tool Cabinet')
        catalog.verifyFirstProductPrice(89.55)
        catalog.verifyProductCount(9)
        catalog.verifyPricesSorted('desc')
    })

    it('[CA-02][TC-02.1][SCRUM-398] Debe ordenar por nombre de la A a la Z', () => {
        catalog.sortBy('nameAsc')

        catalog.verifyFirstProduct('Adjustable Wrench')
        catalog.verifyProductCount(9)
        catalog.verifyNamesSorted('asc')
    })

    it('[CA-02][TC-02.2][SCRUM-399] Debe ordenar por nombre de la Z a la A', () => {
        catalog.sortBy('nameDesc')

        catalog.verifyFirstProduct('Wood Saw')
        catalog.verifyProductCount(9)
        catalog.verifyNamesSorted('desc')
    })

    it('[CA-03][TC-03.1][SCRUM-400] Ordenar los resultados de una busqueda debe conservar el termino buscado', () => {
        catalog.search('pliers')
        catalog.verifySearchCaption('pliers')
        catalog.verifyProductCount(4)

        catalog.sortBy('priceAsc')

        catalog.verifyFirstProduct('Slip Joint Pliers')
        catalog.verifyFirstProductPrice(9.17)
        catalog.verifySearchCaption('pliers')
        catalog.verifyExactProducts(['Combination Pliers', 'Pliers', 'Long Nose Pliers', 'Slip Joint Pliers'])
        catalog.verifyPricesSorted('asc')
    })

    it('[CA-03][TC-03.2][SCRUM-401] Ordenar con un filtro de categoria activo debe conservar el filtro', () => {
        catalog.checkCategory('pliers')
        catalog.verifyProductCount(5)

        catalog.sortBy('priceAsc')

        catalog.verifyFirstProduct('Slip Joint Pliers')
        catalog.verifyLastProduct('Bolt Cutters')
        catalog.verifyCategoriesChecked(['pliers'])
        catalog.verifyProductCount(5)
        catalog.verifyPricesSorted('asc')
    })

    it('[CA-03][TC-03.3][SCRUM-402] Ordenar una busqueda sin resultados no debe volver a mostrar el catalogo', () => {
        catalog.search('xyzzy')
        catalog.verifyNoResults()

        catalog.sortBy('nameAsc')
        catalog.waitForListResponse()

        catalog.verifySearchCaption('xyzzy')
        catalog.verifyNoResults()
    })
})
