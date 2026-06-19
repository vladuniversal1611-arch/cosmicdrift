package com.hamsterkingdom.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.text.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hamsterkingdom.data.models.HamsterData
import com.hamsterkingdom.ui.theme.*
import kotlin.math.sin
import kotlin.math.cos

@Composable
fun HamsterView(
    hamster: HamsterData,
    modifier: Modifier = Modifier,
    onTap: () -> Unit = {}
) {
    val infiniteTransition = rememberInfiniteTransition(label = "hamster")

    val bounce by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = if (hamster.isHappy) 10f else if (hamster.isSad) 2f else 6f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ), label = "bounce"
    )

    val blink by infiniteTransition.animateFloat(
        initialValue = 1f, targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = keyframes {
                durationMillis = 3000
                1f at 0; 1f at 2700; 0f at 2800; 0f at 2900; 1f at 3000
            }
        ), label = "blink"
    )

    val tailWag by infiniteTransition.animateFloat(
        initialValue = -8f, targetValue = 8f,
        animationSpec = infiniteRepeatable(
            animation = tween(400, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ), label = "tailWag"
    )

    val textMeasurer = rememberTextMeasurer()

    Canvas(
        modifier = modifier
            .size(200.dp, 220.dp)
            .clickable(onClick = onTap)
    ) {
        val cx = size.width / 2f
        val cy = size.height / 2f + bounce - 20f

        drawHamster(cx, cy, blink, tailWag, hamster, textMeasurer)
    }
}

private fun DrawScope.drawHamster(
    cx: Float, cy: Float, blink: Float, tailWag: Float,
    hamster: HamsterData, textMeasurer: TextMeasurer
) {
    val bodyRadius = size.width * 0.3f
    val sadColor = if (hamster.isSad) Color(0xFFAAAAAA) else Color(0xFFF4C87E)
    val bodyColor = sadColor

    // Shadow
    drawEllipse(Color(0x33000000), cx - bodyRadius * 0.8f, cy + bodyRadius * 0.8f, bodyRadius * 1.6f, bodyRadius * 0.4f)

    // Ears
    drawEar(cx - bodyRadius * 0.6f, cy - bodyRadius * 0.8f, bodyRadius * 0.38f, bodyColor, Color(0xFFF9A8C9))
    drawEar(cx + bodyRadius * 0.6f, cy - bodyRadius * 0.8f, bodyRadius * 0.38f, bodyColor, Color(0xFFF9A8C9))

    // Body
    drawOval(bodyColor, topLeft = Offset(cx - bodyRadius, cy - bodyRadius * 0.9f), size = Size(bodyRadius * 2f, bodyRadius * 1.9f))

    // Cheek pouches
    val pouchAlpha = (hamster.hunger / 100f).coerceIn(0.3f, 1f)
    drawOval(Color(0xFFF9C79E).copy(alpha = pouchAlpha), topLeft = Offset(cx - bodyRadius * 1.25f, cy - bodyRadius * 0.1f), size = Size(bodyRadius * 0.7f, bodyRadius * 0.55f))
    drawOval(Color(0xFFF9C79E).copy(alpha = pouchAlpha), topLeft = Offset(cx + bodyRadius * 0.55f, cy - bodyRadius * 0.1f), size = Size(bodyRadius * 0.7f, bodyRadius * 0.55f))

    // Eyes
    val eyeY = cy - bodyRadius * 0.15f
    val eyeRadius = bodyRadius * 0.13f
    val eyeScaleY = if (hamster.isSad) 0.5f else blink
    // Left eye
    drawOval(Color(0xFF3D2B1F), topLeft = Offset(cx - bodyRadius * 0.42f - eyeRadius, eyeY - eyeRadius * eyeScaleY), size = Size(eyeRadius * 2f, eyeRadius * 2f * eyeScaleY))
    drawOval(Color.White, topLeft = Offset(cx - bodyRadius * 0.42f - eyeRadius * 0.4f, eyeY - eyeRadius * eyeScaleY * 0.5f), size = Size(eyeRadius * 0.6f, eyeRadius * 0.6f * eyeScaleY))
    // Right eye
    drawOval(Color(0xFF3D2B1F), topLeft = Offset(cx + bodyRadius * 0.42f - eyeRadius, eyeY - eyeRadius * eyeScaleY), size = Size(eyeRadius * 2f, eyeRadius * 2f * eyeScaleY))
    drawOval(Color.White, topLeft = Offset(cx + bodyRadius * 0.42f - eyeRadius * 0.4f, eyeY - eyeRadius * eyeScaleY * 0.5f), size = Size(eyeRadius * 0.6f, eyeRadius * 0.6f * eyeScaleY))

    // Nose
    drawNose(cx, cy + bodyRadius * 0.15f, bodyRadius * 0.08f, hamster.isSad)

    // Mouth
    if (hamster.isSad) {
        drawArc(Color(0xFF8B6914), -30f, -120f, false, topLeft = Offset(cx - bodyRadius * 0.2f, cy + bodyRadius * 0.3f), size = Size(bodyRadius * 0.4f, bodyRadius * 0.2f), style = Stroke(width = 3f))
    } else {
        drawArc(Color(0xFF8B6914), 0f, 180f, false, topLeft = Offset(cx - bodyRadius * 0.2f, cy + bodyRadius * 0.28f), size = Size(bodyRadius * 0.4f, bodyRadius * 0.2f), style = Stroke(width = 3f))
    }

    // Crown (if level > 5)
    if (hamster.level >= 5) {
        drawCrown(cx, cy - bodyRadius * 0.95f, bodyRadius * 0.5f, hamster.level)
    }

    // Hat cosmetic indicator
    if (hamster.hat != "none") {
        drawHatIndicator(cx, cy - bodyRadius * 1.1f, bodyRadius, hamster.hat, textMeasurer)
    }

    // Mood indicator
    val moodEmoji = when {
        hamster.isSad -> "😢"
        hamster.isHappy -> "😊"
        else -> ""
    }
    if (moodEmoji.isNotEmpty()) {
        val measured = textMeasurer.measure(
            AnnotatedString(moodEmoji),
            style = TextStyle(fontSize = (bodyRadius * 0.3f / density).sp)
        )
        drawText(measured, topLeft = Offset(cx + bodyRadius * 0.7f, cy - bodyRadius * 0.8f))
    }
}

