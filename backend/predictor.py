from __future__ import annotations

from math import isfinite
from typing import Any, Mapping, Sequence

PERFIL_OPERACIONAL = {
    "fabricante": "IMPREG",
    "modelo_uv": "LQ 56 Double-Core",
    "diametro_dn": 1000,
    "espessura_mm": 9.2,
    "numero_lampadas": 8,
    "potencia_lampada_w": 1000,
    "pressao_min_mbar": 200.0,
    "pressao_max_mbar": 300.0,
    # IMPREG, Anexo 9, LQ56: DN1000, >9.0 a <=10.0 mm, condições da tabela.
    "velocidade_max_cm_min": 25.0,
    # IMPREG, Anexo 8: 900-1300, espessura 8-14, Double-Core 8x1000 W.
    "intervalo_ignicao_nucleo_seg": 120,
    "tempo_ocioso_seg": 300,
    "periodo_estabilidade_seg": 600,
    "temp2_min_c": 80.0,
    "temp3_min_c": 100.0,
    "temp3_max_c": 140.0,
}

# 20 mbar NÃO é uma tolerância declarada nos trechos examinados do manual:
# preservada como critério experimental, sujeita à validação operacional.
TOLERANCIA_PRESSAO_EXPERIMENTAL_MBAR = 20.0
# Intervalo máximo entre amostras que ainda permite alegar observação contínua.
MAX_INTERVALO_AMOSTRAS_SEG = 90.0
# Confirmado pelo responsável pelo conjunto de dados:
# 0 = lâmpada apagada; 2 = lâmpada acesa. 1 e 3 permanecem sem legenda.
# Estado aceso não implica por si só que a cura esteja tecnicamente concluída.
ESTADO_UV_LIGADA = 2.0
ESTADO_UV_DESLIGADA = 0.0


def _numero(valor: Any) -> float | None:
    if valor is None or isinstance(valor, bool):
        return None
    try:
        n = float(valor)
    except (ValueError, TypeError):
        return None
    return n if isfinite(n) else None


def _tempo_segundos(leitura: Mapping[str, Any]) -> float | None:
    calculado = _numero(leitura.get("tempo_operacao_s"))
    if calculado is not None:
        return calculado
    horario = leitura.get("time")
    if not isinstance(horario, str):
        return None
    try:
        h, m, s = map(int, horario.split(":"))
        if 0 <= h < 24 and 0 <= m < 60 and 0 <= s < 60:
            return float(h * 3600 + m * 60 + s)
    except (TypeError, ValueError):
        pass
    return None


def obter_predicao(espessura: float, diametro: int) -> dict[str, float]:
    """Obtém parâmetros exclusivamente para a configuração comprovada.

    Não retorna zero ou valores genéricos quando a configuração não existe.
    """
    if diametro != PERFIL_OPERACIONAL["diametro_dn"] or not 9.0 < espessura <= 10.0:
        raise ValueError(
            "Configuração não validada neste perfil: usar IMPREG LQ56, "
            "DN1000 e espessura acima de 9.0 até 10.0 mm."
        )
    return {
        "pressao_min_mbar": PERFIL_OPERACIONAL["pressao_min_mbar"],
        "pressao_max_mbar": PERFIL_OPERACIONAL["pressao_max_mbar"],
        "velocidade_max_cm_min": PERFIL_OPERACIONAL["velocidade_max_cm_min"],
    }


def avaliar_leitura(
    leitura: Mapping[str, Any],
    espessura: float,
    diametro: int,
    margem_tolerancia_cm: float = 0.0,
) -> dict[str, Any]:
    """Compara a velocidade medida com referência nominal (não atesta falha)."""
    if margem_tolerancia_cm < 0:
        raise ValueError("Margem não pode ser negativa")
    parametros = obter_predicao(espessura, diametro)
    limite = parametros["velocidade_max_cm_min"]
    velocidade = _numero(leitura.get("velocidade_cm_min"))
    desvio = round(velocidade - limite, 2) if velocidade is not None else None
    alerta = velocidade is not None and velocidade >= 0 and desvio > margem_tolerancia_cm
    return {
        **leitura,
        "limite_teorico": limite,  # contrato anterior com o React Native
        "desvio_cm_min": desvio,
        "alerta": bool(alerta),
        "velocidade_valida": velocidade is not None and velocidade >= 0,
        "referencia_velocidade": "IMPREG LQ56; valor orientativo, condições da tabela",
        "margem_tolerancia_experimental_cm_min": margem_tolerancia_cm,
    }


