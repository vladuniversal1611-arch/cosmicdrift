package com.dragoncollector.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.dragoncollector.data.models.Dragon
import com.dragoncollector.data.models.Element
import com.dragoncollector.data.models.Rarity

fun elementPrimaryColor(element: Element): Color = when (element) {
    Element.FIRE -> Color(0xFFFF4500)
    Element.EARTH -> Color(0xFF8B4513)
    Element.WATER -> Color(0xFF1E90FF)
    Element.AIR -> Color(0xFF87CEEB)
    Element.ICE -> Color(0xFF00BFFF)
    Element.ELECTRIC -> Color(0xFFFFD700)
    Element.POISON -> Color(0xFF7FFF00)
    Element.METAL -> Color(0xFFC0C0C0)
    Element.SHADOW -> Color(0xFF4B0082)
    Element.LIGHT -> Color(0xFFFFD700)
    Element.CRYSTAL -> Color(0xFF00FFFF)
    Element.COSMIC -> Color(0xFF191970)
    Element.VOLCANIC -> Color(0xFFFF4500)
    Element.GOLDEN -> Color(0xFFFFD700)
    Element.TIME -> Color(0xFFDA70D6)
}

fun elementSecondaryColor(element: Element): Color = when (element) {
    Element.FIRE -> Color(0xFFFF8C00)
    Element.EARTH -> Color(0xFFA0522D)
    Element.WATER -> Color(0xFF00CED1)
    Element.AIR -> Color(0xFFB0E0E6)
    Element.ICE -> Color(0xFF87CEEB)
    Element.ELECTRIC -> Color(0xFFFFA500)
    Element.POISON -> Color(0xFF32CD32)
    Element.METAL -> Color(0xFF808080)
    Element.SHADOW -> Color(0xFF800080)
    Element.LIGHT -> Color(0xFFFFE4B5)
    Element.CRYSTAL -> Color(0xFFAFEEEE)
    Element.COSMIC -> Color(0xFF483D8B)
    Element.VOLCANIC -> Color(0xFF8B0000)
    Element.GOLDEN -> Color(0xFFDAA520)
    Element.TIME -> Color(0xFFEE82EE)
}

@Composable
fun DragonIcon(dragon: Dragon, size: Dp = 64.dp, modifier: Modifier = Modifier) {
    val primary = elementPrimaryColor(dragon.element)
    val secondary = elementSecondaryColor(dragon.element)
    val glowColor = when (dragon.rarity) {
        Rarity.LEGENDARY -> Color(0xFFFFD700).copy(alpha = 0.6f)
        Rarity.EPIC -> Color(0xFF9C27B0).copy(alpha = 0.5f)
        Rarity.RARE -> Color(0xFF2196F3).copy(alpha = 0.4f)
        Rarity.COMMON -> Color.Transparent
    }

    Canvas(modifier = modifier.size(size)) {
        val w = this.size.width
        val h = this.size.height
        val cx = w / 2
        val cy = h / 2

        // Glow for epic/legendary
        if (dragon.rarity.ordinal >= 2) {
            drawCircle(glowColor, radius = w * 0.48f, center = Offset(cx, cy))
        }

        drawDragonShape(primary, secondary, dragon.element, w, h)
    }
}

