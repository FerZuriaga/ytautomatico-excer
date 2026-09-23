// Modulo: Mi cuenta
// Sitio bajo prueba: https://commitquality.com
// Ticket Jira: SCRUM-338 (CA-01/CA-02/CA-03/CA-04, Test Cycle SCRUM-339)
//
// Datos por defecto "Commit Quality" / "CommitQuality". "Update Details"
// arranca colapsada (toggle "+"/"-"). Save dispara un alert() nativo y
// actualiza "My Details". Sin backend: los datos guardados son estado
// local del componente, se pierden al salir de /account o recargar.
// Hallazgo (NO automatizado como esperado): /account no valida sesion,
// solo se oculta el link del menu -- ver docs/discovery/commitquality.md.

import CommitQualityLoginPage from '../../pages/commitquality/CommitQualityLoginPage'
import CommitQualityProductListPage from '../../pages/commitquality/CommitQualityProductListPage'
import CommitQualityAccountPage from '../../pages/commitquality/CommitQualityAccountPage'

const loginPage = new CommitQualityLoginPage()
const listPage = new CommitQualityProductListPage()
const accountPage = new CommitQualityAccountPage()

const DEFAULTS = { name: 'Commit Quality', youtube: 'CommitQuality' }
const NEW_DETAILS = { name: 'Fer QA', youtube: 'FerQAChannel' }

const loginAndOpenAccount = () => {
    loginPage.visit()
    loginPage.login('test', 'test')
    loginPage.verifyLoggedIn()
    accountPage.openFromNavbar()
    accountPage.verifyOnAccountPage()
}

const saveNewDetails = () => {
    accountPage.clickToggleDetails()
    accountPage.fillDetails(NEW_DETAILS)
    accountPage.clickSave()
    accountPage.verifySavedDetails(NEW_DETAILS)
}

describe('Mi cuenta [SCRUM-338]', () => {

    it('[CA-01][TC-01.1][SCRUM-340] Debe acceder a Mi cuenta desde el menu con los datos por defecto', () => {
        loginPage.visit()
        loginPage.login('test', 'test')
        loginPage.verifyLoggedIn()

        accountPage.openFromNavbar()

        accountPage.verifyOnAccountPage()
        accountPage.verifyDefaultDetails()
    })

    it('[CA-01][TC-01.2][SCRUM-341] No debe mostrar el link My Account sin sesion iniciada', () => {
        listPage.visit()

        accountPage.verifyNavbarAccountLinkHidden()
    })

    it('[CA-02][TC-02.1][SCRUM-342] Debe expandir Update Details precargando los datos actuales', () => {
        loginAndOpenAccount()
        accountPage.verifyDetailsCollapsed()

        accountPage.clickToggleDetails()

        accountPage.verifyDetailsExpanded(DEFAULTS)
    })

    it('[CA-02][TC-02.2][SCRUM-343] Debe volver a colapsar Update Details', () => {
        loginAndOpenAccount()
        accountPage.clickToggleDetails()
        accountPage.verifyDetailsExpanded(DEFAULTS)

        accountPage.clickToggleDetails()

        accountPage.verifyDetailsCollapsed()
    })

    it('[CA-03][TC-03.1][SCRUM-344] Debe guardar los nuevos datos con aviso y actualizar My Details', () => {
        const alertStub = cy.stub()
        cy.on('window:alert', alertStub)
        loginAndOpenAccount()
        accountPage.clickToggleDetails()
        accountPage.verifyDetailsExpanded(DEFAULTS)

        accountPage.fillDetails(NEW_DETAILS)
        accountPage.clickSave()

        cy.then(() => {
            expect(alertStub).to.have.been.calledOnceWith(`Name: ${NEW_DETAILS.name}\nYoutube: ${NEW_DETAILS.youtube}`)
        })
        accountPage.verifySavedDetails(NEW_DETAILS)
    })

    it('[CA-03][TC-03.2][SCRUM-345] No debe actualizar My Details si no se presiona Save', () => {
        loginAndOpenAccount()
        accountPage.clickToggleDetails()
        accountPage.verifyDetailsExpanded(DEFAULTS)

        accountPage.fillDetails(NEW_DETAILS)

        accountPage.verifySavedDetails(DEFAULTS)
    })

    it('[CA-04][TC-04.1][SCRUM-346] Debe volver a los datos por defecto al salir y volver a la pantalla', () => {
        loginAndOpenAccount()
        saveNewDetails()

        listPage.goToProductsFromNavbar()
        listPage.verifyRowCount(10)
        accountPage.openFromNavbar()

        accountPage.verifyOnAccountPage()
        accountPage.verifySavedDetails(DEFAULTS)
    })

    it('[CA-04][TC-04.2][SCRUM-347] Debe volver a los datos por defecto al recargar la pagina', () => {
        loginAndOpenAccount()
        saveNewDetails()

        cy.reload()

        accountPage.verifyOnAccountPage()
        accountPage.verifySavedDetails(DEFAULTS)
    })
})
