// Page Object Model - OrangeHRMEmployeeListPage
// Encapsula selectores y acciones del modulo PIM de OrangeHRM relacionados con
// el listado de empleados ("Employee List"): navegacion al modulo, busqueda,
// lectura de resultados, y eliminacion individual/masiva.

class OrangeHRMEmployeeListPage {

    // ─── Selectores - Navegacion ─────────────────────────────────────────────

    get pimMenuLink() {
        return cy.get('.oxd-main-menu-item--name').contains('PIM')
    }

    get employeeListTabLink() {
        return cy.get('.oxd-topbar-body-nav-tab-item, a.oxd-main-menu-item')
            .contains('Employee List')
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

    get employmentStatusSelect() {
        return cy.contains('label', 'Employment Status').parents('.oxd-input-group').find('.oxd-select-text')
    }

    // Dialogo de confirmacion que muestra OrangeHRM antes de eliminar un
    // empleado ("Are you Sure?"). Se localiza por [role="document"] (mismo
    // patron de dialogo OXD ya usado en OrangeHRMLeavePage para el dialogo de
    // confirmacion de entitlement), ya que el sheet no expone una clase CSS
    // propia distinta de las genericas del componente.
    get deleteConfirmationDialog() {
        return cy.get('[role="document"]')
    }

    // Boton "Yes, Delete" del dialogo de confirmacion de eliminacion
    get confirmDeleteButton() {
        return this.deleteConfirmationDialog.contains('button', 'Yes, Delete')
    }

    // Boton "No, Cancel" del dialogo de confirmacion de eliminacion
    get cancelDeleteButton() {
        return this.deleteConfirmationDialog.contains('button', 'No, Cancel')
    }

    // Mensaje de confirmacion (toast) que muestra OrangeHRM tras eliminar un
    // empleado exitosamente. Texto propio ("Successfully Deleted"), distinto
    // al de guardado/edicion de Contact Details, por lo que se define un
    // getter independiente en vez de reutilizarlo.
    get deleteConfirmationToast() {
        return cy.get('.oxd-toast-content--success').contains('Successfully Deleted')
    }

    // Checkbox de seleccion individual de una fila, ubicado por el nombre completo
    // del empleado (mismo patron de localizacion de fila que clickDeleteEmployee).
    // Verificado en vivo contra la demo (SCRUM-51): cada fila expone su propio
    // checkbox dentro de .oxd-table-card-cell-checkbox en la primera celda. Se
    // evita deliberadamente el checkbox "seleccionar todos" del encabezado de la
    // tabla (.oxd-table-header), ya que seleccionaria tambien empleados ajenos a
    // esta suite en el entorno demo publico y compartido.
    employeeRowCheckbox(fullName) {
        return cy.contains('.oxd-table-body .oxd-table-row', fullName, { timeout: 30000 })
            .find('.oxd-table-card-cell-checkbox input[type="checkbox"]')
    }

    // Boton de eliminacion masiva ("Delete Selected"). Verificado en vivo contra la
    // demo (SCRUM-51): este boton no existe en el DOM cuando no hay ningun
    // empleado seleccionado (no solo deshabilitado), y aparece unicamente al
    // seleccionar al menos un checkbox de fila.
    get bulkDeleteButton() {
        return cy.contains('button', 'Delete Selected')
    }

    // ─── Acciones - Navegacion ────────────────────────────────────────────────

    // Navega al modulo PIM desde el menu principal (aterriza en Employee List,
    // la pestana por defecto del modulo)
    navigateToPim() {
        this.pimMenuLink.should('be.visible').click()
    }

    // Navega a la pestana "Employee List" dentro del modulo PIM
    navigateToEmployeeList() {
        this.employeeListTabLink.should('be.visible').click()
    }

    // Verifica que el listado "Employee List" este visible
    verifyEmployeeListVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/pim/viewEmployeeList')
        this.employeeNameInput.should('be.visible')
        this.resultsTable.should('be.visible')
    }

    // ─── Acciones - Busqueda ────────────────────────────────────────────────────

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

    // Filtra el listado por Employment Status (ej. "Full-Time Permanent") y
    // ejecuta la busqueda. A diferencia del nombre, este campo es un select
    // fijo (no autocomplete): abrir el dropdown y clickear la opcion por texto.
    filterByEmploymentStatus(status) {
        cy.intercept('GET', '**/api/v2/pim/employees**').as('filterByStatus')

        this.employmentStatusSelect.click()
        cy.get('.oxd-select-dropdown .oxd-select-option').contains(status).click()
        this.searchButton.click()

        cy.wait('@filterByStatus', { timeout: 30000 })
    }

    // Vuelve a dejar el filtro de Employment Status en "-- Select --" (sin
    // reejecutar la busqueda), para que una busqueda posterior por nombre no
    // quede acotada silenciosamente por el status usado en
    // findExistingEmployeeWithCompleteData().
    resetEmploymentStatusFilter() {
        this.employmentStatusSelect.click()
        cy.get('.oxd-select-dropdown .oxd-select-option').contains('-- Select --').click()
    }

