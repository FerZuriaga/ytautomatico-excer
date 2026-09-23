const FIXTURE = 'selectors/commitquality/practice-file-download.json'
const DOWNLOAD_TIMEOUT = 15000

class CommitQualityFileDownloadPage {

    // ─── Navegación ───────────────────────────────────────────────────────────

    visit() {
        cy.gotoCQUrl('/practice-file-download')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // El boton no tiene data-testid: se ubica por su texto visible.
    clickDownload() {
        cy.fixture(FIXTURE).then(sel => cy.contains('button', sel.downloadButtonText).click())
    }

    clickBackToPractice() {
        cy.fixture(FIXTURE).then(sel => cy.get(sel.backLink).click())
    }

    // ─── Verificaciones ───────────────────────────────────────────────────────

    downloadedFilePath(sel) {
        return `${Cypress.config('downloadsFolder')}/${sel.fileName}`
    }

    verifyLoaded() {
        cy.fixture(FIXTURE).then(sel => {
            cy.url().should('eq', `${Cypress.env('commitqualityUrl')}/practice-file-download`)
            cy.contains('button', sel.downloadButtonText).should('be.visible')
            cy.get(sel.backLink).should('be.visible')
        })
    }

    // Requiere cy.task('clearDownloads') en el beforeEach: sin eso el
    // archivo podria venir de un test anterior.
    verifyNotDownloadedYet() {
        cy.fixture(FIXTURE).then(sel => cy.readFile(this.downloadedFilePath(sel)).should('not.exist'))
    }

    verifyFileDownloaded() {
        cy.fixture(FIXTURE).then(sel => {
            cy.readFile(this.downloadedFilePath(sel), { timeout: DOWNLOAD_TIMEOUT }).should('exist')
        })
    }

    verifyDownloadedContent() {
        cy.fixture(FIXTURE).then(sel => {
            cy.readFile(this.downloadedFilePath(sel), { timeout: DOWNLOAD_TIMEOUT }).should('eq', sel.fileContent)
        })
    }

    verifyOnPracticePage() {
        cy.url().should('eq', `${Cypress.env('commitqualityUrl')}/practice`)
    }
}

export default CommitQualityFileDownloadPage
