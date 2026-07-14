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

    // Pestana "Contact Details" dentro de la ficha del empleado. Vive dentro del
    // mismo grupo de tabs que "Personal Details" (.orangehrm-tabs-item).
    get contactDetailsTabLink() {
        return cy.get('a.orangehrm-tabs-item').contains('Contact Details')
    }

    // Campo "Mobile" dentro de la seccion "Telephone" de Contact Details. No expone
    // un label individual distinto de "Home"/"Mobile"/"Work" bajo un mismo titulo de
    // seccion, por lo que se ubica por su label propio siguiendo el mismo patron ya
    // usado para Employee Id/Employee Name (label + .oxd-input-group + input).
    get mobileInput() {
        return cy.contains('label', 'Mobile')
            .parents('.oxd-input-group')
            .find('input')
    }

    // Boton "Save" de la seccion Contact Details. Mismo selector generico que el
    // resto de los formularios de OrangeHRM (un unico submit button por pantalla).
    get contactDetailsSaveButton() {
        return cy.get('button[type="submit"]').contains('Save')
    }

    // Mensaje de confirmacion (toast) que muestra OrangeHRM tras un guardado exitoso.
    get saveConfirmationToast() {
        return cy.get('.oxd-toast-content--success').contains('Successfully Updated')
    }

    // Boton de accion "editar" (icono lapiz) de una fila de Employee List. Permite
    // reingresar a la ficha completa (Personal Details) de un empleado ya existente.
    get rowEditButton() {
        return cy.get('.oxd-table-cell-action-space').first()
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

    get resultsTable() {
        return cy.get('.oxd-table')
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
        this.employeeNameInput.should('be.visible')
        this.resultsTable.should('be.visible')
    }

    // Busca al empleado por nombre en Employee List. El campo es un autocomplete:
    // si aparece una sugerencia coincidente se selecciona, de lo contrario se
    // mantiene el texto ingresado y se ejecuta la busqueda igualmente.
    // Se intercepta la peticion de busqueda para esperar a que la tabla se
    // actualice con los resultados antes de continuar con las validaciones.
    // selectAutocomplete=false evita seleccionar la sugerencia: necesario para
    // busquedas por nombre parcial, donde clickear el autocomplete colapsaria
    // la busqueda a un unico empleado especifico en vez de dejar el texto
    // parcial para que la tabla muestre todas las coincidencias.
    searchEmployeeByName(name, { selectAutocomplete = true } = {}) {
        cy.intercept('GET', '**/api/v2/pim/employees**').as('searchEmployees')

        this.employeeNameInput.should('be.visible').clear().type(name)

        if (selectAutocomplete) {
            cy.get('body').then(($body) => {
                if ($body.find('.oxd-autocomplete-option').length > 0) {
                    this.autocompleteOption.first().click()
                }
            })
        }

        this.searchButton.click()
        cy.wait('@searchEmployees', { timeout: 30000 })
    }

    // Verifica que el empleado buscado quede visible entre los resultados
    verifyEmployeeInList(fullName) {
        this.resultsRows.should('have.length.greaterThan', 0)

        cy.contains('.oxd-table-body .oxd-table-row', fullName, { timeout: 30000 })
            .should('be.visible')
    }

    // Construye un mapa {nombreDeColumna: indice} a partir de los encabezados
    // reales de la tabla, en vez de asumir columnas fijas por posicion.
    // OrangeHRM permite reordenar/agregar columnas de Employee List
    // configurando "Optional Fields" desde Admin > Job, lo que rompe un
    // mapeo fijo por posicion de forma silenciosa (leeria el dato de la
    // columna equivocada sin que el test falle). Se descarta el texto de
    // los controles de orden ("AscendingDescending") que el DOM real
    // incluye embebido en cada encabezado.
    _getColumnIndexMap() {
        return cy.get('.oxd-table-header-cell', { timeout: 10000 }).then(($headers) => {
            const map = {}
            Array.from($headers).forEach((el, index) => {
                const text = Cypress.$(el).text().replace(/AscendingDescending$/, '').trim()
                if (text) {
                    map[text] = index
                }
            })
            return map
        })
    }

    // Extrae los datos basicos de una fila de resultados usando el mapa de
    // columnas real (ver _getColumnIndexMap).
    _extractRowData($row, columnIndexMap) {
        const cells = $row.find('.oxd-table-cell')
        const textAt = (columnName) => cells.eq(columnIndexMap[columnName]).text().trim()

        const firstMiddleName = textAt('First (& Middle) Name')
        const lastName = textAt('Last Name')
        return {
            id: textAt('Id'),
            fullName: `${firstMiddleName} ${lastName}`.replace(/\s+/g, ' ').trim(),
            jobTitle: textAt('Job Title'),
            status: textAt('Employment Status')
        }
    }

    // Busca, entre los resultados actualmente visibles, el primer empleado cuya
    // informacion basica (Id, nombre, cargo, estado) este completa. Se utiliza para
    // evitar depender de registros de datos incompletos presentes en el entorno demo
    // publico y compartido de OrangeHRM.
    getFirstEmployeeWithCompleteData() {
        return this.resultsRows.should('have.length.greaterThan', 0).then(($rows) => {
            return this._getColumnIndexMap().then((columnIndexMap) => {
                for (let i = 0; i < $rows.length; i++) {
                    const data = this._extractRowData($rows.eq(i), columnIndexMap)
                    if (data.id && data.fullName && data.jobTitle && data.status) {
                        return data
                    }
                }
                throw new Error('No se encontro ningun empleado con informacion basica completa (Id, nombre, cargo, estado) entre los resultados visibles.')
            })
        })
    }

    // Extrae el nombre completo del primer empleado visible en los resultados, sin
    // requerir que tenga cargo/estado completos (a diferencia de
    // getFirstEmployeeWithCompleteData). Los empleados dados de alta por esta misma
    // suite (ver enterEmployeeNames/saveEmployee, oh_tc5) solo completan nombre y
    // apellido: nunca tendran Job Title ni Employment Status cargados, por lo que
    // requerir esos datos completos descartaria siempre a los empleados propios de
    // la suite. Se usa para seleccionar el empleado propio (prefijo "QaAuto") sobre
    // el que se realiza la edicion.
    getFirstEmployeeFullName() {
        return this.resultsRows.should('have.length.greaterThan', 0).then(($rows) => {
            return this._getColumnIndexMap().then((columnIndexMap) => {
                const data = this._extractRowData($rows.eq(0), columnIndexMap)
                expect(data.fullName, 'Nombre completo del primer empleado en los resultados').to.not.be.empty
                return data.fullName
            })
        })
    }

    // Verifica que todas las filas de resultados correspondan al nombre buscado
    // (comparando contra la concatenacion de First(&Middle) Name + Last Name)
    verifyResultsMatchName(name) {
        this.resultsRows.should('have.length.greaterThan', 0).then(($rows) => {
            return this._getColumnIndexMap().then((columnIndexMap) => {
                Array.from($rows).forEach((row) => {
                    const data = this._extractRowData(Cypress.$(row), columnIndexMap)
                    expect(data.fullName.toLowerCase()).to.include(name.trim().toLowerCase())
                })
            })
        })
    }

    // Verifica que la fila indicada (por nombre completo) muestre su informacion basica:
    // Id, nombre completo, cargo (Job Title) y estado (Employment Status)
    verifyEmployeeBasicInfoDisplayed(expectedData) {
        this.resultsRows.should('have.length.greaterThan', 0).then(($rows) => {
            return this._getColumnIndexMap().then((columnIndexMap) => {
                const match = Array.from($rows).map((row) => this._extractRowData(Cypress.$(row), columnIndexMap))
                    .find((data) => data.fullName.toLowerCase() === expectedData.fullName.toLowerCase())

                expect(match, `Empleado "${expectedData.fullName}" encontrado en los resultados`).to.exist
                expect(match.id).to.not.be.empty
                expect(match.fullName).to.not.be.empty
                expect(match.jobTitle).to.not.be.empty
                expect(match.status).to.not.be.empty
            })
        })
    }

    // Verifica que la busqueda por un nombre inexistente no devuelva empleados en la tabla
    verifyNoRecordsFound() {
        cy.contains('No Records Found', { timeout: 30000 }).should('be.visible')
        this.resultsRows.should('have.length', 0)
    }

    // Indica (sin aseverar) si la busqueda actual devolvio al menos un resultado.
    // A diferencia de verifyNoRecordsFound/verifyEmployeeInList (que hacen fallar el
    // test), este metodo permite a los specs decidir un flujo condicional: por
    // ejemplo, crear un empleado de respaldo cuando no se encuentra ninguno propio
    // de la suite en el entorno demo publico y compartido de OrangeHRM.
    hasSearchResults() {
        return cy.get('body').then(($body) => {
            return $body.find('.oxd-table-body .oxd-table-row').length > 0
        })
    }

    // Reingresa a la ficha completa de un empleado (Personal Details) haciendo clic
    // en el boton "editar" (icono lapiz) de su fila en Employee List. Se usa tanto
    // para acceder por primera vez a la ficha de un empleado existente como para
    // verificar la persistencia de un dato luego de haber salido del modulo.
    openEmployeeByName(fullName) {
        cy.intercept('GET', '**/api/v2/pim/employees/*').as('getEmployee')

        cy.contains('.oxd-table-body .oxd-table-row', fullName, { timeout: 30000 })
            .find('.oxd-table-cell-action-space')
            .first()
            .click()

        cy.wait('@getEmployee', { timeout: 30000 })
    }

    // ─── Acciones - Contact Details (edicion de datos personales) ─────────────

    // Navega a la pestana "Contact Details" dentro de la ficha del empleado
    navigateToContactDetailsTab() {
        this.contactDetailsTabLink.should('be.visible').click()
    }

    // Verifica que la seccion Contact Details este visible, con el campo Mobile
    // (dato personal simple elegido para esta automatizacion) cargado
    verifyContactDetailsVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/pim/contactDetails')
        this.mobileInput.should('be.visible')
    }

    // Lee (sin modificar) el valor actual del campo Mobile
    getCurrentMobileNumber() {
        return this.mobileInput.should('be.visible').invoke('val')
    }

    // Genera un numero de telefono movil unico por ejecucion (basado en timestamp),
    // siguiendo el mismo patron que generateUniqueEmployeeName(), para evitar
    // depender de un valor fijo y poder verificar sin ambiguedad que el nuevo valor
    // especifico de esta ejecucion persiste.
    generateUniqueMobileNumber() {
        const digits = `555${Date.now()}`
        return digits.slice(0, 10)
    }

    // Reemplaza el valor del campo Mobile por uno nuevo
    updateMobileNumber(newMobile) {
        this.mobileInput.should('be.visible').clear().type(newMobile)
    }

    // Confirma el guardado de Contact Details, sincronizando con la respuesta del
    // backend antes de continuar con las validaciones posteriores (mismo patron que
    // saveEmployee()).
    saveContactDetails() {
        cy.intercept('PUT', '**/contact-details**').as('updateContactDetails')

        this.contactDetailsSaveButton.should('be.visible').click()

        cy.wait('@updateContactDetails', { timeout: 30000 })
    }

    // Verifica que el sistema muestre la confirmacion de guardado exitoso (toast)
    verifySaveConfirmationVisible() {
        this.saveConfirmationToast.should('be.visible')
    }

    // Verifica que el campo Mobile muestre el valor esperado. Reutilizable tanto
    // para comprobar la persistencia tras recargar la pagina como tras salir de la
    // ficha y volver a ingresar mas adelante.
    verifyMobileNumberValue(expectedMobile) {
        this.mobileInput.should('be.visible').and('have.value', expectedMobile)
    }
}

export default OrangeHRMAddEmployeePage
