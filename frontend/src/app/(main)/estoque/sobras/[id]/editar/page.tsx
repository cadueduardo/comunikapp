'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import { useUser } from '@/contexts/UserContext'

export default function EditarSobraPage() {
  const params = useParams()
  const router = useRouter()
  const sobraId = String(params?.id || '')
  const { user, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    descricao: '',
    dimensoes: '',
    area: '',
    quantidade: '',
    unidadeMedida: '',
    material: '',
    cor: '',
    acabamento: '',
    status: 'DISPONIVEL',
    origem: '',
    orcamentoOrigem: '',
  })

  const carregar = async () => {
    setLoading(true)
    try {
      const res = await apiRequest(`/api/estoque/sobras/${sobraId}`)
      if (!res.ok) throw new Error('Falha ao carregar sobra')
      const data = await res.json()
      const s = data?.data || data
      setForm({
        descricao: s.descricao ?? '',
        dimensoes: s.dimensoes ?? '',
        area: s.area != null ? String(s.area) : '',
        quantidade: s.quantidade != null ? String(s.quantidade) : '',
        unidadeMedida: s.unidadeMedida ?? s.unidade_medida ?? '',
        material: s.material ?? '',
        cor: s.cor ?? '',
        acabamento: s.acabamento ?? '',
        status: s.status ?? 'DISPONIVEL',
        origem: s.origem ?? '',
        orcamentoOrigem: s.orcamentoOrigem ?? s.orcamento_origem ?? '',
      })
    } catch (e) {
      console.error(e)
      toast.error('Erro ao carregar sobra')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (sobraId && !userLoading && user) carregar() }, [sobraId, userLoading, user])

  const onChange = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiRequest(`/api/estoque/sobras/${sobraId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          quantidade: form.quantidade ? parseFloat(form.quantidade) : undefined,
          area: form.area ? parseFloat(form.area) : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Erro ao salvar sobra')
      }
      toast.success('Sobra atualizada com sucesso!')
      router.push(`/estoque/sobras/${sobraId}`)
    } catch (e) {
      console.error(e)
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/estoque/sobras/${sobraId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Editar Sobra</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={e => onChange('descricao', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Dimensões</Label>
              <Input value={form.dimensoes} onChange={e => onChange('dimensoes', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Área (m²)</Label>
              <Input type="number" step="0.01" value={form.area} onChange={e => onChange('area', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" step="0.01" value={form.quantidade} onChange={e => onChange('quantidade', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={form.unidadeMedida} onValueChange={v => onChange('unidadeMedida', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="m²">m²</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="un">unidade</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="l">litro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Material</Label>
              <Input value={form.material} onChange={e => onChange('material', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <Input value={form.cor} onChange={e => onChange('cor', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Acabamento</Label>
              <Input value={form.acabamento} onChange={e => onChange('acabamento', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => onChange('status', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISPONIVEL">Disponível</SelectItem>
                  <SelectItem value="APROVEITADA">Aproveitada</SelectItem>
                  <SelectItem value="VENCIDA">Vencida</SelectItem>
                  <SelectItem value="DESCARTADA">Descartada</SelectItem>
                  <SelectItem value="RESERVADA">Reservada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Origem</Label>
              <Input value={form.origem} onChange={e => onChange('origem', e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Orçamento de Origem</Label>
              <Input value={form.orcamentoOrigem} onChange={e => onChange('orcamentoOrigem', e.target.value)} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


