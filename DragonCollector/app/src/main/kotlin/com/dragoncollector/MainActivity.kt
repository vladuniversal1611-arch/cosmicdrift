package com.dragoncollector

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.*
import com.dragoncollector.ui.components.ResourceBar
import com.dragoncollector.ui.screens.*
import com.dragoncollector.ui.theme.*
import com.dragoncollector.viewmodel.MainViewModel

sealed class Screen(val route: String, val label: String, val icon: ImageVector, val emoji: String) {
    object Island : Screen("island", "Острів", Icons.Default.Home, "🏝️")
    object Collection : Screen("collection", "Колекція", Icons.Default.List, "📚")
    object Hatchery : Screen("hatchery", "Інкубатор", Icons.Default.Star, "🥚")
    object Expedition : Screen("expedition", "Пригоди", Icons.Default.Place, "🗺️")
    object Arena : Screen("arena", "Арена", Icons.Default.FavoriteBorder, "⚔️")
    object Daily : Screen("daily", "День", Icons.Default.DateRange, "🎁")
    object Merge : Screen("merge", "Злиття", Icons.Default.Refresh, "🔀")
    object Achievements : Screen("achievements", "Досягнення", Icons.Default.Star, "🏆")
}

val bottomNavScreens = listOf(
    Screen.Island, Screen.Collection, Screen.Hatchery,
    Screen.Expedition, Screen.Arena
)

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DragonCollectorTheme {
                DragonCollectorApp(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun DragonCollectorApp(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    if (uiState.isLoading) {
        Box(Modifier.fillMaxSize().background(DragonDarker), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("🐉", fontSize = 64.sp)
                Spacer(Modifier.height(16.dp))
                Text("Dragon Collector", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = DragonGold)
                Spacer(Modifier.height(16.dp))
                CircularProgressIndicator(color = DragonGold)
            }
        }
        return
    }

    Scaffold(
        containerColor = DragonDarker,
        topBar = {
            Column {
                // App title bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(DragonDarker)
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("🐉 Dragon Collector", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = DragonGold)
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        IconButton(onClick = { navController.navigate(Screen.Merge.route) }, modifier = Modifier.size(36.dp)) {
                            Text("🔀", fontSize = 18.sp)
                        }
                        IconButton(onClick = { navController.navigate(Screen.Daily.route) }, modifier = Modifier.size(36.dp)) {
                            Text("🎁", fontSize = 18.sp)
                        }
                        IconButton(onClick = { navController.navigate(Screen.Achievements.route) }, modifier = Modifier.size(36.dp)) {
                            Text("🏆", fontSize = 18.sp)
                        }
                    }
                }
                ResourceBar(gameState = uiState.gameState)
            }
        },
        bottomBar = {
            DragonBottomNavBar(navController = navController, currentRoute = currentRoute)
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            NavHost(navController = navController, startDestination = Screen.Island.route) {
                composable(Screen.Island.route) { IslandScreen(viewModel) }
                composable(Screen.Collection.route) { CollectionScreen(viewModel) }
                composable(Screen.Hatchery.route) { HatcheryScreen(viewModel) }
                composable(Screen.Expedition.route) { ExpeditionScreen(viewModel) }
                composable(Screen.Arena.route) { ArenaScreen(viewModel) }
                composable(Screen.Daily.route) { DailyScreen(viewModel) }
                composable(Screen.Merge.route) { MergeScreen(viewModel) }
                composable(Screen.Achievements.route) { AchievementsScreen(viewModel) }
            }
        }
    }

    // Global overlays
    uiState.offlineRewards?.let { rewards ->
        OfflineRewardsDialog(rewards = rewards, onDismiss = { viewModel.dismissOfflineRewards() })
    }

    uiState.message?.let { msg ->
        LaunchedEffect(msg) {
            kotlinx.coroutines.delay(3000)
            viewModel.dismissMessage()
        }
        Box(
            modifier = Modifier.fillMaxSize().padding(bottom = 80.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Snackbar(
                modifier = Modifier.padding(16.dp),
                containerColor = DragonCard,
                contentColor = Color.White
            ) {
                Text(msg, fontSize = 13.sp)
            }
        }
    }
}

@Composable
fun DragonBottomNavBar(navController: NavController, currentRoute: String?) {
    NavigationBar(
        containerColor = DragonDark,
        contentColor = Color.White,
        tonalElevation = 0.dp
    ) {
        bottomNavScreens.forEach { screen ->
            NavigationBarItem(
                selected = currentRoute == screen.route,
                onClick = {
                    navController.navigate(screen.route) {
                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                icon = { Text(screen.emoji, fontSize = 20.sp) },
                label = { Text(screen.label, fontSize = 10.sp) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIndicatorColor = DragonPurple.copy(alpha = 0.6f),
                    selectedIconColor = DragonGold,
                    selectedTextColor = DragonGold,
                    unselectedIconColor = Color.White.copy(alpha = 0.5f),
                    unselectedTextColor = Color.White.copy(alpha = 0.5f)
                )
            )
        }
    }
}

@Composable
fun OfflineRewardsDialog(rewards: Map<String, Long>, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DragonCard,
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text("🌙", fontSize = 40.sp)
                Text("Ласкаво Просимо Назад!", color = DragonGold, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp), horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()) {
                val hours = (rewards["timeMs"] ?: 0L) / (60 * 60 * 1000)
                val minutes = ((rewards["timeMs"] ?: 0L) % (60 * 60 * 1000)) / 60_000
                Text("Ви були відсутні: ${hours}г ${minutes}хв", color = Color.White.copy(alpha = 0.7f), fontSize = 13.sp)
                Spacer(Modifier.height(4.dp))
                Text("Ваші дракони не сиділи без діла!", color = Color.White, fontSize = 13.sp)
                if ((rewards["gold"] ?: 0L) > 0) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("🪙", fontSize = 24.sp)
                        Text("+${rewards["gold"]} золота", color = GoldColor, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onDismiss, colors = ButtonDefaults.buttonColors(containerColor = DragonGold, contentColor = DragonDark)) {
                Text("Дякую! 🐉", fontWeight = FontWeight.Bold)
            }
        }
    )
}
