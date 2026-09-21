import json
import glob
import os

# Pega os arquivos e ordena pelo nome (85, 86, 88, 89...) para manter a sequência correta
arquivos_json = sorted([f for f in glob.glob("*.json") if f != "simulacao_completa.json"])

dados_unificados = []

for arquivo in arquivos_json:
    print(f"Lendo e adicionando na fila: {arquivo}")
    with open(arquivo, 'r', encoding='utf-8') as f:
        dado_bruto = json.load(f)
        leituras = dado_bruto.get("readings", [])
        
        # Opcional: Adiciona de onde veio a leitura
        for leitura in leituras:
            leitura["trecho_origem"] = dado_bruto.get("metadata", {}).get("project", "Desconhecido")
            
        dados_unificados.extend(leituras)

# AQUI ESTÁ A CORREÇÃO: Removemos o sort() que misturava os horários.
# Agora é uma "fila" contínua: termina um trecho, começa o outro.

# Salva o arquivo final
with open("simulacao_completa.json", "w", encoding='utf-8') as f:
    json.dump(dados_unificados, f, indent=2, ensure_ascii=False)

print(f"\nSucesso! {len(dados_unificados)} leituras foram enfileiradas corretamente no arquivo 'simulacao_completa.json'.")