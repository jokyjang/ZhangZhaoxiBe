package com.zzx.games.controllers;

import com.zzx.games.App;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.junit4.SpringRunner;

import static org.junit.Assert.assertEquals;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = App.class, webEnvironment = WebEnvironment.RANDOM_PORT)
public class EndeavorTest {
    private static final String API_ROOT = "http://localhost/endeavor";

    @LocalServerPort
    private int port;

    @Before
    public void before() {
        RestAssured.port = port;
    }

    @Test
    public void listPlayRecords_ok() {
        Response response = RestAssured.get(API_ROOT + "/playRecords");
        assertEquals(HttpStatus.OK.value(), response.getStatusCode());
    }
}
