import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!token || !supabaseUrl || !supabaseKey) {
  console.error("Error: Environment variables are missing.");
  process.exit(1);
}

// Initialize Supabase Client
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize bot in polling mode
const bot = new TelegramBot(token, { polling: true });

/**
 * Automatically configure the native chat command menu dropdown 
 */
bot.setMyCommands([
  { command: 'start', description: '🚀 Open BlueCards Mini App' },
  { command: 'help', description: '❓ Get help' },
  { command: 'webapp', description: '🌐 Launch mini webapp' }
]).then(() => {
  console.log("✅ Bot commands menu successfully registered with Telegram API.");
});

// UI Content Templates
const ABOUT_TEXT = 
`ℹ️ *About BlueCards*

BlueCards is a premium fintech service designed to bridge the gap between local currency and global payments.

We provide high-quality virtual Visa and Mastercards that work exactly like physical bank cards. Whether you're paying for Netflix, shopping on Amazon, or running Facebook Ads, our cards ensure your transaction goes through.

*Why Choose Us?*
✅ *Flexible Funding:* Load exactly what you need.
✅ *Secure:* Your data is protected with bank-grade security.
✅ *Fast:* Cards are issued instantly upon payment.
✅ *No Monthly Fees:* Pay only for what you use.`;

const MAIN_MENU_TEXT = 
`💳 *ℹ️ About BlueCards*

BlueCards is a premium fintech service designed to bridge the gap between local currency and global payments.

We provide high-quality virtual Visa and Mastercards that work exactly like physical bank cards. Whether you're paying for Netflix, shopping on Amazon, or running Facebook Ads, our cards ensure your transaction goes through.

Why Choose Us?
✅ Flexible Funding: Load exactly what you need.
✅ Secure: Your data is protected with bank-grade security.
✅ Fast: Cards are issued instantly upon payment.
✅ No Monthly Fees: Pay only for what you use.`;

const WELCOME_UNREGISTERED_TEXT = 
`👋 *Welcome to BlueCards!*

To access our virtual card services, launch the mini-app, and receive important account updates, please register your account below.`;

/**
 * Menu Layout Configurations
 */
const getRegisterKeyboard = () => ({
  parse_mode: 'Markdown',
  reply_markup: {
    inline_keyboard: [
      [
        { text: "📝 Register to BlueCards", callback_data: "register_user" }
      ]
    ]
  }
});

const getMainMenuKeyboard = () => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🚀 Launch App", web_app: { url: webAppUrl } }
      ],
      [
        { text: "ℹ️ About BlueCards", callback_data: "view_about" },
        { text: "❓ Support Help", callback_data: "view_help" }
      ]
    ]
  }
});

const getAboutKeyboard = () => ({
  parse_mode: 'Markdown',
  reply_markup: {
    inline_keyboard: [
      [
        { text: "⬅️ Back to Menu", callback_data: "back_to_menu" }
      ]
    ]
  }
});

/**
 * Command Controllers
 */
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Check if the user is already registered in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('telegram_id', chatId)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      // User is not in the database, prompt them to register
      bot.sendMessage(chatId, WELCOME_UNREGISTERED_TEXT, getRegisterKeyboard());
    } else {
      // User exists, send standard main menu
      bot.sendMessage(chatId, MAIN_MENU_TEXT, {
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
    }
  } catch (err) {
    console.error("Database Error on /start:", err);
    bot.sendMessage(chatId, "⚠️ Service temporarily unavailable. Please try again later.");
  }
});

bot.onText(/\/webapp/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Click below to execute your secure standalone portal framework session:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌐 Launch Web App", web_app: { url: webAppUrl } }]
      ]
    }
  });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "💡 *Need Assistance?*\n\nIf you encounter deposit processing issues or need verification approval assistance, please contact our automated support channels.\n\nUse /start to go back.", { parse_mode: 'Markdown' });
});

/**
 * Inline Callback Query Routing Router 
 */
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const data = query.data;

  try {
    if (data === "register_user") {
      const telegramUser = query.from;

      // Insert user profile into Supabase
      const { error } = await supabase
        .from('users')
        .insert([{
          telegram_id: telegramUser.id,
          username: telegramUser.username || null,
          first_name: telegramUser.first_name || null,
          last_name: telegramUser.last_name || null
        }]);

      if (error) {
        // Handle constraint violation (e.g., they double-clicked register)
        if (error.code !== '23505') throw error; 
      }

      // Transition the user into the main app interface post-registration
      bot.editMessageText(`✅ *Registration Successful!*\n\n${MAIN_MENU_TEXT}`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
    } 
    else if (data === "view_about") {
      bot.editMessageText(ABOUT_TEXT, {
        chat_id: chatId,
        message_id: messageId,
        ...getAboutKeyboard()
      });
    } 
    else if (data === "back_to_menu" || data === "view_help") {
      const textTarget = data === "back_to_menu" 
        ? MAIN_MENU_TEXT 
        : "💡 *BlueCards Help Support Portal*\n\nReach out to admin operations or check out system configuration states down the line safely.";
      
      bot.editMessageText(textTarget, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        ...getMainMenuKeyboard()
      });
    }
  } catch (err) {
    console.error("Callback processing error:", err);
    bot.sendMessage(chatId, "⚠️ An error occurred while processing your request.");
  } finally {
    // Acknowledge the callback internally to remove the button loading spinner state
    bot.answerCallbackQuery(query.id);
  }
});

console.log("🚀 BlueCards Backend Gateway Listener Initialized Successfully.");