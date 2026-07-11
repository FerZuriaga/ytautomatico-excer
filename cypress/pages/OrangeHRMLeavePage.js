// Page Object Model - OrangeHRMLeavePage
// Encapsula selectores y acciones del modulo Leave de OrangeHRM:
// - "Apply" (formulario de solicitud de permiso)
// - "My Leave" (listado de solicitudes propias)

class OrangeHRMLeavePage {

    // ─── Selectores - Navegacion ─────────────────────────────────────────────

    get leaveMenuLink() {
        return cy.get('.oxd-main-menu-item--name').contains('Leave')
    }

    get applyTabLink() {
        return cy.get('.oxd-topbar-body-nav-tab-item, a.oxd-main-menu-item')
            .contains('Apply')
    }

    get myLeaveTabLink() {
        return cy.get('.oxd-topbar-body-nav-tab-item, a.oxd-main-menu-item')
            .contains('My Leave')
    }

    get entitlementsTabLink() {
        return cy.get('.oxd-topbar-body-nav-tab-item, a.oxd-main-menu-item')
            .contains('Entitlements')
    }

    get addEntitlementsMenuOption() {
        return cy.contains('Add Entitlements')
    }

    // ─── Selectores - Formulario Add Entitlement ─────────────────────────────

    get entitlementEmployeeNameInput() {
        return cy.contains('label', 'Employee Name')
            .parents('.oxd-input-group')
            .find('input')
    }

    get entitlementEmployeeAutocompleteOption() {
        return cy.get('.oxd-autocomplete-option')
    }

    get entitlementLeaveTypeDropdown() {
        return cy.contains('label', 'Leave Type')
            .parents('.oxd-input-group')
            .find('.oxd-select-text')
    }

    get entitlementLeavePeriodDropdown() {
        return cy.contains('label', 'Leave Period')
            .parents('.oxd-input-group')
            .find('.oxd-select-text')
    }

    get entitlementDaysInput() {
        return cy.contains('label', 'Entitlement')
            .parents('.oxd-input-group')
            .find('input')
    }

    get saveEntitlementButton() {
        return cy.get('button[type="submit"]').contains('Save')
    }

    get loggedInUserName() {
        return cy.get('.oxd-userdropdown-name')
    }

    // ─── Selectores - Formulario Apply Leave ─────────────────────────────────

    get leaveTypeDropdown() {
        return cy.contains('label', 'Leave Type')
            .parents('.oxd-input-group')
            .find('.oxd-select-text')
    }

    get leaveTypeOptions() {
        return cy.get('.oxd-select-dropdown .oxd-select-option')
    }

    get fromDateInput() {
        return cy.contains('label', 'From Date')
            .parents('.oxd-input-group')
            .find('input')
    }

    get toDateInput() {
        return cy.contains('label', 'To Date')
            .parents('.oxd-input-group')
            .find('input')
    }

    get applyButton() {
        return cy.get('button[type="submit"]').contains('Apply')
    }

    get successToast() {
        return cy.get('.oxd-toast')
    }

    // ─── Selectores - My Leave ────────────────────────────────────────────────

    get myLeaveTable() {
        return cy.get('.oxd-table')
    }

    get myLeaveRows() {
        return cy.get('.oxd-table-body .oxd-table-row')
    }

    // ─── Acciones - Navegacion ────────────────────────────────────────────────

    // Navega al modulo Leave desde el menu principal
    navigateToLeave() {
        this.leaveMenuLink.should('be.visible').click()
    }

    // Navega a la pestana "Apply" dentro del modulo Leave
    navigateToApplyTab() {
        this.applyTabLink.should('be.visible').click()
    }

    // Navega a la pestana "My Leave" dentro del modulo Leave
    navigateToMyLeave() {
        this.myLeaveTabLink.should('be.visible').click()
    }

    // Navega al formulario "Add Entitlements" dentro del modulo Leave.
    // Entra primero al modulo Leave (no asume que el caller ya este
    // posicionado ahi) para que este metodo sea invocable de forma
    // independiente, por ejemplo justo despues del login.
    navigateToAddEntitlementsForm() {
        this.navigateToLeave()
        this.entitlementsTabLink.should('be.visible').click()
        this.addEntitlementsMenuOption.should('be.visible').click()
    }

    // ─── Acciones - Formulario Add Entitlement ───────────────────────────────

