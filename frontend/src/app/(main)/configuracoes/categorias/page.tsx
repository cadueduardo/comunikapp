'use client';

import { useEffect, useState } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from 'sonner';
import { Categoria, getColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CategoryForm, formSchema } from "./category-form";

export default function CategoriasConfigPage() {
  const [data, setData] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3001/categorias', { headers: { 'Authorization': `Bearer ${token}` }});
      if (response.ok) setData(await response.json());
      else toast.error("Falha ao buscar categorias.");
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro.");
    } 
    finally { setLoading(false); }
  };
  
  useEffect(() => { fetchCategorias(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3001/categorias/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success("Categoria excluída com sucesso!");
        setData(prev => prev.filter(c => c.id !== deleteId));
      } else {
        toast.error("Falha ao excluir categoria.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao conectar ao servidor.");
    } finally {
      setDeleteId(null);
    }
  };

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const url = editingCategory ? `http://localhost:3001/categorias/${editingCategory.id}` : 'http://localhost:3001/categorias';
    const method = editingCategory ? 'PATCH' : 'POST';

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success(`Categoria ${editingCategory ? 'atualizada' : 'criada'} com sucesso!`);
        fetchCategorias();
        setIsFormOpen(false);
        setEditingCategory(null);
      } else {
        const error = await response.json();
        toast.error(`Falha: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocorreu um erro ao conectar ao servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategory(categoria);
    setIsFormOpen(true);
  };
  
  const columns = getColumns({ onEdit: handleEdit, onDelete: (id) => setDeleteId(id) });

  return (
    <>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gerenciar Categorias</h1>
            <p className="text-gray-600">Adicione, edite ou remova as categorias do sistema.</p>
          </div>
          <Button onClick={() => { setEditingCategory(null); setIsFormOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Categoria
          </Button>
        </div>
        
        {loading ? <p>Carregando categorias...</p> : <DataTable columns={columns} data={data} />}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingCategory(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Altere o nome da categoria.' : 'Preencha o nome para a nova categoria.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm 
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
            defaultValues={editingCategory || undefined}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente a categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 