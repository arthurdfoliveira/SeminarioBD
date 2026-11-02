# SeminarioBD - Banco de Dados Orientado a Documentos (MongoDB)

Trabalho do Seminário de Banco de Dados NoSQL - CESAR School, prof. Eduardo Arruda.

- **Grupo:** 1.2
- **Tema:** Orientado a Documentos
- **Ferramenta:** MongoDB 7 (Community) + MongoDB Compass / extensão MongoDB for VS Code
- **Base de dados:** TMDB 5000 Movie Dataset (Kaggle), convertido para JSON
- **Apresentação:** 05/11

## Integrantes

- Artur Oliveira
- Bruno Holanda
- Matheus Fialho
- Pablo Coelho

## Estrutura de pastas

```
SeminarioBD/
├── conversao/
│   └── converter.py            # converte os CSVs do Kaggle em filmes.json
├── dados/
│   ├── brutos/                 # CSVs do Kaggle (não vão para o git)
│   └── processados/
│       └── filmes.json         # 4803 filmes prontos para importar
├── docker/
│   └── importar.sh             # importa o filmes.json quando o container sobe pela 1a vez
├── docs/
│   └── roteiro-apresentacao.md # divisão de falas, tempos e checklist
├── scripts/
│   ├── 00-teste.mongodb.js     # playground só para testar a conexão
│   ├── 01-crud.mongodb.js      # Create, Read, Update, Delete
│   ├── 02-consultas-complexas.mongodb.js  # aggregation pipeline, $elemMatch, $all
│   └── 03-indices.mongodb.js   # explain() antes e depois dos índices
└── docker-compose.yml
```

O banco usado é `catalogo` e a coleção é `filmes`.

## Como rodar com Docker (recomendado)

Precisa ter o Docker (Docker Desktop no Windows) instalado.

```bash
docker compose up -d
```

Na primeira vez que o container sobe, o `docker/importar.sh` roda sozinho e importa o
`dados/processados/filmes.json` em `catalogo.filmes`. Para conferir:

```bash
docker exec seminario-mongo mongosh catalogo --eval "db.filmes.countDocuments()"
# 4803
```

Observações:

- O script de importação só roda quando o volume está vazio. Para apagar tudo e importar
  de novo: `docker compose down -v` e depois `docker compose up -d`.
- O MongoDB fica em `mongodb://localhost:27017` (sem usuário e senha), então dá para
  conectar com o Compass ou com a extensão do VS Code normalmente.
- Para parar sem perder os dados: `docker compose down` (sem o `-v`).

## Como rodar sem Docker

Com o MongoDB Community instalado e rodando na máquina (porta 27017), dá para importar
de dois jeitos.

**Pelo MongoDB Compass** (é o caminho sugerido no roteiro do professor):

1. Conectar em `mongodb://localhost:27017`.
2. Criar o banco `catalogo` com a coleção `filmes`.
3. Na coleção, clicar em "Add Data" > "Import JSON or CSV file" e escolher
   `dados/processados/filmes.json`.
4. Conferir se aparecem 4803 documentos.

**Pelo mongoimport** (vem no MongoDB Database Tools):

```bash
mongoimport --db catalogo --collection filmes --jsonArray --file dados/processados/filmes.json
```

Nos dois casos o campo `data_lancamento` entra como tipo Date, porque no JSON ele está
no formato `{"$date": "..."}` (Extended JSON), que os dois entendem.

## Como rodar os playgrounds

Os arquivos em `scripts/` são playgrounds da extensão **MongoDB for VS Code**.

1. Instalar a extensão "MongoDB for VS Code".
2. Na aba do MongoDB, criar uma conexão com `mongodb://localhost:27017`.
3. Abrir o arquivo `.mongodb.js`.
4. Selecionar o bloco que quer rodar, clicar com o botão direito e escolher
   "MongoDB: Run Selected Lines From Playground". O resultado aparece numa aba ao lado.

Cuidados:

