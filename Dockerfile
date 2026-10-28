# Stage 1: Build the Spring Boot JAR with Maven & Java 21
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy POMs and backend source
COPY pom.xml .
COPY backend/pom.xml ./backend/
COPY backend/src ./backend/src

# Build backend module
RUN mvn clean package -pl backend -am -DskipTests

# Stage 2: Lightweight Java 21 JRE runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create dedicated application user and storage directory
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/storage && chown -R appuser:appgroup /app/storage

USER appuser

COPY --from=build /app/backend/target/securestorage-backend-*.jar app.jar

ENV SERVER_PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
