# Script completo para corrigir caracteres especiais em todos os arquivos do backend
$files = @(
    "src/orcamentos-v2/services/orcamentos-v2.service.ts",
    "src/orcamentos-v2/services/chat-v2.service.ts",
    "src/orcamentos-v2/services/notificacao-v2.service.ts",
    "src/mensagens-negociacao/mensagens-negociacao.service.ts",
    "src/notificacoes/notificacoes.service.ts"
)

# Substituições de caracteres especiais
$substituicoes = @{
    "orÃ§amento" = "orçamento"
    "orÃ§amentos" = "orçamentos"
    "pÃºblicas" = "públicas"
    "pÃºblico" = "público"
    "pÃºblica" = "pública"
    "negociaÃ§Ã£o" = "negociação"
    "aprovaÃ§Ã£o" = "aprovação"
    "AtualizaÃ§Ã£o" = "Atualização"
    "visualizaÃ§Ã£o" = "visualização"
    "versÃ£o" = "versão"
    "cÃ³digo" = "código"
    "recÃ¡lculo" = "recálculo"
    "concluÃ­do" = "concluído"
    "pertence Ã " = "pertence à"
    "para Ã " = "para à"
    "nÃ£o" = "não"
    "Ã©" = "é"
    "Ã " = "à"
    "Ã¡" = "á"
    "Ã¢" = "â"
    "Ã£" = "ã"
    "Ã§" = "ç"
    "Ã­" = "í"
    "Ã³" = "ó"
    "Ã´" = "ô"
    "Ãº" = "ú"
    "Ã¼" = "ü"
    "Ã‰" = "É"
    "Ã‡" = "Ç"
    "Ãƒ" = "Ã"
    "Ã‚" = "Â"
    "Ã„" = "Ä"
    "Ãˆ" = "È"
    "ÃŠ" = "Ê"
    "Ã‹" = "Ë"
    "ÃŒ" = "Ì"
    "ÃŽ" = "Î"
    "Ã" = "Ï"
    "Ã" = "Ò"
    "Ã" = "Ô"
    "Ã" = "Ö"
    "Ã" = "Ù"
    "Ã" = "Û"
    "Ã" = "Ü"
    "Ã" = "Ý"
    "Ã" = "Þ"
    "Ã" = "ß"
    "Ã" = "à"
    "Ã" = "á"
    "Ã" = "â"
    "Ã" = "ã"
    "Ã" = "ä"
    "Ã" = "å"
    "Ã" = "æ"
    "Ã" = "ç"
    "Ã" = "è"
    "Ã" = "é"
    "Ã" = "ê"
    "Ã" = "ë"
    "Ã" = "ì"
    "Ã" = "í"
    "Ã" = "î"
    "Ã" = "ï"
    "Ã" = "ð"
    "Ã" = "ñ"
    "Ã" = "ò"
    "Ã" = "ó"
    "Ã" = "ô"
    "Ã" = "õ"
    "Ã" = "ö"
    "Ã" = "÷"
    "Ã" = "ø"
    "Ã" = "ù"
    "Ã" = "ú"
    "Ã" = "û"
    "Ã" = "ü"
    "Ã" = "ý"
    "Ã" = "þ"
    "Ã" = "ÿ"
}

Write-Host "🔧 Iniciando correção de encoding em todos os arquivos do backend..."

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "📝 Processando: $file"
        
        $content = Get-Content $file -Raw -Encoding UTF8
        $originalContent = $content
        
        # Aplicar todas as substituições
        foreach ($key in $substituicoes.Keys) {
            $content = $content -replace [regex]::Escape($key), $substituicoes[$key]
        }
        
        # Verificar se houve mudanças
        if ($content -ne $originalContent) {
            Set-Content $file -Value $content -Encoding UTF8
            Write-Host "✅ Arquivo corrigido: $file"
        } else {
            Write-Host "ℹ️  Nenhuma correção necessária: $file"
        }
    } else {
        Write-Host "❌ Arquivo não encontrado: $file"
    }
}

Write-Host "🎉 Correção de encoding concluída!"

