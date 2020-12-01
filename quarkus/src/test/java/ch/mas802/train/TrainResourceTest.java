package ch.mas802.train;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
public class TrainResourceTest {

    @Test
    public void testHelloEndpoint() {
        given()
          .when().get("/train")
          .then()
             .statusCode(200)
             .body(is("hello"));
    }

}