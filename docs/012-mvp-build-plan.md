012 — MVP Build Plan

Plan de construction de la première version utilisable

⸻

1. Objectif

La v0.1 doit prouver une seule chose :

Life OS peut transformer des fragments de vie en mémoire utile.

Pas besoin de tout comprendre.
Pas besoin de tout automatiser.
Pas besoin d’une IA parfaite.

La première version doit permettre à l’utilisateur de :

1. capturer quelque chose rapidement ;
2. le retrouver dans une inbox ;
3. laisser l’IA l’analyser ;
4. créer ou enrichir une entité ;
5. construire une mémoire simple ;
6. recevoir un briefing utile.

La v0.1 n’est pas le produit final.

C’est le premier cycle vivant.

⸻

2. Périmètre exact de la v0.1

La v0.1 contient uniquement :

* une application mobile-first ;
* une entrée universelle texte ;
* une inbox personnelle ;
* une analyse IA simple ;
* des entités vivantes basiques ;
* une mémoire personnelle minimale ;
* un briefing quotidien ;
* une page de réglages confiance/suppression.

Tout le reste est exclu.

⸻

3. Les écrans à construire

3.1 Home

Rôle : point d’entrée principal.

Elle contient :

* le champ de capture ;
* le briefing du jour ;
* les dernières entités actives ;
* les dernières observations capturées.

La Home doit donner une sensation simple :

“Je pose quelque chose, Life OS s’en occupe.”

⸻

3.2 Capture

Rôle : permettre à l’utilisateur d’ajouter un fragment de vie.

En v0.1, uniquement :

* texte libre ;
* note rapide ;
* idée ;
* souvenir ;
* tâche personnelle ;
* information sur une personne ;
* information sur un projet.

Exemples :

* “Ezra a adoré la compote pomme-banane.”
* “Penser à appeler David pour le projet.”
* “Je veux me remettre sérieusement au sport.”
* “Ma femme préfère éviter les sorties trop tardives.”

⸻

3.3 Inbox

Rôle : recevoir tout ce qui n’est pas encore compris.

Chaque élément affiche :

* contenu brut ;
* date ;
* statut ;
* suggestion IA ;
* action utilisateur.

Statuts simples :

* à analyser ;
* analysé ;
* confirmé ;
* ignoré ;
* supprimé.

⸻

3.4 Détail d’une observation

Rôle : voir ce que l’IA a compris.

L’écran affiche :

* observation originale ;
* signaux détectés ;
* entités proposées ;
* mémoire proposée ;
* niveau de confiance ;
* bouton confirmer ;
* bouton modifier ;
* bouton supprimer.

Principe clé :

L’IA propose. L’utilisateur valide.

⸻

3.5 Entités

Rôle : représenter les éléments importants de la vie.

En v0.1, types limités :

* personne ;
* projet ;
* habitude ;
* lieu ;
* sujet ;
* objectif.

Chaque entité contient :

* nom ;
* type ;
* résumé ;
* observations liées ;
* mémoires associées ;
* dernière activité.

⸻

3.6 Détail d’une entité

Rôle : comprendre ce que Life OS sait d’un élément.

L’écran contient :

* résumé vivant ;
* faits connus ;
* préférences ;
* observations récentes ;
* liens simples avec d’autres entités.

Pas de graph visuel complexe en v0.1.

⸻

3.7 Mémoire

Rôle : donner à l’utilisateur le contrôle.

Elle affiche :

* ce que le système pense savoir ;
* les mémoires confirmées ;
* les mémoires incertaines ;
* les mémoires sensibles ;
* les options modifier / oublier.

⸻

3.8 Briefing

Rôle : restituer de la valeur.

En v0.1, le briefing contient :

* ce qui est important aujourd’hui ;
* les projets actifs ;
* les personnes à ne pas oublier ;
* les habitudes ou objectifs récents ;
* une ou deux suggestions maximum.

Le briefing doit être court.

⸻

3.9 Réglages confiance

Rôle : rassurer.

Contient :

* supprimer une observation ;
* supprimer une mémoire ;
* désactiver une mémoire sensible ;
* exporter plus tard ;
* rappel du principe : rien d’important n’est figé.

⸻

4. Données minimales nécessaires

Observation

* contenu brut ;
* date ;
* source ;
* statut ;
* niveau de sensibilité ;
* analyse IA ;
* entités liées.

Signal

* thème détecté ;
* importance ;
* confiance ;
* observations sources.

Entité

* nom ;
* type ;
* résumé ;
* importance ;
* confiance ;
* observations liées ;
* mémoires liées.

Mémoire

* contenu ;
* type ;
* confiance ;
* sensibilité ;
* source ;
* date de création ;
* date de dernière confirmation.

Briefing

* date ;
* éléments prioritaires ;
* suggestions ;
* mémoires utilisées.

⸻

5. Actions utilisateur

L’utilisateur peut :

* ajouter une note ;
* valider une analyse ;
* corriger une analyse ;
* créer une entité ;
* fusionner avec une entité existante ;
* confirmer une mémoire ;
* supprimer une observation ;
* oublier une mémoire ;
* lire son briefing.

C’est tout.

Pas de workflows complexes.

⸻

6. Actions IA

