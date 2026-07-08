// Page Object Model - OrangeHRMPimPage
// Encapsula selectores y acciones del modulo PIM de OrangeHRM,
// especificamente la seccion "Employee List" (busqueda de empleados por nombre)
//
// Mapeo de columnas de la tabla de resultados (confirmado inspeccionando el DOM real):
// [0] checkbox, [1] Id, [2] First (& Middle) Name, [3] Last Name,
// [4] Job Title, [5] Employment Status, [6] Sub Unit, [7] Supervisor, [8] Actions

class OrangeHRMPimPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get pimMenuLink() {
        return cy.get('.oxd-main-menu-item--name').contains('PIM')
    }

    get employeeNameInput() {
        return cy.contains('label', 'Employee Name')
            .parents('.oxd-input-group')
            .find('input')
    }

    get autocompleteOption() {
        return cy.get('.oxd-autocomplete-option')
    }

    get searchButton() {
        return cy.get('button[type="submit"]').contains('Search')
    }

    get resultsTable() {
        return cy.get('.oxd-table')
    }

    get resultsRows() {
        return cy.get('.oxd-table-body .oxd-table-row')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // Navega al modulo PIM desde el menu principal
    navigateToPim() {
        this.pimMenuLink.should('be.visible').click()
    }

    // Verifica que la pagina de Employee List (dentro de PIM) esta visible
    verifyEmployeeListVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/pim/viewEmployeeList')
        this.employeeNameInput.should('be.visible')
        this.resultsTable.should('be.visible')
    }

    // Escribe el nombre del empleado en el campo de busqueda y ejecuta la busqueda.
    // El campo es un autocomplete: si aparece una sugerencia coincidente se selecciona,
    // de lo contrario se mantiene el texto ingresado y se ejecuta la busqueda igualmente.
    // Se intercepta la peticion de busqueda para esperar a que la tabla se actualice
    // con los resultados antes de continuar con las validaciones.
    searchByEmployeeName(name) {
        cy.intercept('GET', '**/api/v2/pim/employees**').as('searchEmployees')

        this.employeeNameInput.should('be.visible').clear().type(name)

        cy.get('body').then(($body) => {
            if ($body.find('.oxd-autocomplete-option').length > 0) {
                this.autocompleteOption.first().click()
            }
        })

        this.searchButton.click()
        cy.wait('@searchEmployees', { timeout: 30000 })
    }

    // Extrae de una fila (elemento jQuery) los datos basicos del empleado
    _extractRowData($row) {
        const cells = $row.find('.oxd-table-cell')
        const firstMiddleName = cells.eq(2).text().trim()
        const lastName = cells.eq(3).text().trim()
        return {
            id: cells.eq(1).text().trim(),
            fullName: `${firstMiddleName} ${lastName}`.replace(/\s+/g, ' ').trim(),
            jobTitle: cells.eq(4).text().trim(),
            status: cells.eq(5).text().trim()
        }
    }

    // Busca, entre los resultados actualmente visibles, el primer empleado cuya
    // informacion basica (Id, nombre, cargo, estado) este completa. Se utiliza para
    // evitar depender de registros de datos incompletos presentes en el entorno demo
    // publico y compartido de OrangeHRM.
    getFirstEmployeeWithCompleteData() {
        return this.resultsRows.should('have.length.greaterThan', 0).then(($rows) => {
            for (let i = 0; i < $rows.length; i++) {
                const data = this._extractRowData($rows.eq(i))
                if (data.id && data.fullName && data.jobTitle && data.status) {
                    return data
                }
            }
            throw new Error('No se encontro ningun empleado con informacion basica completa (Id, nombre, cargo, estado) entre los resultados visibles.')
        })
    }

    // Verifica que todas las filas de resultados correspondan al nombre buscado
    // (comparando contra la concatenacion de First(&Middle) Name + Last Name)
    verifyResultsMatchName(name) {
        this.resultsRows.should('have.length.greaterThan', 0).each(($row) => {
            const data = this._extractRowData($row)
            expect(data.fullName.toLowerCase()).to.include(name.trim().toLowerCase())
        })
    }

    // Verifica que la fila indicada (por nombre completo) muestre su informacion basica:
    // Id, nombre completo, cargo (Job Title) y estado (Employment Status)
    verifyEmployeeBasicInfoDisplayed(expectedData) {
        this.resultsRows.should('have.length.greaterThan', 0).then(($rows) => {
            const match = Array.from($rows).map((row) => this._extractRowData(Cypress.$(row)))
                .find((data) => data.fullName.toLowerCase() === expectedData.fullName.toLowerCase())

            expect(match, `Empleado "${expectedData.fullName}" encontrado en los resultados`).to.exist
            expect(match.id).to.not.be.empty
            expect(match.fullName).to.not.be.empty
            expect(match.jobTitle).to.not.be.empty
            expect(match.status).to.not.be.empty
        })
    }

    // Verifica que la busqueda por un nombre inexistente no devuelva empleados en la tabla
    verifyNoRecordsFound() {
        cy.contains('No Records Found', { timeout: 30000 }).should('be.visible')
        this.resultsRows.should('have.length', 0)
    }
}

export default OrangeHRMPimPage