def _avaliar_estabilidade(historico: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    """Pressão na faixa por >=600s, intervalo regular e amplitude <=20 mbar.

    Exige timestamps reais da operação, não número fixo de leituras.
    O limiar de 20 mbar é experimental; não libera ignição do equipamento.
    """
    resposta = {
        "pronta": False,  # apenas critério monitorado de pressão
        "tempo_restante_min": None,  # sem previsão enquanto pressão fora da faixa
        "pressao_dentro_faixa": False,
        "duracao_observada_min": 0.0,
        "variacao_observada_mbar": None,
        "criterio_amplitude_mbar": TOLERANCIA_PRESSAO_EXPERIMENTAL_MBAR,
        "status": "Aguardando pressão na faixa de trabalho",
        "observacao": (
            "Indicador experimental de estabilidade da pressão; "
            "NÃO constitui autorização para ignição UV."
        ),
    }
    if not historico:
        return resposta

    atual = historico[-1]
    tempo_atual = _tempo_segundos(atual)
    pressao_atual = _numero(atual.get("pressao_mbar"))
    lo, hi = PERFIL_OPERACIONAL["pressao_min_mbar"], PERFIL_OPERACIONAL["pressao_max_mbar"]
    if tempo_atual is None or pressao_atual is None:
        resposta["status"] = "Leitura de pressão ou horário inválido"
        return resposta
    if not lo <= pressao_atual <= hi:
        resposta["status"] = "Pressão fora da faixa configurada"
        return resposta

    resposta["pressao_dentro_faixa"] = True
    resposta["tempo_restante_min"] = 10.0
    minimo = maximo = pressao_atual
    inicio = tempo_anterior = tempo_atual

    for leitura in reversed(historico[:-1]):
        t = _tempo_segundos(leitura)
        p = _numero(leitura.get("pressao_mbar"))
        if t is None or p is None or not lo <= p <= hi:
            break
        intervalo = tempo_anterior - t
        if not 0 < intervalo <= MAX_INTERVALO_AMOSTRAS_SEG:
            break
        novo_min, novo_max = min(minimo, p), max(maximo, p)
        if novo_max - novo_min > TOLERANCIA_PRESSAO_EXPERIMENTAL_MBAR:
            break
        minimo, maximo = novo_min, novo_max
        inicio, tempo_anterior = t, t
        if tempo_atual - inicio >= PERFIL_OPERACIONAL["periodo_estabilidade_seg"]:
            break

    duracao_seg = max(0.0, tempo_atual - inicio)
    resposta["duracao_observada_min"] = round(duracao_seg / 60, 2)
    resposta["variacao_observada_mbar"] = round(maximo - minimo, 2)
    resposta["tempo_restante_min"] = round(
        max(0.0, PERFIL_OPERACIONAL["periodo_estabilidade_seg"] - duracao_seg) / 60, 2
    )
    if duracao_seg >= PERFIL_OPERACIONAL["periodo_estabilidade_seg"]:
        resposta["pronta"] = True
        resposta["status"] = "Critério experimental de pressão atendido"
    else:
        resposta["status"] = "Aguardando completar 10 minutos observáveis"
    return resposta


def _fase_inferida(leitura: Mapping[str, Any]) -> str:
    luzes = leitura.get("uv_lamps", [])
    if not isinstance(luzes, list):
        luzes = []
    estados = [_numero(v) for v in luzes[:8]]
    velocidade = _numero(leitura.get("velocidade_cm_min"))
    if any(s in (1.0, 3.0) for s in estados):
        return "estado_uv_nao_confirmado"
    if ESTADO_UV_LIGADA in estados:
        return "cura_em_movimento_inferida" if velocidade is not None and velocidade > 0 else "uv_ligada_sem_movimento"
    if velocidade is not None and velocidade > 0:
        return "movimento_sem_uv_ligada"
    return "preparacao_ou_parada"


def gerar_inteligencia_preditiva(
    leitura_atual: Mapping[str, Any],
    historico_leituras: Sequence[Mapping[str, Any]],
    diametro: int,
) -> dict[str, Any]:
    if diametro != PERFIL_OPERACIONAL["diametro_dn"]:
        raise ValueError("Perfil de ignição UV disponível apenas para DN1000")

    resultado: dict[str, Any] = {
        "ignicao_segura": _avaliar_estabilidade(historico_leituras),
        "anomalia_termica": None,  # campo mantido para frontend antigo
        "recomendacao_acao": "Leitura recebida; conferir condições e procedimento aplicável.",
        "tempos_ignicao": {
            # Chave antiga mantida: o dado é POR NÚCLEO, não por lâmpada.
            "intervalo_lampada_seg": PERFIL_OPERACIONAL["intervalo_ignicao_nucleo_seg"],
            "intervalo_nucleo_seg": PERFIL_OPERACIONAL["intervalo_ignicao_nucleo_seg"],
            "tempo_ocioso_seg": PERFIL_OPERACIONAL["tempo_ocioso_seg"],
        },
        "fase_operacional_inferida": _fase_inferida(leitura_atual),
        "anomalias_termicas": [],
        "anomalias_uv": [],
        "criterios_somente_apoio_decisao": True,
    }

    # O contador de pressão é o ÚNICO tempo calculável a partir dos
    # sensores disponíveis para a preparação. Não existe evidência suficiente
    # para prever o instante real/seguro de ignição. O tempo abaixo indica,
    # de forma condicional, quando APENAS o critério de pressão estaria
    # satisfeito se as condições monitoradas continuassem válidas.
    pressao = resultado["ignicao_segura"]
    if pressao["pronta"]:
        situacao = "Condição monitorada de pressão atendida; demais verificações pendentes"
    elif not pressao["pressao_dentro_faixa"]:
        situacao = "Sem estimativa: pressão fora da faixa ou leitura inválida"
    else:
        situacao = "Contagem condicional do requisito de pressão em andamento"
    resultado["estimativa_ignicao"] = {
        "tempo_minimo_condicao_pressao_min": pressao["tempo_restante_min"],
        "criterio_pressao_atendido": pressao["pronta"],
        "ignicao_segura_confirmada": False,
        "momento_real_ignicao_previsto": False,
        "status": situacao,
        "observacao": (
            "Estimativa limitada à pressão; inspeção visual, condições do "
            "equipamento e liberação pelo responsável não são verificadas "
            "por este aplicativo. Não usar como ordem de ignição."
        ),
    }

    fase = resultado["fase_operacional_inferida"]
    # Não disparar alertas de cura na pressurização e no aquecimento estacionário.
    # A fase de cura é apenas INFERIDA; falta documentação dos códigos Jiutai.
    if fase == "cura_em_movimento_inferida":
        t2 = _numero(leitura_atual.get("temp2_c"))
        t3 = _numero(leitura_atual.get("temp3_c"))
        avisos: list[str] = []
        if t3 is not None and t3 > PERFIL_OPERACIONAL["temp3_max_c"]:
            avisos.append("T3 > 140°C: temperatura acima da faixa de referência")
        if t2 is not None and t2 < PERFIL_OPERACIONAL["temp2_min_c"]:
            avisos.append("T2 < 80°C: temperatura abaixo da referência durante cura inferida")
        if t3 is not None and t3 < PERFIL_OPERACIONAL["temp3_min_c"]:
            avisos.append("T3 < 100°C: abaixo da faixa de referência durante cura inferida")
        if t2 is None or t3 is None:
            avisos.append("Leitura térmica indisponível")
        resultado["anomalias_termicas"] = avisos
        resultado["anomalia_termica"] = avisos[0] if avisos else None
        if avisos:
            resultado["recomendacao_acao"] = (
                "Verificar parâmetros e fase operacional com profissional habilitado; "
                "aplicar as orientações do manual IMPREG para a configuração real."
            )
        else:
            resultado["recomendacao_acao"] = "Sem desvios térmicos detectados nesta leitura inferida."

    if len(historico_leituras) >= 2:
        anterior = historico_leituras[-2].get("uv_lamps", [])
        atual = leitura_atual.get("uv_lamps", [])
        if isinstance(anterior, list) and isinstance(atual, list) and fase == "cura_em_movimento_inferida":
            mudancas = [
                i + 1 for i, (a, b) in enumerate(zip(anterior[:8], atual[:8]))
                if _numero(a) == 2.0 and _numero(b) != 2.0
            ]
            if mudancas:
                resultado["anomalias_uv"].append(
                    f"Lâmpadas que deixaram o estado aceso (2) nos canais {mudancas}; "
                    "verificar se houve desligamento ou estado transitório; "
                    "isso não comprova falha física."
                )
    return resultado
