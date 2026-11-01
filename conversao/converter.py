"""
Converte o TMDB 5000 Movie Dataset (Kaggle) de CSV para documentos JSON
prontos para importar no MongoDB (coleção catalogo.filmes).

Entrada (baixe do Kaggle e coloque em dados/brutos/):
    tmdb_5000_movies.csv
    tmdb_5000_credits.csv

Saída:
    dados/processados/filmes.json

Uso (a partir da raiz do repositório):
    python conversao/converter.py

Só usa a biblioteca padrão do Python (não precisa instalar nada).
"""

import csv
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BRUTOS = RAIZ / "dados" / "brutos"
SAIDA = RAIZ / "dados" / "processados" / "filmes.json"

ARQ_FILMES = BRUTOS / "tmdb_5000_movies.csv"
ARQ_CREDITOS = BRUTOS / "tmdb_5000_credits.csv"

MAX_ELENCO = 10  # guarda só os 10 primeiros atores de cada filme

# As colunas de elenco/equipe são textos enormes; aumenta o limite do leitor CSV
csv.field_size_limit(2**31 - 1)


def lista_json(texto):
    """Colunas como 'genres' vêm como texto JSON: '[{"id": 28, "name": "Action"}]'."""
    if not texto:
        return []
    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        return []


def nomes(texto):
    return [item["name"] for item in lista_json(texto) if item.get("name")]


def numero(texto, tipo=float):
    try:
        return tipo(float(texto))
    except (TypeError, ValueError):
        return None


def ler_creditos():
    creditos = {}
    with open(ARQ_CREDITOS, encoding="utf-8", newline="") as f:
        for linha in csv.DictReader(f):
            elenco = sorted(lista_json(linha["cast"]), key=lambda a: a.get("order", 999))
            equipe = lista_json(linha["crew"])
            creditos[linha["movie_id"]] = {
                "elenco": [
                    {"ator": a["name"], "personagem": a.get("character", ""), "ordem": a.get("order")}
                    for a in elenco[:MAX_ELENCO]
                ],
                "direcao": [p["name"] for p in equipe if p.get("job") == "Director"],
            }
    return creditos


def montar_documento(linha, creditos):
    doc = {
        "tmdb_id": int(linha["id"]),
        "titulo": linha["title"],
        "titulo_original": linha["original_title"],
        "idioma_original": linha["original_language"],
        "sinopse": linha["overview"],
        "generos": nomes(linha["genres"]),
        "palavras_chave": nomes(linha["keywords"]),
        "nota": numero(linha["vote_average"]),
        "votos": numero(linha["vote_count"], int),
        "popularidade": numero(linha["popularity"]),
        "producao": {
            "empresas": nomes(linha["production_companies"]),
            "paises": nomes(linha["production_countries"]),
        },
    }

    # Campos opcionais: só entram no documento quando existem (esquema flexível)
    data = linha["release_date"]
    if data:
        doc["data_lancamento"] = {"$date": f"{data}T00:00:00Z"}  # vira tipo Date no MongoDB
        doc["ano"] = int(data[:4])

    duracao = numero(linha["runtime"], int)
    if duracao:
        doc["duracao_min"] = duracao

    orcamento = numero(linha["budget"], int)
    receita = numero(linha["revenue"], int)
    if orcamento or receita:
        doc["financeiro"] = {"orcamento": orcamento, "receita": receita}

    if linha["tagline"]:
        doc["slogan"] = linha["tagline"]
    if linha["homepage"]:
        doc["site"] = linha["homepage"]

    cred = creditos.get(linha["id"])
    if cred:
        if cred["elenco"]:
            doc["elenco"] = cred["elenco"]
        if cred["direcao"]:
            doc["direcao"] = cred["direcao"]

    return doc


def main():
    for arq in (ARQ_FILMES, ARQ_CREDITOS):
        if not arq.exists():
            sys.exit(f"Arquivo não encontrado: {arq}\nBaixe o dataset do Kaggle e coloque em dados/brutos/.")

    creditos = ler_creditos()
    with open(ARQ_FILMES, encoding="utf-8", newline="") as f:
        documentos = [montar_documento(linha, creditos) for linha in csv.DictReader(f)]

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(documentos, f, ensure_ascii=False, indent=1)

    tamanho_mb = SAIDA.stat().st_size / 1_000_000
    print(f"{len(documentos)} filmes convertidos -> {SAIDA} ({tamanho_mb:.1f} MB)")


if __name__ == "__main__":
    main()
