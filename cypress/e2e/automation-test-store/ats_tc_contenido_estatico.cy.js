import AutomationTestStoreContentPage from '../../pages/automation-test-store/AutomationTestStoreContentPage'

const contentPage = new AutomationTestStoreContentPage()

describe('Automation Test Store - Ver páginas de contenido estático', () => {
    it('[CA-01][TC-01.1][SCRUM-263] navegar a About Us y Privacy Policy desde el footer muestra el título correcto de cada página', () => {
        contentPage.visitContent(1)
        contentPage.pageTitle.should('contain.text', 'About Us')

        contentPage.visitContent(2)
        contentPage.pageTitle.should('contain.text', 'Privacy Policy')
    })

    it('[CA-01][TC-01.2][SCRUM-264] navegar a Return Policy y Shipping desde el footer muestra el título correcto de cada página', () => {
        contentPage.visitContent(3)
        contentPage.pageTitle.should('contain.text', 'Return Policy')

        contentPage.visitContent(4)
        contentPage.pageTitle.should('contain.text', 'Shipping')
    })

    it('[CA-02][TC-02.1][SCRUM-265] enviar el formulario de Contacto vacío muestra los 3 errores de campo obligatorio', () => {
        contentPage.visitContact()
        contentPage.submitContactForm()

        contentPage.fieldErrors.should('contain.text', 'First name: is required field!')
        contentPage.fieldErrors.should('contain.text', 'Email: is required field!')
        contentPage.fieldErrors.should('contain.text', 'Enquiry: is required field!')
    })

    it('[CA-02][TC-02.2][SCRUM-266] enviar con un Enquiry de 2 caracteres muestra el error de longitud mínima', () => {
        contentPage.visitContact()
        contentPage.fillContactForm({ firstName: 'Fede', email: 'qatester_enquiry2@example.com', enquiry: 'xx' })
        contentPage.submitContactForm()

        contentPage.fieldErrors.should('contain.text', 'Enquiry must be between 10 and 3000 characters!')
    })

    it('[CA-03][TC-03.1][SCRUM-267] enviar el formulario de Contacto con datos válidos muestra el mensaje de confirmación', () => {
        contentPage.visitContact()
        contentPage.fillContactForm({
            firstName: 'Fede Tester',
            email: `qatester_contacto_${Date.now()}@example.com`,
            enquiry: 'This is a real test enquiry message for QA automation purposes'
        })
        contentPage.submitContactForm()

        contentPage.successMessage.should('be.visible')
    })

    it('[CA-03][TC-03.2][SCRUM-268] enviar el formulario de Contacto con un Enquiry de exactamente 3 caracteres es aceptado', () => {
        contentPage.visitContact()
        contentPage.fillContactForm({
            firstName: 'Fede',
            email: `qatester_enquiry3_${Date.now()}@example.com`,
            enquiry: 'xyz'
        })
        contentPage.submitContactForm()

        contentPage.successMessage.should('be.visible')
    })
})
