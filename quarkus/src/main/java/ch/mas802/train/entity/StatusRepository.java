package ch.mas802.train.entity;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.ArrayList;

import javax.enterprise.context.ApplicationScoped;

import ch.mas802.train.entity.Status;

@ApplicationScoped
public class StatusRepository {

    private Map<String, Status> data = new ConcurrentHashMap<>();

    public Status getStatus(final String key) {
    	Status raw = data.get(key);
        if (raw == null) {
            return new Status( "load", -1);
        }
        return new Status( raw.state, raw.until-System.currentTimeMillis());
    }

    public Status updateStatus(final String key, final String status, final long deltaduration) {
        Status raw = new Status( status, System.currentTimeMillis()+deltaduration);
        data.put(key, raw);
        return new Status( raw.state, raw.until-System.currentTimeMillis());
    }

    public Map<String, Status> status() {
        return data;
    }
}