    // Busca al empleado actualmente logueado por su primer nombre (obtenido
    // dinamicamente del topbar) y selecciona la primera sugerencia del
    // autocomplete. Se evita hardcodear "Admin" porque el nombre del
    // empleado asociado a esa cuenta varia en el entorno demo publico y
    // compartido (otros usuarios lo editan constantemente via PIM).
    searchLoggedInEmployee() {
        this.loggedInUserName.invoke('text').then((fullName) => {
            const firstName = fullName.trim().split(' ')[0]
            this.entitlementEmployeeNameInput.should('be.visible').type(firstName)
        })

        this.entitlementEmployeeAutocompleteOption
            .should('have.length.greaterThan', 0)
            .and('not.contain.text', 'Searching')
            .and('not.contain.text', 'No Records Found')

        this.entitlementEmployeeAutocompleteOption.first().click()
    }

    // Selecciona el primer tipo de permiso disponible en el formulario de
    // alta de entitlement. Devuelve (via .then) el texto seleccionado.
    selectEntitlementLeaveType() {
        this.entitlementLeaveTypeDropdown.should('be.visible').click()
        return this._selectFirstAvailableOption()
    }

    // Selecciona el periodo de licencia correspondiente al anio actual
    // (opcion con formato "yyyy-01-01 - yyyy-..."), para que el saldo
    // otorgado sea valido en las fechas futuras usadas por Apply Leave.
    selectCurrentYearLeavePeriod() {
        const currentYear = new Date().getFullYear()
        this.entitlementLeavePeriodDropdown.should('be.visible').click()
        cy.get('.oxd-select-dropdown .oxd-select-option', { timeout: 10000 })
            .contains(`${currentYear}-01-01`)
            .click()
    }

    // Completa la cantidad de dias de saldo a otorgar
    enterEntitlementDays(days) {
        this.entitlementDaysInput.should('be.visible').type(String(days))
    }

    // Confirma el guardado del entitlement. OrangeHRM muestra un dialogo de
    // confirmacion ("Existing Entitlement value X will be updated to Y")
    // cuando el empleado ya tiene un registro de saldo para ese tipo/periodo
    // (aunque sea 0.00); debe confirmarse explicitamente para completar la
    // operacion.
    saveEntitlement() {
        this.saveEntitlementButton.should('be.visible').click()

        cy.get('body').then(($body) => {
            const $confirmButton = $body.find('button:contains("Confirm")')
            if ($confirmButton.length > 0) {
                cy.wrap($confirmButton.first()).click()
            }
        })
    }

    // Orquesta el alta completa de saldo de licencia para el empleado
    // actualmente logueado. Es una precondicion necesaria porque el entorno
    // demo publico y compartido de OrangeHRM frecuentemente se queda sin
    // saldo disponible en todos los tipos de permiso (por el uso concurrente
    // de otros usuarios), lo que hace que "Apply Leave" oculte el formulario
    // y muestre "No Leave Types with Leave Balance" en su lugar. Devuelve
    // (via .then) el tipo de permiso al que se le otorgo saldo.
    grantLeaveEntitlement(days = 10) {
        this.navigateToAddEntitlementsForm()
        this.searchLoggedInEmployee()

        return this.selectEntitlementLeaveType().then((leaveTypeText) => {
            this.selectCurrentYearLeavePeriod()
            this.enterEntitlementDays(days)
            this.saveEntitlement()
            return cy.wrap(leaveTypeText)
        })
    }

