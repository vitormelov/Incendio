# Dockerfile para Evolution API no Railway
# Este Dockerfile apenas inicia o docker-compose

FROM docker:24-dind

# Instalar docker-compose
RUN apk add --no-cache docker-compose

# Copiar docker-compose.yml
COPY src/services/evolution-api/docker-compose.yml /app/docker-compose.yml

WORKDIR /app

# Comando para iniciar docker-compose
CMD ["docker-compose", "up", "-d"]

