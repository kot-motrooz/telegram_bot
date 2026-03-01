require('dotenv').config();
const TelegramApi = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const messages = require('./messages');
const options = require('./options');

const token = process.env.TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

if (!token) {
    console.error('❌ TOKEN не найден в .env');
    process.exit(1);
}

const bot = new TelegramApi(token, { polling: true });

// ------------------ DATA ------------------
const dataPath = path.join(__dirname, 'animeData.json');
const statsPath = path.join(__dirname, 'stats.json');

const loadData = () => {
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '{}');
    return JSON.parse(fs.readFileSync(dataPath));
};
const saveData = (data) => fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
let animeData = loadData();

const loadStats = () => {
    if (!fs.existsSync(statsPath)) fs.writeFileSync(statsPath, '{}');
    return JSON.parse(fs.readFileSync(statsPath));
};
const saveStats = (data) => fs.writeFileSync(statsPath, JSON.stringify(data, null, 2));
let userStats = loadStats();

const userState = {};
const gameData = {};

// ------------------ HELPERS ------------------
const sendScreen = async (chatId, messageId, text, keyboard) => {
    try {
        return await bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'HTML',
            reply_markup: keyboard
        });
    } catch {
        return bot.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            reply_markup: keyboard
        });
    }
};

const updateStats = (chatId, result) => {
    if (!userStats[chatId]) userStats[chatId] = { wins: 0, losses: 0 };
    if (result === 'win') userStats[chatId].wins += 1;
    if (result === 'loss') userStats[chatId].losses += 1;
    saveStats(userStats);
};

const searchAnime = async (chatId, code) => {
    if (typeof code !== 'string') return;

    const upper = code.trim().toUpperCase();
    const anime = animeData[upper];

    if (!anime) {
        return bot.sendMessage(chatId, messages.notFound(upper), {
            parse_mode: 'HTML'
        });
    }

    return bot.sendPhoto(chatId, anime.image, {
        caption: messages.animeCaption(anime.title, upper),
        parse_mode: 'HTML',
        reply_markup: options.animeScreen.reply_markup
    });
};

const startGame = async (chatId, messageId) => {
    const number = Math.floor(Math.random() * 10);
    gameData[chatId] = number;

    return sendScreen(
        chatId,
        messageId,
        messages.gameStart,
        options.gameOptions.reply_markup
    );
};

const addAnime = (chatId, text) => {
    if (String(chatId) !== ADMIN_ID) return bot.sendMessage(chatId, messages.noAccess);

    const parts = text.split(' ');
    if (parts.length < 4) return bot.sendMessage(chatId, messages.addFormat);

    const code = parts[1].toUpperCase();
    const title = parts[2];
    const image = parts[3];

    animeData[code] = { title, image };
    saveData(animeData);

    bot.sendMessage(chatId, messages.addSuccess);
};

// ------------------ COMMANDS ------------------
bot.setMyCommands([
    { command: 'start', description: 'Главное меню' },
    { command: 'game', description: 'Игра' }
]);

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, messages.start, {
        parse_mode: 'HTML',
        ...options.mainMenu
    });
});

// ------------------ MESSAGES ------------------
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text) return;

    if (text.startsWith('/add')) return addAnime(chatId, text);

    if (userState[chatId] === 'search') {
        delete userState[chatId];
        return searchAnime(chatId, text);
    }
});

// ------------------ CALLBACKS ------------------
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    try {
        await bot.answerCallbackQuery(query.id);
    } catch (err) {
        console.log('Callback expired');
    }

    if (data === 'back') {
        return sendScreen(
            chatId,
            messageId,
            messages.start,
            options.mainMenu.reply_markup
        );
    }

    if (data === 'go_search') {
        userState[chatId] = 'search';
        return sendScreen(
            chatId,
            messageId,
            '🔎 <b>Введите код аниме:</b>',
            options.searchScreen.reply_markup
        );
    }

    if (data === 'info') {
        return sendScreen(
            chatId,
            messageId,
            '🤖 <b>Информация о боте</b>\n\nПоиск аниме и игра.',
            options.backToMenu.reply_markup
        );
    }

    if (data === 'stats') {
        const stats = userStats[chatId] || { wins: 0, losses: 0 };
        return sendScreen(
            chatId,
            messageId,
            `📊 <b>Ваша статистика</b>\n\n🟢 Побед: ${stats.wins}\n🔴 Поражений: ${stats.losses}`,
            options.backToMenu.reply_markup
        );
    }

    if (data === 'game') return startGame(chatId, messageId);

    if (gameData[chatId] !== undefined && /^[0-9]$/.test(data)) {
        const number = gameData[chatId];
        delete gameData[chatId];

        let resultText, resultType;
        if (parseInt(data) === number) {
            resultText = messages.gameWin(number);
            resultType = 'win';
        } else {
            resultText = messages.gameLose(number);
            resultType = 'loss';
        }

        updateStats(chatId, resultType);

        return sendScreen(
            chatId,
            messageId,
            resultText,
            options.againOptions.reply_markup
        );
    }
});

console.log('🤖 Бот запущен!');