# --- build stage ---
FROM gradle:8.10-jdk21 AS build
WORKDIR /src

# Prime dependency cache
COPY settings.gradle.kts build.gradle.kts ./
RUN gradle --no-daemon dependencies >/dev/null 2>&1 || true

COPY src ./src
RUN gradle --no-daemon bootJar \
    && cp build/libs/*.jar /app.jar

# --- runtime stage ---
FROM eclipse-temurin:21-jre-noble AS runtime
WORKDIR /app

RUN useradd --system --uid 1001 --home /app jobtracker \
    && mkdir -p /data \
    && chown jobtracker:jobtracker /data
USER jobtracker

COPY --from=build /app.jar /app/app.jar

ENV SPRING_DATASOURCE_URL=jdbc:sqlite:/data/jobs.db
ENV SERVER_ADDRESS=0.0.0.0
ENV SERVER_PORT=8080

VOLUME ["/data"]
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
