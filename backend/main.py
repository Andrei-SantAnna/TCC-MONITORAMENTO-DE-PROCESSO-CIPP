
from __future__ import annotations

import asyncio
import hmac
import json
import math
import os
from pathlib import Path
from typing import Any, Mapping

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from predictor import PERFIL_OPERACIONAL, avaliar_leitura, gerar_inteligencia_preditiva

app = FastAPI(title="TCC CIPP - Replay de Telemetria", version="2.0-experimental")

# CORS HTTP não autentica WebSockets; origens permitidas devem ser definidas
# de forma específica ao publicar o serviço. O token WS abaixo é opcional.
ORIGENS_HTTP = [x.strip() for x in os.getenv("TCC_CORS_ORIGENS", "http://localhost:8081").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENS_HTTP,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

FATOR_ACELERACAO = float(os.getenv("TCC_FATOR_ACELERACAO", "60"))
PAUSA_MAX_REPLAY_S = float(os.getenv("TCC_PAUSA_MAXIMA_S", "2"))
if FATOR_ACELERACAO <= 0 or PAUSA_MAX_REPLAY_S <= 0:
    raise ValueError("Fator de aceleração e pausa máxima devem ser positivos")

ESPESSURA_OBRA = PERFIL_OPERACIONAL["espessura_mm"]
DIAMETRO_OBRA = PERFIL_OPERACIONAL["diametro_dn"]

# Por solicitação do projeto, sem alvo validado usa-se a REFERÊNCIA HISTÓRICA
# 0 m (a mesma regra visualizada na primeira versão do protótipo).
# A distância até zero é uma medida cinemática, NÃO garante distância real
# até o fim da cura para trechos cuja coordenada aumenta.
# Alvos de término validados continuam opcionais por trecho:
# TCC_ALVOS_JSON='{"nome exato do trecho": 120.5}'
ALVOS_CURAS_M: dict[str, float] = json.loads(os.getenv("TCC_ALVOS_JSON", "{}"))
TOKEN_WS = os.getenv("TCC_WS_TOKEN", "")  # exige ?token=... quando definido

# MODO DE TESTE TEMPORÁRIO: a seleção só filtra os dados do replay.
# Sem ?trecho=, reproduz os quatro trechos na sequência como antes.
TRECHOS_TESTE = ("85", "86", "88", "89")
# Valor experimental coerente com o limite usado pelo motor de pressão.
# Uma lacuna maior interrompe a continuidade do registro; não prova parada física.
LIMIAR_LACUNA_SEG = 90.0
# Usado APENAS para sinalizar variação relevante de posição após uma lacuna.
LIMIAR_MUDANCA_POSICAO_M = 10.0


def inferir_inicio_em_andamento(bruta: Mapping[str, Any]) -> bool:
    """Primeiro registro com UV ligada e avanço: operação já registrada em curso.

    Não tenta deduzir o instante da ignição ou do início da pressurização.
    """
    lampadas = bruta.get("uv_lamps")
    velocidade = bruta.get("speed_m_min")
    return (
        isinstance(lampadas, list)
        and any(v == 2 for v in lampadas[:8])
        and isinstance(velocidade, (int, float))
        and velocidade > 0
    )


def detectar_descontinuidade(
    intervalo_s: float,
    posicao_anterior_m: float | None,
    posicao_atual_m: float | None,
) -> dict[str, Any]:
    """Identifica ausência de telemetria, sem afirmar que o equipamento parou."""
    lacuna = intervalo_s > LIMIAR_LACUNA_SEG
    salto = (
        abs(posicao_atual_m - posicao_anterior_m)
        if posicao_atual_m is not None and posicao_anterior_m is not None
        else None
    )
    return {
        "nova_janela": lacuna,
        "lacuna_s": intervalo_s if lacuna else 0.0,
        "mudanca_posicao_m": round(salto, 2) if salto is not None else None,
        "possivel_reinicio_referencia_posicao": (
            lacuna and salto is not None and salto > LIMIAR_MUDANCA_POSICAO_M
        ),
    }



def selecionar_log_trecho(
    log: list[dict[str, Any]], codigo: str | None
) -> list[dict[str, Any]]:
    """Seleciona exclusivamente o histórico solicitado, preservando a ordem."""
    if codigo is None or codigo == "":
        return log
    if codigo not in TRECHOS_TESTE:
        raise ValueError("Trecho inválido. Escolha 85, 86, 88 ou 89.")
    selecionadas = [
        registro for registro in log
        if str(registro.get("trecho_origem", "")).split(" - ", 1)[0] == codigo
    ]
    if not selecionadas:
        raise ValueError(f"Não existem leituras para o trecho {codigo} no JSON.")
    return selecionadas


def caminho_dados(nome_arquivo: str = "simulacao_completa.json") -> Path:
    raiz = Path(__file__).resolve().parent
    custom = os.getenv("TCC_CAMINHO_JSON")
    candidatos = ([Path(custom)] if custom else []) + [
        raiz.parent / "data" / nome_arquivo,
        raiz / "data" / nome_arquivo,
        raiz / nome_arquivo,
    ]
    for caminho in candidatos:
        if caminho.is_file():
            return caminho
    raise FileNotFoundError(
        f"Arquivo não localizado: {nome_arquivo}. "
        "Use data/simulacao_completa.json ou TCC_CAMINHO_JSON."
    )


def carregar_log_real(nome_arquivo: str = "simulacao_completa.json") -> list[dict[str, Any]]:
    with caminho_dados(nome_arquivo).open(encoding="utf-8") as arquivo:
        dados = json.load(arquivo)
    if isinstance(dados, dict):
        dados = dados.get("readings", [])
    if not isinstance(dados, list) or not all(isinstance(x, dict) for x in dados):
        raise ValueError("JSON inválido: esperada lista de leituras (ou objeto com 'readings').")
    return dados


def horario_em_segundos(horario: str) -> int:
    h, m, s = map(int, horario.split(":"))
    if not (0 <= h < 24 and 0 <= m < 60 and 0 <= s < 60):
        raise ValueError(f"Horário inválido: {horario!r}")
    return h * 3600 + m * 60 + s


def adaptar_leitura(
    bruta: Mapping[str, Any], indice: int, tempo_operacao_s: float
) -> dict[str, Any]:
    velocidade = bruta.get("speed_m_min")
    velocidade_cm_min = float(velocidade) * 100 if velocidade is not None else None
    lampadas_brutas = bruta.get("uv_lamps", [])
    if not isinstance(lampadas_brutas, list):
        lampadas_brutas = []
    original = bruta.get("ambient_temp_c_original")
    foi_imputada = original is not None and original != bruta.get("ambient_temp_c")
    # 500 °C aparece como valor sentinela/anômalo em um dos históricos.
    ambiente = bruta.get("ambient_temp_c")
    temperatura_ambiente_valida = (
        isinstance(ambiente, (int, float))
        and not isinstance(ambiente, bool)
        and ambiente != 500.0
        and not foi_imputada
    )
    # Não altera o JSON: o campo original abaixo é preservado, mas uma
    # sentinela de 500°C NÃO deve ser apresentada como temperatura ambiente.
    ambiente_exibicao = ambiente if temperatura_ambiente_valida or foi_imputada else None
    return {
        "indice_leitura": indice,
        # campo antigo, mas agora corresponde a MINUTOS transcorridos, não índice.
        "minuto": round(tempo_operacao_s / 60, 2),
        "time": bruta.get("time"),
        "tempo_operacao_s": tempo_operacao_s,
        "trecho_origem": bruta.get("trecho_origem", "Trecho não identificado"),
        "distancia_m": bruta.get("distance_m"),
        "velocidade_cm_min": round(velocidade_cm_min, 2) if velocidade_cm_min is not None else None,
        "pressao_mbar": bruta.get("pressure_mbar"),
        "temp1_c": bruta.get("temp1_c"),
        "temp2_c": bruta.get("temp2_c"),
        "temp3_c": bruta.get("temp3_c"),
        "temp_ambiente_c": ambiente_exibicao,
        "temp_ambiente_bruta_c": ambiente,
        # Apenas 8 canais reais no painel; o nono é retido separadamente.
        "uv_lamps": lampadas_brutas[:8],
        "uv_lamps_bruto": lampadas_brutas,
        "temp_ambiente_imputada": foi_imputada,
        "temp_ambiente_valida_para_analise": temperatura_ambiente_valida,
        "temp_ambiente_original_c": original,
        "observacao_qualidade_ambiente": bruta.get("ambient_temp_c_note"),
    }


def calcular_previsao_cura(
    leitura: Mapping[str, Any],
    posicao_inicial_m: float | None,
    alvo_m: float | None,
) -> dict[str, Any]:
    velocidade_cm = leitura.get("velocidade_cm_min")
    velocidade_m_min = velocidade_cm / 100 if velocidade_cm is not None else None
    if velocidade_m_min is not None and velocidade_m_min > 0:
        status_mov = "Carrinho em movimento"
    else:
        status_mov = "Carrinho Parado" if velocidade_m_min == 0 else "Velocidade indisponível"

    # Restabelece o cálculo da PRIMEIRA VERSÃO quando não existe alvo validado:
    # DISTANCIA_ALVO_M = 0.0
    # distancia_restante_m = abs(0.0 - distancia_atual_m)
    # tempo_estimado_min = distancia_restante_m / velocidade_atual_m_min
    referencia_zero = alvo_m is None
    resultado = {
        "distancia_restante_m": None,
        "tempo_estimado_min": None,
        "tempo_texto": "--h --m",
        "status_movimento": status_mov,
        "status_estimativa": (
            "Referência histórica 0 m; não necessariamente o término real da cura"
            if referencia_zero else "Alvo do trecho configurado"
        ),
        "referencia_distancia_m": 0.0 if referencia_zero else float(alvo_m),
        "referencia_validada": not referencia_zero,
    }
    atual = leitura.get("distancia_m")
    if atual is None:
        return resultado
    atual = float(atual)
    if not math.isfinite(atual):
        return resultado

    if referencia_zero:
        distancia = abs(0.0 - atual)
    else:
        if posicao_inicial_m is None or alvo_m == posicao_inicial_m:
            return resultado
        sentido = 1 if alvo_m > posicao_inicial_m else -1
        distancia = max(0.0, (float(alvo_m) - atual) * sentido)

    resultado["distancia_restante_m"] = round(distancia, 2)
    if velocidade_m_min is None or velocidade_m_min <= 0:
        return resultado

    duracao = distancia / velocidade_m_min
    horas = int(duracao // 60)
    minutos = int(duracao % 60)
    resultado.update(
        tempo_estimado_min=round(duracao, 2),
        tempo_texto=f"{horas}h {minutos}m",
    )
    return resultado


def gerar_payload(
    bruta: Mapping[str, Any],
    historico_trecho: list[dict[str, Any]],
    indice: int,
    tempo_operacao_s: float,
    posicao_inicial_m: float | None,
    alvo_m: float | None,
    lacuna_anterior_s: float = 0.0,
    bloco_operacional: int = 1,
    inicio_em_andamento: bool = False,
    aviso_operacional: str | None = None,
    descontinuidade: dict[str, Any] | None = None,
    tempo_trecho_s: float | None = None,
) -> dict[str, Any]:
    leitura = adaptar_leitura(bruta, indice, tempo_operacao_s)
    leitura["bloco_operacional"] = bloco_operacional
    leitura["tempo_trecho_s"] = tempo_trecho_s
    historico_trecho.append(leitura)
    fisica = avaliar_leitura(leitura, ESPESSURA_OBRA, DIAMETRO_OBRA)
    preditiva = gerar_inteligencia_preditiva(leitura, historico_trecho, DIAMETRO_OBRA)
    previsao = calcular_previsao_cura(leitura, posicao_inicial_m, alvo_m)
    return {
        # Mesmo contrato de alto nível que o React Native já consome.
        "telemetria": fisica,
        "inteligencia": preditiva,
        "previsao_cura": previsao,
        "metadados_simulacao": {
            "tipo": "replay_historico",
            "perfil": "IMPREG DN1000 9.2mm LQ56 8x1000W",
            "fator_aceleracao": FATOR_ACELERACAO,
            "lacuna_anterior_s": lacuna_anterior_s,
            "bloco_operacional": bloco_operacional,
            "inicio_em_andamento": inicio_em_andamento,
            "aviso_operacional": aviso_operacional,
            "descontinuidade": descontinuidade,
            "alvo_validado": alvo_m is not None,
            "nao_controla_robo": True,
        },
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "modo": "replay_historico"}


@app.websocket("/ws/simulador")
async def websocket_endpoint(websocket: WebSocket) -> None:
    if TOKEN_WS and not hmac.compare_digest(websocket.query_params.get("token", ""), TOKEN_WS):
        await websocket.close(code=1008, reason="Token de acesso inválido")
        return
    await websocket.accept()
    try:
        log = selecionar_log_trecho(
            carregar_log_real(), websocket.query_params.get("trecho")
        )
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        await websocket.send_json({"status": "erro", "mensagem": str(exc)})
        await websocket.close(code=1011)
        return

    trecho_anterior: str | None = None
    historico_trecho: list[dict[str, Any]] = []
    posicao_inicial: float | None = None
    inicio_trecho_seg: float | None = None
    tempo_anterior_seg: float | None = None
    dia_extra_seg = 0.0
    inicio_bloco_seg: float | None = None
    bloco_operacional = 0
    inicio_bloco_em_andamento = False
    aviso_operacional: str | None = None
    posicao_anterior: float | None = None

    try:
        for bruta in log:
            trecho = str(bruta.get("trecho_origem") or "Trecho não identificado")
            hora_seg = float(horario_em_segundos(str(bruta["time"])))
            trecho_novo = trecho != trecho_anterior
            if trecho_novo:
                historico_trecho = []
                trecho_anterior = trecho
                inicio_trecho_seg = hora_seg
                tempo_anterior_seg = None
                dia_extra_seg = 0.0
                bloco_operacional = 0
                posicao_anterior = None

            tempo_seg = hora_seg + dia_extra_seg
            if tempo_anterior_seg is not None and tempo_seg < tempo_anterior_seg - 3600:
                dia_extra_seg += 86400
                tempo_seg = hora_seg + dia_extra_seg  # virada de dia
            if tempo_anterior_seg is not None and tempo_seg <= tempo_anterior_seg:
                raise ValueError(f"Horários não crescentes no trecho {trecho}")
            lacuna = max(0.0, tempo_seg - tempo_anterior_seg) if tempo_anterior_seg is not None else 0.0
            posicao_bruta = bruta.get("distance_m")
            posicao_atual = float(posicao_bruta) if posicao_bruta is not None else None
            evento = detectar_descontinuidade(lacuna, posicao_anterior, posicao_atual)
            novo_bloco = trecho_novo or evento["nova_janela"]
            if novo_bloco:
                historico_trecho = []  # zera a janela de estabilidade da pressão
                bloco_operacional += 1
                inicio_bloco_seg = tempo_seg
                posicao_inicial = posicao_atual
                inicio_bloco_em_andamento = inferir_inicio_em_andamento(bruta)
                if bloco_operacional > 1:
                    aviso_operacional = (
                        f"Trecho com lacuna de {int(lacuna)} segundos sem medições. "
                        "A análise de continuidade, o gráfico e a pressão foram reiniciados "
                        "neste bloco. A mudança de posição não comprova reinício físico."
                    )
                elif inicio_bloco_em_andamento:
                    aviso_operacional = (
                        "O histórico disponível já começa com lâmpadas UV acesas e "
                        "carrinho em movimento. Pressurização e ignição anteriores "
                        "não estão documentadas neste bloco."
                    )
                else:
                    aviso_operacional = None
            if lacuna:
                await asyncio.sleep(min(lacuna / FATOR_ACELERACAO, PAUSA_MAX_REPLAY_S))
            tempo_anterior_seg = tempo_seg
            posicao_anterior = posicao_atual
            elapsed = tempo_seg - (inicio_bloco_seg if inicio_bloco_seg is not None else tempo_seg)
            tempo_trecho = tempo_seg - (inicio_trecho_seg if inicio_trecho_seg is not None else tempo_seg)
            alvo = ALVOS_CURAS_M.get(trecho)
            payload = gerar_payload(
                bruta, historico_trecho, len(historico_trecho) + 1,
                elapsed, posicao_inicial, alvo,
                lacuna_anterior_s=lacuna,
                bloco_operacional=bloco_operacional,
                inicio_em_andamento=inicio_bloco_em_andamento,
                aviso_operacional=aviso_operacional,
                descontinuidade=evento if evento["nova_janela"] else None,
                tempo_trecho_s=tempo_trecho,
            )
            await websocket.send_json(payload)

        selecionado = websocket.query_params.get("trecho")
        if selecionado:
            mensagem = f"Reprodução do trecho {selecionado} concluída; isso não certifica a cura física."
        else:
            mensagem = "Reprodução dos quatro históricos concluída; isso não certifica a cura física."
        await websocket.send_json({"status": "finalizado", "mensagem": mensagem})
    except WebSocketDisconnect:
        pass
    except (ValueError, TypeError, KeyError) as exc:
        await websocket.send_json({"status": "erro", "mensagem": f"Falha no replay: {exc}"})
        await websocket.close(code=1011)
