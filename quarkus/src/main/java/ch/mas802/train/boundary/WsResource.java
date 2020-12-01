package ch.mas802.train.boundary;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.enterprise.context.ApplicationScoped;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import javax.websocket.Session;

import javax.inject.Inject;
import ch.mas802.train.control.WsService;


@ServerEndpoint("/trainws/{clientname}")
@ApplicationScoped
public class WsResource {

    @Inject
    WsService wsService;

    @OnOpen
    public void onOpen(Session session, @PathParam("clientname") String clientname) {
        wsService.put(clientname, session);
    }

    @OnClose
    public void onClose(Session session, @PathParam("clientname") String clientname) {
        wsService.remove(clientname);
    }

    @OnError
    public void onError(Session session, @PathParam("clientname") String clientname, Throwable throwable) {
        wsService.remove(clientname);
    }

    @OnMessage
    public void onMessage(Session session, String message, @PathParam("clientname") String clientname) {
        wsService.broadcast(">> " + clientname + ": " + message);
    }
}
