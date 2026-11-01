// =============================================================
// 02 - Consultas complexas (Aggregation Pipeline e operadores de array)
// Banco: catalogo | Coleção: filmes
//
// Rode uma consulta por vez: selecione o bloco, botão direito,
// "MongoDB: Run Selected Lines From Playground".
// Os gêneros estão em inglês, como no dataset original.
// =============================================================

use('catalogo');

// -------------------------------------------------------------
// Q1. Nota média por gênero
// $unwind "abre" o array de gêneros (um documento por gênero),
// $group calcula média e quantidade, $sort ordena.
// Só considera filmes com pelo menos 100 votos, para evitar notas distorcidas.
// -------------------------------------------------------------
db.filmes.aggregate([
  { $match: { votos: { $gte: 100 } } },
  { $unwind: "$generos" },
  { $group: {
      _id: "$generos",
      nota_media: { $avg: "$nota" },
      quantidade: { $sum: 1 }
  } },
  { $match: { quantidade: { $gte: 20 } } },
  { $project: { _id: 0, genero: "$_id", nota_media: { $round: ["$nota_media", 2] }, quantidade: 1 } },
  { $sort: { nota_media: -1 } }
]);

// -------------------------------------------------------------
// Q2. Diretores com maior lucro somado (receita - orçamento)
// Usa campo aninhado (financeiro) e array (direcao).
// -------------------------------------------------------------
db.filmes.aggregate([
  { $match: { "financeiro.orcamento": { $gt: 0 }, "financeiro.receita": { $gt: 0 } } },
  { $unwind: "$direcao" },
  { $group: {
      _id: "$direcao",
      lucro_total: { $sum: { $subtract: ["$financeiro.receita", "$financeiro.orcamento"] } },
      filmes: { $sum: 1 },
      titulos: { $push: "$titulo" }
  } },
  { $sort: { lucro_total: -1 } },
  { $limit: 10 },
  { $project: { _id: 0, diretor: "$_id", lucro_total: 1, filmes: 1, titulos: { $slice: ["$titulos", 5] } } }
]);

// -------------------------------------------------------------
// Q3. Atores que mais aparecem em filmes bem avaliados
// (nota >= 7.5 e pelo menos 1000 votos). Abre o array de objetos "elenco".
// -------------------------------------------------------------
db.filmes.aggregate([
  { $match: { nota: { $gte: 7.5 }, votos: { $gte: 1000 } } },
  { $unwind: "$elenco" },
  { $group: { _id: "$elenco.ator", filmes: { $sum: 1 }, titulos: { $push: "$titulo" } } },
  { $sort: { filmes: -1 } },
  { $limit: 10 },
  { $project: { _id: 0, ator: "$_id", filmes: 1, titulos: 1 } }
]);

// -------------------------------------------------------------
// Q4. Evolução por década: quantidade de filmes, duração média e nota média
// -------------------------------------------------------------
db.filmes.aggregate([
  { $match: { ano: { $exists: true } } },
  { $group: {
      _id: { $multiply: [{ $floor: { $divide: ["$ano", 10] } }, 10] },
      filmes: { $sum: 1 },
      duracao_media: { $avg: "$duracao_min" },
      nota_media: { $avg: "$nota" }
  } },
  { $project: {
      _id: 0,
      decada: "$_id",
      filmes: 1,
      duracao_media: { $round: ["$duracao_media", 0] },
      nota_media: { $round: ["$nota_media", 2] }
  } },
  { $sort: { decada: 1 } }
]);

// -------------------------------------------------------------
// Q5. $elemMatch: filmes em que o ator é o PROTAGONISTA (ordem 0 no elenco).
// As duas condições precisam valer para o MESMO item do array.
// -------------------------------------------------------------
db.filmes.find(
  { elenco: { $elemMatch: { ator: "Leonardo DiCaprio", ordem: 0 } } },
  { _id: 0, titulo: 1, ano: 1, nota: 1 }
).sort({ ano: 1 });

// -------------------------------------------------------------
// Q6. $all: filmes que são ao mesmo tempo de Ação E Ficção Científica,
// com nota alta, mostrando só o protagonista
// -------------------------------------------------------------
db.filmes.find(
  { generos: { $all: ["Action", "Science Fiction"] }, nota: { $gte: 7.5 }, votos: { $gte: 1000 } },
  { _id: 0, titulo: 1, ano: 1, nota: 1, protagonista: { $first: "$elenco.ator" } }
).sort({ nota: -1 });
