package com.dragoncollector.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dragoncollector.data.models.Dragon
import com.dragoncollector.data.models.Rarity
import com.dragoncollector.ui.theme.*

@Composable
fun DragonCard(
    dragon: Dragon,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier,
    showExpeditionBadge: Boolean = false
) {
    val rarityColor = rarityColor(dragon.rarity)
    val shimmer = dragon.rarity == Rarity.LEGENDARY || dragon.rarity == Rarity.EPIC

    val infiniteTransition = rememberInfiniteTransition(label = "shimmer")
    val shimmerAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    val borderColor = if (shimmer) rarityColor.copy(alpha = shimmerAlpha) else rarityColor.copy(alpha = 0.6f)
    val cardBg = Brush.verticalGradient(listOf(DragonCardLight, DragonCard))

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(cardBg)
            .border(1.5.dp, borderColor, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(6.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            // Rarity stars
            Row {
                repeat(dragon.rarity.stars) {
                    Text("⭐", fontSize = 8.sp, lineHeight = 10.sp)
                }
            }

            Spacer(modifier = Modifier.height(2.dp))

            // Dragon icon
            Box {
                DragonIcon(dragon = dragon, size = 64.dp)
                if (!dragon.isOwned) {
                    Box(
                        Modifier
                            .matchParentSize()
                            .background(Color.Black.copy(alpha = 0.55f))
                            .clip(RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("?", fontSize = 28.sp, color = Color.White.copy(alpha = 0.7f), fontWeight = FontWeight.Bold)
                    }
                }
                if (dragon.isHatching) {
                    Box(
                        Modifier
                            .matchParentSize()
                            .background(Color.Yellow.copy(alpha = 0.25f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🥚", fontSize = 22.sp)
                    }
                }
                if (showExpeditionBadge && dragon.isOnExpedition) {
                    Box(
                        Modifier.align(Alignment.TopEnd).size(18.dp)
                            .background(Color(0xFF4CAF50), RoundedCornerShape(9.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("✈", fontSize = 10.sp, color = Color.White)
                    }
                }
                if (dragon.isReadyToCollect) {
                    Box(
                        Modifier.align(Alignment.TopEnd).size(18.dp)
                            .background(Color(0xFFFFD700), RoundedCornerShape(9.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("!", fontSize = 11.sp, color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Name
            Text(
                text = if (dragon.isOwned || dragon.isHatching) dragon.name else "???",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (dragon.isOwned) rarityColor else Color.Gray,
                textAlign = TextAlign.Center,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            // Level
            if (dragon.isOwned) {
                Text(
                    text = "Рів. ${dragon.level}",
                    fontSize = 10.sp,
                    color = Color.White.copy(alpha = 0.7f)
                )
            }

            // Element
            Text(
                text = dragon.element.emoji,
                fontSize = 12.sp
            )
        }
    }
}
