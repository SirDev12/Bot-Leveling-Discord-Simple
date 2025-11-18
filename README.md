# Discord Leveling Bot (ProBot-like)

A Discord bot with a leveling system similar to ProBot, featuring XP gain, level rewards, and leaderboards.

## Features

### Core Features
- 🎮 **XP System** - Earn 15-25 XP per message (60 second cooldown)
- 📊 **Leveling** - Level up based on ProBot's formula: `5 * (level^2) + 50 * level + 100`
- 🏆 **Leaderboard** - View top members by XP
- 🎯 **Rank Card** - Check your or others' rank with detailed stats
- 🎁 **Role Rewards** - Auto-assign roles when reaching specific levels
- 🔧 **Admin Commands** - Manage XP and configure the system
- 📢 **Level Up Notifications** - Customizable level up messages

### ✨ NEW Advanced Features
- 📊 **Detailed Statistics** - View comprehensive user stats with progress bars
- 🎯 **Milestone Tracking** - Track progress toward next goals and rewards
- ⚔️ **User Comparison** - Compare stats with other users
- 🏅 **Category Leaderboards** - Top users by XP, level, or messages
- ⚙️ **Advanced Configuration** - Easy-to-use config commands for all settings
- 🚫 **Channel Management** - Ignore specific channels for XP gain
- 💾 **Backup & Export** - Backup your data and export user statistics
- 🌐 **Server Statistics** - View comprehensive server-wide analytics
- ❓ **Interactive Help** - User-friendly help menu with all commands
- 🧪 **Diagnostic Tools** - Test all bot features with one command

## Installation

1. **Clone or download this bot**

2. **Install dependencies**
```bash
npm install
```

3. **Configure your bot**
   - Rename `.env` file and fill in your details:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here (optional, for faster command deployment)
   ```

4. **Deploy slash commands**
```bash
npm run deploy
```

5. **Start the bot**
```bash
npm start
```

## Commands

### 👤 User Commands (9)
- `/rank [user]` - View your or another user's rank card with level and XP
- `/leaderboard [page]` - View the server leaderboard (top 10 per page)
- `/stats [user]` - View detailed statistics and progress for a user ✨ **NEW**
- `/rewards` - View all available role rewards and required levels ✨ **NEW**
- `/milestone [user]` - View your next goals and milestones ✨ **NEW**
- `/compare <user>` - Compare your stats with another user ✨ **NEW**
- `/top <category> [amount]` - View top users by XP, level, or messages ✨ **NEW**
- `/server` - View server-wide leveling statistics ✨ **NEW**
- `/help` - Interactive help menu with all commands ✨ **NEW**

### ⚙️ Admin Commands (9)
- `/config <setting>` - Configure bot settings (xprate, levelchannel, announcement, stackroles, message, view) ✨ **NEW**
- `/addxp <user> <amount>` - Add XP to a user
- `/removexp <user> <amount>` - Remove XP from a user
- `/setxp <user> <xp>` - Set a user's total XP
- `/resetxp [user]` - Reset XP for a user or entire server
- `/rolereward <add|remove|list>` - Manage role rewards for levels
- `/ignored <add|remove|list>` - Manage channels where XP gain is disabled ✨ **NEW**
- `/backup <create|export>` - Backup or export server data ✨ **NEW**
- `/test` - Test all bot features and display system status

### 🎉 Total: 18 Commands (10 NEW commands added!)

> 📚 **See [NEW_FEATURES.md](NEW_FEATURES.md) for detailed documentation of all new features!**

## How It Works

### XP System
- Users earn **15-25 random XP** per message
- **60 second cooldown** between XP gains
- Bots don't earn XP
- Can ignore specific channels (feature ready in database)

### Level Formula
The bot uses ProBot's exact leveling formula:
```
XP needed for next level = 5 * (current_level^2) + 50 * current_level + 100
```

Examples:
- Level 0 → 1: 100 XP
- Level 1 → 2: 155 XP
- Level 2 → 3: 220 XP
- Level 10 → 11: 1,100 XP

### Role Rewards
- Set up role rewards using `/rolereward add`
- Roles are automatically given when users reach the specified level
- Can be configured to stack roles or only give the highest level role
- Supports multiple role rewards at different levels

## Database

The bot uses SQLite database with the following tables:
- `users` - Stores user XP, levels, and message count
- `guild_config` - Server-specific settings
- `role_rewards` - Level-based role rewards
- `voice_time` - Voice channel time tracking (for future updates)
- `ignored_channels` - Channels where XP gain is disabled
- `ignored_roles` - Roles that don't earn XP

## Configuration

Default configuration (can be customized in database):
- **XP per message**: 15-25 (random)
- **Cooldown**: 60 seconds
- **Level up message**: "GG {user}, you just advanced to level {level}!"
- **Announcements**: Enabled by default
- **Stack roles**: Enabled by default

## Bot Permissions Required

Make sure your bot has these permissions:
- Read Messages/View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Use Slash Commands
- Manage Roles (for role rewards)

## Troubleshooting

**Commands not showing up?**
- Make sure you ran `npm run deploy`
- Check if CLIENT_ID and DISCORD_TOKEN are correct
- For faster deployment, use GUILD_ID in .env

**Role rewards not working?**
- Ensure the bot's role is higher than the reward roles
- Check if the bot has "Manage Roles" permission

**XP not being awarded?**
- Check if 60 seconds have passed since last message
- Ensure the user is not a bot
- Verify the channel is not in ignored channels list

## Future Features
- Voice XP tracking
- XP multipliers for specific channels/roles
- Custom XP amounts per message
- Weekly/Monthly leaderboard resets
- Level up card images with Canvas

## Support

For issues or questions, please create an issue on GitHub or contact the developer.

## License

MIT License - Feel free to modify and use for your own Discord server!
