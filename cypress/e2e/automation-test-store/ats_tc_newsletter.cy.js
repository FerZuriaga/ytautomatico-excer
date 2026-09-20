import AutomationTestStoreNewsletterPage from '../../pages/automation-test-store/AutomationTestStoreNewsletterPage'

const newsletterPage = new AutomationTestStoreNewsletterPage()
const HUMAN_VERIFICATION_ERROR = 'Human verification has failed! Please try agan.'

// Alcance de esta HU (limitacion real, verificada con curl): el envio
// final exige un captcha de imagen con texto aleatorio por sesion, que
// bloquea con "Human verification has failed!" sin importar los demas
// campos. A diferencia del formulario de resena, este SI valida
// First Name/Last Name/Email de forma independiente al captcha, por eso
// esos casos SI se cubren -- ver cypress/fixtures/selectors/newsletter.json.
describe('Automation Test Store - Suscribirse al Newsletter', () => {
    it('[CA-01][TC-01.1][SCRUM-255] completar el email en el formulario rápido del footer navega al formulario completo con el email pre-cargado', () => {
        cy.gotoATSUrl('/')
        newsletterPage.subscribeFromFooter('qatester_lote@example.com')

        newsletterPage.firstNameInput.should('be.visible')
        newsletterPage.emailInput.should('have.value', 'qatester_lote@example.com')
    })

    it('[CA-01][TC-01.2][SCRUM-256] el formulario completo muestra First Name, Last Name, Email y el código de verificación', () => {
        newsletterPage.visitFullForm()

        newsletterPage.firstNameInput.should('be.visible')
        newsletterPage.lastNameInput.should('be.visible')
        newsletterPage.emailInput.should('be.visible')
        newsletterPage.captchaInput.should('be.visible')
        newsletterPage.captchaImage.should('be.visible')
        newsletterPage.continueButton.should('be.visible')
    })

    it('[CA-02][TC-02.1][SCRUM-257] enviar el formulario completo vacío muestra los 3 errores de campo obligatorio simultáneamente', () => {
        newsletterPage.visitFullForm()
        newsletterPage.submitFullForm()

        newsletterPage.helpBlocks.should('contain.text', 'First Name must be between 1 and 32 characters!')
        newsletterPage.helpBlocks.should('contain.text', 'Last Name must be between 1 and 32 characters!')
        newsletterPage.helpBlocks.should('contain.text', 'Email Address does not appear to be valid!')
    })

    it('[CA-02][TC-02.2][SCRUM-258] enviar con un email de formato inválido muestra el error de formato de email', () => {
        newsletterPage.visitFullForm()
        newsletterPage.fillFullForm({ firstName: 'Fede', lastName: 'Tester', email: 'notanemail' })
        newsletterPage.submitFullForm()

        newsletterPage.helpBlocks.should('contain.text', 'Email Address does not appear to be valid!')
    })

    it('[CA-03][TC-03.1][SCRUM-259] captcha vacío bloquea el envío con el error de verificación humana aunque el resto sea válido', () => {
        newsletterPage.visitFullForm()
        newsletterPage.fillFullForm({
            firstName: 'Fede',
            lastName: 'Tester',
            email: 'qatester_valido@example.com',
            captcha: ''
        })
        newsletterPage.submitFullForm()

        newsletterPage.helpBlocks.should('contain.text', HUMAN_VERIFICATION_ERROR)
    })

    it('[CA-03][TC-03.2][SCRUM-260] captcha incorrecto bloquea el envío con el mismo error aunque el resto sea válido', () => {
        newsletterPage.visitFullForm()
        newsletterPage.fillFullForm({
            firstName: 'Fede',
            lastName: 'Tester',
            email: 'qatester_valido2@example.com',
            captcha: 'XXXXXX'
        })
        newsletterPage.submitFullForm()

        newsletterPage.helpBlocks.should('contain.text', HUMAN_VERIFICATION_ERROR)
    })
})
