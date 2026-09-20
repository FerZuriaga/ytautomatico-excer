import AutomationTestStoreHeaderPage from '../../pages/automation-test-store/AutomationTestStoreHeaderPage'
import AutomationTestStoreProductPage from '../../pages/automation-test-store/AutomationTestStoreProductPage'
import AutomationTestStoreSpecialsPage from '../../pages/automation-test-store/AutomationTestStoreSpecialsPage'

const headerPage = new AutomationTestStoreHeaderPage()
const productPage = new AutomationTestStoreProductPage()
const specialsPage = new AutomationTestStoreSpecialsPage()
const PRODUCT_ID = 50 // Skinsheen Bronzer Stick

describe('Automation Test Store - Cambiar de moneda en el header', () => {
    beforeEach(() => {
        productPage.visit(PRODUCT_ID)
        headerPage.selectCurrency('USD') // estado inicial conocido, la cookie de moneda persiste entre corridas
        productPage.visit(PRODUCT_ID)
    })

    it('[CA-01][TC-01.1][SCRUM-249] cambiar la moneda a Euro convierte el precio con el símbolo EUR como sufijo', () => {
        productPage.unitPrice.should('contain.text', '$29.50')

        headerPage.selectCurrency('EUR')
        productPage.visit(PRODUCT_ID)

        headerPage.currencyLabel.should('contain.text', 'Euro')
        productPage.unitPrice.should('contain.text', '27.69€')
    })

    it('[CA-01][TC-01.2][SCRUM-250] cambiar la moneda a Libra esterlina convierte el precio con el símbolo GBP como prefijo', () => {
        productPage.unitPrice.should('contain.text', '$29.50')

        headerPage.selectCurrency('GBP')
        productPage.visit(PRODUCT_ID)

        headerPage.currencyLabel.should('contain.text', 'Pound Sterling')
        productPage.unitPrice.should('contain.text', '£23.40')
    })

    it('[CA-02][TC-02.1][SCRUM-251] la moneda seleccionada persiste al navegar a otra página del sitio', () => {
        headerPage.selectCurrency('EUR')
        productPage.visit(PRODUCT_ID)
        headerPage.currencyLabel.should('contain.text', 'Euro')

        specialsPage.visit()

        headerPage.currencyLabel.should('contain.text', 'Euro')
        specialsPage.newPrices.first().invoke('text').should('include', '€')
    })

    it('[CA-02][TC-02.2][SCRUM-252] volver a seleccionar Dólar revierte los precios al formato original', () => {
        headerPage.selectCurrency('GBP')
        productPage.visit(PRODUCT_ID)
        productPage.unitPrice.should('contain.text', '£23.40')

        headerPage.selectCurrency('USD')
        productPage.visit(PRODUCT_ID)

        headerPage.currencyLabel.should('contain.text', 'US Dollar')
        productPage.unitPrice.should('contain.text', '$29.50')
    })
})
