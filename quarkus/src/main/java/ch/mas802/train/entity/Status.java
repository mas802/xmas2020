package ch.mas802.train.entity;

public class Status {

    public String state;
    public long until;
    public long deltaduration;

    public Status( String state, long until, long deltaduration) {
        this.state = state;
        this.until = until;
        this.deltaduration = deltaduration;
    }
}
