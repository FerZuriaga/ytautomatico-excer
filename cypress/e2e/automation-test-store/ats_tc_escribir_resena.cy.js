import AutomationTestStoreProductPage from '../../pages/automation-test-store/AutomationTestStoreProductPage'

const productPage = new AutomationTestStoreProductPage()
const PRODUCT_ID = 50 // Skinsheen Bronzer Stick
const HUMAN_VERIFICATION_ERROR = 'Human verification has failed! Please try again.'

// Alcance de esta HU (limitacion real, verificada con curl contra el sitio
// real): el captcha es una imagen con texto aleatorio distinto por sesion,
// y el servidor rechaza CUALQUIER envio con "Human verification has failed!"
// mientras el captcha sea incorrecto, sin evaluar rating/nombre/texto. Por
// eso esta suite cubre la estructura del formulario y el bloqueo por
// captcha invalido/vacio, no el envio exitoso ni los mensajes de validacion
// de campo (inalcanzables sin resolver el captcha real en tiempo de
// ejecucion) -- ver cypress/fixtures/selectors/escribir-resena.json.
describe('Automation Test Store - Escribir una reseña de producto [SCRUM-235]', () => {
    beforeEach(() => {
        productPage.visit(PRODUCT_ID)
        productPage.openTab('reviews')
    })

    it('[CA-01][TC-01.1][SCRUM-237] el formulario de reseña muestra sus campos en la pestaña Reviews', () => {
        productPage.reviewForm.should('be.visible')
        productPage.reviewNameInput.should('be.visible')
        productPage.reviewTextArea.should('be.visible')
        productPage.captchaImage.should('be.visible')
        productPage.captchaInput.should('be.visible')
        productPage.reviewSubmitButton.should('be.visible')
    })

    it('[CA-01][TC-01.2][SCRUM-238] el campo Rating ofrece 5 opciones seleccionables', () => {
        productPage.ratingRadio.should('have.length', 5)
        productPage.ratingRadio.each(($radio, index) => {
            cy.wrap($radio).should('have.value', String(index + 1))
        })
    })

    it('[CA-02][TC-02.1][SCRUM-239] captcha vacío bloquea el envío con el error de verificación humana', () => {
        productPage.fillReviewForm({
            rating: 5,
            name: 'Fede Tester',
            text: 'This product exceeded my expectations completely',
            captcha: ''
        })
        productPage.submitReview()

        productPage.reviewErrorAlert.should('contain.text', HUMAN_VERIFICATION_ERROR)
    })

    it('[CA-02][TC-02.2][SCRUM-240] captcha incorrecto bloquea el envío con el mismo error aunque el resto de los campos sea válido', () => {
        productPage.fillReviewForm({
            rating: 5,
            name: 'Fede Tester',
            text: 'This product exceeded my expectations completely',
            captcha: 'XXXXXX'
        })
        productPage.submitReview()

        productPage.reviewErrorAlert.should('contain.text', HUMAN_VERIFICATION_ERROR)
    })
})
