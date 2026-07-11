// Page Object Model - OrangeHRMAddEmployeePage
// Encapsula selectores y acciones del modulo PIM de OrangeHRM relacionados con:
// - "Add Employee" (formulario de alta de empleado)
// - "Personal Details" (pantalla del empleado recien creado)
// - "Employee List" (listado de empleados, para verificar la visibilidad posterior)

class OrangeHRMAddEmployeePage {

    // ─── Selectores - Navegacion ─────────────────────────────────────────────

    get pimMenuLink() {
        return cy.get('.oxd-main-menu-item--name').contains('PIM')
    }

    get addEmployeeTabLink() {
        return cy.get('.oxd-topbar-body-nav-tab-item, a.oxd-main-menu-item')
            .contains('Add Employee')
    }

    get employeeListTabLink() {
        return cy.get('.oxd-topbar-body-nav-tab-item, a.oxd-main-menu-item')
            .contains('Employee List')
    }

    // ─── Selectores - Formulario Add Employee ────────────────────────────────

    // El grupo de nombre no expone labels individuales por campo (solo un label
    // grupal "Employee Full Name*"); cada input se identifica por su placeholder,
    // que coincide con el texto del campo mostrado en el formulario real.
    get firstNameInput() {
        return cy.get('input[placeholder="First Name"]')
    }

    get lastNameInput() {
        return cy.get('input[placeholder="Last Name"]')
    }

    get employeeIdInput() {
        return cy.contains('label', 'Employee Id')
            .parents('.oxd-input-group')
            .find('input')
    }

    get saveButton() {
        return cy.get('button[type="submit"]').contains('Save')
    }

    // ─── Selectores - Personal Details ────────────────────────────────────────

    get personalDetailsHeader() {
        return cy.get('.orangehrm-edit-employee-name, .oxd-topbar-header-breadcrumb')
    }

    // ─── Selectores - Employee List ───────────────────────────────────────────

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

    get resultsRows() {
        return cy.get('.oxd-table-body .oxd-table-row')
    }

    // ─── Acciones - Navegacion ────────────────────────────────────────────────

    // Navega al modulo PIM desde el menu principal
    navigateToPim() {
        this.pimMenuLink.should('be.visible').click()
    }

    // Navega a la pestana "Add Employee" dentro del modulo PIM
    navigateToAddEmployeeTab() {
        this.addEmployeeTabLink.should('be.visible').click()
    }

    // Navega a la pestana "Employee List" dentro del modulo PIM
    navigateToEmployeeList() {
        this.employeeListTabLink.should('be.visible').click()
    }

    // Verifica que el formulario de Add Employee este visible
    verifyAddEmployeeFormVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/pim/addEmployee')
        this.firstNameInput.should('be.visible')
        this.lastNameInput.should('be.visible')
    }

    // ─── Acciones - Formulario Add Employee ───────────────────────────────────

    // Genera un nombre y apellido unicos por ejecucion (basados en timestamp) para
    // evitar colisiones de datos con otros usuarios en el entorno demo publico
    // y compartido de OrangeHRM.
    generateUniqueEmployeeName() {
        const uniqueId = Date.now()
        return {
            firstName: `QaAuto${uniqueId}`,
            lastName: `SCRUM48${uniqueId}`
        }
    }

    // Completa First Name y Last Name. No interactua con el campo Employee Id
    // (autogenerado por el sistema), respetando el criterio de no modificarlo.
    enterEmployeeNames(firstName, lastName) {
        this.firstNameInput.should('be.visible').clear().type(firstName)
        this.lastNameInput.should('be.visible').clear().type(lastName)
    }

    // Lee (sin modificar) el valor autogenerado del campo Employee Id
    getGeneratedEmployeeId() {
        return this.employeeIdInput.should('be.visible').invoke('val')
    }

    // Confirma el guardado del nuevo empleado, sincronizando con la respuesta
    // del backend antes de continuar con las validaciones posteriores.
    saveEmployee() {
        cy.intercept('POST', '**/api/v2/pim/employees**').as('createEmployee')

        this.saveButton.should('be.visible').click()

        cy.wait('@createEmployee', { timeout: 30000 })
    }

    // ─── Acciones - Personal Details ──────────────────────────────────────────

    // Verifica que el sistema redirige a la pantalla "Personal Details" del
    // empleado recien creado, mostrando su nombre completo
    verifyPersonalDetailsVisible(fullName) {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/pim/viewPersonalDetails')
        cy.contains(fullName, { timeout: 30000 }).should('be.visible')
    }

    // ─── Acciones - Employee List ──────────────────────────────────────────────

    // Verifica que el listado "Employee List" este visible
    verifyEmployeeListVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/pim/viewEmployeeList')
    }

    // Busca al empleado por nombre completo en Employee List. El campo es un
    // autocomplete: si aparece una sugerencia coincidente se selecciona, de lo
    // contrario se mantiene el texto ingresado y se ejecuta la busqueda igualmente.
    // Se intercepta la peticion de busqueda para esperar a que la tabla se
    // actualice con los resultados antes de continuar con las validaciones.
    searchEmployeeByName(fullName) {
        cy.intercept('GET', '**/api/v2/pim/employees**').as('searchEmployees')

        this.employeeNameInput.should('be.visible').clear().type(fullName)

        cy.get('body').then(($body) => {
            if ($body.find('.oxd-autocomplete-option').length > 0) {
                this.autocompleteOption.first().click()
            }
        })

        this.searchButton.click()
        cy.wait('@searchEmployees', { timeout: 30000 })
    }

    // Verifica que el empleado buscado quede visible entre los resultados
    verifyEmployeeInList(fullName) {
        this.resultsRows.should('have.length.greaterThan', 0)

        cy.contains('.oxd-table-body .oxd-table-row', fullName, { timeout: 30000 })
            .should('be.visible')
    }
}

export default OrangeHRMAddEmployeePage
