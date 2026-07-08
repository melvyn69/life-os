014 — Data & AI Architecture

Structure conceptuelle des données et de l’intelligence de Life OS

⸻

1. Objectif

Life OS ne doit pas devenir une base de données compliquée.

Il doit transformer des fragments de vie en mémoire utile, avec une architecture simple, lisible et évolutive.

La question centrale est :

Comment traduire les concepts de Life OS en données, prompts, mémoire et actions IA sans perdre la simplicité du produit ?

La v0.1 doit rester minimaliste.

Elle ne cherche pas à tout comprendre.
Elle ne cherche pas à tout automatiser.
Elle ne cherche pas à construire une intelligence parfaite.

Elle doit simplement permettre à l’utilisateur de capturer une information, à l’IA de l’analyser prudemment, puis au système de créer une mémoire exploitable.

⸻

2. Principe fondamental

Life OS repose sur une chaîne simple :

Capture → Observation → Signal → Entity → Memory → Briefing

Chaque étape a un rôle précis.

Une capture est ce que l’utilisateur donne.
Une observation est ce que le système extrait.
Un signal est une tendance possible.
Une entity est un élément vivant important.
Une memory est une information validée ou utile.
Un briefing est une restitution au bon moment.

Le système ne doit jamais confondre ces niveaux.

Une phrase capturée n’est pas automatiquement une vérité.
Une observation n’est pas automatiquement une mémoire.
Un signal n’est pas automatiquement une conclusion.
Une entité n’est pas automatiquement importante.
Un briefing n’est pas une décision.

⸻

3. Objets de données minimaux

La v0.1 nécessite six objets principaux :

1. Capture
2. Observation
3. Signal
4. Entity
5. Memory
6. Briefing

Ces objets suffisent pour construire une première mémoire intelligente sans créer une usine à gaz.

⸻

4. Capture

Une capture est l’entrée brute fournie par l’utilisateur.

Elle peut être :

* un texte ;
* une note vocale transcrite ;
* une photo décrite ;
* un document résumé ;
* un lien ;
* une pensée rapide ;
* une information à ne pas oublier.

La capture est volontaire.

En v0.1, Life OS ne doit pas aspirer automatiquement la vie de l’utilisateur.

Rôle

La capture sert de point d’entrée universel.

Elle conserve la source originale de l’information.

Données minimales

Une capture contient :

* un identifiant ;
* un contenu brut ;
* un type ;
* une date de création ;
* une source ;
* un statut ;
* un niveau de sensibilité estimé ;
* un lien vers les observations générées.

Statuts possibles

* new ;
* processing ;
* analyzed ;
* ignored ;
* archived ;
* deleted.

Règle clé

Une capture ne doit jamais être modifiée silencieusement.

Le système peut l’analyser, la résumer ou l’enrichir, mais il doit préserver l’entrée originale.

⸻

5. Observation

Une observation est une information extraite d’une capture.

Elle représente ce que le système pense avoir vu, sans encore conclure.

Exemple :

Capture :

“Penser à rappeler Thomas pour le projet de terrasse.”

Observations possibles :

* l’utilisateur veut rappeler Thomas ;
* Thomas est probablement une personne ;
* il existe peut-être un projet lié à une terrasse ;
* une action future est implicite.

Rôle

L’observation transforme le brut en éléments exploitables.

Elle est la première couche d’intelligence.

Données minimales

Une observation contient :

* un identifiant ;
* la capture d’origine ;
* un contenu structuré ;
* un type ;
* une confiance ;
* une sensibilité ;
* un statut ;
* des entités suggérées ;
* une date de création.

Types d’observations

* person_reference ;
* project_reference ;
* task_reference ;
* preference ;
* event ;
* habit ;
* emotion ;
* decision ;
* memory_candidate ;
* contradiction ;
* sensitive_information.

Règle clé

Une observation est toujours provisoire.

Elle peut être juste, partielle ou fausse.

Elle ne devient utile que lorsqu’elle est reliée, confirmée ou répétée.