    // Verifica que el formulario de Apply Leave este visible
    verifyApplyFormVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/leave/applyLeave')
        this.leaveTypeDropdown.should('be.visible')
        this.fromDateInput.should('be.visible')
        this.toDateInput.should('be.visible')
    }

    // ─── Acciones - Formulario Apply Leave ───────────────────────────────────

    // Selecciona la primera opcion no vacia de un dropdown OXD ya abierto
    // (".oxd-select-dropdown"). Reutilizable por cualquier dropdown de este
    // componente (Leave Type en Apply Leave, Leave Type/Leave Period en Add
    // Entitlement), que comparten la misma estructura de opciones. Devuelve
    // (via .then) el texto de la opcion seleccionada.
    _selectFirstAvailableOption() {
        return cy.get('.oxd-select-dropdown .oxd-select-option', { timeout: 10000 })
            .should('have.length.greaterThan', 1)
            .then(($options) => {
                // La primera opcion de todo dropdown OXD es siempre el
                // placeholder ("-- Select --"), por eso se descarta por
                // posicion en lugar de comparar texto (el placeholder no es
                // un simple "-" como asumia una version anterior de este
                // filtro, sino el texto completo "-- Select --").
                const validOption = Array.from($options)
                    .slice(1)
                    .map((el) => Cypress.$(el).text().trim())
                    .find((text) => text.length > 0)

                expect(validOption, 'Existe al menos una opcion valida en el dropdown').to.exist

                // Se re-consulta el DOM en vivo (en lugar de reutilizar la
                // coleccion $options ya capturada) porque este componente OXD
                // puede re-renderizar la lista entre el filtrado y el click,
                // dejando la referencia original desactualizada.
                cy.contains('.oxd-select-dropdown .oxd-select-option', validOption).click()

                return cy.wrap(validOption)
            })
    }

    // Abre el dropdown "Leave Type" y selecciona la primera opcion disponible
    // (no vacia). Devuelve (via .then) el texto del tipo de permiso seleccionado
    // para poder validarlo luego en "My Leave". Se selecciona dinamicamente en
    // lugar de un valor fijo porque el entorno demo publico y compartido puede
    // tener distintos tipos de permiso disponibles/con saldo en cada ejecucion.
    selectAvailableLeaveType() {
        this.leaveTypeDropdown.should('be.visible').click()
        return this._selectFirstAvailableOption()
    }

    // Calcula un rango de fechas futuras dinamico (relativo a la fecha de
    // ejecucion) para minimizar colisiones con solicitudes de otros usuarios
    // en el entorno demo publico compartido. Devuelve fechas en formato
    // yyyy-MM-dd, que es el formato por defecto que acepta el input de OrangeHRM.
    // Se suma un offset aleatorio a daysFromToday porque corridas repetidas
    // en el mismo dia calculan siempre el mismo rango base, lo que genera
    // solicitudes superpuestas ("overlap") con ejecuciones anteriores
    // propias sobre el mismo entorno compartido. Se acota a 150 dias para
    // que la fecha resultante se mantenga dentro del mismo anio calendario
    // que el entitlement otorgado (que se registra para el periodo del
    // anio actual, ver selectCurrentYearLeavePeriod).
    _getFutureDateRange(daysFromToday = 10, durationDays = 1) {
        const formatDate = (date) => {
            const yyyy = date.getFullYear()
            const mm = String(date.getMonth() + 1).padStart(2, '0')
            const dd = String(date.getDate()).padStart(2, '0')
            return `${yyyy}-${mm}-${dd}`
        }

        const randomOffset = Math.floor(Math.random() * 150)
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() + daysFromToday + randomOffset)

        const toDate = new Date(fromDate)
        toDate.setDate(toDate.getDate() + durationDays)

        return {
            fromDate: formatDate(fromDate),
            toDate: formatDate(toDate)
        }
    }

    // Ingresa la fecha de inicio y fin del permiso. Limpia el input antes de
    // escribir y cierra el datepicker emergente presionando escape para que
    // no tape otros campos ni el boton de envio.
    enterDates(fromDate, toDate) {
        this.fromDateInput.should('be.visible').clear().type(fromDate).type('{esc}')
        this.toDateInput.should('be.visible').clear().type(toDate).type('{esc}')
    }

    // Envia la solicitud de permiso, sincronizando con la respuesta del backend
    // antes de continuar con las validaciones posteriores.
    submitApplyLeave() {
        cy.intercept('POST', '**/api/v2/leave/leave-requests**').as('applyLeave')

        this.applyButton.should('be.visible').click()

        cy.wait('@applyLeave', { timeout: 30000 })
    }

    // Verifica que el sistema muestre confirmacion de que la solicitud fue registrada
    verifyConfirmationVisible() {
        this.successToast.should('be.visible')
    }

    // ─── Acciones - My Leave ──────────────────────────────────────────────────

    // Verifica que el listado "My Leave" este visible
    verifyMyLeaveListVisible() {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/leave/viewMyLeaveList')
        this.myLeaveTable.should('be.visible')
    }

    // Verifica que exista una solicitud en "My Leave" que coincida con el tipo
    // de permiso indicado y cuyo estado sea "Pending Approval"
    verifyLeaveRequestPending(leaveTypeText) {
        this.myLeaveRows.should('have.length.greaterThan', 0)

        cy.contains('.oxd-table-body .oxd-table-row', leaveTypeText, { timeout: 30000 })
            .should('be.visible')
            .within(() => {
                cy.contains('Pending Approval').should('be.visible')
            })
    }
}

export default OrangeHRMLeavePage