private fun DrawScope.drawDragonShape(
    primary: Color, secondary: Color, element: Element, w: Float, h: Float
) {
    val cx = w / 2
    val cy = h / 2

    // Body
    drawOval(
        color = primary,
        topLeft = Offset(cx - w * 0.2f, cy - h * 0.25f),
        size = Size(w * 0.4f, h * 0.45f)
    )

    // Head
    drawCircle(color = primary, radius = w * 0.18f, center = Offset(cx, cy - h * 0.28f))

    // Wings (left and right)
    val wingPathL = Path().apply {
        moveTo(cx - w * 0.1f, cy - h * 0.05f)
        lineTo(cx - w * 0.48f, cy - h * 0.35f)
        lineTo(cx - w * 0.45f, cy + h * 0.05f)
        lineTo(cx - w * 0.15f, cy + h * 0.05f)
        close()
    }
    val wingPathR = Path().apply {
        moveTo(cx + w * 0.1f, cy - h * 0.05f)
        lineTo(cx + w * 0.48f, cy - h * 0.35f)
        lineTo(cx + w * 0.45f, cy + h * 0.05f)
        lineTo(cx + w * 0.15f, cy + h * 0.05f)
        close()
    }
    drawPath(wingPathL, secondary, style = Fill)
    drawPath(wingPathR, secondary, style = Fill)
    drawPath(wingPathL, primary.copy(alpha = 0.5f), style = Stroke(strokeWidth = 1.5f))
    drawPath(wingPathR, primary.copy(alpha = 0.5f), style = Stroke(strokeWidth = 1.5f))

    // Tail
    val tailPath = Path().apply {
        moveTo(cx, cy + h * 0.2f)
        quadraticBezierTo(cx + w * 0.3f, cy + h * 0.3f, cx + w * 0.15f, cy + h * 0.48f)
        lineTo(cx + w * 0.05f, cy + h * 0.42f)
        quadraticBezierTo(cx + w * 0.2f, cy + h * 0.25f, cx - w * 0.05f, cy + h * 0.22f)
        close()
    }
    drawPath(tailPath, secondary)

    // Eyes
    drawCircle(color = Color.White, radius = w * 0.045f, center = Offset(cx - w * 0.07f, cy - h * 0.3f))
    drawCircle(color = Color.White, radius = w * 0.045f, center = Offset(cx + w * 0.07f, cy - h * 0.3f))
    drawCircle(color = Color.Black, radius = w * 0.025f, center = Offset(cx - w * 0.065f, cy - h * 0.295f))
    drawCircle(color = Color.Black, radius = w * 0.025f, center = Offset(cx + w * 0.075f, cy - h * 0.295f))

    // Element symbol on body
    val symbolColor = secondary.copy(alpha = 0.9f)
    drawElementSymbol(element, symbolColor, cx, cy + h * 0.05f, w * 0.1f)
}

private fun DrawScope.drawElementSymbol(element: Element, color: Color, cx: Float, cy: Float, r: Float) {
    when (element) {
        Element.FIRE, Element.VOLCANIC -> {
            // Flame
            val p = Path().apply {
                moveTo(cx, cy - r)
                quadraticBezierTo(cx + r * 0.8f, cy, cx, cy + r)
                quadraticBezierTo(cx - r * 0.8f, cy, cx, cy - r)
            }
            drawPath(p, color)
        }
        Element.WATER -> drawCircle(color, r * 0.6f, Offset(cx, cy))
        Element.ICE, Element.CRYSTAL -> {
            // Star/snowflake
            for (i in 0..5) {
                val angle = Math.toRadians(i * 60.0)
                drawLine(color, Offset(cx, cy), Offset(cx + (r * Math.cos(angle)).toFloat(), cy + (r * Math.sin(angle)).toFloat()), strokeWidth = 2f)
            }
        }
        Element.ELECTRIC -> {
            // Zigzag lightning
            val p = Path().apply {
                moveTo(cx - r * 0.3f, cy - r)
                lineTo(cx + r * 0.2f, cy - r * 0.1f)
                lineTo(cx - r * 0.1f, cy + r * 0.1f)
                lineTo(cx + r * 0.4f, cy + r)
            }
            drawPath(p, color, style = Stroke(strokeWidth = 2.5f))
        }
        Element.COSMIC -> drawCircle(color, r * 0.5f, Offset(cx, cy), style = Stroke(strokeWidth = 2f))
        Element.GOLDEN -> drawCircle(color, r * 0.55f, Offset(cx, cy))
        else -> drawCircle(color, r * 0.4f, Offset(cx, cy))
    }
}