    // Localiza un empleado existente en el entorno demo publico y compartido
    // que garantice tener su informacion basica completa (Id, nombre, cargo,
    // estado). Buscar por un nombre amplio ("a") no alcanza: el listado
    // acumulo una cantidad enorme de registros de otras suites de
    // automatizacion sin Job Title ni Employment Status cargados, que ademas
    // ordenan alfabeticamente antes que los empleados reales (verificado en
    // vivo: los primeros 50 resultados de "a" no tenian ni un solo registro
    // con datos completos). Filtrar por Employment Status = "Full-Time
    // Permanent" acota el listado a empleados con ficha de RRHH cargada,
    // donde Job Title y Employment Status siempre vienen completos.
    findExistingEmployeeWithCompleteData() {
        this.filterByEmploymentStatus('Full-Time Permanent')

        return this.getFirstEmployeeWithCompleteData().then((employee) => {
            this.resetEmploymentStatusFilter()
            return cy.wrap(employee)
        })
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
    // suite (ver OrangeHRMAddEmployeePage#createEmployee, oh_tc5) solo completan
    // nombre y apellido: nunca tendran Job Title ni Employment Status cargados, por
    // lo que requerir esos datos completos descartaria siempre a los empleados
    // propios de la suite. Se usa para seleccionar el empleado propio (prefijo
    // "QaAuto") sobre el que se realiza la edicion.
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

    // ─── Acciones - Eliminacion de empleado ───────────────────────────────────

    // Hace clic en el icono de eliminar (papelera) de la fila del empleado
    // indicado. La celda de acciones de cada fila expone dos botones con la
    // misma clase (.oxd-table-cell-action-space): el primero es "editar"
    // (icono lapiz, bi-pencil-fill, ya usado por openEmployeeByName) y el
    // segundo es "eliminar" (icono papelera, bi-trash). Se selecciona por
    // posicion (.last()) dentro de la fila, ya que ambos botones comparten
    // clase y no exponen ningun atributo distintivo (aria-label, title, etc)
    // mas alla del icono interno.
    clickDeleteEmployee(fullName) {
        cy.contains('.oxd-table-body .oxd-table-row', fullName, { timeout: 30000 })
            .find('.oxd-table-cell-action-space')
            .last()
            .click()
    }

    // Verifica que el dialogo de confirmacion de eliminacion este visible
    verifyDeleteConfirmationDialogVisible() {
        this.deleteConfirmationDialog.should('be.visible')
        this.deleteConfirmationDialog.contains('Are you Sure?').should('be.visible')
    }

    // Confirma la eliminacion haciendo clic en "Yes, Delete", sincronizando
    // con la respuesta del backend antes de continuar con las validaciones
    // posteriores.
    confirmDeleteEmployee() {
        cy.intercept('DELETE', '**/api/v2/pim/employees**').as('deleteEmployee')

        this.confirmDeleteButton.should('be.visible').click()

        cy.wait('@deleteEmployee', { timeout: 30000 })
    }

    // Cancela la eliminacion haciendo clic en "No, Cancel". Esta accion no
    // dispara ninguna peticion DELETE, por lo que unicamente se espera a que
    // el dialogo se cierre antes de continuar (a diferencia de
    // confirmDeleteEmployee(), que sincroniza con la respuesta del backend).
    cancelDeleteEmployee() {
        this.cancelDeleteButton.should('be.visible').click()
        this.deleteConfirmationDialog.should('not.exist')
    }

    // Verifica que el sistema muestre la confirmacion de eliminacion exitosa (toast)
    verifyDeleteConfirmationVisible() {
        this.deleteConfirmationToast.should('be.visible')
    }

    // ─── Acciones - Eliminacion multiple ───────────────────────────────────────

    // Selecciona el checkbox de cada empleado de la lista de nombres indicada. Se
    // usa click({force: true}) porque el input nativo del checkbox esta oculto
    // visualmente detras del span estilizado (patron OXD ya observado en el
    // formulario). Reutilizado tanto para la eliminacion multiple (CA-01) como
    // para verificar la disponibilidad del control de eliminacion masiva (CA-03),
    // evitando duplicar el loop de seleccion en el spec.
    selectEmployeesByName(fullNames) {
        fullNames.forEach((fullName) => {
            this.employeeRowCheckbox(fullName).should('exist').click({ force: true })
        })
    }

    // Hace clic en el boton de eliminacion masiva, abriendo el mismo dialogo de
    // confirmacion generico ya usado por clickDeleteEmployee() (el dialogo y el
    // toast de exito son identicos para ambos triggers, verificado en vivo
    // contra la demo).
    clickBulkDeleteButton() {
        this.bulkDeleteButton.should('be.visible').click()
    }

    // Verifica que el control de eliminacion masiva no este disponible (ausente
    // del DOM), esperado cuando no hay ningun empleado seleccionado.
    verifyBulkDeleteButtonNotAvailable() {
        cy.contains('button', 'Delete Selected').should('not.exist')
    }

    // Verifica que el control de eliminacion masiva este disponible, esperado
    // luego de seleccionar al menos un empleado.
    verifyBulkDeleteButtonAvailable() {
        this.bulkDeleteButton.should('be.visible')
    }
}

export default OrangeHRMEmployeeListPage
