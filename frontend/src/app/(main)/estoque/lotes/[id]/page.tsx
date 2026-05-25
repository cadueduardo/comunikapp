'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package } from 'lucide-react'
import { toast } from 'sonner'

interface LoteDetalhe {
  id: string
  numeroLote: string
  estoque_id: string
  itemCodigo?: string
  itemNome?: string
  insumoNome?: string
  localizacaoCodigo?: string
  quantidadeLote: number
  dataFabricacao?: string | null
  dataValidade?: string | null
  status: string
  criado_em?: string
  atualizado_em?: string
  unidadeCompra?: string
  diasRestantes?: number
}

export default function VerLotePage() {
  const params = useParams()
  const router = useRouter()
  const loteId = String(params?.id || '')
  const [loading, setLoading] = useState(true)
  const [lote, setLote] = useState<LoteDetalhe | null>(null)

  const carregar = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`/api/estoque/lotes/${loteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao carregar lote')
      const data = await res.json()
      const raw = data?.data || data
      const normalized: LoteDetalhe = {
        id: raw.id,
        numeroLote: raw.numeroLote ?? raw.numero_lote ?? '',
        estoque_id: raw.estoque_id ?? raw.estoqueId,
        itemCodigo: raw.itemCodigo,
        itemNome: raw.itemNome,
        insumoNome: raw.insumoNome,
        localizacaoCodigo: raw.localizacaoCodigo,
        quantidadeLote: raw.quantidadeLote ?? raw.quantidade_lote ?? 0,
        dataFabricacao: raw.dataFabricacao ?? raw.data_fabricacao ?? null,
        dataValidade: raw.dataValidade ?? raw.data_validade ?? null,
        status: raw.status,
        criado_em: raw.criado_em ?? raw.createdAt,
        atualizado_em: raw.atualizado_em ?? raw.updatedAt,
        unidadeCompra: raw.unidadeCompra,
        diasRestantes: raw.diasRestantes,
      }
      setLote(normalized)
    } catch (e: any) {
      toast.error('Erro ao carregar lote')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (loteId) carregar()
  }, [loteId])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
            <p className="mt-2 text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!lote) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/estoque/lotes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">Lote não encontrado.</CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('pt-BR') : '-')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/estoque/lotes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" /> Detalhes do Lote
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/estoque/lotes/${lote.id}/editar`}>
            <Button variant="outline">Editar</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Número do Lote: {lote.numeroLote}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Item</div>
            <div className="text-sm">{lote.itemNome || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Insumo</div>
            <div className="text-sm">{lote.insumoNome || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Localização</div>
            <div className="text-sm">{lote.localizacaoCodigo || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Quantidade</div>
            <div className="text-sm">{lote.quantidadeLote} {lote.unidadeCompra || ''}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Fabricação</div>
            <div className="text-sm">{formatDate(lote.dataFabricacao)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Validade</div>
            <div className="text-sm">{formatDate(lote.dataValidade)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <Badge>{lote.status}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


