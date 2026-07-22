import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

if (!token) {
  console.error("Error: TELEGRAM_BOT_TOKEN is missing in your environment variables.");
  process.exit(1);
}

// Initialize bot in polling mode
const bot = new TelegramBot(token, { polling: true });

// 1. InMemory Store tracking language preferences { chatId: 'am' | 'en' }
const userLanguages = {};

// 2. Comprehensive Amharic and English Translation Dictionaries
const botDict = {
  am: {
    mainMenuText: `💳 *ℹ️ ስለ ብሉ ካርድ (BlueCards)*\n\nBlueCards የአካባቢ ገንዘብን ከዓለም አቀፍ ክፍያዎች ጋር ለማገናኘት የተነደፈ ዋና የፊንቴክ አገልግሎት ነው።\n\nፊዚካል የባንክ ካርዶችን የሚመስሉ ከፍተኛ ጥራት ያላቸውን የቪዛ እና የማስተርካርድ ቨርቹዋል ካርዶችን እናቀርባለን። በየትኛውም የዓለም ክፍሎች ክፍያዎችን በቀላሉ መፈጸም ይችላሉ።`,
    aboutText: `ℹ️ *ስለ ብሉ ካርድ (BlueCards)*\n\nBlueCards የአካባቢ ገንዘብን ከዓለም አቀፍ ክፍያዎች ጋር ለማገናኘት የተነደፈ ዋና የፊንቴክ አገልግሎት ነው።\n\nፊዚካል የባንክ ካርዶችን የሚመስሉ ከፍተኛ ጥራት ያላቸውን የቪዛ እና የማስተርካርድ ቨርቹዋል ካርዶችን እናቀርባለን። ለኔትፍሊክስ፣ ለአማዞን ግብይት፣ ወይም ለፌስቡክ ማስታወቂያዎች ክፍያ እየፈጸሙ ይሁኑ፣ የእኛ ካርዶች ግብይትዎ በስኬት እንዲጠናቀቅ ያረጋግጣሉ።\n\n*ለምን መረጡን?*\n✅ *ተለዋዋጭ የገንዘብ ማስገቢያ:* የሚያስፈልጉዎትን ያህል ብቻ ይጫኑ።\n✅ *አስተማማኝ:* መረጃዎ በባንክ ደረጃ ደህንነቱ የተጠበቀ ነው።\n✅ *ፈጣን:* ክፍያ እንደፈጸሙ ካርዶች ወዲያውኑ ይወጣሉ።\n✅ *ወርሃዊ ክፍያ የሌለው:* ለተጠቀሙበት ብቻ ይክፈሉ፡፡`,
    helpPortalText: `💡 *የብሉ ካርድ የእርዳታ እና ድጋፍ ፖርታል*\n\nየተቀማጭ ገንዘብ ማስገባት ችግር ካጋጠመዎት ወይም የማረጋገጫ እገዛ ከፈለጉ እባክዎን የድጋፍ መስመራችንን ያነጋግሩ።\n\nለመመለስ /start ይጠቀሙ።`,
    webappText: `ደህንነቱ የተጠበቀ ገጽዎን ለመክፈት ከታች ያለውን ቁልፍ ይጫኑ፡`,
    launchBtn: "🚀 አፕ ክፈት / Launch App",
    aboutBtn: "ℹ️ ስለ ብሉ ካርድ",
    supportBtn: "❓ እርዳታና ድጋፍ",
    langToggleBtn: "🌐 ቋንቋ ቀይር / Change Language",
    backBtn: "⬅️ ወደ ዋና ማውጫ",
    chooseLang: "እባክዎ የሚመርጡትን ቋንቋ ይምረጡ / Please select your preferred language:",
    langUpdated: "ቋንቋዎ በተሳካ ሁኔታ ወደ አማርኛ ተቀይሯል! 🇪🇹"
  },
  en: {
    mainMenuText: `💳 *ℹ️ About BlueCards*\n\nBlueCards is a premium fintech service designed to bridge the gap between local currency and global payments.\n\nWe provide high-quality virtual Visa and Mastercards that work exactly like physical bank cards. Whether you're paying for Netflix, shopping on Amazon, or running Facebook Ads, our cards ensure your transaction goes through.`,
    aboutText: `ℹ️ *About BlueCards*\n\nBlueCards is a premium fintech service designed to bridge the gap between local currency and global payments.\n\nWe provide high-quality virtual Visa and Mastercards that work exactly like physical bank cards. Whether you're paying for Netflix, shopping on Amazon, or running Facebook Ads, our cards ensure your transaction goes through.\n\n*Why Choose Us?*\n✅ *Flexible Funding:* Load exactly what you need.\n✅ *Secure:* Your data is protected with bank-grade security.\n✅ *Fast:* Cards are issued instantly upon payment.\n✅ *No Monthly Fees:* Pay only for what you use.`,
    helpPortalText: `💡 *BlueCards Help Support Portal*\n\nIf you encounter deposit processing issues or need verification approval assistance, please contact our automated support channels.\n\nUse /start to go back.`,
    webappText: `Click below to execute your secure standalone portal framework session:`,
    launchBtn: "🚀 Launch App",
    aboutBtn: "ℹ️ About BlueCards",
    supportBtn: "❓ Support Help",
    langToggleBtn: "🌐 Change Language",
    backBtn: "⬅️ Back to Menu",
    chooseLang: "Please select your preferred language / እባክዎ የሚመርጡትን ቋንቋ ይምረጡ:",
    langUpdated: "Your language profile has been successfully set to English! 🇬🇧"
  }
};

