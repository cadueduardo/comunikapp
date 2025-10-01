from pathlib import Path
path = Path('frontend/src/app/(main)/os/[id]/page.tsx')
text = path.read_text()
marker = "  parametros_tecnicos?: {\n    largura?: number;\n    altura?: number;\n    area?: number;\n    unidade_medida?: string;\n    [key: string]: any;\n  };"
replacement = marker + "\n  alertas_estoque?: string[];\n  recomendacoes_estoque?: string[];\n  detalhes_estoque?: EstoqueDetalhe[];"
if marker not in text:
    raise SystemExit('marker not found')
text = text.replace(marker, replacement, 1)
if 'interface EstoqueDetalhe' not in text:
    insert = "};\n\n// Configura??o"
    new_block = "};\n\ninterface EstoqueDetalhe {\n  insumo_id: string;\n  nome?: string;\n  categoria?: string;\n  fornecedor?: string;\n  estoque_atual?: number;\n  estoque_minimo?: number;\n  quantidade_necessaria?: number;\n  quantidade_disponivel?: number;\n  percentual_disponivel?: number;\n  unidade?: string;\n  alerta_estoque?: boolean;\n  alerta_estoque_minimo?: boolean;\n  alerta_fornecedor?: boolean;\n}\n\n// Configura??o"
    if insert not in text:
        raise SystemExit('insert token not found')
    text = text.replace(insert, new_block, 1)
path.write_text(text)