⸻

6. Signal

Un signal est une tendance construite à partir d’une ou plusieurs observations.

Une observation seule dit :

“L’utilisateur a mentionné Thomas.”

Un signal peut dire :

“Thomas revient souvent dans le contexte professionnel.”

Le signal introduit une notion de répétition, de relation ou d’importance.

Rôle

Le signal permet d’éviter les conclusions trop rapides.

Il sert de couche intermédiaire entre observation et mémoire.

Données minimales

Un signal contient :

* un identifiant ;
* les observations liées ;
* une hypothèse ;
* un niveau de confiance ;
* un niveau d’importance ;
* une sensibilité ;
* un statut ;
* une date de première détection ;
* une date de dernière confirmation.

Statuts possibles

* emerging ;
* confirmed ;
* weak ;
* contradicted ;
* expired ;
* dismissed.

Règle clé

Un signal ne doit pas être présenté comme une vérité.

Il doit rester formulé comme une hypothèse tant qu’il n’est pas confirmé.

⸻

7. Entity

Une entity est un élément vivant important de la vie de l’utilisateur.

Elle peut représenter :

* une personne ;
* un projet ;
* une entreprise ;
* un lieu ;
* une passion ;
* une habitude ;
* un objet ;
* un événement ;
* une valeur ;
* un objectif.

Rôle

L’entity est le point d’ancrage de la mémoire.

Life OS ne mémorise pas seulement des notes.
Il relie les informations à des entités vivantes.

Données minimales

Une entity contient :

* un identifiant ;
* un nom ;
* un type ;
* une description courte ;
* un niveau d’importance ;
* un niveau de confiance ;
* un niveau de sensibilité ;
* un statut ;
* des relations ;
* des memories liées ;
* une date de création ;
* une date de dernière activité.

Types d’entities

* person ;
* project ;
* place ;
* company ;
* passion ;
* habit ;
* goal ;
* event ;
* object ;
* value ;
* health ;
* family ;
* work.

Statuts possibles

* suggested ;
* active ;
* confirmed ;
* hidden ;
* archived ;
* deleted.

Règle clé

En v0.1, l’utilisateur doit pouvoir valider, corriger ou supprimer une entity importante.

L’IA peut suggérer.
L’utilisateur garde l’autorité.

⸻

8. Memory

Une memory est une information utile, stabilisée et réutilisable.

Elle peut être :

* un fait ;
* une préférence ;
* une décision ;
* une habitude ;
* un souvenir ;
* un contexte relationnel ;
* une contrainte ;
* un objectif ;
* une règle personnelle.

Rôle

La memory permet au Companion de mieux comprendre et mieux restituer.

Elle est la couche de connaissance durable du système.

Données minimales

Une memory contient :

* un identifiant ;
* un contenu ;
* un type ;
* les entities liées ;
* la source ;
* le niveau de confiance ;
* le niveau de sensibilité ;
* le statut ;
* la date de création ;
* la date de dernière confirmation ;
* une règle d’expiration éventuelle.

Types de memories

* fact ;
* preference ;
* habit ;
* decision ;
* relationship_context ;
* project_context ;
* personal_rule ;
* reminder_context ;
* emotional_context ;
* sensitive_context.

Statuts possibles

* draft ;
* active ;
* confirmed ;
* uncertain ;
* contradicted ;
* hidden ;
* expired ;
* deleted.

Règle clé

Une memory ne doit pas être créée trop vite.

La v0.1 doit privilégier peu de memories mais de bonne qualité.

⸻

9. Briefing

Un briefing est une restitution utile de la mémoire.

Il ne doit pas être un résumé général.
Il doit aider l’utilisateur à voir ce qui compte maintenant.

Rôle

Le briefing transforme la mémoire en clarté.

Il peut afficher :

* ce qui mérite attention ;
* ce qui a changé ;
* ce qui est en attente ;
* ce que l’utilisateur pourrait vouloir revoir ;
* les informations utiles pour la journée.

