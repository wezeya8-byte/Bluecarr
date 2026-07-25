import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!token || !supabaseUrl || !supabaseKey) {
  console.error("Error: Missing Telegram Token or Supabase Credentials in .env");
  process.exit(1);
}

// Initialize Supabase and Telegram Bot
const supabase = createClient(supabaseUrl, supabaseKey);
const bot = new TelegramBot(token, { polling: true });

// InMemory Stores
const userLanguages = {};
const registrationState = {}; // Tracks if a user is currently typing their email

// Comprehensive Translation Dictionaries
const botDict = {
  am: {
    mainMenuText: `💳 *ℹ️ ስለ ብሉ ካርድ (BlueCards)*\n\nBlueCards የአካባቢ ገንዘብን ከዓለም አቀፍ ክፍያዎች ጋር ለማገናኘት የተነደፈ ዋና የፊንቴክ አገልግሎት ነው።\n\nፊዚካል የባንክ ካርዶችን የሚመስሉ ከፍተኛ ጥራት ያላቸውን የቪዛ እና የማስተርካርድ ቨርቹዋል ካርዶችን እናቀርባለን። በየትኛውም የዓለም ክፍሎች ክፍያዎችን በቀላሉ መፈጸም ይችላሉ።`,
    aboutText: `ℹ️ *ስለ ብሉ ካርድ (BlueCards)*\n\nBlueCards የአካባቢ ገንዘብን ከዓለም አቀፍ ክፍያዎች ጋር ለማገናኘት የተነደፈ ዋና የፊንቴክ አገልግሎት ነው።\n\n*ለምን መረጡን?*\n✅ *ተለዋዋጭ የገንዘብ ማስገቢያ:* የሚያስፈልጉዎትን ያህል ብቻ ይጫኑ።\n✅ *አስተማማኝ:* መረጃዎ በባንክ ደረጃ ደህንነቱ የተጠበቀ ነው።`,
    helpPortalText: `💡 *የብሉ ካርድ የእርዳታ እና ድጋፍ ፖርታል*\n\nየተቀማጭ ገንዘብ ማስገባት ችግር ካጋጠመዎት እባክዎን ያነጋግሩን።`,
    webappText: `ደህንነቱ የተጠበቀ ገጽዎን ለመክፈት ከታች ያለውን ቁልፍ ይጫኑ፡`,
    launchBtn: "🚀 አፕ ክፈት / Launch App",
    aboutBtn: "ℹ️ ስለ ብሉ ካርድ",
    supportBtn: "❓ እርዳታና ድጋፍ",
    langToggleBtn: "🌐 ቋንቋ ቀይር / Change Language",
    registerBtn: "📝 መመዝገቢያ / Register",
    backBtn: "⬅️ ወደ ዋና ማውጫ",
    chooseLang: "እባክዎ የሚመርጡትን ቋንቋ ይምረጡ:",
    langUpdated: "ቋንቋዎ በተሳካ ሁኔታ ወደ አማርኛ ተቀይሯል! 🇪🇹",
    askEmail: "እባክዎ መረጃዎችን እና አዳዲስ ማሳወቂያዎችን ለማግኘት የኢሜል አድራሻዎን ይጻፉልን (ለምሳሌ፡ name@gmail.com) 📧",
    invalidEmail: "❌ ያስገቡት ኢሜል ትክክል አይደለም። እባክዎ እንደገና ይሞክሩ።",
    registerSuccess: "✅ ምዝገባዎ በተሳካ ሁኔታ ተጠናቋል! እናመሰግናለን!"
  },
  en: {
    mainMenuText: `💳 *ℹ️ About BlueCards*\n\nBlueCards is a premium fintech service designed to bridge the gap between local currency and global payments.\n\nWe provide high-quality virtual Visa and Mastercards that work exactly like physical bank cards.`,
    aboutText: `ℹ️ *About BlueCards*\n\nBlueCards is a premium fintech service designed to bridge the gap between local currency and global payments.\n\n*Why Choose Us?*\n✅ *Flexible Funding:* Load exactly what you need.\n✅ *Secure:* Your data is protected with bank-grade security.`,
    helpPortalText: `💡 *BlueCards Help Support Portal*\n\nIf you encounter deposit processing issues, contact our support channels.`,
    webappText: `Click below to execute your secure standalone portal framework session:`,
    launchBtn: "🚀 Launch App",
    aboutBtn: "ℹ️ About BlueCards",
    supportBtn: "❓ Support Help",
    langToggleBtn: "🌐 Change Language",
    registerBtn: "📝 Register for Updates",
    backBtn: "⬅️ Back to Menu",
    chooseLang: "Please select your preferred language:",
    langUpdated: "Your language profile has been successfully set to English! 🇬🇧",
    askEmail: "Please type and send your email address to receive important account updates (e.g., name@gmail.com) 📧",
    invalidEmail: "❌ Invalid email format. Please try again.",
    registerSuccess: "✅ Registration complete! Thank you for joining us!"
  }
};

