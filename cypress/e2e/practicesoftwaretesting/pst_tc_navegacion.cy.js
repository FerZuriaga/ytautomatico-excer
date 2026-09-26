// Modulo: Catalogo - Navegacion por paginas y categorias
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-416 (CA-01/CA-02/CA-03, Test Cycle SCRUM-417)
//
// La Home aplica el rango de precio 1 - 100 (45 productos, 5 paginas); las
// paginas de categoria no lo aplican. "Special Tools" queda fuera a
// proposito: Bug SCRUM-458. Ver docs/discovery/practicesoftwaretesting.md.

import PSTCatalogPage from '../../pages/practicesoftwaretesting/PSTCatalogPage'
import PSTNavigationPage from '../../pages/practicesoftwaretesting/PSTNavigationPage'

const catalog = new PSTCatalogPage()
const nav = new PSTNavigationPage()

describe('Catalogo: navegacion por paginas y categorias [SCRUM-416]', () => {

    beforeEach(() => {
        catalog.visit()
        catalog.verifyInitialCatalog()
        catalog.verifyFirstProduct('Combination Pliers')
    })

    it('[CA-01][TC-01.1][SCRUM-418] Debe mostrar los productos de la pagina elegida por su numero', () => {
        nav.goToPage(2)

        nav.verifyActivePage(2)
        catalog.verifyFirstProduct('Sledgehammer')
        catalog.verifyProductCount(9)
    })

    it('[CA-01][TC-01.2][SCRUM-419] Debe avanzar y retroceder una pagina con las flechas', () => {
        nav.clickNext()
        nav.verifyActivePage(2)
        catalog.verifyFirstProduct('Sledgehammer')

        nav.clickPrev()

        nav.verifyActivePage(1)
        catalog.verifyFirstProduct('Combination Pliers')
    })

    it('[CA-01][TC-01.3][SCRUM-420] No debe retroceder desde la primera pagina', () => {
        nav.verifyPrevDisabled()

        nav.clickPrevWhileDisabled()

        nav.verifyPrevDisabled()
        nav.verifyActivePage(1)
        catalog.verifyFirstProduct('Combination Pliers')
    })

    it('[CA-01][TC-01.4][SCRUM-421] No debe avanzar desde la ultima pagina', () => {
        nav.goToPage(5)
        nav.verifyActivePage(5)
        catalog.verifyFirstProduct('Washers')
        nav.verifyNextDisabled()

        nav.clickNextWhileDisabled()

        nav.verifyActivePage(5)
        catalog.verifyFirstProduct('Washers')
    })

    it('[CA-02][TC-02.1][SCRUM-422] La categoria Hand Tools debe mostrar sus productos', () => {
        nav.openMenuItem('Hand Tools')

        nav.verifyCategoryTitle('Hand Tools')
        catalog.verifyPageCount(3)
        catalog.verifyProductCount(9)
        catalog.verifyFirstProduct('Combination Pliers')
    })

    it('[CA-02][TC-02.2][SCRUM-423] La categoria debe incluir productos de cualquier precio', () => {
        nav.openMenuItem('Power Tools')

        nav.verifyCategoryTitle('Power Tools')
        catalog.verifyNoPagination()
        catalog.verifyProductCount(8)
        catalog.verifyContainsProducts(['Random Orbit Sander', 'Cordless Drill 20V'])
    })

    it('[CA-03][TC-03.1][SCRUM-424] Debe acotar Hand Tools a la subcategoria Pliers', () => {
        nav.openMenuItem('Hand Tools')
        nav.verifyCategoryTitle('Hand Tools')
        catalog.verifyPageCount(3)

        catalog.checkCategory('pliers')

        catalog.verifyExactProducts(['Combination Pliers', 'Pliers', 'Bolt Cutters', 'Long Nose Pliers', 'Slip Joint Pliers'])
    })

    it('[CA-03][TC-03.2][SCRUM-425] Debe acotar Power Tools a la subcategoria Drill', () => {
        nav.openMenuItem('Power Tools')
        nav.verifyCategoryTitle('Power Tools')
        catalog.verifyProductCount(8)

        catalog.checkCategory('drill')

        catalog.verifyExactProducts(['Cordless Drill 20V', 'Cordless Drill 24V', 'Cordless Drill 18V', 'Cordless Drill 12V'])
    })

    it('[CA-03][TC-03.3][SCRUM-426] Debe informar que no hay productos en una subcategoria vacia', () => {
        nav.openMenuItem('Power Tools')
        nav.verifyCategoryTitle('Power Tools')
        catalog.verifyProductCount(8)

        catalog.checkCategory('grinder')

        nav.verifyCategoryNoResults()
        catalog.verifyProductCount(0)
    })
})
