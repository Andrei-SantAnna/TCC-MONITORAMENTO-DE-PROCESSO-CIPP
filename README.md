# TCC-MONITORAMENTO-DE-PROCESSO-CIPP

Este projeto é um módulo de backend e validação de regras de negócio para análise de dados de cura CIPP (Cured-in-Place Pipe). Ele avalia logs de telemetria extraídos do equipamento UVCDOC, comparando a execução real em campo com a matriz de parâmetros ideais de engenharia.

## Arquitetura do Projeto
O repositório está estruturado em um formato monorepo:
- `/backend`: API em Python (FastAPI) que funciona como o motor de regras e servidor WebSocket (Simulador).
- `/frontend`: (Em breve) Dashboard em React para visualização em tempo real das curvas de cura.
- `/data`: Armazenamento dos datasets estruturados pelo parser de PDF.
- `/tests`: Clientes e scripts para validação de endpoints e túneis de comunicação.

## Pré-requisitos
- Python 3.8 ou mais recentes

## Instalação e Execução
```bash
git clone [https://github.com/SEU_USUARIO/cipp-telemetry-simulator.git](https://github.com/SEU_USUARIO/cipp-telemetry-simulator.git)
cd cipp-telemetry-simulator