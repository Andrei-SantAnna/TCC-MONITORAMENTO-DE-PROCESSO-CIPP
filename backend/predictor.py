# predictor.py

# Faixa de pressão aceitável (min, max) por Diâmetro Nominal (DN).
PRESSAO_IDEAL = {
    600: (0.30, 0.40), 700: (0.30, 0.40), 800: (0.25, 0.35),
    900: (0.25, 0.35), 1000: (0.20, 0.30), 1100: (0.20, 0.30), 1200: (0.20, 0.30),
}

# Matriz de velocidade máxima de cura (cm/min) para lâmpadas de 1000W.
# Estrutura: (Espessura_Min, Espessura_Max): {DN: Velocidade}
# Mapeei os limites em tuplas pra evitar uma cadeia gigante de if/else no código.
VELOCIDADE_NORMAL = {
    (0.0, 4.0):   {600: 130, 700: 0,   800: 0,   900: 0,   1000: 0,  1100: 0,  1200: 0},
    (4.0, 5.0):   {600: 120, 700: 115, 800: 110, 900: 105, 1000: 0,  1100: 0,  1200: 0},
    (5.0, 6.0):   {600: 110, 700: 105, 800: 100, 900: 95,  1000: 90, 1100: 85, 1200: 75},
    (6.0, 7.0):   {600: 100, 700: 95,  800: 90,  900: 85,  1000: 75, 1100: 70, 1200: 65},
    (7.0, 8.0):   {600: 90,  700: 85,  800: 75,  900: 70,  1000: 65, 1100: 60, 1200: 55},
    (8.0, 9.0):   {600: 85,  700: 75,  800: 70,  900: 65,  1000: 60, 1100: 55, 1200: 50},
    (9.0, 10.0):  {600: 70,  700: 65,  800: 60,  900: 55,  1000: 50, 1100: 45, 1200: 40},
    (10.0, 11.0): {600: 60,  700: 55,  800: 50,  900: 45,  1000: 40, 1100: 35, 1200: 30},
    (11.0, 12.0): {600: 55,  700: 50,  800: 45,  900: 40,  1000: 35, 1100: 30, 1200: 20},
    (12.0, 13.0): {600: 45,  700: 40,  800: 35,  900: 30,  1000: 20, 1100: 15, 1200: 10},
}

def obter_predicao(espessura, diametro):
    # Monta o cenário ideal que a máquina deveria seguir pra esse tubo específico.
    parametros = {
        "pressao_min": PRESSAO_IDEAL.get(diametro, (0, 0))[0],
        "pressao_max": PRESSAO_IDEAL.get(diametro, (0, 0))[1],
        "v_start_cm_min": 15, # Já convertido do 0.15 m/min da tabela pra bater com o log
        "velocidade_max_cm_min": 0,
    }
    
    # Varre as chaves do dicionário pra achar a faixa de espessura correspondente
    for (min_esp, max_esp), velocidades in VELOCIDADE_NORMAL.items():
        if min_esp < espessura <= max_esp or (espessura == 4.0 and min_esp == 0.0):
            parametros["velocidade_max_cm_min"] = velocidades.get(diametro, 0)
            break
            
    return parametros

def avaliar_leitura(leitura, espessura, diametro, margem_tolerancia_cm=3):
    """
    Pega o que aconteceu de verdade no log e cruza com o cálculo ideal.
    A margem de 3cm/min serve pra não gerar falso positivo, já que o 
    tracionador mecânico na vida real nunca é 100% cravado.
    """
    predicao = obter_predicao(espessura, diametro)
    limite_teorico = predicao["velocidade_max_cm_min"]
    velocidade_executada = leitura.get("velocidade_cm_min", 0)
    
    desvio = velocidade_executada - limite_teorico
    
    # Se o desvio for maior que a tolerância, levanta a flag de risco estrutural na cura
    alerta = desvio > margem_tolerancia_cm
    
    # Retorna o payload enriquecido pro frontend plotar o gráfico
    return {
        **leitura,
        "limite_teorico": limite_teorico,
        "desvio_cm_min": round(desvio, 2),
        "alerta": alerta
    }