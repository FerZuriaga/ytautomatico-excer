import AutomationTestStoreProductPage from '../../pages/automation-test-store/AutomationTestStoreProductPage'

const productPage = new AutomationTestStoreProductPage()
const PRODUCT_ID = 50 // Skinsheen Bronzer Stick, sin oferta activa

describe('Automation Test Store - Ver el detalle de un producto', () => {
    beforeEach(() => {
        productPage.visit(PRODUCT_ID)
    })

    it('[CA-01][TC-01.1][SCRUM-230] la pestaña Description muestra nombre, precio y descripción del producto', () => {
        productPage.productName.should('contain.text', 'Skinsheen Bronzer Stick')
        productPage.unitPrice.should('contain.text', '$29.50')

        productPage.descriptionInfo.should('contain.text', 'Model:').and('contain.text', '558003')
        productPage.descriptionInfo.should('contain.text', 'Manufacturer:')
    })

    it('[CA-01][TC-01.2][SCRUM-231] la pestaña Reviews muestra el estado sin reseñas cuando el producto no tiene reseñas aprobadas', () => {
        productPage.openTab('reviews')
        productPage.reviewForm.should('be.visible')

        productPage.fetchNoReviewsText(PRODUCT_ID).should('include', 'There are no reviews for this product.')
    })

    it('[CA-01][TC-01.3][SCRUM-232] la pestaña Tags muestra las etiquetas asociadas al producto', () => {
        productPage.openTab('tags')

        productPage.tagsList.should('have.length', 2)
        productPage.tagsList.eq(0).should('contain.text', 'cheeks')
        productPage.tagsList.eq(1).should('contain.text', 'makeup')
    })

    it('[CA-02][TC-02.1][SCRUM-233] la cantidad por defecto (1) muestra el precio total igual al precio unitario', () => {
        productPage.quantityInput.should('have.value', '1')
        productPage.totalPrice.should('contain.text', '$29.50')
    })

    it('[CA-02][TC-02.2][SCRUM-234] cambiar la cantidad recalcula el precio total como unitario por cantidad', () => {
        productPage.setQuantity(3)
        productPage.totalPrice.should('contain.text', '$88.50')
    })
})
