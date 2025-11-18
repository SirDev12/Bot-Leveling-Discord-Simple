const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addRoleReward, removeRoleReward, getRoleRewards } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolereward')
    .setDescription('Manage role rewards for levels (Admin only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a role reward for a level')
        .addIntegerOption(option =>
          option.setName('level')
            .setDescription('The level to give the role at')
            .setMinValue(1)
            .setRequired(true)
        )
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to give')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a role reward for a level')
        .addIntegerOption(option =>
          option.setName('level')
            .setDescription('The level to remove the reward from')
            .setMinValue(1)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all role rewards')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const level = interaction.options.getInteger('level');
      const role = interaction.options.getRole('role');

      await addRoleReward(interaction.guild.id, level, role.id);
      await interaction.reply({
        content: `✅ Added role reward: **${role.name}** at level **${level}**`,
        ephemeral: true
      });

    } else if (subcommand === 'remove') {
      const level = interaction.options.getInteger('level');

      await removeRoleReward(interaction.guild.id, level);
      await interaction.reply({
        content: `✅ Removed role reward for level **${level}**`,
        ephemeral: true
      });

    } else if (subcommand === 'list') {
      const rewards = await getRoleRewards(interaction.guild.id);

      if (rewards.length === 0) {
        return interaction.reply({
          content: '❌ No role rewards have been set up yet!',
          ephemeral: true
        });
      }

      let description = '**Role Rewards:**\n\n';
      for (const reward of rewards) {
        const role = interaction.guild.roles.cache.get(reward.role_id);
        const roleName = role ? role.name : 'Deleted Role';
        description += `Level **${reward.level}** → ${role ? role : roleName}\n`;
      }

      await interaction.reply({
        content: description,
        ephemeral: true
      });
    }
  },
};
