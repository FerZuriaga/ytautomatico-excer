// Page Object Model - OrangeHRMDashboardPage
// Encapsula selectores y acciones del Dashboard de OrangeHRM,
// incluyendo el menu de usuario y el cierre de sesion (Logout)

class OrangeHRMDashboardPage {

    // ─── Selectores ───────────────────────────────────────────────────────────

    get userDropdownTab() {
        return cy.get('.oxd-userdropdown-tab')
    }

    get logoutLink() {
        return this.userDropdownTab.parents('.oxd-topbar-header-userarea')
            .find('.oxd-dropdown-menu')
            .contains('a', 'Logout')
    }

    // Item de menu principal "My Info", mismo patron que pimMenuLink en
    // OrangeHRMEmployeeListPage (.oxd-main-menu-item--name).
    get myInfoMenuLink() {
        return cy.get('.oxd-main-menu-item--name').contains('My Info')
    }

    // ─── Acciones ─────────────────────────────────────────────────────────────

    // Abre el menu de usuario ubicado en la esquina superior derecha
    openUserMenu() {
        this.userDropdownTab.should('be.visible').click()
    }

    // Hace click en la opcion "Logout" del menu de usuario
    clickLogout() {
        this.logoutLink.should('be.visible').click()
    }

    // Abre el menu de usuario y selecciona "Logout"
    logout() {
        this.openUserMenu()
        this.clickLogout()
    }

    // Navega al modulo "My Info" desde el menu principal
    navigateToMyInfo() {
        this.myInfoMenuLink.should('be.visible').click()
    }
}

export default OrangeHRMDashboardPage
