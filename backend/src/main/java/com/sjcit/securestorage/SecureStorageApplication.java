package com.sjcit.securestorage;
 
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.BufferedReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class SecureStorageApplication {

    private static final Logger log = LoggerFactory.getLogger(SecureStorageApplication.class);

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(SecureStorageApplication.class, args);
    }

    private static void loadDotenv() {
        List<Path> candidatePaths = List.of(
            Paths.get(".env"),
            Paths.get("../.env"),
            Paths.get(System.getProperty("user.dir", "."), ".env"),
            Paths.get(System.getProperty("user.dir", "."), "..", ".env")
        );

        for (Path path : candidatePaths) {
            if (Files.isRegularFile(path)) {
                log.info("Loading environment configuration from {}", path.toAbsolutePath().normalize());
                try (BufferedReader reader = Files.newBufferedReader(path)) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String value = line.substring(eqIdx + 1).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if ("MAIL_PASSWORD".equals(key) && value.contains(" ") && !value.isBlank()) {
                                value = value.replace(" ", "");
                            }
                            if (System.getProperty(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Could not load .env file from {}: {}", path, e.getMessage());
                }
                break;
            }
        }

        // Auto-normalize cloud database URL (Render, Railway, Supabase format)
        String rawDbUrl = System.getProperty("SPRING_DATASOURCE_URL");
        if (rawDbUrl == null || rawDbUrl.isBlank()) {
            rawDbUrl = System.getenv("SPRING_DATASOURCE_URL");
        }
        if (rawDbUrl == null || rawDbUrl.isBlank()) {
            rawDbUrl = System.getenv("DATABASE_URL");
        }

        if (rawDbUrl != null && !rawDbUrl.isBlank()) {
            rawDbUrl = rawDbUrl.trim();
            try {
                String cleanUrl = rawDbUrl;
                if (cleanUrl.startsWith("jdbc:")) {
                    cleanUrl = cleanUrl.substring("jdbc:".length());
                }

                String pseudoHttp = cleanUrl.replaceFirst("^(postgres|postgresql)://", "http://");
                java.net.URI uri = new java.net.URI(pseudoHttp);
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] creds = userInfo.split(":", 2);
                    String user = java.net.URLDecoder.decode(creds[0], java.nio.charset.StandardCharsets.UTF_8);
                    String pass = java.net.URLDecoder.decode(creds[1], java.nio.charset.StandardCharsets.UTF_8);
                    System.setProperty("SPRING_DATASOURCE_USERNAME", user);
                    System.setProperty("DB_USERNAME", user);
                    System.setProperty("SPRING_DATASOURCE_PASSWORD", pass);
                    System.setProperty("DB_PASSWORD", pass);
                    log.info("Extracted database username '{}' from cloud connection string", user);
                }

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                String query = uri.getQuery();

                StringBuilder jdbc = new StringBuilder("jdbc:postgresql://")
                        .append(host)
                        .append(":")
                        .append(port)
                        .append(path);

                if (query != null && !query.isBlank()) {
                    jdbc.append("?").append(query);
                }

                String finalJdbcUrl = jdbc.toString();
                System.setProperty("SPRING_DATASOURCE_URL", finalJdbcUrl);
                System.setProperty("DB_URL", finalJdbcUrl);
                log.info("Configured JDBC URL: {}", finalJdbcUrl);
            } catch (Exception e) {
                log.warn("Could not parse cloud database URI {}: {}", rawDbUrl, e.getMessage());
                if (rawDbUrl.startsWith("postgres://")) {
                    rawDbUrl = "jdbc:postgresql://" + rawDbUrl.substring("postgres://".length());
                } else if (rawDbUrl.startsWith("postgresql://") && !rawDbUrl.startsWith("jdbc:")) {
                    rawDbUrl = "jdbc:" + rawDbUrl;
                }
                System.setProperty("SPRING_DATASOURCE_URL", rawDbUrl);
                System.setProperty("DB_URL", rawDbUrl);
            }
        }
    }
}
