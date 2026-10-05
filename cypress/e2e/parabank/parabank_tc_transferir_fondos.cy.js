// Modulo: Banca - Transferir dinero entre mis cuentas
// Sitio bajo prueba: https://parabank.parasoft.com/parabank (ParaBank, demo de Parasoft)
// Ticket Jira: SCRUM-876 (CA-12..CA-13, Test Cycle SCRUM-877)
//
// Cada test registra su cliente con la sesión iniciada y le abre una
// segunda cuenta por API: inicial $415.50, segunda $100.00.

import ParabankTransferPage from '../../pages/parabank/ParabankTransferPage'

const transfer = new ParabankTransferPage()

// Paso 1: "Transfer Funds" con las dos cuentas del cliente.
const openWithTwoAccounts = () => cy.pbRegisterCustomer({ keepSession: true })
    .then(customer => cy.pbOpenSecondAccount(customer))
    .then(accounts => {
        transfer.open(2)
        return cy.wrap(accounts)
    })

// Pasos 2 a 4: monto, segunda cuenta como destino y "Transfer" confirmado.
const transferToSecond = (accounts, amount, amountText) => {
    transfer.typeAmount(amount)
    transfer.selectTo(accounts.second)
    transfer.submit()
    transfer.verifyComplete(amountText, accounts.initial, accounts.second)
}

describe('[SCRUM-876] ParaBank - Transferir dinero entre mis cuentas', () => {

    // CA-12: Al transferir un monto válido entre dos cuentas propias distintas, se confirma con "Transfer Complete!" indicando el monto y las cuentas.

    it('[CA-12][TC-12.1][SCRUM-878] Transferir un monto entero entre dos cuentas propias', () => {
        openWithTwoAccounts().then(accounts => transferToSecond(accounts, '100', '$100.00'))
    })

    it('[CA-12][TC-12.2][SCRUM-879] Transferir un monto con centavos', () => {
        openWithTwoAccounts().then(accounts => transferToSecond(accounts, '25.50', '$25.50'))
    })

    it('[CA-12][TC-12.3][SCRUM-880] Transferir todo el saldo de la cuenta de origen', () => {
        openWithTwoAccounts().then(accounts => transferToSecond(accounts, '415.50', '$415.50'))
    })

    // CA-13: Después de transferir, en "Accounts Overview" la cuenta de origen muestra el monto de menos y la de destino el monto de más.

    it('[CA-13][TC-13.1][SCRUM-881] Los saldos reflejan una transferencia de monto entero', () => {
        openWithTwoAccounts().then(accounts => {
            transferToSecond(accounts, '100', '$100.00')
            transfer.openOverview()
            transfer.verifyBalances({ [accounts.initial]: '$315.50', [accounts.second]: '$200.00' })
        })
    })

    it('[CA-13][TC-13.2][SCRUM-882] Los saldos reflejan una transferencia con centavos', () => {
        openWithTwoAccounts().then(accounts => {
            transferToSecond(accounts, '25.50', '$25.50')
            transfer.openOverview()
            transfer.verifyBalances({ [accounts.initial]: '$390.00', [accounts.second]: '$125.50' })
        })
    })
})
