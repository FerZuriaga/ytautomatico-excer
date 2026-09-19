import AutomationTestStoreSpecialsPage from '../../pages/automation-test-store/AutomationTestStoreSpecialsPage'
import AutomationTestStoreProductPage from '../../pages/automation-test-store/AutomationTestStoreProductPage'

const specialsPage = new AutomationTestStoreSpecialsPage()
const productPage = new AutomationTestStoreProductPage()
const PRODUCT_WITH_OFFER = { id: 65, priceOld: '$105.00', priceNew: '$89.00' }
const PRODUCT_WITHOUT_OFFER = { id: 50 }

describe('Automation Test Store - Ver Ofertas especiales del catalogo', () => {
    it('[CA-01][TC-01.1][SCRUM-243] el listado de Ofertas especiales muestra precio original y precio con descuento', () => {
        specialsPage.visit()

        specialsPage.pageTitle.should('contain.text', 'Special Offers')
        specialsPage.thumbnails.should('have.length', 8)
        specialsPage.oldPrices.should('have.length', 8)
        specialsPage.newPrices.should('have.length', 8)
    })

    it('[CA-01][TC-01.2][SCRUM-244] el precio con descuento es menor al precio original en cada producto listado', () => {
        specialsPage.visit()

        specialsPage.oldPrices.then($oldPrices => {
            specialsPage.newPrices.then($newPrices => {
                expect($oldPrices).to.have.length($newPrices.length)
                ;[...$oldPrices].forEach((oldEl, index) => {
                    const oldPrice = specialsPage.parsePrice(oldEl.innerText)
                    const newPrice = specialsPage.parsePrice($newPrices[index].innerText)
                    expect(newPrice).to.be.lessThan(oldPrice)
                })
            })
        })
    })

    it('[CA-02][TC-02.1][SCRUM-245] el detalle de un producto en oferta mantiene el precio original tachado y el precio con descuento', () => {
        specialsPage.goToProduct(PRODUCT_WITH_OFFER.id)

        productPage.unitPrice.should('contain.text', PRODUCT_WITH_OFFER.priceNew)
        productPage.oldPrice.should('contain.text', PRODUCT_WITH_OFFER.priceOld)
    })

    it('[CA-02][TC-02.2][SCRUM-246] el detalle de un producto sin oferta no muestra precio original tachado', () => {
        specialsPage.goToProduct(PRODUCT_WITHOUT_OFFER.id)

        productPage.unitPrice.should('be.visible')
        productPage.oldPrice.should('not.exist')
    })
})
