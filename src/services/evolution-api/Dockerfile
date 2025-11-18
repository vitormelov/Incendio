# Dockerfile para Evolution API no Railway
# Railway já gerencia Postgres e Redis, então usamos apenas a imagem da Evolution API

FROM evoapicloud/evolution-api:v2.3.4

# As variáveis de ambiente serão configuradas no Railway dashboard
# Não precisamos de docker-compose aqui - Railway gerencia os serviços separadamente

EXPOSE 8080

# A Evolution API já tem um CMD padrão, mas podemos sobrescrever se necessário
# O Railway vai usar as variáveis de ambiente configuradas no dashboard
