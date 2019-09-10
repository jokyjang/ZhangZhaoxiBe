package com.zzx.games.kayles;

import com.zzx.games.kayles.exceptions.InvalidMoveException;
import com.zzx.games.kayles.exceptions.InvalidTurnException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Game {
    private final Logger logger = LoggerFactory.getLogger(KaylesController.class);

    private static final String PLAYER1 = "player1";
    private static final String PLAYER2 = "player2";
    private static final int PINS = 10;

    private final Row row;
    private final String player1;
    private final String player2;
    private String turn;

    public Game(String player1, String player2, int pins) {
        this.player1 = player1;
        this.player2 = player2;
        this.row = new Row(pins);
        this.turn = player1;
    }

    public Game(String player1, String player2) {
        this(player1, player2, PINS);
    }

    public Game() {
        this(PLAYER1, PLAYER2, PINS);
    }

    public void move(String player, int pin1, int pin2) throws InvalidTurnException, InvalidMoveException {
        if (!player.equals(turn)) {
            throw new InvalidTurnException();
        }

        row.knockdown(pin1, pin2);
        update_turn();
    }

    public void move(String player, int[] pins) throws InvalidTurnException, InvalidMoveException {
        if (!player.equals(turn)) {
            throw new InvalidTurnException();
        }

        if (pins.length == 1) {
            row.knockdown(pins[0]);
        } else if (pins.length == 2) {
            row.knockdown(pins[0], pins[1]);
        } else {
            throw new InvalidMoveException();
        }

        update_turn();
    }

    public void update_turn() {
        if (!isEnded()) {
            if (turn.equals(player1)) {
                turn = player2;
            } else {
                turn = player1;
            }
        }
    }

    public boolean isEnded() {
        return row.getPinsLeft() == 0;
    }

    public String getWinner() {
        if (isEnded()) {
            return turn;
        } else {
            return null;
        }
    }

    public String toString() {
        if (isEnded()) {
            String template = "The game has ended! Players: %s %s; Winner: %s";
            return String.format(template, player1, player2, getWinner());
        } else {
            String template = "Players: %s %s; Row status: %s; Turn: %s";
            return String.format(template, player1, player2, row.toString(), turn);
        }
    }
}
