require('dotenv').config()

const TelegramApi = require('node-telegram-bot-api')
const fs = require('fs')
const path = require('path')

const { gameOptions, againOptions, mainMenu, backToMenu } = require('./options')
const messages = require('./messages')

const token = process.env.TOKEN
const ADMIN_ID = process.env.ADMIN_ID

const bot = new TelegramApi(token, { polling: true })

const dataPath = path.join(__dirname, 'animeData.json')

const loadData = () => {
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, '{}')
    }
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
}

const saveData = (data) => {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
}

let animeData = loadData()

const searchAnime = async (chatId, code) => {
    const upperCode = code.toUpperCase()
    const anime = animeData[upperCode]

    if (!anime) {
        return bot.sendMessage(
            chatId,
            messages.notFound(upperCode),
            backToMenu
        )
    }

    return bot.sendPhoto(chatId, anime.image, {
        caption: messages.animeCaption(anime.title, upperCode),
        parse_mode: 'HTML',
        reply_markup: backToMenu.reply_markup
    })
}

const chats = {}

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, messages.gameStart)

    const randomNumber = Math.floor(Math.random() * 10)
    chats[chatId] = randomNumber

    await bot.sendMessage(chatId, 'Выбирай число 👇', gameOptions)
}

bot.setMyCommands([
    { command: 'start', description: 'Главное меню' },
    { command: 'game', description: 'Игра угадай число' },
    { command: 'info', description: "Инфорамция о боте" }
])

bot.on('message', async (msg) => {
    const text = msg.text
    const chatId = msg.chat.id

    if (!text) return

    if (text === '/start') {
        return bot.sendMessage(chatId, messages.start, mainMenu)
    }

    if (text === '/game') {
        return startGame(chatId)
    }
    if (text === '/info'){
        return bot.sendMessage(chatId, messages.info)
    }

    if (text.startsWith('/add')) {
        if (String(msg.from.id) !== ADMIN_ID) {
            return bot.sendMessage(chatId, messages.noAccess)
        }

        const parts = text.split(' ')

        if (parts.length < 4) {
            return bot.sendMessage(chatId, messages.addFormat)
        }

        const code = parts[1].toUpperCase()
        const title = parts[2]
        const image = parts[3]

        animeData[code] = { title, image }
        saveData(animeData)

        return bot.sendMessage(chatId, messages.addSuccess)
    }

    if (!text.startsWith('/')) {
        return searchAnime(chatId, text)
    }
})

bot.on('callback_query', async (query) => {
    const { id, data, message } = query

    try {
        await bot.answerCallbackQuery(id)
    } catch (e) {
        return
    }

    if (!message) return

    const chatId = message.chat.id
    const messageId = message.message_id

    if (data === 'back_menu') {
        if (message.text) {
            return bot.editMessageText(messages.start, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: mainMenu.reply_markup
            })
        } else {
            return bot.sendMessage(chatId, messages.start, mainMenu)
        }
    }

    if (data === 'search') {
        return bot.editMessageText(messages.askCode, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: backToMenu.reply_markup
        })
    }

    if (data === 'info') {
        return bot.editMessageText(messages.info, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: mainMenu.reply_markup
        })
    }

    if (data === 'game') {
        const number = Math.floor(Math.random() * 10)
        chats[chatId] = number

        return bot.editMessageText(messages.gameStart, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: gameOptions.reply_markup
        })
    }
    if (data === 'again') {
        const number = Math.floor(Math.random() * 10)
        chats[chatId] = number

        return bot.editMessageText(messages.gameStart, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: gameOptions.reply_markup
        })
    }

    if (chats[chatId] !== undefined) {
        const number = chats[chatId]
        delete chats[chatId]

        if (Number(data) === number) {
            return bot.editMessageText(messages.gameWin(number), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: againOptions.reply_markup
            })
        } else {
            return bot.editMessageText(messages.gameLose(number), {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: againOptions.reply_markup
            })
        }
    }
})

console.log('🤖 Бот запущен')

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED ERROR:', err)
})