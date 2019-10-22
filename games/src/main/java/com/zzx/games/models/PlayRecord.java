package com.zzx.games.models;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
public class PlayRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private long id;

    @Column(nullable = false)
    private String player;

    @Column
    private int attributes;

    @Column
    private int occupancies;

    @Column
    private int cards;

    @Column
    private int leftovers;

    @Column
    private int slavery;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getPlayer() {
        return player;
    }

    public void setPlayer(String player) {
        this.player = player;
    }

    public int getAttributes() {
        return attributes;
    }

    public void setAttributes(int attributes) {
        this.attributes = attributes;
    }

    public int getOccupancies() {
        return occupancies;
    }

    public void setOccupancies(int occupancies) {
        this.occupancies = occupancies;
    }

    public int getCards() {
        return cards;
    }

    public void setCards(int cards) {
        this.cards = cards;
    }

    public int getLeftovers() {
        return leftovers;
    }

    public void setLeftovers(int leftovers) {
        this.leftovers = leftovers;
    }

    public int getSlavery() {
        return slavery;
    }

    public void setSlavery(int slavery) {
        this.slavery = slavery;
    }
}
