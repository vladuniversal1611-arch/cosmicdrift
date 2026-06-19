package com.hamsterkingdom.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.hamsterkingdom.ui.screens.*
import com.hamsterkingdom.ui.theme.*
import com.hamsterkingdom.viewmodel.GameViewModel

sealed class Screen(val route: String, val label: String, val emoji: String) {
    object Home : Screen("home", "Hammy", "🐹")
    object Kingdom : Screen("kingdom", "Kingdom", "🏰")
    object Minigames : Screen("minigames", "Games", "🎮")
    object Collection : Screen("collection", "Items", "🎒")
    object Achievements : Screen("achievements", "Trophy", "🏆")
    object DailyTasks : Screen("tasks", "Tasks", "📋")
}

val screens = listOf(Screen.Home, Screen.Kingdom, Screen.Minigames, Screen.Collection, Screen.Achievements, Screen.DailyTasks)

@Composable
fun HamsterKingdomNavigation(vm: GameViewModel) {
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Home) }

    Scaffold(
        containerColor = Color(0xFF1A0A2E),
        bottomBar = {
            HamsterBottomBar(currentScreen) { currentScreen = it }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            AnimatedContent(
                targetState = currentScreen,
                transitionSpec = {
                    fadeIn() togetherWith fadeOut()
                },
                label = "screenTransition"
            ) { screen ->
                when (screen) {
                    Screen.Home -> HomeScreen(vm)
                    Screen.Kingdom -> KingdomScreen(vm)
                    Screen.Minigames -> MinigamesScreen(vm)
                    Screen.Collection -> CollectionScreen(vm)
                    Screen.Achievements -> AchievementsScreen(vm)
                    Screen.DailyTasks -> DailyTasksScreen(vm)
                }
            }
        }
    }
}

@Composable
fun HamsterBottomBar(current: Screen, onNavigate: (Screen) -> Unit) {
    NavigationBar(
        containerColor = Color(0xFF0D0520),
        contentColor = HamsterOrange,
        tonalElevation = 0.dp
    ) {
        screens.forEach { screen ->
            val selected = current == screen
            NavigationBarItem(
                selected = selected,
                onClick = { onNavigate(screen) },
                icon = {
                    Text(
                        screen.emoji,
                        fontSize = if (selected) 22.sp else 18.sp
                    )
                },
                label = {
                    Text(
                        screen.label,
                        fontSize = 9.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                        color = if (selected) HamsterOrange else Color.White.copy(alpha = 0.5f)
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = HamsterOrange,
                    unselectedIconColor = Color.White.copy(alpha = 0.5f),
                    indicatorColor = HamsterOrange.copy(alpha = 0.15f)
                )
            )
        }
    }
}
