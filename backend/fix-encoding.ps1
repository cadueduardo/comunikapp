# Script para corrigir caracteres especiais no arquivo orcamentos-v2.service.ts
$filePath = "src/orcamentos-v2/services/orcamentos-v2.service.ts"

if (Test-Path $filePath) {
    $content = Get-Content $filePath -Raw -Encoding UTF8
    
    # Substituições de caracteres especiais
    $content = $content -replace "orÃ§amento", "orçamento"
    $content = $content -replace "orÃ§amentos", "orçamentos"
    $content = $content -replace "orÃ§amento", "orçamento"
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
    
    # Salvar o arquivo corrigido
    Set-Content $filePath -Value $content -Encoding UTF8
    Write-Host "✅ Caracteres especiais corrigidos em $filePath"
} else {
    Write-Host "❌ Arquivo não encontrado: $filePath"
}


