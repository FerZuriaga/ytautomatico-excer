// Page Object Model - OrangeHRMAddEmployeePage
// Encapsula selectores y acciones del formulario "Add Employee" del modulo PIM
// y de la pantalla "Personal Details" a la que redirige tras guardar.

class OrangeHRMAddEmployeePage {

    // ─── Selectores - Navegacion ─────────────────────────────────────────────

    get addEmployeeTabLink() {
        return cy.get('.oxd-topbar-body-nav-tab-item, a.oxd-main-menu-item')
            .contains('Add Employee')
    }

    // ─── Selectores - Formulario Add Employee ────────────────────────────────

    // El grupo de nombre no expone labels individuales por campo (solo un label
    // grupal "Employee Full Name*"); cada input se identifica por su placeholder,
    // que coincide con el texto del campo mostrado en el formulario real.
    // El placeholder real del campo (verificado en vivo contra la demo,
    // SCRUM-50) es "First name" (n minuscula), a diferencia de "Last Name"
    // que si usa mayuscula. Se usa el flag "i" (case-insensitive) para no
    // depender de esta inconsistencia de la aplicacion.
    get firstNameInput() {
        return cy.get('input[placeholder="First name" i]')
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

    // ─── Acciones - Navegacion ────────────────────────────────────────────────

    // Navega a la pestana "Add Employee" dentro del modulo PIM
    navigateToAddEmployeeTab() {
        this.addEmployeeTabLink.should('be.visible').click()
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

    // Da de alta un nuevo empleado con nombre y apellido unicos (prefijo
    // "QaAuto") y verifica que el sistema redirige a su ficha (Personal
    // Details). Devuelve el nombre completo generado. Se usa como precondicion
    // en specs que necesitan un empleado propio de la suite para operar sobre
    // el (nunca sobre un registro ajeno del entorno demo publico y
    // compartido), como edicion (oh_tc7) o eliminacion (oh_tc8). Asume que ya
    // se navego previamente al modulo PIM (cualquier pestana).
    createEmployee() {
        const { firstName, lastName } = this.generateUniqueEmployeeName()
        const fullName = `${firstName} ${lastName}`

        this.navigateToAddEmployeeTab()
        this.verifyAddEmployeeFormVisible()
        this.enterEmployeeNames(firstName, lastName)
        this.saveEmployee()
        this.verifyPersonalDetailsVisible(fullName)

        return fullName
    }

    // ─── Acciones - Personal Details ──────────────────────────────────────────

    // Verifica que el sistema redirige a la pantalla "Personal Details" del
    // empleado recien creado, mostrando su nombre completo
    verifyPersonalDetailsVisible(fullName) {
        cy.location('pathname', { timeout: 30000 }).should('contain', '/pim/viewPersonalDetails')
        cy.contains(fullName, { timeout: 30000 }).should('be.visible')
    }
}

export default OrangeHRMAddEmployeePage
