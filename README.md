# Monitoramento do processo CIPP com cura ultravioleta

Aplicativo de apoio ao acompanhamento de operações de reabilitação de tubulações pelo método **Cured-in-Place Pipe (CIPP)** com cura UV. O projeto integra uma API em **Python/FastAPI**, um motor de regras operacionais e uma interface em **React Native, Expo e TypeScript**.

> **Escopo acadêmico:** a versão atual reproduz **registros históricos** como fluxo de telemetria; não está conectada diretamente ao equipamento durante uma cura real. O aplicativo **não controla o trem UV, não autoriza a ignição das lâmpadas e não certifica a qualidade física da cura**.

## O que o sistema faz

- Reproduz os registros dos trechos **85, 86, 88 e 89**, com **4.417 leituras** no conjunto utilizado no experimento E01.
- Apresenta pressão, temperaturas, posição, velocidade e estados informados das oito lâmpadas.
- Sinaliza desvios de velocidade em relação ao perfil de referência configurado.
- Apresenta uma **estimativa condicional para completar 10 minutos de pressão monitorada** e uma **estimativa de deslocamento** obtida da distância até uma referência e da velocidade atual.
- Identifica leituras discrepantes e lacunas na telemetria sem alterar o registro histórico original.

## Telas do aplicativo

As telas abaixo pertencem ao protótipo utilizado no TCC. As capturas devem ser armazenadas em `docs/screenshots/` para serem exibidas automaticamente nesta seção.

### 1. Início

**Arquivo da captura:** `docs/screenshots/inicio.webp`

É a porta de entrada do aplicativo. Permite abrir o **Monitoramento** e o **Sumário**. Na versão de testes, o seletor também permite reproduzir todos os históricos ou escolher individualmente os trechos 85, 86, 88 e 89; a seleção de outro trecho reinicia a sessão de replay.

### 2. Sensores / Telemetria

**Arquivo da captura:** `docs/screenshots/sensores.webp`

Apresenta as leituras operacionais recebidas pelo WebSocket: posição, pressão interna, velocidade, temperaturas e estados das lâmpadas UV. Exibe avisos de desvio, indicadores de qualidade da telemetria e evolução térmica. Dados indisponíveis ou discrepantes não devem ser interpretados como medições válidas.

### 3. Previsões / Inteligência Preditiva

**Arquivo da captura:** `docs/screenshots/previsoes.webp`

Mostra a distância restante **até uma posição de referência**, o tempo estimado de deslocamento e o tempo faltante para completar o **critério monitorado de pressão**. A estimativa de deslocamento pressupõe velocidade constante; sem um ponto final validado, ela **não equivale necessariamente ao tempo real até o fim da cura**. O requisito de pressão **não constitui autorização para acender as lâmpadas**.

### 4. Sumário dos sensores

**Arquivo da captura:** `docs/screenshots/sumario.webp`

Funciona como guia de leitura do aplicativo. Explica os indicadores de localização, pressão, cinemática, temperaturas, módulo UV e gráfico térmico, ajudando o leitor a interpretar o que é apresentado na tela de Sensores.

> Para publicar as fotografias reais dessas quatro telas no GitHub, inclua os quatro arquivos WebP na pasta `docs/screenshots/`. As descrições acima já estão preparadas; os arquivos de imagem são distribuídos separadamente neste momento.

## Arquitetura

```text
data/*.json e data/simulacao_completa.json
               |
               v
backend/main.py              FastAPI, replay, normalização, WebSocket
backend/predictor.py         Regras de pressão, velocidade e avisos
               |
               v
/ws/simulador                Mensagens com telemetria, inteligencia,
                             previsao_cura e metadados_simulacao
               |
               v
frontend/src                 React Native + Expo Router + TypeScript
  app/index.tsx              Início / seleção do trecho
  app/sensores.tsx           Monitoramento operacional
  app/previsoes.tsx          Estimativas condicionais
  app/sumario.tsx            Guia das variáveis
```

O arquivo `data/unificar_dados.py` organiza os históricos no conjunto utilizado para o replay. Os componentes `useMonitoramento`, `useSensorSocket` e `services/websocket.ts` gerenciam a sessão e a comunicação no frontend.

## Pré-requisitos

- **Python 3.10 ou superior** e `pip`.
- **Node.js** e `npm` compatíveis com a versão do Expo indicada em `frontend/package.json`.
- VS Code, navegador ou Expo Go para abrir o aplicativo.

## Instalação e execução

### 1. Obter o projeto

```bash
git clone https://github.com/Andrei-SantAnna/TCC-MONITORAMENTO-DE-PROCESSO-CIPP.git
cd TCC-MONITORAMENTO-DE-PROCESSO-CIPP
```

