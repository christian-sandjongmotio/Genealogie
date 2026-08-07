# Mémoire familiale

Application d’arbre généalogique : Java 25, Spring Boot 4.1, Maven, Angular 22 et PostgreSQL 17.

## Démarrage

1. À la racine : `docker compose up -d`
2. Dans un terminal : `cd backend` puis `mvn spring-boot:run`
3. Dans un autre terminal : `cd frontend` puis `npm start`
4. Ouvrir http://localhost:4200

L’API est disponible sur http://localhost:8091/api/persons. L’interface affiche des données de démonstration si l’API n’est pas encore lancée.

## Sauvegarde et échange

- Export GEDCOM : bouton « Exporter GEDCOM » dans l’application.
- Sauvegarde PostgreSQL : `powershell -ExecutionPolicy Bypass -File scripts/sauvegarder.ps1`.
- Les sauvegardes SQL sont créées dans `backups/`.
