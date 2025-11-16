# Script para deletar e recriar a instancia incendio-bot
Write-Host "1. Deletando instancia existente...";
try {
    Invoke-RestMethod -Uri "http://localhost:8080/instance/delete/incendio-bot" -Method DELETE -Headers @{"apikey"="INCENDO_FACIL123"} -TimeoutSec 5;
    Write-Host "   Instancia deletada";
} catch {
    Write-Host "   Erro ao deletar (pode nao existir): ";
}

Write-Host "
2. Aguardando 2 segundos...";
Start-Sleep -Seconds 2;

Write-Host "
3. Criando nova instancia...";
 = @{
    instanceName = "incendio-bot"
    token = "5B1AED84F2AA-4B09-B35F-1E981B8B9985"
    qrcode = True
    integration = "WHATSAPP-BAILEYS"
} | ConvertTo-Json;

try {
     = Invoke-RestMethod -Uri "http://localhost:8080/instance/create" -Method POST -Headers @{"apikey"="INCENDO_FACIL123"; "Content-Type"="application/json"} -Body  -TimeoutSec 10;
    Write-Host "   Instancia criada!";
    Write-Host "
4. Acesse http://localhost:8080/manager/ para escanear o QR code";
} catch {
    Write-Host "   Erro ao criar: ";
}
