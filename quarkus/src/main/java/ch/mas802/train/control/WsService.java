package ch.mas802.train.control;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;

import javax.enterprise.context.ApplicationScoped;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import javax.websocket.Session;

import javax.inject.Inject;

import ch.mas802.train.entity.StatusRepository;
import ch.mas802.train.entity.Status;

@ApplicationScoped
public class WsService {

    @Inject
    StatusRepository statusRepository;

    Map<String, Session> sessions = new ConcurrentHashMap<>();

    public void put(String clientname, Session session) {
        sessions.put(clientname, session);
        broadcast("User " + clientname + "  joined");
    }

    public void remove(String clientname) {
        sessions.remove(clientname);
        broadcast("User " + clientname + " left");
    }

    public void broadcast(String message) {
        System.out.println("send message: " + message);
        sessions.values().forEach(s -> {
            s.getAsyncRemote().sendObject(message, result ->  {
                if (result.getException() != null) {
                    System.out.println("Unable to send message: " + result.getException());
                }
            });
        });
    }

    public void incomingStatus(final String key, final String state, final long validFor) {
        statusRepository.updateStatus(key, state, validFor);
    }

    public Status execute(final String key, final String mode) {
        Status status =  statusRepository.getStatus(key);
        if (status.until > 0) {
            return status;
        }

        broadcast(mode+":"+key);
        statusRepository.updateStatus(key, "load", 500);
        return new Status("load", 500);
    }

    public Status info(final String key) {
        return execute(key, "info");
    }

    public Status toggle(final String key) {
        return execute(key, "toggle");
    }

    public Status action(final String key) {
        return execute(key, "action");
    }

    public Map<String, Status> status() {
        return statusRepository.status();
    }
}
