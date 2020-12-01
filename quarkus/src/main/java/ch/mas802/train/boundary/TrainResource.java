package ch.mas802.train.boundary;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.inject.Inject;

import ch.mas802.train.entity.Status;
import java.util.List;
import java.util.Map;

import ch.mas802.train.control.WsService;

@Path("/train")
public class TrainResource {

    @Inject
    WsService wsService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Status toggle(@QueryParam(value="key") String key) {
//        if (key.length() > 10 || !"".equals(key.replaceAll("^[A-Z]", ""))) return null;
        return wsService.toggle(key);
    }

    @Path("/info")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Status info(@QueryParam(value="key") String key) {
//        if (key.length() > 10 || !"".equals(key.replaceAll("^[A-Z]", ""))) return null;
        return wsService.info(key);
    }


    @Path("status")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Status> status() {
        return wsService.status();
    }
}
