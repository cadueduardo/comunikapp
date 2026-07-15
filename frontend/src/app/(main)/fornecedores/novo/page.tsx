"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fornecedoresApi } from "@/lib/api-client";
import { FornecedorForm, FornecedorFormValues } from "../fornecedor-form";

export default function NovoFornecedorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const salvar = async (values: FornecedorFormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        toast.error("Token de autenticação não encontrado.");
        return;
      }
      await fornecedoresApi.create(values, token);
      toast.success("Fornecedor cadastrado com sucesso.");
      router.push("/fornecedores");
    } catch (error) {
      console.error("Erro ao cadastrar fornecedor:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar fornecedor.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Novo fornecedor</h1>
        <p className="mt-1 text-muted-foreground">
          Cadastre um fornecedor de insumos ou parceiro terceirizado.
        </p>
      </div>
      <FornecedorForm onSave={salvar} loading={loading} />
    </div>
  );
}
