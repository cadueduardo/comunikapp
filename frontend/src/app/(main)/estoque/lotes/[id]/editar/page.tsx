'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function EditarLotePage() {
  const params = useParams()
  const router = useRouter()
  const loteId = String(params?.id || '')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    numeroLote: '',
    dataFabricacao: '',
    dataValidade: '',
    quantidadeLote: '',
    status: 'ATIVO',
  })

  const carregar = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`/api/estoque/lotes/${loteId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Falha ao carregar lote')
      const data = await res.json()
      const r = data?.data || data
      const l = {
        numeroLote: r.numeroLote ?? r.numero_lote ?? '',
        dataFabricacao: r.dataFabricacao ?? r.data_fabricacao ?? null,
        dataValidade: r.dataValidade ?? r.data_validade ?? null,
        quantidadeLote: r.quantidadeLote ?? r.quantidade_lote ?? '',
        status: r.status ?? 'ATIVO',
      }
      setForm({
        numeroLote: l.numeroLote || '',
        dataFabricacao: l.dataFabricacao ? String(l.dataFabricacao).slice(0, 10) : '',
        dataValidade: l.dataValidade ? String(l.dataValidade).slice(0, 10) : '',
        quantidadeLote: String(l.quantidadeLote ?? ''),
        status: l.status || 'ATIVO',
      })
    } catch {
      toast.error('Erro ao carregar lote')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (loteId) void carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loteId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('access_token')
      const formData = {
        numeroLote: form.numeroLote || undefined,
        dataFabricacao: form.dataFabricacao || null,
        dataValidade: form.dataValidade || null,
        quantidadeLote: form.quantidadeLote ? parseFloat(form.quantidadeLote) : undefined,
        status: form.status,
      };
      const res = await fetch(`/api/estoque/lotes/${loteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Falha ao salvar')
      toast.success('Lote atualizado')
      router.push('/estoque/lotes')
    } catch {
      toast.error('Erro ao salvar lote')
    }
  }

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/estoque/lotes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Lote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="numeroLote">Número do Lote</Label>
              <Input id="numeroLote" value={form.numeroLote} onChange={(e) => setForm({ ...form, numeroLote: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="quantidadeLote">Quantidade do Lote</Label>
              <Input id="quantidadeLote" type="number" step="0.01" value={form.quantidadeLote} onChange={(e) => setForm({ ...form, quantidadeLote: e.target.value })} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Datas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dataFabricacao">Data de Fabricação</Label>
              <Input id="dataFabricacao" type="date" value={form.dataFabricacao} onChange={(e) => setForm({ ...form, dataFabricacao: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="dataValidade">Data de Validade</Label>
              <Input id="dataValidade" type="date" value={form.dataValidade} onChange={(e) => setForm({ ...form, dataValidade: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Label htmlFor="status">Status</Label>
            <select id="status" className="w-full border rounded px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ATIVO">ATIVO</option>
              <option value="VENCIDO">VENCIDO</option>
              <option value="CONSUMIDO">CONSUMIDO</option>
              <option value="BLOQUEADO">BLOQUEADO</option>
            </select>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="submit"><Save className="h-4 w-4 mr-2" />Salvar</Button>
          </div>
        </CardContent>
      </Card>
      </form>
    </div>
  )
}