L’IA peut :

* analyser une observation ;
* détecter des signaux ;
* proposer une entité ;
* enrichir une entité existante ;
* proposer une mémoire ;
* détecter une contradiction ;
* marquer une information comme incertaine ;
* marquer une information comme sensible ;
* générer un briefing.

L’IA ne peut pas :

* décider seule qu’une vérité est définitive ;
* mémoriser une information sensible sans prudence ;
* créer trop d’entités ;
* interrompre l’utilisateur sans raison forte ;
* transformer Life OS en assistant bavard.

⸻

7. Flux complet v0.1

Étape 1 — Capture

L’utilisateur écrit une information dans l’entrée universelle.

Exemple :

“Ezra dort mieux quand on fait une promenade après le dîner.”

⸻

Étape 2 — Inbox

L’information arrive dans l’inbox comme observation brute.

Statut :

“à analyser”

⸻

Étape 3 — Analyse

L’IA détecte :

* sujet : Ezra ;
* thème : sommeil ;
* habitude : promenade après dîner ;
* signal : possible lien entre promenade et meilleur sommeil ;
* confiance : moyenne.

⸻

Étape 4 — Entité

L’IA propose de relier l’observation à l’entité :

“Ezra”

Si l’entité n’existe pas, elle propose de la créer.

⸻

Étape 5 — Mémoire

L’IA propose une mémoire prudente :

“Ezra semble mieux dormir après une promenade en soirée.”

Pas :

“Ezra doit marcher tous les soirs.”

⸻

Étape 6 — Confirmation

L’utilisateur valide, modifie ou ignore.

⸻

Étape 7 — Briefing

Le lendemain, Life OS peut dire :

“À noter : Ezra a mieux dormi après une promenade hier soir. Ça peut valoir le coup d’observer si cela se confirme.”

C’est la valeur centrale.

⸻

8. Exclusions strictes

La v0.1 ne contient pas :

* voix ;
* photo ;
* documents ;
* calendrier connecté ;
* emails connectés ;
* santé connectée ;
* notifications intelligentes complexes ;
* agents autonomes ;
* automatisations ;
* graph visuel avancé ;
* scoring psychologique ;
* recommandations intrusives ;
* marketplace ;
* partage familial ;
* version desktop avancée ;
* système de permissions complexe ;
* app native complète si une PWA suffit pour démarrer.

La règle :

si ce n’est pas nécessaire pour prouver capture → mémoire → briefing, on ne le construit pas.

⸻

9. Ordre de développement

Phase 1 — Structure produit

Construire :

* navigation mobile ;
* Home ;
* Capture ;
* Inbox ;
* Détail observation.

Objectif :

l’utilisateur peut capturer une note et la retrouver.

⸻

Phase 2 — Analyse IA

Construire :

* analyse d’une observation ;
* extraction des signaux ;
* proposition d’entités ;
* proposition de mémoire ;
* niveau de confiance ;
* niveau de sensibilité.

Objectif :

Life OS commence à comprendre sans conclure trop vite.

⸻

Phase 3 — Entités

Construire :

* liste des entités ;
* création d’entité ;
* détail entité ;
* liaison observation → entité ;
* résumé simple d’entité.

Objectif :

les fragments commencent à s’organiser autour de présences vivantes.

⸻

Phase 4 — Mémoire

Construire :

* liste des mémoires ;
* mémoire confirmée ;
* mémoire incertaine ;
* modification ;
* oubli.

Objectif :

l’utilisateur voit et contrôle ce que le système retient.

⸻

Phase 5 — Briefing

Construire :

* génération du briefing quotidien ;
* affichage sur Home ;
* lien vers les observations et mémoires utilisées.

Objectif :

la mémoire devient utile.

⸻

Phase 6 — Polish MVP

Améliorer :

* fluidité mobile ;
* empty states ;
* wording ;
* confiance ;
* lisibilité ;
* onboarding très court ;
* performance perçue.

Objectif :

le produit doit donner envie de revenir.

⸻

10. Critères de réussite

La v0.1 fonctionne si :

* l’utilisateur peut capturer une pensée en moins de 10 secondes ;
* chaque capture arrive dans l’inbox ;
* l’IA propose une analyse compréhensible ;
* l’utilisateur peut corriger ou refuser ;
* une entité peut être créée ou enrichie ;
* une mémoire peut être confirmée ;
* une mémoire peut être oubliée ;
* le briefing utilise réellement la mémoire ;
* l’utilisateur comprend pourquoi le système propose quelque chose ;
* l’expérience reste simple sur mobile.

Le critère ultime :

après quelques jours, Life OS doit donner l’impression de commencer à connaître la vie de l’utilisateur sans jamais l’envahir.

⸻

11. Principe fondateur de construction

Ne pas construire une app de notes.

Ne pas construire un CRM personnel.

Ne pas construire un dashboard.

Ne pas construire un assistant générique.

Construire le plus petit système capable de faire émerger une mémoire personnelle vivante.

La v0.1 doit être simple.

Mais elle doit déjà contenir l’ADN du produit final :

* observation ;
* signal ;
* entité ;
* mémoire ;
* confiance ;
* briefing ;
* contrôle utilisateur.

Tout le reste viendra après.