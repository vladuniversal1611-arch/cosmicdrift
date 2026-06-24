package com.hamsterkingdom.ui.minigames

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hamsterkingdom.ui.theme.*
import com.hamsterkingdom.viewmodel.GameViewModel
import kotlinx.coroutines.delay

private val PUZZLE_EMOJIS = listOf("🧀", "🥕", "🌽", "🍎", "🥜", "🫐", "🍓", "🥝")

data class PuzzleCard(
    val id: Int,
    val emoji: String,
    val isFaceUp: Boolean = false,
    val isMatched: Boolean = false
)

data class CheesePuzzleState(
    val cards: List<PuzzleCard> = emptyList(),
    val firstFlipped: Int? = null,
    val pendingMismatch: Pair<Int, Int>? = null,
    val moves: Int = 0,
    val matches: Int = 0,
    val timeLeft: Int = 60,
    val gameRunning: Boolean = false,
    val gameOver: Boolean = false,
    val win: Boolean = false
)

private fun generatePuzzleCards(): List<PuzzleCard> =
    (PUZZLE_EMOJIS + PUZZLE_EMOJIS)
        .shuffled()
        .mapIndexed { i, emoji -> PuzzleCard(i, emoji) }

@Composable
fun CheesePuzzleScreen(vm: GameViewModel, onBack: () -> Unit) {
    var state by remember { mutableStateOf(CheesePuzzleState()) }
    var wins by remember { mutableStateOf(0) }

    LaunchedEffect(state.gameRunning) {
        if (!state.gameRunning) return@LaunchedEffect
        while (state.gameRunning && state.timeLeft > 0) {
            delay(1000L)
            state = state.copy(timeLeft = state.timeLeft - 1)
            if (state.timeLeft <= 0) {
                state = state.copy(gameRunning = false, gameOver = true)
            }
        }
    }

    LaunchedEffect(state.pendingMismatch) {
        val pair = state.pendingMismatch ?: return@LaunchedEffect
        delay(700L)
        val newCards = state.cards.toMutableList()
        newCards[pair.first] = newCards[pair.first].copy(isFaceUp = false)
        newCards[pair.second] = newCards[pair.second].copy(isFaceUp = false)
        state = state.copy(cards = newCards, pendingMismatch = null)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF1A2E1A), Color(0xFF0A1A0A)))),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) { Text("←", fontSize = 20.sp, color = Color.White) }
            Text("🧩 Cheese Puzzle", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = Color.White)
            Spacer(Modifier.weight(1f))
            Text("Wins: $wins", fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
        }

        if (state.gameRunning || state.gameOver || state.win) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Text(
                    "⏱️ ${state.timeLeft}s",
                    fontWeight = FontWeight.Bold,
                    color = if (state.timeLeft < 15) HamsterRed else Color.White
                )
                Text("🔄 ${state.moves}", fontWeight = FontWeight.Bold, color = Color.White)
                Text("✅ ${state.matches}/8", fontWeight = FontWeight.Bold, color = HamsterGreen)
            }
            Spacer(Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = { state.timeLeft / 60f },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp).height(6.dp),
                color = if (state.timeLeft < 15) HamsterRed else HamsterGreen,
                trackColor = Color.White.copy(alpha = 0.1f)
            )
            Spacer(Modifier.height(8.dp))
        }

        if (state.cards.isNotEmpty()) {
            LazyVerticalGrid(
                columns = GridCells.Fixed(4),
                modifier = Modifier.padding(16.dp).weight(1f),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                itemsIndexed(state.cards) { index, card ->
                    val canFlip = state.gameRunning && state.pendingMismatch == null &&
                            !card.isMatched && !card.isFaceUp && state.firstFlipped != index
                    PuzzleCardView(card = card, enabled = canFlip) {
                        val newCards = state.cards.toMutableList()
                        newCards[index] = card.copy(isFaceUp = true)

                        if (state.firstFlipped == null) {
                            state = state.copy(cards = newCards, firstFlipped = index, moves = state.moves + 1)
                        } else {
                            val firstIdx = state.firstFlipped!!
                            val firstEmoji = state.cards[firstIdx].emoji
                            val newMoves = state.moves + 1
                            if (firstEmoji == card.emoji) {
                                newCards[firstIdx] = newCards[firstIdx].copy(isMatched = true)
                                newCards[index] = newCards[index].copy(isMatched = true)
                                val newMatches = state.matches + 1
                                val win = newMatches == PUZZLE_EMOJIS.size
                                state = state.copy(
                                    cards = newCards,
                                    firstFlipped = null,
                                    matches = newMatches,
                                    moves = newMoves,
                                    win = win,
                                    gameRunning = !win
                                )
                            } else {
                                state = state.copy(
                                    cards = newCards,
                                    firstFlipped = null,
                                    moves = newMoves,
                                    pendingMismatch = Pair(firstIdx, index)
                                )
                            }
                        }
                    }
                }
            }
        } else {
            Spacer(Modifier.weight(1f))
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(16.dp)
        ) {
            when {
                state.win -> {
                    val bonus = (state.timeLeft * 5 + (8 - state.moves / 2).coerceAtLeast(0) * 10).toLong()
                    Text("🎉 Puzzle Solved!", fontWeight = FontWeight.ExtraBold, color = HamsterGold, fontSize = 18.sp)
                    Text("Time bonus: +${state.timeLeft * 5}  Move bonus: +${(8 - state.moves / 2).coerceAtLeast(0) * 10}", fontSize = 12.sp, color = Color.White.copy(alpha = 0.7f))
                    LaunchedEffect(Unit) {
                        wins++
                        vm.addMinigameReward(cheese = 100L + bonus, coins = 50L, xp = 150L)
                    }
                }
                state.gameOver -> {
                    Text("⏰ Time's Up!", fontWeight = FontWeight.Bold, color = HamsterRed, fontSize = 16.sp)
                    Text("Matched ${state.matches}/8 pairs", fontSize = 13.sp, color = Color.White.copy(alpha = 0.7f))
                    LaunchedEffect(Unit) {
                        vm.addMinigameReward(cheese = state.matches.toLong() * 10)
                    }
                }
                !state.gameRunning -> {
                    Text("Match all cheese pairs!", fontSize = 13.sp, color = Color.White.copy(alpha = 0.8f))
                    Text("Find 8 pairs in 60 seconds", fontSize = 12.sp, color = Color.White.copy(alpha = 0.6f))
                }
                else -> {}
            }
            if (!state.gameRunning) {
                Spacer(Modifier.height(8.dp))
                Button(
                    onClick = {
                        state = CheesePuzzleState(
                            cards = generatePuzzleCards(),
                            gameRunning = true,
                            timeLeft = 60
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = HamsterGreen),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Text(
                        if (state.gameOver || state.win) "Play Again!" else "Start!",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun PuzzleCardView(card: PuzzleCard, enabled: Boolean, onClick: () -> Unit) {
    val bg = when {
        card.isMatched -> Color(0xFF1E4A1E)
        card.isFaceUp -> Color(0xFF3E3E1E)
        else -> Color(0xFF1E1E3E)
    }
    val border = when {
        card.isMatched -> HamsterGreen.copy(alpha = 0.6f)
        card.isFaceUp -> HamsterGold.copy(alpha = 0.5f)
        else -> Color.White.copy(alpha = 0.1f)
    }
    Box(
        modifier = Modifier
            .aspectRatio(1f)
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .then(if (enabled) Modifier.clickable(onClick = onClick) else Modifier),
        contentAlignment = Alignment.Center
    ) {
        if (card.isFaceUp || card.isMatched) {
            Text(card.emoji, fontSize = 26.sp)
        } else {
            Text("🧩", fontSize = 20.sp, color = Color.White.copy(alpha = 0.4f))
        }
        if (!card.isFaceUp && !card.isMatched) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(12.dp))
                    .background(border.copy(alpha = 0.05f))
            )
        }
    }
}
