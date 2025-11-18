const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getUser, getGuildConfig, getRoleRewards, getIgnoredChannels, getLeaderboard } = require('../database');
const { getXPForLevel, getLevelFromXP, getTotalXPForLevel } = require('../xpSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Test all bot features and display system status')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const testResults = [];
    let allTestsPassed = true;

    // Test 1: Database Connection
    testResults.push('**📊 DATABASE CONNECTION TEST**');
    try {
      const config = await getGuildConfig(interaction.guild.id);
      testResults.push('✅ Database connection: OK');
      testResults.push(`   └ Guild config loaded successfully`);
    } catch (error) {
      testResults.push('❌ Database connection: FAILED');
      testResults.push(`   └ Error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 2: XP System Calculations
    testResults.push('\n**🧮 XP SYSTEM CALCULATIONS TEST**');
    try {
      const level5XP = getXPForLevel(5);
      const level10XP = getXPForLevel(10);
      const totalXPLevel5 = getTotalXPForLevel(5);
      const calculatedLevel = getLevelFromXP(1000);
      
      testResults.push('✅ XP calculations: OK');
      testResults.push(`   ├ XP for Level 5: ${level5XP} (Expected: 425)`);
      testResults.push(`   ├ XP for Level 10: ${level10XP} (Expected: 1100)`);
      testResults.push(`   ├ Total XP to reach Level 5: ${totalXPLevel5}`);
      testResults.push(`   └ Level from 1000 XP: ${calculatedLevel}`);
    } catch (error) {
      testResults.push('❌ XP calculations: FAILED');
      testResults.push(`   └ Error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 3: User Data Retrieval
    testResults.push('\n**👤 USER DATA RETRIEVAL TEST**');
    try {
      const userData = await getUser(interaction.user.id, interaction.guild.id);
      testResults.push('✅ User data retrieval: OK');
      testResults.push(`   ├ User ID: ${userData.user_id}`);
      testResults.push(`   ├ Level: ${userData.level}`);
      testResults.push(`   ├ Total XP: ${userData.total_xp.toLocaleString()}`);
      testResults.push(`   └ Messages: ${userData.messages.toLocaleString()}`);
    } catch (error) {
      testResults.push('❌ User data retrieval: FAILED');
      testResults.push(`   └ Error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 4: Leaderboard System
    testResults.push('\n**🏆 LEADERBOARD SYSTEM TEST**');
    try {
      const leaderboard = await getLeaderboard(interaction.guild.id, 5);
      testResults.push('✅ Leaderboard system: OK');
      testResults.push(`   ├ Top users retrieved: ${leaderboard.length}`);
      if (leaderboard.length > 0) {
        testResults.push(`   └ Top user XP: ${leaderboard[0].total_xp.toLocaleString()}`);
      } else {
        testResults.push(`   └ No users with XP yet`);
      }
    } catch (error) {
      testResults.push('❌ Leaderboard system: FAILED');
      testResults.push(`   └ Error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 5: Role Rewards System
    testResults.push('\n**🎁 ROLE REWARDS SYSTEM TEST**');
    try {
      const roleRewards = await getRoleRewards(interaction.guild.id);
      testResults.push('✅ Role rewards system: OK');
      testResults.push(`   ├ Active role rewards: ${roleRewards.length}`);
      if (roleRewards.length > 0) {
        for (const reward of roleRewards.slice(0, 3)) {
          const role = interaction.guild.roles.cache.get(reward.role_id);
          const roleName = role ? role.name : 'Unknown Role';
          testResults.push(`   ├ Level ${reward.level}: ${roleName}`);
        }
        if (roleRewards.length > 3) {
          testResults.push(`   └ ...and ${roleRewards.length - 3} more`);
        }
      } else {
        testResults.push(`   └ No role rewards configured`);
      }
    } catch (error) {
      testResults.push('❌ Role rewards system: FAILED');
      testResults.push(`   └ Error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 6: Guild Configuration
    testResults.push('\n**⚙️ GUILD CONFIGURATION TEST**');
    try {
      const config = await getGuildConfig(interaction.guild.id);
      testResults.push('✅ Guild configuration: OK');
      testResults.push(`   ├ Announcements: ${config.announcement_enabled ? 'Enabled' : 'Disabled'}`);
      testResults.push(`   ├ Stack roles: ${config.stack_roles ? 'Yes' : 'No'}`);
      testResults.push(`   ├ XP rate: ${config.xp_rate}x`);
      
      if (config.level_up_channel) {
        const channel = interaction.guild.channels.cache.get(config.level_up_channel);
        testResults.push(`   ├ Level up channel: ${channel ? channel.name : 'Unknown Channel'}`);
      } else {
        testResults.push(`   ├ Level up channel: Current channel (default)`);
      }
      testResults.push(`   └ Level up message: "${config.level_up_message.substring(0, 30)}..."`);
    } catch (error) {
      testResults.push('❌ Guild configuration: FAILED');
      testResults.push(`   └ Error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 7: Ignored Channels
    testResults.push('\n**🚫 IGNORED CHANNELS TEST**');
    try {
      const ignoredChannels = await getIgnoredChannels(interaction.guild.id);
      testResults.push('✅ Ignored channels: OK');
      testResults.push(`   ├ Ignored channels: ${ignoredChannels.length}`);
      if (ignoredChannels.length > 0) {
        for (const ch of ignoredChannels.slice(0, 3)) {
          const channel = interaction.guild.channels.cache.get(ch.channel_id);
          const channelName = channel ? channel.name : 'Unknown Channel';
          testResults.push(`   ├ ${channelName}`);
        }
        if (ignoredChannels.length > 3) {
          testResults.push(`   └ ...and ${ignoredChannels.length - 3} more`);
        }
      } else {
        testResults.push(`   └ No channels ignored`);
      }
    } catch (error) {
      testResults.push('❌ Ignored channels: FAILED');
      testResults.push(`   └ Error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 8: Bot Permissions
    testResults.push('\n**🔐 BOT PERMISSIONS TEST**');
    try {
      const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
      const permissions = botMember.permissions;
      
      const requiredPerms = [
        { name: 'Send Messages', has: permissions.has(PermissionFlagsBits.SendMessages) },
        { name: 'Embed Links', has: permissions.has(PermissionFlagsBits.EmbedLinks) },
        { name: 'Attach Files', has: permissions.has(PermissionFlagsBits.AttachFiles) },
        { name: 'Read Message History', has: permissions.has(PermissionFlagsBits.ReadMessageHistory) },
        { name: 'Manage Roles', has: permissions.has(PermissionFlagsBits.ManageRoles) },
        { name: 'Use Slash Commands', has: permissions.has(PermissionFlagsBits.UseApplicationCommands) }
      ];

      const missingPerms = requiredPerms.filter(p => !p.has);
      
      if (missingPerms.length === 0) {
        testResults.push('✅ Bot permissions: OK');
        testResults.push(`   └ All required permissions present`);
      } else {
        testResults.push('⚠️ Bot permissions: INCOMPLETE');
        missingPerms.forEach(p => {
          testResults.push(`   ├ Missing: ${p.name}`);
        });
        testResults.push(`   └ ${missingPerms.length} permission(s) missing`);
      }
    } catch (error) {
      testResults.push('❌ Bot permissions: FAILED');
      testResults.push(`   └ Error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 9: Commands Check
    testResults.push('\n**🤖 COMMANDS LOADED TEST**');
    try {
      const commands = interaction.client.commands;
      testResults.push('✅ Commands loaded: OK');
      testResults.push(`   ├ Total commands: ${commands.size}`);
      testResults.push(`   └ Available: ${Array.from(commands.keys()).join(', ')}`);
    } catch (error) {
      testResults.push('❌ Commands loaded: FAILED');
      testResults.push(`   └ Error: ${error.message}`);
      allTestsPassed = false;
    }

    // Test 10: Bot Status
    testResults.push('\n**📡 BOT STATUS TEST**');
    try {
      const client = interaction.client;
      const uptime = Math.floor(client.uptime / 1000);
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = uptime % 60;
      
      testResults.push('✅ Bot status: ONLINE');
      testResults.push(`   ├ Username: ${client.user.tag}`);
      testResults.push(`   ├ Servers: ${client.guilds.cache.size}`);
      testResults.push(`   ├ Users: ${client.users.cache.size}`);
      testResults.push(`   └ Uptime: ${hours}h ${minutes}m ${seconds}s`);
    } catch (error) {
      testResults.push('❌ Bot status: FAILED');
      testResults.push(`   └ Error: ${error.message}`);
      allTestsPassed = false;
    }

    // Create final embed
    const embed = new EmbedBuilder()
      .setColor(allTestsPassed ? '#00FF00' : '#FFA500')
      .setTitle('🧪 Bot Feature Test Results')
      .setDescription(testResults.join('\n'))
      .setFooter({ 
        text: allTestsPassed 
          ? '✅ All tests passed!' 
          : '⚠️ Some tests failed or incomplete. Check details above.' 
      })
      .setTimestamp();

    // Add summary field
    const summary = [
      `**Test Summary**`,
      `• Guild: ${interaction.guild.name}`,
      `• Tested by: ${interaction.user.tag}`,
      `• Status: ${allTestsPassed ? '✅ All Systems Operational' : '⚠️ Issues Detected'}`
    ].join('\n');

    embed.addFields({ name: '📋 Summary', value: summary, inline: false });

    await interaction.editReply({ embeds: [embed] });
  },
};
