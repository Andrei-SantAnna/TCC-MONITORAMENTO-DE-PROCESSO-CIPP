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
1. **Clone o repositório:**
```bash
git clone [https://github.com/Andrei-SantAnna/TCC-MONITORAMENTO-DE-PROCESSO-CIPP.git](https://github.com/Andrei-SantAnna/TCC-MONITORAMENTO-DE-PROCESSO-CIPP.git)
```
2. **Instale as dependências do Backend**
```bash
cd TCC-MONITORAMENTO-DE-PROCESSO-CIPP/cipp-simulador-telemetria/backend
pip install -r requerimentos.txt
```

3. **Inicie o Servidor do Simulador**
    Ainda dentro da `backend`, execute: 
```bash
uvicorn main:app --reload
```
O servidor estará escutando em `ws://localhost:8000/ws/simulador`.

4. **Realize o teste de comunicação**
    Agora com o servidor iniciado e rodando, abra o arquivo teste.html (localizado na pasta tests) no navegador web para visualizar o streaming da telemetria e os alertas de desvio disparando em tempo real

## Notas
No arquivo backend/main.py, a variável FATOR_ACELERACAO está configurada como 60.0 por padrão. Isso acelera o log para fins de demonstração acadêmica e testes (1 segundo na tela = 1 minuto de operação real da máquina). Para rodar uma simulação fiel à física da obra, ajuste o valor para 1.0.