Données minimales

Un briefing contient :

* un identifiant ;
* une date ;
* un type ;
* les memories utilisées ;
* les entities concernées ;
* un contenu généré ;
* un statut ;
* un feedback utilisateur éventuel.

Types de briefings

* daily ;
* project ;
* relationship ;
* catch_up ;
* decision_support ;
* weekly_reflection.

En v0.1, seul le briefing quotidien simple est indispensable.

Règle clé

Le briefing ne doit pas donner l’impression que l’IA contrôle la vie de l’utilisateur.

Il doit proposer de la clarté, pas des ordres.

⸻

10. Relations entre les objets

Les relations principales sont :

* une capture peut générer plusieurs observations ;
* une observation peut contribuer à plusieurs signals ;
* un signal peut suggérer une entity ;
* une entity peut contenir plusieurs memories ;
* une memory peut être liée à plusieurs entities ;
* un briefing utilise plusieurs memories et entities ;
* une correction utilisateur peut modifier une observation, une entity ou une memory.

Le modèle doit rester graphe dans l’esprit, mais simple dans l’usage.

L’utilisateur ne voit pas une base de données.
Il voit des éléments vivants, compréhensibles et corrigibles.

⸻

11. Niveaux de confiance

Chaque information interprétée par l’IA doit avoir un niveau de confiance.

Niveaux

Low

L’information est possible mais fragile.

Medium

L’information est probable mais mérite validation.

High

L’information est fiable, répétée ou confirmée.

Confirmed

L’utilisateur l’a validée explicitement.

Règle clé

Plus une information est sensible ou importante, plus le niveau de confiance requis doit être élevé.

Une préférence légère peut être utilisée avec une confiance moyenne.
Une information familiale, médicale, financière ou émotionnelle doit demander plus de prudence.

⸻

12. Niveaux de sensibilité

Toutes les informations ne se valent pas.

Life OS doit classifier la sensibilité pour protéger l’utilisateur.

Niveaux

Public

Information non intime.

Personal

Information personnelle normale.

Private

Information intime ou contextuelle.

Sensitive

Information pouvant toucher à la santé, la famille, l’argent, la religion, les émotions profondes, les conflits, l’identité ou la sécurité.

Restricted

Information qui ne doit jamais être utilisée sans validation explicite.

Règle clé

La sensibilité réduit l’automatisation.

Plus une information est sensible, plus le système doit être silencieux, prudent et contrôlable.

⸻

13. Statuts globaux

Tous les objets importants doivent avoir un statut.

Les statuts évitent les ambiguïtés.

Statuts communs

* draft ;
* suggested ;
* active ;
* confirmed ;
* uncertain ;
* contradicted ;
* archived ;
* hidden ;
* deleted.

Règle clé

Le système ne supprime jamais silencieusement une information importante.

Il peut archiver.
Il peut masquer.
Il peut proposer d’oublier.
Mais l’oubli volontaire doit rester un acte clair.

⸻

14. Actions IA

L’IA de Life OS ne doit pas être un agent incontrôlé.

Elle doit exécuter des actions précises.

Actions nécessaires en v0.1

Analyze Capture

Lire une capture et extraire des observations.

Suggest Entities

Détecter les personnes, projets, lieux, habitudes ou sujets importants.

Suggest Memories

Identifier ce qui pourrait devenir une memory.

Detect Sensitivity

Classer le niveau de sensibilité.

Detect Confidence

Estimer le niveau de confiance.

Generate Briefing

Créer un briefing simple à partir des memories actives.

Ask for Validation

Demander confirmation quand une information est importante ou incertaine.

Detect Contradiction

Repérer une information qui contredit une memory existante.

Summarize Entity

Produire une description courte d’une entity.

Actions exclues en v0.1

* agir automatiquement sur des services externes ;
* envoyer des messages ;
* modifier un calendrier ;
* prendre des décisions ;
* analyser en continu toute la vie numérique ;
* inférer des sujets sensibles sans contrôle ;
* créer des profils psychologiques profonds.

