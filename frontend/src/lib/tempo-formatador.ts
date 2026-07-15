/**
 * Formata um número decimal de horas em uma string legível no formato "XhYm".
 * Exemplo: 3.1024 -> "3h06m", 0.3333 -> "0h20m", 0 -> "0h00m"
 */
export const formatarTempoHumano = (horas: number): string => {
  if (!horas || Number.isNaN(horas) || horas <= 0) return "0h00m";
  const totalMinutos = Math.round(horas * 60);
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return `${h}h${m.toString().padStart(2, "0")}m`;
};

/**
 * Converte uma string formatada (ex: "3h10m", "45m", "0h20m" ou "3.5") de volta para número decimal de horas.
 */
export const parseTempoHumano = (tempoStr: string): number => {
  if (!tempoStr) return 0;

  const str = tempoStr.trim().toLowerCase();

  // Se contiver h ou m, faz parse usando regex
  if (str.includes("h") || str.includes("m")) {
    const matchH = str.match(/(\d+)\s*h/);
    const matchM = str.match(/(\d+)\s*m/);
    const h = matchH ? parseInt(matchH[1], 10) : 0;
    const m = matchM ? parseInt(matchM[1], 10) : 0;
    return h + m / 60;
  }

  // Se for apenas número com ponto ou vírgula, faz parse direto
  const num = parseFloat(str.replace(",", "."));
  return isNaN(num) ? 0 : num;
};
