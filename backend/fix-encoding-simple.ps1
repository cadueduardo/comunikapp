# Script simples para corrigir caracteres especiais
$files = @(
    "src/orcamentos-v2/services/orcamentos-v2.service.ts",
    "src/orcamentos-v2/services/chat-v2.service.ts",
    "src/orcamentos-v2/services/notificacao-v2.service.ts",
    "src/mensagens-negociacao/mensagens-negociacao.service.ts",
    "src/notificacoes/notificacoes.service.ts"
)

Write-Host "Iniciando correcao de encoding..."

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processando: $file"
        
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Substituicoes basicas
        $content = $content -replace "orÃ§amento", "orçamento"
        $content = $content -replace "orÃ§amentos", "orçamentos"
        $content = $content -replace "pÃºblicas", "públicas"
        $content = $content -replace "pÃºblico", "público"
        $content = $content -replace "pÃºblica", "pública"
        $content = $content -replace "negociaÃ§Ã£o", "negociação"
        $content = $content -replace "aprovaÃ§Ã£o", "aprovação"
        $content = $content -replace "AtualizaÃ§Ã£o", "Atualização"
        $content = $content -replace "visualizaÃ§Ã£o", "visualização"
        $content = $content -replace "versÃ£o", "versão"
        $content = $content -replace "cÃ³digo", "código"
        $content = $content -replace "recÃ¡lculo", "recálculo"
        $content = $content -replace "concluÃ­do", "concluído"
        $content = $content -replace "pertence Ã ", "pertence à"
        $content = $content -replace "para Ã ", "para à"
        $content = $content -replace "nÃ£o", "não"
        $content = $content -replace "Ã©", "é"
        $content = $content -replace "Ã ", "à"
        $content = $content -replace "Ã¡", "á"
        $content = $content -replace "Ã¢", "â"
        $content = $content -replace "Ã£", "ã"
        $content = $content -replace "Ã§", "ç"
        $content = $content -replace "Ã­", "í"
        $content = $content -replace "Ã³", "ó"
        $content = $content -replace "Ã´", "ô"
        $content = $content -replace "Ãº", "ú"
        $content = $content -replace "Ã¼", "ü"
        $content = $content -replace "Ã‰", "É"
        $content = $content -replace "Ã‡", "Ç"
        $content = $content -replace "Ãƒ", "Ã"
        $content = $content -replace "Ã‚", "Â"
        $content = $content -replace "Ã„", "Ä"
        $content = $content -replace "Ãˆ", "È"
        $content = $content -replace "ÃŠ", "Ê"
        $content = $content -replace "Ã‹", "Ë"
        $content = $content -replace "ÃŒ", "Ì"
        $content = $content -replace "ÃŽ", "Î"
        $content = $content -replace "Ã", "Ï"
        $content = $content -replace "Ã", "Ò"
        $content = $content -replace "Ã", "Ô"
        $content = $content -replace "Ã", "Ö"
        $content = $content -replace "Ã", "Ù"
        $content = $content -replace "Ã", "Û"
        $content = $content -replace "Ã", "Ü"
        $content = $content -replace "Ã", "Ý"
        $content = $content -replace "Ã", "Þ"
        $content = $content -replace "Ã", "ß"
        $content = $content -replace "Ã", "à"
        $content = $content -replace "Ã", "á"
        $content = $content -replace "Ã", "â"
        $content = $content -replace "Ã", "ã"
        $content = $content -replace "Ã", "ä"
        $content = $content -replace "Ã", "å"
        $content = $content -replace "Ã", "æ"
        $content = $content -replace "Ã", "ç"
        $content = $content -replace "Ã", "è"
        $content = $content -replace "Ã", "é"
        $content = $content -replace "Ã", "ê"
        $content = $content -replace "Ã", "ë"
        $content = $content -replace "Ã", "ì"
        $content = $content -replace "Ã", "í"
        $content = $content -replace "Ã", "î"
        $content = $content -replace "Ã", "ï"
        $content = $content -replace "Ã", "ð"
        $content = $content -replace "Ã", "ñ"
        $content = $content -replace "Ã", "ò"
        $content = $content -replace "Ã", "ó"
        $content = $content -replace "Ã", "ô"
        $content = $content -replace "Ã", "õ"
        $content = $content -replace "Ã", "ö"
        $content = $content -replace "Ã", "÷"
        $content = $content -replace "Ã", "ø"
        $content = $content -replace "Ã", "ù"
        $content = $content -replace "Ã", "ú"
        $content = $content -replace "Ã", "û"
        $content = $content -replace "Ã", "ü"
        $content = $content -replace "Ã", "ý"
        $content = $content -replace "Ã", "þ"
        $content = $content -replace "Ã", "ÿ"
        
        Set-Content $file -Value $content -Encoding UTF8
        Write-Host "Arquivo corrigido: $file"
    } else {
        Write-Host "Arquivo nao encontrado: $file"
    }
}

Write-Host "Correcao de encoding concluida!"

