# QueenDeQ Backend

Backend pour la plateforme Queen de Q avec intégration OpenAI pour la Reine-Mère.

## Installation

```bash
npm install
```

## Configuration

Créez un fichier `.env` basé sur `.env.example` :

```bash
cp .env.example .env
```

Configurez les variables d'environnement :

- `MONGODB_URI` : Votre URI de connexion MongoDB
- `JWT_SECRET` : Clé secrète pour JWT
- `OPENAI_API_KEY` : Votre clé API OpenAI (obligatoire pour la fonctionnalité chat)
- `PORT` : Port du serveur (défaut: 5000)

## Fonctionnalités AI

### La Reine-Mère - Assistant IA

Le backend inclut un système d'IA sophistiqué pour l'assistant "Reine-Mère" avec :

- **Personnalité consistante** : Voix intérieure chaleureuse et complice
- **Modes multiples** : 
  - `default` : La Reine-Mère classique
  - `dreamsInterpreter` : Spécialisée dans l'interprétation des rêves
  - `mysticalGuide` : Guide spirituelle et mystique
- **Streaming en temps réel** : Réponses progressives pour une meilleure UX
- **Gestion d'erreurs robuste** : Messages de fallback en cas de problème

### Endpoints API

#### Chat Standard
```
POST /api/ai/chat
```

Body :
```json
{
  "messages": [
    {"role": "user", "content": "Votre message"}
  ],
  "mode": "default"
}
```

#### Chat Streaming
```
POST /api/ai/chat/stream
```

Même format de body, retourne un stream de réponses JSON.

#### Modes Disponibles
```
GET /api/ai/modes
```

Retourne la liste des modes disponibles.

## Démarrage

```bash
npm start
```

Le serveur démarre sur le port configuré (défaut: 5000).

## Structure du Projet

```
src/
├── config/
│   ├── database.js      # Configuration MongoDB
│   └── ai.js           # Configuration OpenAI et prompts système
├── routes/
│   ├── index.js        # Routes principales
│   ├── userRoutes.js   # Routes utilisateur
│   └── chatRoutes.js   # Routes IA/Chat
├── middleware/
│   ├── notFound.js     # Middleware 404
│   └── errorHandler.js # Gestionnaire d'erreurs
└── index.js           # Point d'entrée principal
```

## Sécurité et Limites

- Rate limiting : 100 requêtes/15min
- Validation des entrées avec express-validator
- Headers de sécurité avec Helmet
- Limites de tokens configurables par mode
- Gestion gracieuse des erreurs OpenAI

