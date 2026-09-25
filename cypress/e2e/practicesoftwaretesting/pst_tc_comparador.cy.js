// Modulo: Catalogo - Comparador de productos
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-438 (CA-01/CA-02/CA-03, Test Cycle SCRUM-439)
//
// Maximo 4 productos, guardados en sessionStorage (Cypress lo limpia entre
// tests). Hammer y Claw Hammer comparten solo la especificacion Material
// (Carbon Steel). Ver docs/discovery/practicesoftwaretesting.md.

import PSTCatalogPage from '../../pages/practicesoftwaretesting/PSTCatalogPage'
import PSTComparisonPage from '../../pages/practicesoftwaretesting/PSTComparisonPage'

const catalog = new PSTCatalogPage()
const comparison = new PSTComparisonPage()

const compareHammers = () => {
    catalog.visit()
    catalog.verifyInitialCatalog()
    comparison.toggleCompare('Hammer')
    comparison.verifyBarCount(1)
    comparison.toggleCompare('Claw Hammer')
    comparison.verifyBarCount(2)
    comparison.compareNow()
    comparison.verifyComparedProducts(['Hammer', 'Claw Hammer'])
}

describe('Catalogo: comparador de productos [SCRUM-438]', () => {

    it('[CA-01][TC-01.1][SCRUM-440] Debe comparar dos productos lado a lado', () => {
        compareHammers()

        comparison.verifyTitle()
        comparison.verifyPricesAndBrands(['$12.58', '$11.48'], ['ForgeFlex Tools', 'MightyCraft Hardware'])
    })

    it('[CA-01][TC-01.2][SCRUM-441] Volver a presionar Compare debe quitar el producto de la seleccion', () => {
        catalog.visit()
        catalog.verifyInitialCatalog()
        comparison.toggleCompare('Hammer')
        comparison.verifyBarCount(1)
        comparison.toggleCompare('Claw Hammer')
        comparison.verifyBarCount(2)

        comparison.toggleCompare('Claw Hammer')

        comparison.verifyBarCount(1)
    })

    it('[CA-01][TC-01.3][SCRUM-442] No debe agregar un quinto producto a la comparacion', () => {
        catalog.visit()
        catalog.verifyInitialCatalog()
        ;['Combination Pliers', 'Pliers', 'Bolt Cutters', 'Long Nose Pliers'].forEach(name => comparison.toggleCompare(name))
        comparison.verifyBarCount(4)

        comparison.toggleCompare('Slip Joint Pliers')

        comparison.verifyBarCount(4)
    })

    it('[CA-02][TC-02.1][SCRUM-443] Debe mostrar solo las especificaciones que difieren', () => {
        compareHammers()
        comparison.verifySpecRowShown('Material')

        comparison.toggleShowDifferences()

        comparison.verifySpecRowHidden('Material')
        comparison.verifySpecRowShown('Handle Material')
        comparison.verifySpecRowShown('Head Weight')
    })

    it('[CA-02][TC-02.2][SCRUM-444] Desmarcar la opcion debe volver a mostrar todas las especificaciones', () => {
        compareHammers()
        comparison.toggleShowDifferences()
        comparison.verifySpecRowHidden('Material')

        comparison.toggleShowDifferences()

        comparison.verifySpecRowShown('Material')
        comparison.verifySpecRowShown('Handle Material')
    })

    it('[CA-03][TC-03.1][SCRUM-445] Debe quitar un producto desde la comparacion', () => {
        compareHammers()

        comparison.removeProduct('Claw Hammer')

        comparison.verifyComparedProducts(['Hammer'])
    })

    it('[CA-03][TC-03.2][SCRUM-446] Clear All debe vaciar la comparacion', () => {
        compareHammers()

        comparison.clearAll()

        comparison.verifyEmpty()
    })

    it('[CA-03][TC-03.3][SCRUM-447] Abrir la comparacion sin productos debe mostrar el mensaje de vacio', () => {
        comparison.visit()
        comparison.verifyTitle()
        comparison.verifyEmpty()

        comparison.clickBrowseProducts()

        catalog.verifyProductCount(9)
    })
})
