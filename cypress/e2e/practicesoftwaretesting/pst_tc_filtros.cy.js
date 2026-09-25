// Modulo: Catalogo - Filtros por categoria, marca, sustentabilidad y precio
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-403 (CA-01/CA-02/CA-03/CA-04, Test Cycle SCRUM-404)
//
// Base de datos compartida: solo se usan las 2 marcas originales y las
// categorias del seed (por id). Rango de precio inicial 1 - 100. Ver
// docs/discovery/practicesoftwaretesting.md.

import PSTCatalogPage from '../../pages/practicesoftwaretesting/PSTCatalogPage'

const catalog = new PSTCatalogPage()

describe('Catalogo: filtros por categoria, marca, sustentabilidad y precio [SCRUM-403]', () => {

    beforeEach(() => {
        catalog.visit()
        catalog.verifyInitialCatalog()
    })

    it('[CA-01][TC-01.1][SCRUM-405] Debe mostrar solo los productos de la subcategoria elegida', () => {
        catalog.checkCategory('pliers')

        catalog.verifyExactProducts(['Combination Pliers', 'Pliers', 'Bolt Cutters', 'Long Nose Pliers', 'Slip Joint Pliers'])
    })

    it('[CA-01][TC-01.2][SCRUM-406] La categoria principal debe incluir los productos de todas sus subcategorias', () => {
        catalog.checkCategory('powerTools')

        catalog.verifyCategoriesChecked(['grinder', 'sander', 'saw', 'drill'])
        catalog.verifyExactProducts(['Sheet Sander', 'Belt Sander', 'Circular Saw', 'Cordless Drill 24V', 'Cordless Drill 12V'])
    })

    it('[CA-01][TC-01.3][SCRUM-407] Desmarcar la categoria debe volver a mostrar el catalogo completo', () => {
        catalog.checkCategory('pliers')
        catalog.verifyProductCount(5)

        catalog.uncheckCategory('pliers')

        catalog.verifyProductCount(9)
        catalog.verifyFullCatalogPagination()
    })

    it('[CA-02][TC-02.1][SCRUM-408] Debe mostrar solo los productos de la marca elegida', () => {
        catalog.checkBrand('mightyCraft')

        catalog.verifyNoPagination()
        catalog.verifyProductCount(9)
        catalog.verifyContainsProducts(['Claw Hammer', 'Bolt Cutters', 'Belt Sander'])
    })

    it('[CA-02][TC-02.2][SCRUM-409] Debe combinar la marca con la categoria elegida', () => {
        catalog.checkCategory('pliers')
        catalog.verifyProductCount(5)

        catalog.checkBrand('forgeFlex')

        catalog.verifyExactProducts(['Combination Pliers', 'Pliers'])
    })

    it('[CA-02][TC-02.3][SCRUM-410] Debe informar que no hay productos si ninguno cumple marca y categoria', () => {
        catalog.checkCategory('wrench')
        catalog.verifyExactProducts(['Adjustable Wrench', 'Angled Spanner', 'Open-end Spanners (Set)'])

        catalog.checkBrand('mightyCraft')

        catalog.verifyNoResults()
    })

    it('[CA-03][TC-03.1][SCRUM-411] Debe mostrar solo productos ecologicos', () => {
        catalog.checkEcoFriendly()

        catalog.verifyPageCount(2)
        catalog.verifyProductCount(9)
        catalog.verifyAllProductsEcoFriendly()
    })

    it('[CA-03][TC-03.2][SCRUM-412] Debe informar que no hay productos ecologicos en una categoria que no los tiene', () => {
        catalog.checkCategory('pliers')
        catalog.verifyProductCount(5)

        catalog.checkEcoFriendly()

        catalog.verifyNoResults()
    })

    it('[CA-04][TC-04.1][SCRUM-413] Debe mostrar solo los productos dentro del rango de precio', () => {
        catalog.setMinPriceToFloor()
        catalog.verifyPriceRange(0, 100)

        catalog.setMaxPrice(10)

        catalog.verifyPriceRange(0, 10)
        catalog.verifyNoPagination()
        catalog.verifyProductCount(9)
        catalog.verifyAllPricesAtMost(10)
        catalog.verifyContainsProducts(['Slip Joint Pliers'])
    })

    it('[CA-04][TC-04.2][SCRUM-414] Debe informar que no hay productos en un rango de precio sin productos', () => {
        catalog.setMinPriceToFloor()
        catalog.verifyPriceRange(0, 100)

        catalog.setMaxPrice(3)

        catalog.verifyPriceRange(0, 3)
        catalog.verifyNoResults()
    })
})
