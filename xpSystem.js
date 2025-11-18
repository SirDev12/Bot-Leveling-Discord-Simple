const { getUser, updateUser, getRoleRewards, getGuildConfig, getIgnoredChannels } = require('./database');

function getXPForLevel(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}
function getTotalXPForLevel(level) {
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

function getLevelFromXP(totalXP) {
  let level = 0;
  let xpNeeded = 0;
  
  while (totalXP >= xpNeeded) {
    xpNeeded += getXPForLevel(level);
    if (totalXP >= xpNeeded) {
      level++;
    }
  }
  
  return level;
}

function getCurrentLevelXP(totalXP) {
  const level = getLevelFromXP(totalXP);
  const xpForCurrentLevel = getTotalXPForLevel(level);
  return totalXP - xpForCurrentLevel;
}

function getRandomXP(min = 15, max = 25) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function shouldIgnoreChannel(guildId, channelId) {
  const ignoredChannels = await getIgnoredChannels(guildId);
  return ignoredChannels.some(ch => ch.channel_id === channelId);
}

async function addXP(message) {
  if (message.author.bot) return null;
  if (!message.guild) return null;

  const userId = message.author.id;
  const guildId = message.guild.id;

  if (await shouldIgnoreChannel(guildId, message.channel.id)) {
    return null;
  }

  const userData = await getUser(userId, guildId);
  const config = await getGuildConfig(guildId);

  const now = Date.now();
  const cooldown = 60000; // 60 seconds
  
  if (userData.last_message && (now - userData.last_message) < cooldown) {
    return null;
  }

  const xpGain = getRandomXP() * (config.xp_rate || 1);
  const newTotalXP = userData.total_xp + xpGain;
  const oldLevel = userData.level;
  const newLevel = getLevelFromXP(newTotalXP);
  const currentXP = getCurrentLevelXP(newTotalXP);
  const newMessages = userData.messages + 1;

  await updateUser(userId, guildId, currentXP, newLevel, newTotalXP, newMessages, now);

  if (newLevel > oldLevel) {
    return {
      leveledUp: true,
      oldLevel,
      newLevel,
      totalXP: newTotalXP,
      currentXP,
      xpForNextLevel: getXPForLevel(newLevel),
      user: message.author,
      member: message.member,
      guildId
    };
  }

  return {
    leveledUp: false,
    level: newLevel,
    totalXP: newTotalXP,
    currentXP,
    xpForNextLevel: getXPForLevel(newLevel)
  };
}

async function handleRoleRewards(member, level, guildId) {
  const roleRewards = await getRoleRewards(guildId);
  const config = await getGuildConfig(guildId);
  
  if (roleRewards.length === 0) return;

  const rewardsToGive = roleRewards.filter(reward => reward.level <= level);
  
  if (config.stack_roles === 1) {
    for (const reward of rewardsToGive) {
      const role = member.guild.roles.cache.get(reward.role_id);
      if (role && !member.roles.cache.has(reward.role_id)) {
        try {
          await member.roles.add(role);
        } catch (error) {
          console.error(`Failed to add role ${role.name}:`, error);
        }
      }
    }
  } else {
    const highestReward = rewardsToGive[rewardsToGive.length - 1];
    if (highestReward) {
      const role = member.guild.roles.cache.get(highestReward.role_id);
      
      for (const reward of roleRewards) {
        if (reward.level !== highestReward.level) {
          const oldRole = member.guild.roles.cache.get(reward.role_id);
          if (oldRole && member.roles.cache.has(reward.role_id)) {
            try {
              await member.roles.remove(oldRole);
            } catch (error) {
              console.error(`Failed to remove role ${oldRole.name}:`, error);
            }
          }
        }
      }
      
      if (role && !member.roles.cache.has(highestReward.role_id)) {
        try {
          await member.roles.add(role);
        } catch (error) {
          console.error(`Failed to add role ${role.name}:`, error);
        }
      }
    }
  }
}

module.exports = {
  getXPForLevel,
  getTotalXPForLevel,
  getLevelFromXP,
  getCurrentLevelXP,
  getRandomXP,
  addXP,
  handleRoleRewards
};
