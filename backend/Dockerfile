# ---------- Étape build (Maven + JDK 21) ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Cache des dépendances
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
# Code + packaging
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---------- Étape runtime (JRE 21) ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