const t = (chatId, key) => {
  const currentLang = userLanguages[chatId] || 'am';
  return botDict[currentLang][key] || botDict['am'][key] || key;
};

// Configure the native chat command menu dropdown
bot.setMyCommands([
  { command: 'start', description: '🚀 Open BlueCards Mini App' },
  { command: 'help', description: '❓ Get help' },
  { command: 'webapp', description: '🌐 Launch mini webapp' }
]).then(() => {
  console.log("✅ Bot commands menu successfully registered with Telegram API.");
});

// Main Menu Layout Configuration (Includes the Register Button)
const getMainMenuKeyboard = (chatId) => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: t(chatId, 'launchBtn'), web_app: { url: webAppUrl } }
      ],
      [
        { text: t(chatId, 'registerBtn'), callback_data: "trigger_register" }
      ],
      [
        { text: t(chatId, 'aboutBtn'), callback_data: "view_about" },
        { text: t(chatId, 'supportBtn'), callback_data: "view_help" }
      ],
      [
        { text: t(chatId, 'langToggleBtn'), callback_data: "trigger_language_select" }
      ]
    ]
  }
});

const getAboutKeyboard = (chatId) => ({
  parse_mode: 'Markdown',
  reply_markup: {
    inline_keyboard: [[{ text: t(chatId, 'backBtn'), callback_data: "back_to_menu" }]]
  }
});

// Command Controllers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, t(chatId, 'mainMenuText'), {
    parse_mode: 'Markdown',
    ...getMainMenuKeyboard(chatId)
  });
});

bot.onText(/\/webapp/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, t(chatId, 'webappText'), {
    reply_markup: {
      inline_keyboard: [
        [{ text: t(chatId, 'launchBtn'), web_app: { url: webAppUrl } }]
      ]
    }
  });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, t(chatId, 'helpPortalText'), { parse_mode: 'Markdown' });
});

// Email Listener (Catches text input when state is 'awaiting_email')
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands
  if (!text || text.startsWith('/')) return;

  if (registrationState[chatId] === 'awaiting_email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(text)) {
      bot.sendMessage(chatId, t(chatId, 'invalidEmail'));
      return;
    }

    try {
      // Upsert user into Supabase 'users' table
      const { error } = await supabase
        .from('users')
        .upsert({
          chat_id: chatId.toString(),
          username: msg.chat.username || 'No Username',
          first_name: msg.chat.first_name || 'No Name',
          email: text,
          updated_at: new Date().toISOString()
        }, { onConflict: 'chat_id' });

      if (error) throw error;

      bot.sendMessage(chatId, t(chatId, 'registerSuccess'));
      delete registrationState[chatId]; // Clear their typing state

    } catch (err) {
      console.error("Supabase Error:", err);
      bot.sendMessage(chatId, "⚠️ Database connection error. Please try again later.");
    }
  }
});

// Callback Query Router
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  if (data === "view_about") {
    bot.editMessageText(t(chatId, 'aboutText'), { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', ...getAboutKeyboard(chatId) });
  } 
  else if (data === "back_to_menu") {
    bot.editMessageText(t(chatId, 'mainMenuText'), { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', ...getMainMenuKeyboard(chatId) });
  }
  else if (data === "view_help") {
    bot.editMessageText(t(chatId, 'helpPortalText'), { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', ...getAboutKeyboard(chatId) });
  }
  else if (data === "trigger_register") {
    registrationState[chatId] = 'awaiting_email'; // Activate listener
    bot.sendMessage(chatId, t(chatId, 'askEmail'));
  }
  else if (data === "trigger_language_select") {
    bot.editMessageText(t(chatId, 'chooseLang'), {
      chat_id: chatId,
      message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [{ text: "🇪🇹 አማርኛ (Amharic)", callback_data: "assign_lang_am" }],
          [{ text: "🇬🇧 English", callback_data: "assign_lang_en" }],
          [{ text: t(chatId, 'backBtn'), callback_data: "back_to_menu" }]
        ]
      }
    });
  }
  else if (data === "assign_lang_am" || data === "assign_lang_en") {
    userLanguages[chatId] = data === "assign_lang_am" ? 'am' : 'en';
    bot.editMessageText(t(chatId, 'langUpdated'), { chat_id: chatId, message_id: messageId }).then(() => {
      setTimeout(() => {
        bot.sendMessage(chatId, t(chatId, 'mainMenuText'), { parse_mode: 'Markdown', ...getMainMenuKeyboard(chatId) });
      }, 1200);
    });
  }

  bot.answerCallbackQuery(query.id);
});

console.log("🚀 BlueCards Backend Gateway Listener Initialized Successfully.");