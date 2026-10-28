package com.sjcit.securestorage;
 
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.BufferedReader;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class SecureStorageApplication {

    private static final Logger log = LoggerFactory.getLogger(SecureStorageApplication.class);

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication app = new SpringApplication(SecureStorageApplication.class);
        app.addInitializers(new DatabaseUrlNormalizerInitializer());
        app.run(args);
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

    /**
     * Intercepts Spring Boot environment before beans/datasources initialize and
     * automatically converts cloud database URLs (e.g. Render, Railway, Supabase)
     * from postgres://user:pass@host:port/db into valid JDBC properties.
     */
    private static class DatabaseUrlNormalizerInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override
        public void initialize(ConfigurableApplicationContext context) {
            ConfigurableEnvironment env = context.getEnvironment();
            Map<String, Object> overrides = new HashMap<>();

            String rawDbUrl = env.getProperty("SPRING_DATASOURCE_URL");
            if (rawDbUrl == null || rawDbUrl.isBlank()) {
                rawDbUrl = env.getProperty("DATABASE_URL");
            }
            if (rawDbUrl == null || rawDbUrl.isBlank()) {
                rawDbUrl = env.getProperty("DB_URL");
            }

            if (rawDbUrl != null && !rawDbUrl.isBlank()) {
                rawDbUrl = rawDbUrl.trim();
                try {
                    String cleanUrl = rawDbUrl;
                    if (cleanUrl.startsWith("jdbc:")) {
                        cleanUrl = cleanUrl.substring("jdbc:".length());
                    }

                    if (cleanUrl.startsWith("postgres://") || cleanUrl.startsWith("postgresql://")) {
                        int slashSlash = cleanUrl.indexOf("://");
                        int atIndex = cleanUrl.lastIndexOf('@');

                        String userInfo = null;
                        String hostAndPath = cleanUrl;

                        if (atIndex > slashSlash && slashSlash >= 0) {
                            userInfo = cleanUrl.substring(slashSlash + 3, atIndex);
                            hostAndPath = cleanUrl.substring(atIndex + 1);
                        } else if (cleanUrl.startsWith("postgres://")) {
                            hostAndPath = cleanUrl.substring("postgres://".length());
                        } else if (cleanUrl.startsWith("postgresql://")) {
                            hostAndPath = cleanUrl.substring("postgresql://".length());
                        }

                        if (userInfo != null && userInfo.contains(":")) {
                            int colon = userInfo.indexOf(':');
                            String user = URLDecoder.decode(userInfo.substring(0, colon), StandardCharsets.UTF_8);
                            String pass = URLDecoder.decode(userInfo.substring(colon + 1), StandardCharsets.UTF_8);
                            overrides.put("spring.datasource.username", user);
                            overrides.put("spring.datasource.password", pass);
                            System.setProperty("SPRING_DATASOURCE_USERNAME", user);
                            System.setProperty("SPRING_DATASOURCE_PASSWORD", pass);
                            log.info("DatabaseUrlNormalizer: Extracted cloud database username '{}'", user);
                        }

                        String finalJdbcUrl = "jdbc:postgresql://" + hostAndPath;
                        if (!finalJdbcUrl.equals(rawDbUrl)) {
                            overrides.put("spring.datasource.url", finalJdbcUrl);
                            overrides.put("DB_URL", finalJdbcUrl);
                            overrides.put("SPRING_DATASOURCE_URL", finalJdbcUrl);
                            System.setProperty("SPRING_DATASOURCE_URL", finalJdbcUrl);
                            System.setProperty("DB_URL", finalJdbcUrl);
                            log.info("DatabaseUrlNormalizer: Formatted JDBC connection URL: {}", finalJdbcUrl);
                        }
                    } else if (!rawDbUrl.startsWith("jdbc:")) {
                        String finalJdbcUrl = "jdbc:" + rawDbUrl;
                        overrides.put("spring.datasource.url", finalJdbcUrl);
                        overrides.put("DB_URL", finalJdbcUrl);
                        overrides.put("SPRING_DATASOURCE_URL", finalJdbcUrl);
                        System.setProperty("SPRING_DATASOURCE_URL", finalJdbcUrl);
                        System.setProperty("DB_URL", finalJdbcUrl);
                        log.info("DatabaseUrlNormalizer: Prepended 'jdbc:' to connection URL: {}", finalJdbcUrl);
                    }
                } catch (Exception e) {
                    log.warn("DatabaseUrlNormalizer: Failed to parse URL '{}': {}", rawDbUrl, e.getMessage());
                }
            }

            if (!overrides.isEmpty()) {
                env.getPropertySources().addFirst(new MapPropertySource("cloudDatabaseNormalizer", overrides));
                log.info("DatabaseUrlNormalizer: Applied high-priority database configuration overrides");
            }
        }
    }
}