⸻

15. Prompts nécessaires

La v0.1 nécessite peu de prompts, mais ils doivent être très bien conçus.

Prompt 1 — Capture Analysis

Objectif :

Transformer une capture brute en observations.

Sortie attendue :

* résumé court ;
* observations ;
* entities suggérées ;
* memories candidates ;
* sensibilité ;
* confiance ;
* besoin de validation.

Prompt 2 — Entity Resolution

Objectif :

Déterminer si une information concerne une entity existante ou une nouvelle entity.

Sortie attendue :

* entity existante probable ;
* nouvelle entity suggérée ;
* niveau de confiance ;
* raison du rapprochement ;
* besoin de validation.

Prompt 3 — Memory Candidate Evaluation

Objectif :

Décider si une observation mérite de devenir une memory.

Sortie attendue :

* memory candidate ;
* type ;
* importance ;
* confiance ;
* sensibilité ;
* justification courte ;
* statut recommandé.

Prompt 4 — Contradiction Detection

Objectif :

Identifier les conflits entre une nouvelle information et la mémoire existante.

Sortie attendue :

* memory concernée ;
* nouvelle information contradictoire ;
* niveau de conflit ;
* action recommandée.

Prompt 5 — Briefing Generation

Objectif :

Créer une restitution utile, courte et humaine.

Sortie attendue :

* résumé du jour ;
* points importants ;
* éléments à revoir ;
* suggestions prudentes ;
* questions éventuelles.

Prompt 6 — User Validation Question

Objectif :

Formuler une demande de validation simple.

Sortie attendue :

* une question claire ;
* deux ou trois choix maximum ;
* aucune pression ;
* possibilité d’ignorer.

⸻

16. Rôle du modèle IA

Le modèle IA sert à interpréter, relier, résumer et formuler.

Il ne doit pas être la source de vérité.

La vérité vient de :

* l’utilisateur ;
* les captures ;
* les validations ;
* les corrections ;
* la répétition d’observations cohérentes.

Le modèle IA peut :

* extraire ;
* classer ;
* suggérer ;
* reformuler ;
* relier ;
* résumer ;
* détecter l’incertitude ;
* poser des questions.

Le modèle IA ne doit pas :

* décider seul ;
* inventer des faits ;
* confirmer sans preuve ;
* créer une vérité intime non validée ;
* agir à la place de l’utilisateur ;
* cacher son incertitude.

⸻

17. Ce qui doit être déterministe

Certaines parties du système doivent être strictes, prévisibles et non génératives.

Doit être déterministe

* les statuts ;
* les permissions ;
* les suppressions ;
* les validations utilisateur ;
* les niveaux de visibilité ;
* les règles de sensibilité ;
* l’historique des captures ;
* les liens entre objets ;
* les dates ;
* les actions autorisées ;
* les exclusions de la v0.1.

Pourquoi

La confiance dépend de la prévisibilité.

L’IA peut être souple dans l’interprétation.
Le système doit être strict dans le contrôle.

⸻

18. Ce qui peut être génératif

Certaines parties peuvent utiliser la génération IA.

Peut être génératif

* les résumés ;
* les descriptions d’entities ;
* les briefings ;
* les suggestions ;
* les reformulations ;
* les questions de validation ;
* les hypothèses faibles ;
* les titres ;
* les regroupements possibles.

Règle clé

Tout contenu génératif doit rester corrigible.

L’utilisateur doit pouvoir dire :

* ce n’est pas ça ;
* oublie ça ;
* modifie ;
* garde ;
* confirme.

⸻

19. Garde-fous

Life OS doit intégrer des garde-fous dès la v0.1.

Garde-fou 1 — Pas de vérité sans source

Toute memory doit pouvoir revenir à une capture, une observation ou une validation.

Garde-fou 2 — Pas d’automatisation sensible

Les informations sensibles ne doivent pas déclencher d’action automatique.

