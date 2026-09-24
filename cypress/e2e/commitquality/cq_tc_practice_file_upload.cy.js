// Modulo: Practice - Subida de archivos
// Sitio bajo prueba: https://commitquality.com/practice-file-upload
// Ticket Jira: SCRUM-366 (CA-01/CA-02, Test Cycle SCRUM-367)
//
// Con archivo: alert("File successfully uploaded!") + selector vacio. Sin
// archivo: error "Please select a file to upload.", que recien desaparece
// en el siguiente submit exitoso. No restringe tipo de archivo. Los
// archivos se arman en memoria (Cypress.Buffer), sin fixtures binarios.

import CommitQualityFileUploadPage from '../../pages/commitquality/CommitQualityFileUploadPage'

const uploadPage = new CommitQualityFileUploadPage()

const SUCCESS_ALERT = 'File successfully uploaded!'
const TXT_FILE = { fileName: 'archivo-prueba.txt', contents: 'Archivo de prueba QA', mimeType: 'text/plain' }
const JSON_FILE = { fileName: 'datos-prueba.json', contents: '{"qa": true}', mimeType: 'application/json' }

describe('Practice: subida de archivos [SCRUM-366]', () => {

    let alertStub

    beforeEach(() => {
        alertStub = cy.stub()
        cy.on('window:alert', alertStub)
        uploadPage.visit()
        uploadPage.verifyFormInitial()
    })

    it('[CA-01][TC-01.1][SCRUM-368] Debe subir un archivo de texto y dejar el selector vacio', () => {
        uploadPage.selectFile(TXT_FILE)
        uploadPage.verifySelectedFile(TXT_FILE.fileName)

        uploadPage.clickSubmit()

        cy.then(() => expect(alertStub).to.have.been.calledOnceWith(SUCCESS_ALERT))
        uploadPage.verifyInputEmpty()
    })

    it('[CA-01][TC-01.2][SCRUM-369] Debe aceptar un archivo que no es de texto', () => {
        uploadPage.selectFile(JSON_FILE)
        uploadPage.verifySelectedFile(JSON_FILE.fileName)

        uploadPage.clickSubmit()

        cy.then(() => expect(alertStub).to.have.been.calledOnceWith(SUCCESS_ALERT))
        uploadPage.verifyInputEmpty()
    })

    it('[CA-01][TC-01.3][SCRUM-370] Debe permitir dos subidas consecutivas', () => {
        uploadPage.selectFile(TXT_FILE)
        uploadPage.clickSubmit()
        cy.then(() => expect(alertStub).to.have.been.calledOnceWith(SUCCESS_ALERT))
        uploadPage.verifyInputEmpty()

        uploadPage.selectFile(JSON_FILE)
        uploadPage.clickSubmit()

        cy.then(() => expect(alertStub).to.have.been.calledTwice)
    })

    it('[CA-02][TC-02.1][SCRUM-371] Debe exigir un archivo al presionar Submit con el selector vacio', () => {
        uploadPage.clickSubmit()

        uploadPage.verifyMissingFileError()
        cy.then(() => expect(alertStub).not.to.have.been.called)
    })

    it('[CA-02][TC-02.2][SCRUM-372] Debe volver a exigir un archivo despues de una subida exitosa', () => {
        uploadPage.selectFile(TXT_FILE)
        uploadPage.clickSubmit()
        cy.then(() => expect(alertStub).to.have.been.calledOnceWith(SUCCESS_ALERT))
        uploadPage.verifyInputEmpty()

        uploadPage.clickSubmit()

        uploadPage.verifyMissingFileError()
        cy.then(() => expect(alertStub).to.have.been.calledOnce)
    })

    it('[CA-02][TC-02.3][SCRUM-373] El error debe desaparecer con la siguiente subida exitosa', () => {
        uploadPage.clickSubmit()
        uploadPage.verifyMissingFileError()

        uploadPage.selectFile(TXT_FILE)
        uploadPage.clickSubmit()

        cy.then(() => expect(alertStub).to.have.been.calledOnceWith(SUCCESS_ALERT))
        uploadPage.verifyNoError()
    })
})
