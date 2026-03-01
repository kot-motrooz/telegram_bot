module.exports = {

    mainMenu: {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔎 Поиск аниме', callback_data: 'go_search' }],
                [{ text: '🎮 Игра', callback_data: 'game' }],
                [{ text: '📊 Статистика', callback_data: 'stats' }],
                [{ text: 'ℹ Информация', callback_data: 'info' }]
            ]
        }
    },

    backToMenu: {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🏠 В главное меню', callback_data: 'back' }]
            ]
        }
    },

    searchScreen: {
        reply_markup: {
            inline_keyboard: [
                [{ text: '❌ Отмена', callback_data: 'back' }]
            ]
        }
    },

    animeScreen: {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔄 Найти ещё', callback_data: 'go_search' }],
                [{ text: '🏠 В меню', callback_data: 'back' }]
            ]
        }
    },

    gameOptions: {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '1', callback_data: '1' },
                    { text: '2', callback_data: '2' },
                    { text: '3', callback_data: '3' },
                ],
                [
                    { text: '4', callback_data: '4' },
                    { text: '5', callback_data: '5' },
                    { text: '6', callback_data: '6' }
                ],
                [
                    { text: '7', callback_data: '7' },
                    { text: '8', callback_data: '8' },
                    { text: '9', callback_data: '9' }
                ],
                [
                    { text: '0', callback_data: '0' }
                ]
            ]
        }
    },

    againOptions: {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔄 Играть ещё раз', callback_data: 'game' }],
                [{ text: '🏠 В меню', callback_data: 'back' }]
            ]
        }
    }

};