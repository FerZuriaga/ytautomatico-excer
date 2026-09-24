import AutomationTestStoreSiteMapPage from '../../pages/automation-test-store/AutomationTestStoreSiteMapPage'
import AutomationTestStoreCategoryPage from '../../pages/automation-test-store/AutomationTestStoreCategoryPage'
import AutomationTestStoreSpecialsPage from '../../pages/automation-test-store/AutomationTestStoreSpecialsPage'

const siteMapPage = new AutomationTestStoreSiteMapPage()
const categoryPage = new AutomationTestStoreCategoryPage()
const specialsPage = new AutomationTestStoreSpecialsPage()

describe('Automation Test Store - Navegar el Site Map [SCRUM-269]', () => {
    beforeEach(() => {
        siteMapPage.visit()
    })

    it('[CA-01][TC-01.1][SCRUM-271] el Site Map muestra la columna de categorías de productos con sus subcategorías', () => {
        siteMapPage.pageTitle.should('contain.text', 'Site Map')
        siteMapPage.categoriesColumn.should('contain.text', 'Apparel & accessories')
        siteMapPage.categoriesColumn.should('contain.text', 'Makeup')
        ;['Cheeks', 'Eyes', 'Face', 'Lips', 'Nails', 'Value Sets'].forEach(sub => {
            siteMapPage.categoriesColumn.should('contain.text', sub)
        })
    })

    it('[CA-01][TC-01.2][SCRUM-272] el Site Map muestra la columna de accesos generales del sitio', () => {
        siteMapPage.generalColumn.should('contain.text', 'Special Offers')
        siteMapPage.generalColumn.should('contain.text', 'My Account')
        siteMapPage.generalColumn.should('contain.text', 'Shopping Cart')
        siteMapPage.generalColumn.should('contain.text', 'Checkout')
        siteMapPage.generalColumn.should('contain.text', 'Search')
        siteMapPage.generalColumn.should('contain.text', 'Information')
        ;['About Us', 'Privacy Policy', 'Return Policy', 'Shipping', 'Contact Us'].forEach(page => {
            siteMapPage.generalColumn.should('contain.text', page)
        })
    })

    it('[CA-02][TC-02.1][SCRUM-273] hacer click en una categoría de productos navega a la página de esa categoría', () => {
        siteMapPage.makeupCategoryLink.click()

        cy.url().should('include', 'path=36')
        categoryPage.productNames.should('have.length.greaterThan', 0)
    })

    it('[CA-02][TC-02.2][SCRUM-274] hacer click en Special Offers navega a la página de Ofertas especiales', () => {
        siteMapPage.specialOffersLink.click()

        cy.url().should('include', 'rt=product/special')
        specialsPage.pageTitle.should('contain.text', 'Special Offers')
    })
})
