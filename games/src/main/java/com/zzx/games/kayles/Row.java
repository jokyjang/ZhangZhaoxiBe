package com.zzx.games.kayles;

import com.zzx.games.kayles.exceptions.InvalidMoveException;

import java.util.Arrays;

import static java.lang.Math.abs;

public class Row {
    private final boolean[] pins;

    public Row(int length) {
        this.pins = new boolean[length];
        Arrays.fill(pins, true);
    }

    public String toString() {
        StringBuilder row = new StringBuilder();
        for (boolean up : pins) {
            row.append(up ? '!' : 'x');
        }
        return row.toString();
    }

    public void knockdown(int index1) throws InvalidMoveException {
        // index1 out of bounds
        if (index1 < 0 || index1 >= pins.length) {
            throw new InvalidMoveException();
        }
        pins[index1] = false;
    }

    public void knockdown(int index1, int index2) throws InvalidMoveException {
        // pins must be adjacent if knocking down 2
        if (abs(index1 - index2) != 1) {
            throw new InvalidMoveException();
        }

        knockdown(index1);
        knockdown(index2);
    }

    public int getPinsLeft() {
        int count = 0;
        for (boolean i : pins) {
            count += i ? 1 : 0;
        }
        return count;
    }
}