- Quando a seleção tem mais de um comando, o playground mostra só o resultado do último.
  No `03-indices`, o bloco I4 tem o "antes" e o "depois" juntos, então é preciso rodar
  uma linha de cada vez. As linhas com `resumo(...)` precisam da função `resumo`, que
  está no começo do arquivo; selecione a função junto com a linha.
- O `01-crud` cria documentos com `demo: true` e apaga todos no D2. Se a demonstração
  parar no meio, rode o D2 para deixar a coleção com 4803 de novo.
- O `03-indices` começa apagando os índices (I0), então pode ser rodado várias vezes.

Também dá para rodar pelo terminal, colando os comandos no `mongosh`:

```bash
docker exec -it seminario-mongo mongosh catalogo
```

## Como regerar o filmes.json

O `filmes.json` já está no repositório, então isso só é necessário se a conversão mudar.

1. Baixar o [TMDB 5000 Movie Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata)
   no Kaggle.
2. Colocar `tmdb_5000_movies.csv` e `tmdb_5000_credits.csv` em `dados/brutos/`.
3. Na raiz do repositório, rodar:

```bash
python conversao/converter.py
```

O script só usa a biblioteca padrão do Python 3, não precisa instalar nada. Depois de
regerar, é preciso importar de novo (`docker compose down -v` e `up -d`, no caso do Docker).

## Modelagem

O dataset original vem em dois CSVs (filmes e créditos), com colunas como `genres`,
`cast` e `crew` guardadas como texto JSON. No modelo relacional isso viraria várias
tabelas (filme, gênero, filme_gênero, pessoa, elenco...). Aqui cada filme virou **um
documento** só. Exemplo resumido:

```json
{
  "tmdb_id": 19995,
  "titulo": "Avatar",
  "generos": ["Action", "Adventure", "Fantasy", "Science Fiction"],
  "nota": 7.2,
  "votos": 11800,
  "ano": 2009,
  "data_lancamento": { "$date": "2009-12-10T00:00:00Z" },
  "financeiro": { "orcamento": 237000000, "receita": 2787965087 },
  "producao": { "empresas": ["..."], "paises": ["..."] },
  "direcao": ["James Cameron"],
  "elenco": [
    { "ator": "Sam Worthington", "personagem": "Jake Sully", "ordem": 0 }
  ]
}
```

**Por que embutir gêneros, elenco e direção.** Quase toda consulta do catálogo precisa
desses dados junto com o filme (mostrar a página do filme, filtrar por gênero, buscar por
ator). Com tudo dentro do documento, uma leitura só traz o filme completo, sem JOIN. Esses
dados também quase nunca mudam depois que o filme é lançado, então a duplicação (o nome de
um ator aparece em vários filmes) não dá trabalho para manter. E dá para indexar campos
dentro de arrays, como `elenco.ator`, o que deixa a busca por ator rápida.

**Por que o elenco foi limitado a 10.** No CSV muitos filmes têm dezenas de pessoas no
elenco. Para as consultas do trabalho só os atores principais importam, e guardar todos
deixaria os documentos grandes sem necessidade. Ficamos com os 10 primeiros pela ordem de
créditos (o campo `ordem`, onde 0 é o protagonista). Isso segue a ideia de que um array
dentro do documento não deve crescer sem limite.

**Por que campos ausentes em vez de null.** Campos opcionais (`data_lancamento`, `ano`,
`duracao_min`, `financeiro`, `slogan`, `site`, `elenco`, `direcao`) só aparecem no
documento quando o dado existe. Por exemplo, 890 filmes não têm orçamento nem receita e
por isso não têm o campo `financeiro`. Isso mostra a flexibilidade de esquema do MongoDB,
deixa os documentos menores e as consultas continuam simples: `{ financeiro: { $exists:
false } }` acha quem não tem o dado.

Na conversão, `release_date` virou um Date de verdade (para dar para ordenar e filtrar por
data) e também um campo `ano` numérico, que facilita os agrupamentos.
