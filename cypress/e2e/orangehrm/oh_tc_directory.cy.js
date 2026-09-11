import OrangeHRMDirectoryPage from '../../pages/orangehrm/OrangeHRMDirectoryPage'

const directoryPage = new OrangeHRMDirectoryPage()

describe('[SCRUM-108] Directory - Busqueda de empleados', () => {

    beforeEach(() => {
        cy.loginAsOHAdmin()
        directoryPage.navigateToDirectory()
    })

    it('[CA-01][TC-01.1][SCRUM-111] Debe encontrar a un empleado buscando su nombre completo', () => {
        directoryPage.getRealEmployeeName().then((fullName) => {
            directoryPage.searchByEmployeeName(fullName)
            directoryPage.verifyEmployeeVisible(fullName)
        })
    })

    it('[CA-01][TC-01.2][SCRUM-112] Debe encontrar coincidencias buscando un nombre parcial', () => {
        directoryPage.getRealEmployeeName().then((fullName) => {
            const partialName = fullName.split(' ')[0]
            directoryPage.searchByEmployeeName(partialName)
            directoryPage.verifyEmployeeVisible(fullName)
        })
    })

    it('[CA-02][TC-02.1][SCRUM-109] Debe mostrar mensaje de sin resultados para un nombre inexistente', () => {
        directoryPage.searchByEmployeeName('ZzNoExisteQaAuto123')
        directoryPage.verifyNoRecordsFound()
    })

    it('[CA-02][TC-02.2][SCRUM-115] Reiniciar filtros debe volver a mostrar el listado completo', () => {
        directoryPage.searchByEmployeeName('ZzNoExisteQaAuto123')
        directoryPage.verifyNoRecordsFound()

        directoryPage.reset()
        directoryPage.verifyResultsListVisible()
    })

    it('[CA-03][TC-03.1][SCRUM-113] Debe mostrar resultados al filtrar por Job Title', () => {
        directoryPage.selectFirstJobTitle().then(() => {
            directoryPage.search()
            directoryPage.verifyResultsListVisible()
        })
    })

    it('[CA-03][TC-03.2][SCRUM-110] Combinar Employee Name y Job Title filtra por ambos criterios', () => {
        directoryPage.getEmployeeWithJobTitle().then(({ name, jobTitle }) => {
            directoryPage.employeeNameInput.should('be.visible').clear().type(name).type('{esc}')
            directoryPage.selectJobTitle(jobTitle)
            directoryPage.search()
            directoryPage.verifyEmployeeVisible(name)
        })
    })
})
