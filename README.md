# TCC-MONITORAMENTO-DE-PROCESSO-CIPP

Este projeto é um módulo de backend e validação de regras de negócio para análise de dados de cura CIPP (Cured-in-Place Pipe). Ele avalia logs de telemetria extraídos do equipamento UVCDOC, comparando a execução real em campo com a matriz de parâmetros ideais de engenharia.

## Arquitetura do Projeto
O repositório está estruturado em um formato monorepo:
- `/.github `: Configurações de fluxos de trabalho e automações do repositório.
- `/backend`: API em Python (FastAPI) que funciona como motor de regras de negócio, processador de inteligência preditiva e servidor WebSocket (Simulador).
- `/frontend`: Aplicativo móvel construído em React Native e Expo, contendo o dashboard mobile para visualização em tempo real das curvas de cura, evolução térmica e emissão de alertas.
- `/data`: Armazenamento dos datasets estruturados e logs em formato JSON.


## Pré-requisitos
- Python 3.8 ou mais recentes
- Node.js e npm
- Aplicativo Expo Go instalado no dispositivo móvel (para execução e testes em aparelhos físicos)

## Instalação e Execução
1. **Clone o repositório:**
```bash
git clone [https://github.com/Andrei-SantAnna/TCC-MONITORAMENTO-DE-PROCESSO-CIPP.git](https://github.com/Andrei-SantAnna/TCC-MONITORAMENTO-DE-PROCESSO-CIPP.git)
```
2. **Instale as dependências do Backend**
- Navegue até o diretório do backend, instale os pacotes e inicie o servidor liberando o host para conexões externas na rede local:
```bash
cd TCC-MONITORAMENTO-DE-PROCESSO-CIPP/backend
pip install -r requerimentos.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

3. **Configure as Variáveis de Ambiente do Frontend**
- O arquivo .env já existe na raiz da pasta frontend com a variável EXPO_PUBLIC_WS_URL. Ajuste o valor desta variável de acordo com o seu cenário de teste.

- Teste no próprio computador (Navegador/Emulador Web): Utilize o IP de loopback.

```bash
EXPO_PUBLIC_WS_URL=ws://127.0.0.1:8000/ws/simulador
```
- Teste via dispositivo móvel na rede local: O celular e o computador devem estar na mesma rede Wi-Fi. Substitua o valor pelo endereço IPv4 da sua máquina (verificável via comando `ipconfig` no Windows).

```bash
EXPO_PUBLIC_WS_URL=ws://SEU_IPV4_LOCAL:8000/ws/simulador
```
- Teste com usuários externos (fora da rede local): É necessário criar um túnel público. Recomenda-se a utilização do Ngrok. Após gerar o link público para a porta 8000, atualize o arquivo utilizando o protocolo seguro (wss):

```bash
EXPO_PUBLIC_WS_URL=wss://sua-url-gerada.ngrok.app/ws/simulador
```
4. **Instalação das dependências e inicio do Frontend**
    Em um novo terminal, instale os pacotes do Node e inicie o empacotador do Expo (utilizando a flag de limpeza de cache para forçar a leitura do `.env` atualizado):

```bash
cd TCC-MONITORAMENTO-DE-PROCESSO-CIPP/frontend
npm install
npx expo start -c
```
5. **Realizando o teste de comunicação**
- Com o backend e o frontend em execução, utilize o aplicativo Expo Go no seu smartphone (ou a tecla w para execução no navegador) para ler o QR Code gerado no terminal. A aplicação mobile fará a conexão com o servidor local e iniciará o streaming da telemetria e das projeções preditivas.

## Notas
No arquivo backend/main.py, a variável FATOR_ACELERACAO está configurada como 60.0 por padrão. Isso acelera o log para fins de demonstração acadêmica e testes (1 segundo na tela = 1 minuto de operação real da máquina). Para rodar uma simulação fiel à física da obra, ajuste o valor para 1.0.