### 2. Backend (terminal 1, na raiz do repositório)

```bash
python -m pip install -r backend/requerimentos.txt
python -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```

A API estará disponível em `http://localhost:8000`. O replay utiliza, por padrão, `data/simulacao_completa.json`.

### 3. Frontend (terminal 2)

```bash
cd frontend
npm install
```

Crie ou ajuste `frontend/.env` com **uma única** definição ativa:

```dotenv
EXPO_PUBLIC_WS_URL=ws://127.0.0.1:8000/ws/simulador
```

Se o aplicativo rodar no celular, substitua `127.0.0.1` pelo **IPv4 local do computador que executa o backend** e conecte ambos à mesma rede. Para acesso externo, será necessário um endereço `wss://` válido e a configuração de rede correspondente. Evite publicar URLs temporárias de túnel ou segredos no repositório.

Inicie:

```bash
npx expo start -c
```

Use `w` para abrir no navegador ou o QR Code para abrir no dispositivo, conforme o ambiente Expo disponível.

## Testes automatizados — experimento E01

Os testes utilizam **pytest** e executam a função real de regras em `backend/predictor.py`. O arquivo é `tests/test_estabilidade_pressao.py`.

No **terminal do VS Code, a partir da raiz do repositório**:

```powershell
python -m pip install "pytest>=8,<10"
python -m pytest tests/test_estabilidade_pressao.py -v
```

Para gerar relatório JUnit:

```powershell
mkdir relatorios
python -m pytest tests/test_estabilidade_pressao.py -v --junitxml=relatorios/testes_pressao.xml
```

Os **nove cenários sintéticos** verificam:

| Caso | Condição | Resultado esperado |
| --- | --- | --- |
| E01-01 | Dez leituras em apenas três minutos | Não atendido |
| E01-02 | Dez minutos de pressão válida | Atendido |
| E01-03 | Pressão constante fora de 200–300 mbar | Não atendido |
| E01-04 | Amplitude acima de 20 mbar | Não atendido |
| E01-05 | Lacuna entre leituras acima de 90 s | Não atendido |
| E01-06 | Apenas nove minutos válidos | Não atendido |
| E01-07 | Limite inferior de 200 mbar | Atendido |
| E01-08 | Limite superior de 300 mbar | Atendido |
| E01-09 | Última pressão de 301 mbar | Não atendido |

A faixa **200–300 mbar** e a referência de aproximadamente **10 minutos** estão associadas ao perfil IMPREG estudado; **20 mbar** e **90 s** são limites **experimentais deste projeto**, não exigências comprovadas do fabricante. Os testes verificam o comportamento computacional, **não a segurança da ignição ou a qualidade da cura**.

Os testes também são executados no GitHub em [Actions](https://github.com/Andrei-SantAnna/TCC-MONITORAMENTO-DE-PROCESSO-CIPP/actions) pelo workflow `.github/workflows/testes-pressao.yml`, com um relatório JUnit disponível nos artefatos da execução. A aprovação de um workflow vale para o **commit específico testado**, e não garante validação em campo.

## Avaliação do protótipo

No experimento **E01**, os quatro históricos totalizaram 4.417 registros. A comparação entre a regra original **R10L** e a regra de dez minutos monitorados **R10M** identificou **533 classificações divergentes**. A R10M também foi comparada com uma implementação independente nos registros analisados.

Essas diferenças são **classificações de software**, e não evidências de 533 falhas físicas na tubulação. A validação operacional com aquisição direta do equipamento permanece como etapa futura.

## Configuração e limitações

- `TCC_FATOR_ACELERACAO`: fator de aceleração do replay (padrão: `60`); pausas simuladas também podem sofrer limites definidos no backend.
- `TCC_PAUSA_MAXIMA_S`: limite de espera entre emissões no replay (padrão: `2` segundos).
- `TCC_CAMINHO_JSON`: caminho opcional para o arquivo de históricos.
- `TCC_WS_TOKEN`: token opcional de demonstração; **não equivale a uma autenticação de produção**.
- `TCC_ALVOS_JSON`: permite configurar referências de posição validadas por trecho.

Os arquivos de telemetria podem conter informações de operações industriais. Antes de redistribuí-los, verifique as condições de autorização e anonimização aplicáveis.

## Contexto acadêmico

Projeto de Trabalho de Conclusão de Curso em Engenharia de Computação, SENAI CIMATEC. O sistema é um **protótipo complementar de monitoramento** para estudos funcionais com dados históricos; não substitui o painel industrial nem procedimentos definidos pelo fabricante e pelo responsável técnico.
