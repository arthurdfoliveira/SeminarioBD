#!/bin/bash
set -e
mongoimport --db catalogo --collection filmes --jsonArray --file /dados/filmes.json
