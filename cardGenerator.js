let createCanvas, loadImage, registerFont;
let canvasAvailable = true;

try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  loadImage = canvas.loadImage;
  registerFont = canvas.registerFont;
} catch (error) {
  console.log('⚠️  Canvas module not available - rank cards will use embed format');
  canvasAvailable = false;
}

const path = require('path');

// Helper function to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

// Apply text with shadow effect
function applyText(canvas, text, fontSize, maxWidth) {
  const ctx = canvas.getContext('2d');
  let currentSize = fontSize;

  do {
    ctx.font = `bold ${currentSize}px Arial`;
    currentSize -= 2;
  } while (ctx.measureText(text).width > maxWidth && currentSize > 10);

  return ctx.font;
}

// Create rank card
async function createRankCard(userData, member) {
  // If canvas not available, return null
  if (!canvasAvailable) {
    return null;
  }
  // Canvas dimensions
  const width = 934;
  const height = 282;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add overlay pattern
  ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let i = 0; i < width; i += 20) {
    ctx.fillRect(i, 0, 2, height);
  }

  // Main card background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  roundRect(ctx, 20, 20, width - 40, height - 40, 20);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  roundRect(ctx, 20, 20, width - 40, height - 40, 20);
  ctx.stroke();

  // Load and draw server icon (logo) - Medium size in top right
  const serverIconSize = 80;
  const serverIconX = width - serverIconSize - 40;
  const serverIconY = 35;

  try {
    const guild = member.guild;
    if (guild.iconURL()) {
      const serverIcon = await loadImage(
        guild.iconURL({ extension: 'png', size: 128 })
      );

      // Draw server icon circle background with shadow
      ctx.save();
      
      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      
      ctx.beginPath();
      ctx.arc(serverIconX + serverIconSize / 2, serverIconY + serverIconSize / 2, serverIconSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw server icon
      ctx.drawImage(serverIcon, serverIconX, serverIconY, serverIconSize, serverIconSize);
      ctx.restore();

      // Server icon border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(serverIconX + serverIconSize / 2, serverIconY + serverIconSize / 2, serverIconSize / 2 + 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  } catch (error) {
    console.error('Error loading server icon:', error);
  }

  // Load and draw avatar with circular mask
  const avatarSize = 180;
  const avatarX = 50;
  const avatarY = 51;

  try {
    const avatar = await loadImage(
      member.user.displayAvatarURL({ extension: 'png', size: 256 })
    );

    // Draw avatar circle background
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw avatar
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Avatar border with gradient
    const avatarGradient = ctx.createLinearGradient(
      avatarX, avatarY, 
      avatarX + avatarSize, avatarY + avatarSize
    );
    avatarGradient.addColorStop(0, '#5865F2');
    avatarGradient.addColorStop(1, '#57F287');
    
    ctx.strokeStyle = avatarGradient;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
  } catch (error) {
    console.error('Error loading avatar:', error);
    // Draw default avatar circle
    ctx.fillStyle = '#5865F2';
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Username
  ctx.fillStyle = '#FFFFFF';
  ctx.font = applyText(canvas, member.user.username, 42, 550);
  ctx.fillText(member.user.username, 270, 90);

  // Discriminator (if exists)
  if (member.user.discriminator && member.user.discriminator !== '0') {
    ctx.fillStyle = '#B9BBBE';
    ctx.font = '28px Arial';
    const usernameWidth = ctx.measureText(member.user.username).width;
    ctx.fillText(`#${member.user.discriminator}`, 270 + usernameWidth + 10, 90);
  }

  // Rank and Level boxes
  const boxY = 120;
  const boxHeight = 50;
  const boxWidth = 150;

  // Rank box
  ctx.fillStyle = 'rgba(88, 101, 242, 0.2)';
  roundRect(ctx, 270, boxY, boxWidth, boxHeight, 10);
  ctx.fill();

  ctx.fillStyle = '#5865F2';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('RANK', 285, boxY + 22);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`#${userData.rank}`, 285, boxY + 45);

  // Level box
  ctx.fillStyle = 'rgba(87, 242, 135, 0.2)';
  roundRect(ctx, 440, boxY, boxWidth, boxHeight, 10);
  ctx.fill();

  ctx.fillStyle = '#57F287';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('LEVEL', 455, boxY + 22);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`${userData.level}`, 455, boxY + 45);

  // XP Progress bar
  const barX = 270;
  const barY = 195;
  const barWidth = 624;
  const barHeight = 40;

  // Progress bar background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  roundRect(ctx, barX, barY, barWidth, barHeight, 20);
  ctx.fill();

  // Progress bar fill
  const progress = userData.xp / userData.xpForNextLevel;
  const fillWidth = Math.max(barWidth * progress, 40);

  const progressGradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
  progressGradient.addColorStop(0, '#5865F2');
  progressGradient.addColorStop(1, '#57F287');

  ctx.fillStyle = progressGradient;
  roundRect(ctx, barX, barY, fillWidth, barHeight, 20);
  ctx.fill();

  // XP Text on progress bar
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  const xpText = `${userData.xp.toLocaleString()} / ${userData.xpForNextLevel.toLocaleString()} XP`;
  ctx.fillText(xpText, barX + barWidth / 2, barY + 27);

  // Total XP and Messages
  ctx.textAlign = 'left';
  ctx.fillStyle = '#B9BBBE';
  ctx.font = '18px Arial';
  ctx.fillText(`Total XP: ${userData.totalXP.toLocaleString()}`, 270, 255);
  ctx.fillText(`Messages: ${userData.messages.toLocaleString()}`, 520, 255);

  // Progress percentage
  const percentage = Math.round(progress * 100);
  ctx.fillStyle = '#57F287';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`${percentage}%`, barX + barWidth - 15, barY - 10);

  ctx.textAlign = 'left';

  return canvas.toBuffer('image/png');
}

module.exports = { createRankCard };
