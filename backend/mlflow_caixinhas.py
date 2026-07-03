from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
import hashlib
import json
import math
import os
import re
import tempfile
from typing import Any, Callable, Dict, Iterable, Optional

import mlflow
import pandas as pd

# Configurações padrão do MLflow.
EXPERIMENT_NAME = os.getenv("MLFLOW_EXPERIMENT_NAME", "LocalidadeRisco")
SENSITIVE_PATTERNS = (
    "CPF", "CNPJ", "DOCUMENTO", "NOME_TITULAR", "NOME", "CONTA", "AGENCIA", "ENDERECO"
)

# Função para sanitizar chaves, valores e paths.
def _sanitize_key(value: Any, max_len: int = 180) -> str:
    text = str(value) if value is not None else "nulo"
    text = re.sub(r"[^A-Za-z0-9_.\-/ ]+", "_", text).strip().replace(" ", "_")
    return text[:max_len] or "nulo"

# Função para converter valores em float, retornando None para NaN ou infinito.
def _safe_number(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except Exception:
        return None

# Função para gerar hash curto de um valor, retornando string vazia para None ou NaN.
def _short_hash(value: Any) -> str:
    if value is None or pd.isna(value):
        return ""
    return hashlib.sha256(str(value).encode("utf-8", errors="ignore")).hexdigest()[:12]

# Função para gerar hash completo de bytes, retornando hash de bytes vazios para None.
def hash_bytes(data: bytes) -> str:
    return hashlib.sha256(data or b"").hexdigest()

# Função para converter caminho de string para Path.
def _path_from_env(value: Optional[str]) -> Optional[Path]:
    if not value:
        return None
    return Path(value).expanduser().resolve()

# Função para configurar o MLflow, definindo tracking URI e experimento.
def configurar_mlflow(app_data_path_fn: Optional[Callable[[str], str]] = None) -> str:

    tracking_uri = os.getenv("MLFLOW_TRACKING_URI")
    artifact_root = _path_from_env(os.getenv("MLFLOW_ARTIFACT_ROOT"))

    if tracking_uri:
        mlflow.set_tracking_uri(tracking_uri)
    else:
        db_env = os.getenv("MLFLOW_SQLITE_DB_PATH") or os.getenv("MLFLOW_CARACAS_DB_PATH")

        if db_env:
            db_path = _path_from_env(db_env)
            assert db_path is not None
            db_path.parent.mkdir(parents=True, exist_ok=True)
            if artifact_root is None:
                artifact_root = db_path.parent / "mlruns"
            artifact_root.mkdir(parents=True, exist_ok=True)
            tracking_uri = f"sqlite:///{db_path.as_posix()}"
            mlflow.set_tracking_uri(tracking_uri)

        elif app_data_path_fn is not None:
            db_path = Path(app_data_path_fn("mlflow.db")).resolve()
            artifact_root = Path(app_data_path_fn("mlruns")).resolve()
            artifact_root.mkdir(parents=True, exist_ok=True)
            tracking_uri = f"sqlite:///{db_path.as_posix()}"
            mlflow.set_tracking_uri(tracking_uri)

    experimento = mlflow.get_experiment_by_name(EXPERIMENT_NAME)
    if experimento is None and artifact_root is not None:
        mlflow.create_experiment(EXPERIMENT_NAME, artifact_location=artifact_root.as_uri())

    mlflow.set_experiment(EXPERIMENT_NAME)
    return mlflow.get_tracking_uri()

# Funções para logar parâmetros, métricas e artefatos de forma segura, evitando erros com tipos inválidos ou valores sensíveis.
def log_params_safe(params: Dict[str, Any], prefix: str = "") -> None:
    clean = {}
    for k, v in (params or {}).items():
        key = _sanitize_key(f"{prefix}{k}")
        if isinstance(v, (dict, list, tuple, set)):
            clean[key] = json.dumps(v, ensure_ascii=False, default=str)[:500]
        else:
            clean[key] = str(v)[:500]
    if clean:
        mlflow.log_params(clean)

# Função para logar métricas de forma segura, convertendo valores para float e sanitizando chaves.
def log_metrics_safe(metrics: Dict[str, Any], prefix: str = "") -> None:
    clean = {}
    for k, v in (metrics or {}).items():
        f = _safe_number(v)
        if f is not None:
            clean[_sanitize_key(f"{prefix}{k}")] = f
    if clean:
        mlflow.log_metrics(clean)

# Função para logar artefatos JSON, salvando em arquivo temporário e registrando no MLflow.
def log_json_artifact(obj: Any, filename: str, artifact_path: str = "json") -> None:
    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / filename
        path.write_text(json.dumps(obj, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
        mlflow.log_artifact(str(path), artifact_path=artifact_path)

# Função para mascarar dados sensíveis em um DataFrame, aplicando hash curto em colunas que correspondem a padrões sensíveis.
def _mask_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    masked = df.copy()
    for col in masked.columns:
        col_upper = str(col).upper()
        if any(pattern in col_upper for pattern in SENSITIVE_PATTERNS):
            masked[col] = masked[col].apply(lambda x: _short_hash(x) if str(x).strip() else "")
    return masked

# Função para logar um DataFrame como artefato CSV, aplicando máscara de PII e limitando o número de linhas.
def log_dataframe_artifact(
    df: Optional[pd.DataFrame],
    filename: str,
    artifact_path: str = "data_samples",
    max_rows: int = 500,
    allow_raw: Optional[bool] = None,
) -> None:
    if df is None:
        return

    if allow_raw is None:
        allow_raw = os.getenv("MLFLOW_LOG_RAW_DATA", "false").lower() == "true"

    sample = df.head(max_rows).copy()
    if not allow_raw:
        sample = _mask_dataframe(sample)

    with tempfile.TemporaryDirectory() as tmp:
        path = Path(tmp) / filename
        sample.to_csv(path, index=False, sep=";", encoding="utf-8-sig")
        mlflow.log_artifact(str(path), artifact_path=artifact_path)

# Função para logar métricas de perfil de um DataFrame, incluindo contagem de linhas, colunas, duplicatas e estatísticas de colunas específicas.
def log_dataframe_profile(df: Optional[pd.DataFrame], prefix: str) -> None:
    prefix = _sanitize_key(prefix) + "_"

    if df is None:
        log_metrics_safe({"linhas": 0, "colunas": 0}, prefix=prefix)
        return

    metrics = {
        "linhas": len(df),
        "colunas": len(df.columns),
        "duplicadas": int(df.duplicated().sum()) if len(df) else 0,
    }

    if "VALOR_TRANSACAO" in df.columns:
        valores = pd.to_numeric(df["VALOR_TRANSACAO"], errors="coerce").fillna(0)
        metrics.update({
            "valor_total": float(valores.sum()),
            "valor_medio": float(valores.mean()) if len(valores) else 0,
            "valor_max": float(valores.max()) if len(valores) else 0,
        })

    if "SCORE_SUSPEITA" in df.columns:
        scores = pd.to_numeric(df["SCORE_SUSPEITA"], errors="coerce").fillna(0)
        metrics.update({
            "score_medio": float(scores.mean()) if len(scores) else 0,
            "score_max": float(scores.max()) if len(scores) else 0,
        })

    log_metrics_safe(metrics, prefix=prefix)

    schema = {
        "columns": list(map(str, df.columns)),
        "dtypes": {str(k): str(v) for k, v in df.dtypes.items()},
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    log_json_artifact(schema, f"{prefix}schema.json", artifact_path="schemas")

    for col in ["TIPOLOGIA_ORIGEM", "UF_FINAL", "SUSPEITA"]:
        if col in df.columns:
            counts = df[col].fillna("N/D").astype(str).value_counts().head(10)
            for value, count in counts.items():
                log_metrics_safe({f"{col}_{_sanitize_key(value)}_qtd": int(count)}, prefix=prefix)


# Função para logar exceções, registrando tags de erro e salvando detalhes em um artefato JSON.
def log_exception(exc: Exception, context: str = "erro") -> None:
    mlflow.set_tag("status_caixinha", "erro")
    mlflow.set_tag("erro_contexto", context)
    mlflow.set_tag("erro_tipo", type(exc).__name__)
    log_json_artifact({"contexto": context, "tipo": type(exc).__name__, "mensagem": str(exc)}, "erro.json", "erros")


@contextmanager
# Context manager para criar uma "caixinha" de run no MLflow, permitindo a criação de runs aninhados e o registro de tags.
def child_run(run_name: str, parent_run_id: Optional[str] = None, tags: Optional[Dict[str, Any]] = None):
    tags = {str(k): str(v) for k, v in (tags or {}).items()}

    if parent_run_id:
        with mlflow.start_run(run_id=parent_run_id):
            with mlflow.start_run(run_name=run_name, nested=True, tags=tags) as run:
                mlflow.set_tag("caixinha", run_name)
                yield run
        return

    nested = mlflow.active_run() is not None
    with mlflow.start_run(run_name=run_name, nested=nested, tags=tags) as run:
        mlflow.set_tag("caixinha", run_name)
        yield run