private fun DrawScope.drawEar(cx: Float, cy: Float, r: Float, outerColor: Color, innerColor: Color) {
    drawCircle(outerColor, r, Offset(cx, cy))
    drawCircle(innerColor, r * 0.6f, Offset(cx, cy))
}

private fun DrawScope.drawNose(cx: Float, cy: Float, r: Float, sad: Boolean) {
    val path = Path().apply {
        moveTo(cx, cy - r)
        lineTo(cx - r * 1.5f, cy + r)
        lineTo(cx + r * 1.5f, cy + r)
        close()
    }
    drawPath(path, if (sad) Color(0xFFC87878) else Color(0xFFE87B9A))
}

private fun DrawScope.drawCrown(cx: Float, cy: Float, width: Float, level: Int) {
    val crownColor = when {
        level >= 50 -> Color(0xFFE5C100)
        level >= 20 -> Color(0xFFFFD700)
        else -> Color(0xFFFFC107)
    }
    val path = Path().apply {
        moveTo(cx - width, cy + width * 0.5f)
        lineTo(cx - width, cy - width * 0.3f)
        lineTo(cx - width * 0.4f, cy - width * 0.7f)
        lineTo(cx, cy - width * 0.2f)
        lineTo(cx + width * 0.4f, cy - width * 0.7f)
        lineTo(cx + width, cy - width * 0.3f)
        lineTo(cx + width, cy + width * 0.5f)
        close()
    }
    drawPath(path, crownColor)
    drawCircle(Color(0xFFFF6B35), width * 0.12f, Offset(cx, cy - width * 0.25f))
    drawCircle(Color(0xFF2196F3), width * 0.09f, Offset(cx - width * 0.38f, cy - width * 0.65f))
    drawCircle(Color(0xFF4CAF50), width * 0.09f, Offset(cx + width * 0.38f, cy - width * 0.65f))
}

private fun DrawScope.drawHatIndicator(cx: Float, cy: Float, bodyRadius: Float, hatId: String, textMeasurer: TextMeasurer) {
    val emoji = when (hatId) {
        "hat_crown" -> "👑"; "hat_tophat" -> "🎩"; "hat_cap" -> "🧢"
        "hat_bow" -> "🎀"; "hat_wizard" -> "🧙"; "hat_chef" -> "👨‍🍳"
        else -> ""
    }
    if (emoji.isNotEmpty()) {
        val measured = textMeasurer.measure(AnnotatedString(emoji), style = TextStyle(fontSize = (bodyRadius * 0.35f / density).sp))
        drawText(measured, topLeft = Offset(cx - measured.size.width / 2f, cy - measured.size.height * 0.5f))
    }
}

private fun DrawScope.drawEllipse(color: Color, x: Float, y: Float, w: Float, h: Float) {
    drawOval(color, topLeft = Offset(x, y), size = Size(w, h))
}