// 3. Dynamic localization helper function
const t = (chatId, key) => {
  const currentLang = userLanguages[chatId] || 'am'; // Defaults directly to Amharic
  return botDict[currentLang][key] || botDict['am'][key] || key;
};

/**
 * Configure the native chat command menu dropdown 
 */
bot.setMyCommands([
  { command: 'start', description: '🚀 Open BlueCards Mini App' },
  { command: 'help', description: '❓ Get help' },
  { command: 'webapp', description: '🌐 Launch mini webapp' }
]).then(() => {
  console.log("✅ Bot commands menu successfully registered with Telegram API.");
});

/**
 * Menu Layout Configurations (Localized dynamically using chatId)
 */
const getMainMenuKeyboard = (chatId) => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: t(chatId, 'launchBtn'), web_app: { url: webAppUrl } }
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
    inline_keyboard: [
      [
        { text: t(chatId, 'backBtn'), callback_data: "back_to_menu" }
      ]
    ]
  }
});

/**
 * Command Controllers
 */
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

/**
 * Inline Callback Query Routing Router 
 */
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  if (data === "view_about") {
    bot.editMessageText(t(chatId, 'aboutText'), {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...getAboutKeyboard(chatId)
    });
  } 
  else if (data === "back_to_menu") {
    bot.editMessageText(t(chatId, 'mainMenuText'), {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...getMainMenuKeyboard(chatId)
    });
  }
  else if (data === "view_help") {
    bot.editMessageText(t(chatId, 'helpPortalText'), {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      ...getAboutKeyboard(chatId) // Standard single return interface link
    });
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
    const designatedLanguage = data === "assign_lang_am" ? 'am' : 'en';
    
    // Save language update inside preference configuration profile
    userLanguages[chatId] = designatedLanguage;

    // Send confirmation and render out the newly translated home menu
    bot.editMessageText(t(chatId, 'langUpdated'), {
      chat_id: chatId,
      message_id: messageId,
    }).then(() => {
      // Small timeout buffer lets the user read validation completion toast before menu shifts back
      setTimeout(() => {
        bot.sendMessage(chatId, t(chatId, 'mainMenuText'), {
          parse_mode: 'Markdown',
          ...getMainMenuKeyboard(chatId)
        });
      }, 1200);
    });
  }

  // Acknowledge the callback internally to remove the button loading spinner state
  bot.answerCallbackQuery(query.id);
});

console.log("🚀 BlueCards Backend Gateway Listener Initialized Successfully.");
