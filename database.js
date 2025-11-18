const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('leveling.sqlite');

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      total_xp INTEGER DEFAULT 0,
      messages INTEGER DEFAULT 0,
      last_message BIGINT DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS voice_time (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      total_time INTEGER DEFAULT 0,
      join_time BIGINT DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id TEXT PRIMARY KEY,
      level_up_channel TEXT DEFAULT NULL,
      level_up_message TEXT DEFAULT 'GG {user}, you just advanced to level {level}!',
      xp_rate INTEGER DEFAULT 1,
      announcement_enabled INTEGER DEFAULT 1,
      stack_roles INTEGER DEFAULT 1
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS role_rewards (
      guild_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, level)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ignored_channels (
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, channel_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ignored_roles (
      guild_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, role_id)
    )
  `);
});

module.exports = {
  db,
  
  getUser: async (userId, guildId) => {
    await run('INSERT OR IGNORE INTO users (user_id, guild_id) VALUES (?, ?)', [userId, guildId]);
    return await get('SELECT * FROM users WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
  },
  
  updateUser: async (userId, guildId, xp, level, totalXp, messages, lastMessage) => {
    return await run(
      'UPDATE users SET xp = ?, level = ?, total_xp = ?, messages = ?, last_message = ? WHERE user_id = ? AND guild_id = ?',
      [xp, level, totalXp, messages, lastMessage, userId, guildId]
    );
  },
  
  getLeaderboard: async (guildId, limit = 10) => {
    return await all(
      'SELECT user_id, xp, level, total_xp, messages FROM users WHERE guild_id = ? ORDER BY total_xp DESC LIMIT ?',
      [guildId, limit]
    );
  },
  
  getUserRank: async (userId, guildId) => {
    const result = await get(
      `SELECT COUNT(*) + 1 as rank FROM users WHERE guild_id = ? AND total_xp > (SELECT total_xp FROM users WHERE user_id = ? AND guild_id = ?)`,
      [guildId, userId, guildId]
    );
    return result ? result.rank : 0;
  },
  
  resetUserXP: async (userId, guildId) => {
    return await run(
      'UPDATE users SET xp = 0, level = 0, total_xp = 0, messages = 0 WHERE user_id = ? AND guild_id = ?',
      [userId, guildId]
    );
  },
  
  resetAllXP: async (guildId) => {
    return await run(
      'UPDATE users SET xp = 0, level = 0, total_xp = 0, messages = 0 WHERE guild_id = ?',
      [guildId]
    );
  },
  
  getGuildConfig: async (guildId) => {
    await run('INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)', [guildId]);
    return await get('SELECT * FROM guild_config WHERE guild_id = ?', [guildId]);
  },
  
  updateGuildConfig: async (guildId, config) => {
    return await run(
      'UPDATE guild_config SET level_up_channel = ?, level_up_message = ?, xp_rate = ?, announcement_enabled = ?, stack_roles = ? WHERE guild_id = ?',
      [config.level_up_channel, config.level_up_message, config.xp_rate, config.announcement_enabled, config.stack_roles, guildId]
    );
  },
  
  getRoleRewards: async (guildId) => {
    return await all('SELECT * FROM role_rewards WHERE guild_id = ? ORDER BY level ASC', [guildId]);
  },
  
  getRoleReward: async (guildId, level) => {
    return await get('SELECT * FROM role_rewards WHERE guild_id = ? AND level = ?', [guildId, level]);
  },
  
  addRoleReward: async (guildId, level, roleId) => {
    return await run('INSERT OR REPLACE INTO role_rewards (guild_id, level, role_id) VALUES (?, ?, ?)', [guildId, level, roleId]);
  },
  
  removeRoleReward: async (guildId, level) => {
    return await run('DELETE FROM role_rewards WHERE guild_id = ? AND level = ?', [guildId, level]);
  },

  getIgnoredChannels: async (guildId) => {
    return await all('SELECT channel_id FROM ignored_channels WHERE guild_id = ?', [guildId]);
  },
  
  addIgnoredChannel: async (guildId, channelId) => {
    return await run('INSERT OR IGNORE INTO ignored_channels (guild_id, channel_id) VALUES (?, ?)', [guildId, channelId]);
  },
  
  removeIgnoredChannel: async (guildId, channelId) => {
    return await run('DELETE FROM ignored_channels WHERE guild_id = ? AND channel_id = ?', [guildId, channelId]);
  },
  
  getVoiceTime: async (userId, guildId) => {
    return await get('SELECT * FROM voice_time WHERE user_id = ? AND guild_id = ?', [userId, guildId]);
  },
  
  updateVoiceTime: async (userId, guildId, totalTime, joinTime) => {
    return await run(
      'INSERT OR REPLACE INTO voice_time (user_id, guild_id, total_time, join_time) VALUES (?, ?, ?, ?)',
      [userId, guildId, totalTime, joinTime]
    );
  }
};
