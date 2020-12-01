package ch.mas802.train.entity;

public class Status {

    public String state;
    public long until;

    public Status(String state, long until) {
        this.state = state;
        this.until = until;
    }
}
