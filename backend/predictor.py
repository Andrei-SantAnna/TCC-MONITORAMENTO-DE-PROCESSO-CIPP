#!/usr/bin/env python3
#Dicionário de parâmetros e funções para análise preditiva de leituras de processo.

# Faixa de pressão aceitável (min, max) por Diâmetro Nominal (DN).
PRESSAO_IDEAL_BAR = {
    600: (0.30, 0.40), 700: (0.30, 0.40), 800: (0.25, 0.35),
    900: (0.25, 0.35), 1000: (0.20, 0.30), 1100: (0.20, 0.30), 1200: (0.20, 0.30),
}

# Matriz de velocidade máxima de cura (cm/min).
# Estrutura: (Espessura_Min, Espessura_Max): {DN: Velocidade}
VELOCIDADE_NORMAL = {
    (0.0, 4.0):   {600: 130, 700: 0,   800: 0,   900: 0,   1000: 0,  1100: 0,  1200: 0},
    (4.0, 5.0):   {600: 120, 700: 115, 800: 110, 900: 105, 1000: 0,  1100: 0,  1200: 0},
    (5.0, 6.0):   {600: 110, 700: 105, 800: 100, 900: 95,  1000: 90, 1100: 85, 1200: 75},
    (6.0, 7.0):   {600: 100, 700: 95,  800: 90,  900: 85,  1000: 75, 1100: 70, 1200: 65},
    (7.0, 8.0):   {600: 90,  700: 85,  800: 75,  900: 70,  1000: 65, 1100: 60, 1200: 55},
    (8.0, 9.0):   {600: 85,  700: 75,  800: 70,  900: 65,  1000: 60, 1100: 55, 1200: 50},
    (9.0, 10.0):  {600: 70,  700: 65,  800: 60,  900: 55,  1000: 50, 1100: 45, 1200: 40},
}

def obter_predicao(espessura, diametro):
    parametros = {
        "pressao_min_mbar": PRESSAO_IDEAL_BAR.get(diametro, (0.25, 0.35))[0] * 1000,
        "pressao_max_mbar": PRESSAO_IDEAL_BAR.get(diametro, (0.25, 0.35))[1] * 1000,
        "velocidade_max_cm_min": 0,
    }
    
    for (min_esp, max_esp), velocidades in VELOCIDADE_NORMAL.items():
        if min_esp < espessura <= max_esp or (espessura == 4.0 and min_esp == 0.0):
            parametros["velocidade_max_cm_min"] = velocidades.get(diametro, 0)
            break
            
    return parametros

def avaliar_leitura(leitura, espessura, diametro, margem_tolerancia_cm=3):
    predicao = obter_predicao(espessura, diametro)
    limite_teorico = predicao["velocidade_max_cm_min"]
    velocidade_executada = leitura.get("velocidade_cm_min", 0)
    
    desvio = velocidade_executada - limite_teorico
    alerta = desvio > margem_tolerancia_cm
    
    return {
        **leitura,
        "limite_teorico": limite_teorico,
        "desvio_cm_min": round(desvio, 2),
        "alerta": alerta
    }

def gerar_inteligencia_preditiva(leitura_atual, historico_leituras, diametro):
    previsoes = {
        "ignicao_segura": {"pronta": False, "tempo_restante_min": 10},
        "anomalia_termica": None,
        "recomendacao_acao": "Operação dentro dos limites nominais.",
        "tempos_ignicao": {}
    }

    # Tempos baseados no Anexo 8 do Manual IMPREG
    if diametro <= 800:
        previsoes["tempos_ignicao"] = {"intervalo_lampada_seg": 60, "tempo_ocioso_seg": 240}
    else:
        previsoes["tempos_ignicao"] = {"intervalo_lampada_seg": 120, "tempo_ocioso_seg": 300}

    # Regra de Estabilidade de Pressão
    if len(historico_leituras) >= 10:
        ultimas_10 = historico_leituras[-10:]
        pressao_max = max(l.get('pressao_mbar', 0) for l in ultimas_10)
        pressao_min = min(l.get('pressao_mbar', 0) for l in ultimas_10)
        
        if (pressao_max - pressao_min) <= 20:
            previsoes["ignicao_segura"]["pronta"] = True
            previsoes["ignicao_segura"]["tempo_restante_min"] = 0
        else:
            previsoes["ignicao_segura"]["tempo_restante_min"] = 10
    else:
        previsoes["ignicao_segura"]["tempo_restante_min"] = 10 - len(historico_leituras)

    t2 = leitura_atual.get('temp2_c', 0)
    t3 = leitura_atual.get('temp3_c', 0)
    luzes_ligadas = any(lamp > 0 for lamp in leitura_atual.get('uv_lamps', []))

    if luzes_ligadas:
        if t3 > 140.0:
            previsoes["anomalia_termica"] = "Risco Crítico de Bolhas (T3 > 140°C)"
            previsoes["recomendacao_acao"] = "MANUAL IMPREG: Aumente o fluxo de ar mantendo a pressão de trabalho e a velocidade."
        elif t2 > 0 and t2 < 80.0:
            previsoes["anomalia_termica"] = "Temperatura de cura insuficiente (T2 < 80°C)"
            previsoes["recomendacao_acao"] = "MANUAL IMPREG: Reduza a velocidade de tração em 5 cm/min."
        elif not (100.0 <= t3 <= 140.0):
             previsoes["anomalia_termica"] = "T3 fora da zona ótima (100-140°C)"

    return previsoes