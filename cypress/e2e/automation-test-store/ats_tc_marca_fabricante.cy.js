import AutomationTestStoreHomePage from '../../pages/automation-test-store/AutomationTestStoreHomePage'
import AutomationTestStoreProductPage from '../../pages/automation-test-store/AutomationTestStoreProductPage'
import AutomationTestStoreCategoryPage from '../../pages/automation-test-store/AutomationTestStoreCategoryPage'

const homePage = new AutomationTestStoreHomePage()
const productPage = new AutomationTestStoreProductPage()
const manufacturerPage = new AutomationTestStoreCategoryPage()

const MAC_PRODUCT_ID = 50

describe('Automation Test Store - Ver productos de una marca/fabricante', () => {

    it('[CA-01][TC-01.1][SCRUM-277] ver los productos de una marca desde el carrusel del home', () => {
        homePage.visit()
        homePage.brandCarousel.should('be.visible')

        homePage.clickBrand('M·A·C')

        manufacturerPage.heading.should('contain.text', 'M·A·C')
        manufacturerPage.productNames.should('have.length.greaterThan', 0)
    })

    it('[CA-01][TC-01.2][SCRUM-278] ver los productos de una marca desde el link del detalle de un producto', () => {
        productPage.visit(MAC_PRODUCT_ID)
        productPage.manufacturerLink.should('be.visible')

        productPage.clickManufacturerLink()

        manufacturerPage.heading.should('contain.text', 'M·A·C')
        manufacturerPage.productNames.should('have.length.greaterThan', 0)
    })

    it('[CA-02][TC-02.1][SCRUM-279] acceder a un manufacturer_id fuera de rango muestra "Manufacturer not found!"', () => {
        manufacturerPage.visitManufacturer(1)

        manufacturerPage.heading.should('contain.text', 'Manufacturer not found!')
        manufacturerPage.productNames.should('not.exist')
    })

    it('[CA-02][TC-02.2][SCRUM-280] acceder a un manufacturer_id no numerico muestra el mismo mensaje', () => {
        manufacturerPage.visitManufacturer('abc')

        manufacturerPage.heading.should('contain.text', 'Manufacturer not found!')
        manufacturerPage.productNames.should('not.exist')
    })
})