Garde-fou 3 — Pas de profilage profond en v0.1

Le système ne doit pas produire de diagnostic psychologique, médical, religieux ou moral.

Garde-fou 4 — Validation avant stabilisation

Une information importante ou sensible doit rester en draft ou suggested tant qu’elle n’est pas validée.

Garde-fou 5 — Droit à l’oubli visible

L’utilisateur doit pouvoir supprimer ou masquer une information.

Garde-fou 6 — Incertitude explicite

Le système doit savoir dire :

“Je ne suis pas sûr.”

Garde-fou 7 — Pas d’IA invisible

L’utilisateur doit comprendre quand une information a été interprétée par l’IA.

⸻

20. Erreurs acceptables

Certaines erreurs sont acceptables en v0.1.

Acceptable

* suggérer une entity en doublon ;
* manquer une observation secondaire ;
* classer une information avec une confiance trop basse ;
* demander une validation inutile ;
* produire un briefing incomplet ;
* ne pas détecter un lien faible ;
* résumer de manière imparfaite mais fidèle.

Ces erreurs sont acceptables car elles ne trahissent pas l’utilisateur.

Elles créent de la friction, mais pas de perte de confiance profonde.

⸻

21. Erreurs non acceptables

Certaines erreurs doivent être considérées comme critiques.

Non acceptable

* inventer un fait personnel ;
* présenter une hypothèse comme une vérité ;
* mémoriser une information sensible sans prudence ;
* supprimer une information sans consentement ;
* exposer une information privée au mauvais endroit ;
* agir à la place de l’utilisateur ;
* ignorer une correction explicite ;
* créer un briefing culpabilisant ;
* formuler une conclusion psychologique profonde sans base solide ;
* masquer l’origine d’une information.

Ces erreurs attaquent la confiance.

Elles doivent être évitées dès la v0.1.

⸻

22. Ce qui reste manuel en v0.1

La v0.1 doit assumer une part manuelle.

L’utilisateur doit encore :

* capturer volontairement ;
* valider les entities importantes ;
* confirmer les memories sensibles ;
* corriger les mauvaises interprétations ;
* supprimer ce qu’il ne veut pas garder ;
* choisir ce qui compte vraiment.

Ce manuel n’est pas une faiblesse.

C’est une condition de confiance.

⸻

23. Ce qui pourra devenir automatisé plus tard

Plus tard, Life OS pourra automatiser davantage.

Mais seulement après avoir prouvé la confiance.

Automatisations possibles :

* regroupement intelligent des captures ;
* fusion automatique d’entities évidentes ;
* détection de routines ;
* briefings contextuels ;
* intégration calendrier ;
* intégration e-mail ;
* intégration santé ;
* rappels intelligents ;
* actions externes validées ;
* agents spécialisés.

Mais aucune automatisation future ne doit casser le principe central :

L’utilisateur reste propriétaire de sa mémoire et maître de ses décisions.

⸻

24. Architecture mentale finale

La Data & AI Architecture de Life OS peut se résumer ainsi :

Les données structurent la mémoire.
L’IA interprète avec prudence.
Le produit simplifie l’expérience.
L’utilisateur garde le contrôle.

La v0.1 doit être construite autour d’une conviction forte :

Life OS n’a pas besoin de tout savoir.

Il doit seulement commencer à comprendre correctement.

⸻

25. Conclusion

Ce document transforme la vision de Life OS en architecture conceptuelle exploitable.

Il définit les objets minimaux, leurs relations, les niveaux de confiance, les niveaux de sensibilité, les statuts, les actions IA et les garde-fous.

La priorité n’est pas la puissance brute.

La priorité est la fiabilité progressive.

Life OS doit devenir intelligent sans devenir intrusif.
Structuré sans devenir complexe.
Utile sans devenir autoritaire.
Personnel sans devenir dangereux.

La v0.1 doit poser cette fondation.

Pas une intelligence qui devine tout.

Une intelligence qui apprend proprement.