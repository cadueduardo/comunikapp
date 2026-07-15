"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fornecedoresApi } from "@/lib/api-client";
import {
  FornecedorForm,
  FornecedorFormData,
  FornecedorFormValues,
} from "../../fornecedor-form";

export default function EditarFornecedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [fornecedor, setFornecedor] = useState<FornecedorFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const data = await fornecedoresApi.getById(id, token);
        setFornecedor(data as FornecedorFormData);
      } catch (error) {
        console.error("Erro ao carregar fornecedor:", error);
        toast.error("Erro ao carregar fornecedor.");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [id]);

  const salvar = async (values: FornecedorFormValues) => {
    setSalvando(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Token de autenticação não encontrado.");
        return;
      }
      await fornecedoresApi.update(id, values, token);
      toast.success("Fornecedor atualizado com sucesso.");
      router.push("/fornecedores");
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar fornecedor.",
      );
    } finally {
      setSalvando(false);
    }
  };

  if (loading)
    return <p className="text-muted-foreground">Carregando fornecedor...</p>;
  if (!fornecedor) return <p>Fornecedor não encontrado.</p>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Editar fornecedor</h1>
        <p className="mt-1 text-muted-foreground">
          Atualize os dados comerciais, contatos e especialidades.
        </p>
      </div>
      <FornecedorForm
        initialData={fornecedor}
        onSave={salvar}
        loading={salvando}
      />
    </div>
  );
}
