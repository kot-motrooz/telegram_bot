const TelegramApi = require('node-telegram-bot-api')
const {gameOptions, againOptions} = require('./options')
const token = '8571085107:AAHLzXL9HzIl5ZrZlEzvAlop4ySf0d4wWWg'

const bot = new TelegramApi(token, {polling: true})

const chats = {}

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, `Сейчас я загадаю число от 0 до 9, попробуй угадать!`)
    const randonNumber = Math.floor(Math.random() * 10)
    chats[chatId] = randonNumber;
    await bot.sendMessage(chatId, 'Отгадывай', gameOptions)
}

const start = () => {
    bot.setMyCommands([
        {command: 'start', description: 'Начальное приветствие '},
        {command: 'info', description: 'Информация о боте'},
        {command: 'game', description: 'Игра угадай число'},

    ])

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;

        if (text === '/start') {
            return  bot.sendMessage(chatId, `Добро пожаловать в телеграм бота по поиску аниме. Ниже можете выбрать интересующую вас информацию `)
        }
        if (text === '/info'){
            return  bot.sendMessage(chatId, `Этот бот преднозначен для поиска Аниме по коду из тиктока`)
        }
        if (text === '/game'){
            return startGame(chatId)
        }

        return bot.sendMessage(chatId, 'Я тебя не понимаю, попробуй еще раз')

    })

    bot.on('callback_query', msg => {
        const data = msg.data;
        const chatID = msg.message.chat.id;

        if (data === '/again') {
            return startGame(chatID)
        }
        if (data == chats[chatID]) {
            return bot.sendMessage (chatID, `Поздравляю, ты отгодал цифру ${chats[chatID]}`, againOptions)
        } else {
            return bot.sendMessage (chatID, `К сожалению ты не угадал, бот выбрал цифру: ${chats[chatID]}`, againOptions)
        }

    })
}



start()