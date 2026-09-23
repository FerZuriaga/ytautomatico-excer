const FIXTURE = 'selectors/commitquality/practice-file-upload.json'

class CommitQualityFileUploadPage {

    // ─── Navegación ───────────────────────────────────────────────────────────

    visit() {
        cy.gotoCQUrl('/practice-file-upload')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // El archivo se arma en memoria (sin fixtures binarios en el repo).
    selectFile({ fileName, contents, mimeType }) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.fileInput).selectFile({ contents: Cypress.Buffer.from(contents), fileName, mimeType })
        })
    }

    clickSubmit() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.submitButton).click())
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    verifyFormInitial() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.fileInputLabel).should('be.visible').and('contain.text', 'Choose a file:')
            cy.get(sel.fileInput).should('have.value', '')
            cy.get(sel.submitButton).should('be.visible')
            cy.get(sel.errorMessage).should('not.exist')
        })
    }

    verifySelectedFile(fileName) {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.fileInput).its('0.files').should('have.length', 1)
            cy.get(sel.fileInput).its('0.files.0.name').should('eq', fileName)
        })
    }

    verifyInputEmpty() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.fileInput).should('have.value', '')
            cy.get(sel.fileInput).its('0.files').should('have.length', 0)
        })
    }

    verifyMissingFileError() {
        cy.fixture(FIXTURE).then(sel => {
            cy.get(sel.errorMessage).should('be.visible').and('have.text', sel.messages.missingFile)
        })
    }

    verifyNoError() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.errorMessage).should('not.exist'))
    }
}

export default CommitQualityFileUploadPage
