package com.zzx.games.kayles;

import com.zzx.games.kayles.exceptions.InvalidTournamentException;

import java.util.LinkedList;
import java.util.Objects;
import java.util.Queue;

public class Tournament {
    private final int playerCount;
    // Current players who is still in the game
    private final Queue<Node> queue;
    private Node currentPlayer1, currentPlayer2;

    public Tournament(int count) {
        this.playerCount = count;
        this.queue = new LinkedList<>();
        for (int i = 1; i <= count; ++i) {
            this.queue.add(new Node(getPlayer(i), null, null));
        }
    }

    // Return next two players for a new game
    public PlayerPair newGame() {
        if (queue.size() < 2 || currentPlayer1 != null || currentPlayer2 != null) {
            throw new InvalidTournamentException();
        }
        // throw Exception if the queue size is less than 2
        // throw Exception if the current game has not ended yet
        currentPlayer1 = queue.poll();
        currentPlayer2 = queue.poll();
        return new PlayerPair(currentPlayer1.winner, currentPlayer2.winner);
    }

    public void endGame(String winner) {
        if (currentPlayer1 == null || currentPlayer2 == null) {
            throw new InvalidTournamentException();
        }
        if (!currentPlayer1.winner.equals(winner) && !currentPlayer2.winner.equals(winner)) {
            throw new InvalidTournamentException();
        }
        queue.add(new Node(winner, currentPlayer1, currentPlayer2));
        currentPlayer1 = null;
        currentPlayer2 = null;
    }

    public boolean isEnded() {
        return queue.size() == 1 && currentPlayer1 == null && currentPlayer2 == null;
    }

    public String getWinner() {
        if (isEnded()) {
            return Objects.requireNonNull(queue.peek()).winner;
        } else {
            return null;
        }
    }

    // Return the status of the current tournament
    @Override
    public String toString() {
        if (isEnded()) {
            return String.format("Tournament has ended! Winner is %s", getWinner());
        } else if (currentPlayer1 != null && currentPlayer2 != null) {
            return String.format("%s and %s is playing game!", currentPlayer1.winner, currentPlayer2.winner);
        } else {
            return String.format("No game is playing! There are %d players in the queue.", queue.size());
        }
    }

    // Helper method to get the player from an integer ID
    private static String getPlayer(int id) {
        return "player" + id;
    }

    // A pair of players for a game
    public static class PlayerPair {
        String player1, player2;

        public PlayerPair(String player1, String player2) {
            this.player1 = player1;
            this.player2 = player2;
        }
    }

    // Tournament Node
    private static class Node {
        private final String winner;
        private final Node player1, player2;
        public Node(String winner, Node player1, Node player2) {
            this.winner = winner;
            this.player1 = player1;
            this.player2 = player2;
        }

        public String getWinner() {
            return winner;
        }

        public Node getPlayer1() {
            return player1;
        }

        public Node getPlayer2() {
            return player2;
        }
    }
}
