package com.brushiq.automation.utils;

import okhttp3.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

public class ApiHelper {
    private static final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build();

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final String BASE_URL = ConfigReader.getProperty("api.base.url", "https://brushiq-backend.onrender.com/api");

    public static boolean checkBackendHealth() {
        try {
            Request request = new Request.Builder()
                    .url(BASE_URL.replace("/api", "") + "/health")
                    .get()
                    .build();

            try (Response response = client.newCall(request).execute()) {
                return response.isSuccessful();
            }
        } catch (Exception e) {
            System.err.println("Backend health check failed: " + e.getMessage());
            return false;
        }
    }

    public static String registerUser(String email, String username, String password, String phone) throws IOException {
        Map<String, String> bodyMap = new HashMap<>();
        bodyMap.put("email", email);
        bodyMap.put("username", username);
        bodyMap.put("password", password);
        bodyMap.put("phone", phone);

        String json = mapper.writeValueAsString(bodyMap);
        RequestBody body = RequestBody.create(json, MediaType.get("application/json; charset=utf-8"));

        Request request = new Request.Builder()
                .url(BASE_URL + "/auth/register")
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (response.body() != null) {
                String respStr = response.body().string();
                JsonNode node = mapper.readTree(respStr);
                if (node.has("token")) {
                    return node.get("token").asText();
                }
            }
        }
        return null;
    }
}
