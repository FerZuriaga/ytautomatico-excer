// Modulo: Favoritos - Quitar productos favoritos
// Sitio bajo prueba: https://practicesoftwaretesting.com (Toolshop v5)
// Ticket Jira: SCRUM-539 (CA-04/CA-05, Test Cycle SCRUM-540)
//
// Cada test registra su propio cliente por API con sus favoritos sembrados
// por API; la sesion se inyecta en la primera carga de pagina.

import PSTFavoritesPage from '../../pages/practicesoftwaretesting/PSTFavoritesPage'

const favorites = new PSTFavoritesPage()

describe('Favoritos: quitar productos favoritos [SCRUM-539]', () => {

    it('[CA-04][TC-04.1][SCRUM-541] Debe quitar un favorito sin afectar a los demas', () => {
        favorites.prepareCustomer(['Combination Pliers', 'Thor Hammer'])
        favorites.visitHome()

        favorites.openFromMenu()
        favorites.verifyFavorites(['Combination Pliers', 'Thor Hammer'])

        favorites.removeFavorite('Combination Pliers')
        favorites.verifyFavorites(['Thor Hammer'])
    })

    it('[CA-04][TC-04.2][SCRUM-542] Debe mantener fuera de la lista el favorito quitado al recargar', () => {
        favorites.prepareCustomer(['Combination Pliers', 'Thor Hammer'])
        favorites.visitHome()

        favorites.openFromMenu()
        favorites.verifyFavorites(['Combination Pliers', 'Thor Hammer'])

        favorites.removeFavorite('Combination Pliers')
        favorites.verifyFavorites(['Thor Hammer'])

        favorites.reload()
        favorites.verifyFavorites(['Thor Hammer'])
    })

    it('[CA-05][TC-05.1][SCRUM-543] Debe mostrar el mensaje de lista vacia al quitar el ultimo favorito', () => {
        favorites.prepareCustomer(['Combination Pliers'])
        favorites.visitHome()

        favorites.openFromMenu()
        favorites.verifyFavorites(['Combination Pliers'])

        favorites.removeFavorite('Combination Pliers')
        favorites.verifyEmpty()
    })

    it('[CA-05][TC-05.2][SCRUM-544] Debe mostrar el mensaje de lista vacia a un cliente sin favoritos', () => {
        favorites.prepareCustomer()
        favorites.visitHome()

        favorites.openUserMenu()
        favorites.clickMyFavorites()
        favorites.verifyEmpty()
    })
})
