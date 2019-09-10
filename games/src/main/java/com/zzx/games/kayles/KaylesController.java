package com.zzx.games.kayles;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;

@RestController("/kayles")
public class KaylesController {
    private final static Logger logger = LoggerFactory.getLogger(KaylesController.class);
    private static Game currentGame;
    private static Tournament currentTournament;

    // Initialize the game and return the status of the new game
    @PostMapping("/game")
    public String postGame() {
        currentGame = new Game();
        return currentGame.toString();
    }

    // Return the current status of the game
    @GetMapping("/game")
    public String getGame() {
        if (currentGame != null) {
            return currentGame.toString();
        } else {
            return "Current game has not been started!";
        }
    }

    @PostMapping("/move/{player}/{pins}")
    public String postMove(@PathVariable("player") String player, @PathVariable("pins") String pins) {
        int[] pinArray = Arrays.stream(pins.split(","))
            .mapToInt(Integer::parseInt)
            .toArray();

        if (currentGame == null || currentGame.isEnded()) {
            return "No active game.  call new game to start a new game.";
        }

        currentGame.move(player, pinArray);
        return currentGame.toString();
    }

    @PostMapping("/tournament")
    public String postTournament(@RequestParam(value = "count", defaultValue = "4") int count) {
        currentTournament = new Tournament(count);
        return currentTournament.toString();
    }

    @GetMapping("/tournament")
    public String getTournament() {
        if (currentTournament == null) {
            return "Current Tournament has not been started yet!";
        }
        return currentTournament.toString();
    }

    @PostMapping("/tournament/start/game")
    public String postTournamentStartGame() {
        if (currentTournament == null) {
            return "No active tournament. Call new tournament to start a new tournament";
        }
        if (currentTournament.isEnded()) {
            return "Current tournament has ended. Create a new one to restart!";
        }
        Tournament.PlayerPair pair = currentTournament.newGame();
        currentGame = new Game(pair.player1, pair.player2);
        return currentGame.toString();
    }

    @PostMapping("tournament/end/game")
    public String postTournamentEndGame() {
        if (currentTournament == null) {
            return "No active tournament. Call new tournament to start a new tournament";
        }
        if (currentTournament.isEnded()) {
            return "Current tournament has ended. Create a new one to restart!";
        }
        if (!currentGame.isEnded()) {
            return "Current game has not ended yet! Too early!";
        }
        currentTournament.endGame(currentGame.getWinner());
        return currentTournament.toString();
    }
}
