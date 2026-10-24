"""Nove cenarios sinteticos do experimento E01 (pressao CIPP).

Os testes exercitam o predictor.py REAL do repositório. "pronta" significa
somente atendimento do criterio experimental de pressao; NAO autoriza ignicao UV.

Referencias do projeto: 200-300 mbar e 600 s.
Escolhas experimentais: amplitude <=20 mbar e lacuna <=90 s.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
MOTOR = ROOT / "backend" / "predictor.py"


@pytest.fixture(scope="module")
def motor():
    assert MOTOR.is_file(), f"Motor nao encontrado: {MOTOR}"
    spec = importlib.util.spec_from_file_location("cipp_motor_testado", MOTOR)
    assert spec is not None and spec.loader is not None
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    assert callable(getattr(modulo, "gerar_inteligencia_preditiva", None))
    assert modulo.PERFIL_OPERACIONAL["pressao_min_mbar"] == 200
    assert modulo.PERFIL_OPERACIONAL["pressao_max_mbar"] == 300
    assert modulo.PERFIL_OPERACIONAL["periodo_estabilidade_seg"] == 600
    assert modulo.TOLERANCIA_PRESSAO_EXPERIMENTAL_MBAR == 20
    assert modulo.MAX_INTERVALO_AMOSTRAS_SEG == 90
    return modulo


def leituras(pares):
    """Pares (tempo da operacao em segundos, pressao em mbar)."""
    return [
        {
            "tempo_operacao_s": t,
            "pressao_mbar": p,
            "velocidade_cm_min": 0,
            "uv_lamps": [0] * 8,
        }
        for t, p in pares
    ]


# Cada caso tem seu resultado esperado definido ANTES da chamada ao motor.
CASOS = [
    pytest.param(
        [(i * 20, 250.0) for i in range(10)],
        False,
        id="E01-01_dez_leituras_apenas_tres_minutos",
    ),
    pytest.param(
        [(i * 60, 250.0) for i in range(11)],
        True,
        id="E01-02_dez_minutos_validos",
    ),
    pytest.param(
        [(i * 60, 45.0) for i in range(11)],
        False,
        id="E01-03_pressao_constante_fora_da_faixa",
    ),
    pytest.param(
        [(i * 60, 220.0 if i < 6 else 250.0) for i in range(11)],
        False,
        id="E01-04_amplitude_trinta_mbar",
    ),
    pytest.param(
        [(i * 60, 250.0) for i in range(5)] + [(900, 250.0)],
        False,
        id="E01-05_lacuna_seiscentos_e_sessenta_segundos",
    ),
    pytest.param(
        [(i * 60, 250.0) for i in range(10)],
        False,
        id="E01-06_nove_minutos",
    ),
    pytest.param(
        [(i * 60, 200.0) for i in range(11)],
        True,
        id="E01-07_limite_inferior_inclusivo",
    ),
    pytest.param(
        [(i * 60, 300.0) for i in range(11)],
        True,
        id="E01-08_limite_superior_inclusivo",
    ),
    pytest.param(
        [(i * 60, 250.0) for i in range(10)] + [(600, 301.0)],
        False,
        id="E01-09_leitura_final_fora_da_faixa",
    ),
]


@pytest.mark.parametrize("pares,esperado", CASOS)
def test_estabilidade_experimental_e01(motor, pares, esperado):
    historico = leituras(pares)
    resultado = motor.gerar_inteligencia_preditiva(
        historico[-1], historico, diametro=1000
    )
    estabilidade = resultado["ignicao_segura"]

    assert estabilidade["pronta"] is esperado, (
        f"Esperado {esperado}, recebido {estabilidade['pronta']}; "
        f"status={estabilidade.get('status')}; "
        f"duracao={estabilidade.get('duracao_observada_min')} min"
    )
    if esperado:
        assert estabilidade["duracao_observada_min"] >= 10
        assert estabilidade["tempo_restante_min"] == 0
    assert resultado["criterios_somente_apoio_decisao"] is True
    assert resultado["estimativa_ignicao"]["ignicao_segura_confirmada"] is False
