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
    }
}
