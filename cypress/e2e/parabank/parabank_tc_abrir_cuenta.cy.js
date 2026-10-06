// Modulo: Banca - Abrir una cuenta nueva
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-959 (CA-31..CA-34, Test Cycle SCRUM-960)
//
// Cada test registra su cliente con la sesión iniciada (una cuenta con
// $515.50): abrir una cuenta cambia sus datos. Los que necesitan dos cuentas
// las preparan por la API del banco. El de una cuenta de origen con menos
// de $100.00 queda en it.skip: la app la abre igual (SCRUM-969).

import ParabankOpenAccountPage from '../../pages/parabank/ParabankOpenAccountPage'
import ParabankOverviewPage from '../../pages/parabank/ParabankOverviewPage'

const openAccount = new ParabankOpenAccountPage()
const overview = new ParabankOverviewPage()

// Pasos 1 a 3 con una sola cuenta: abrir la pantalla, elegir el tipo y abrir.
// Devuelve el número de la cuenta nueva.
const openOfType = (type) => {
    cy.pbRegisterCustomer({ keepSession: true })
    openAccount.open()
    openAccount.selectType(type)
    openAccount.submit()
    return openAccount.verifyOpened()
}

// Cliente con dos cuentas: la inicial queda en $415.50 menos `transfer` y la
// segunda en $100.00 más `transfer`. Devuelve { initial, second }.
const twoAccounts = (transfer) => cy.pbRegisterCustomer({ keepSession: true })
    .then(customer => cy.pbOpenSecondAccount(customer))
    .then(accounts => {
        if (transfer) cy.pbTransfer(accounts.initial, accounts.second, transfer)
        return cy.wrap(accounts)
    })

// Pasos 1 a 3 eligiendo la cuenta de origen.
const openFrom = (accountId) => {
    openAccount.open(2)
    openAccount.selectFromAccount(accountId)
    openAccount.submit()
}

describe('[SCRUM-959] ParaBank - Abrir una cuenta nueva', () => {

    // CA-31: Al abrir una cuenta, se muestra "Account Opened!" con "Congratulations, your account is now open." y el número de la cuenta nueva.

    it('[CA-31][TC-31.1][SCRUM-961] Abrir una cuenta CHECKING', () => {
        openOfType('CHECKING')
    })

    it('[CA-31][TC-31.2][SCRUM-962] Abrir una cuenta SAVINGS', () => {
        openOfType('SAVINGS')
    })

    // CA-32: La cuenta nueva muestra en "Account Details" el tipo elegido al abrirla.

    it('[CA-32][TC-32.1][SCRUM-963] El detalle de una cuenta CHECKING nueva muestra su tipo', () => {
        openOfType('CHECKING').then(id => openAccount.verifyDetailsType(id, 'CHECKING'))
    })

    it('[CA-32][TC-32.2][SCRUM-964] El detalle de una cuenta SAVINGS nueva muestra su tipo', () => {
        openOfType('SAVINGS').then(id => openAccount.verifyDetailsType(id, 'SAVINGS'))
    })

    // CA-33: Al abrir una cuenta, $100.00 pasan de la cuenta de origen elegida a la cuenta nueva, como se ve en "Accounts Overview".

    it('[CA-33][TC-33.1][SCRUM-965] Abrir una cuenta con fondos de la cuenta inicial', () => {
        cy.pbRegisterCustomer({ keepSession: true })
        openAccount.open()
        openAccount.fromAccount().then(initial => {
            openAccount.submit()
            openAccount.verifyOpened().then(id => {
                overview.verifyAccounts({ [initial]: '$415.50', [id]: '$100.00' }, 2)
            })
        })
    })

    it('[CA-33][TC-33.2][SCRUM-966] Abrir una cuenta con fondos de otra cuenta del cliente', () => {
        twoAccounts().then(({ initial, second }) => {
            openFrom(second)
            openAccount.verifyOpened().then(id => {
                overview.verifyAccounts({ [second]: '$0.00', [initial]: '$415.50', [id]: '$100.00' }, 3)
            })
        })
    })

    // CA-34: Al abrir una cuenta, una cuenta de origen con menos de $100.00 disponibles no abre la cuenta nueva y su saldo no cambia.

    it.skip('[CA-34][TC-34.1][SCRUM-967] Abrir una cuenta desde una cuenta con menos de $100.00 (bug conocido: SCRUM-969)', () => {
        twoAccounts('350').then(({ initial, second }) => {
            openFrom(initial)
            openAccount.verifyNotOpened()
            overview.verifyAccounts({ [initial]: '$65.50', [second]: '$450.00' }, 2)
        })
    })

    it('[CA-34][TC-34.2][SCRUM-968] Abrir una cuenta desde una cuenta con $100.00 justos', () => {
        twoAccounts('315.50').then(({ initial, second }) => {
            openFrom(initial)
            openAccount.verifyOpened().then(id => {
                overview.verifyAccounts({ [initial]: '$0.00', [second]: '$415.50', [id]: '$100.00' }, 3)
            })
        })
    })
})
