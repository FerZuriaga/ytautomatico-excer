// Modulo: Practice - Descarga de archivos
// Sitio bajo prueba: https://commitquality.com/practice-file-download
// Ticket Jira: SCRUM-374 (CA-01/CA-02, Test Cycle SCRUM-375)
//
// "Download File" genera en el navegador un Blob text/plain y descarga
// dummy_file.txt sin navegar. La carpeta de descargas se vacia antes de
// cada test (task clearDownloads en cypress.config.js) para que ningun
// test lea el archivo que dejo otro.

import CommitQualityFileDownloadPage from '../../pages/commitquality/CommitQualityFileDownloadPage'

const downloadPage = new CommitQualityFileDownloadPage()

describe('Practice: descarga de archivos [SCRUM-374]', () => {

    beforeEach(() => {
        cy.task('clearDownloads')
        downloadPage.visit()
        downloadPage.verifyLoaded()
        downloadPage.verifyNotDownloadedYet()
    })

    it('[CA-01][TC-01.1][SCRUM-376] Debe descargar un archivo llamado dummy_file.txt', () => {
        downloadPage.clickDownload()

        downloadPage.verifyFileDownloaded()
    })

    it('[CA-01][TC-01.2][SCRUM-377] El archivo descargado debe tener el contenido exacto', () => {
        downloadPage.clickDownload()

        downloadPage.verifyDownloadedContent()
    })

    it('[CA-02][TC-02.1][SCRUM-378] La descarga no debe cambiar de pantalla', () => {
        downloadPage.clickDownload()
        downloadPage.verifyFileDownloaded()

        downloadPage.verifyLoaded()
    })

    it('[CA-02][TC-02.2][SCRUM-379] Debe poder volver a Practice despues de descargar', () => {
        downloadPage.clickDownload()
        downloadPage.verifyFileDownloaded()

        downloadPage.clickBackToPractice()

        downloadPage.verifyOnPracticePage()
    })
})
