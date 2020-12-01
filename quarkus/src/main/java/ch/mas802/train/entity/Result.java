package ch.mas802.train.entity;

public class Result {

    public boolean ok;
    public int status;
    public String msg;

    public Result(boolean ok,int status,String msg){
        this.ok = ok;
        this.status = status;
        this.msg=msg;
    }
}
