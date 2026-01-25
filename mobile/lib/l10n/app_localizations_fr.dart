// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get welcomeSubtitle => 'Discutez en direct avec votre assistant vocal IA';

  @override
  String get talkToAgent => 'Parler a CAAL';

  @override
  String get connecting => 'Connexion';

  @override
  String get agentListening => 'CAAL ecoute';

  @override
  String get agentIsListening => 'L\'agent ecoute';

  @override
  String get startConversation => 'Commencez une conversation pour voir les messages ici.';

  @override
  String get sayWakeWord => 'Dites \"Hey Jarvis\"';

  @override
  String get waitingForWakeWord => 'En attente du mot d\'activation...';

  @override
  String get screenshareView => 'Vue du partage d\'ecran';

  @override
  String get settings => 'Parametres';

  @override
  String get settingsTitle => 'Parametres';

  @override
  String get caalSetup => 'Configuration CAAL';

  @override
  String get save => 'Enregistrer';

  @override
  String get saving => 'Enregistrement...';

  @override
  String get test => 'Tester';

  @override
  String get connect => 'CONNECTER';

  @override
  String get connection => 'Connexion';

  @override
  String get serverUrl => 'URL du serveur';

  @override
  String get serverUrlHint => 'http://192.168.1.100:3000';

  @override
  String get serverUrlRequired => 'L\'URL du serveur est requise';

  @override
  String get serverUrlInvalid => 'Entrez une URL valide';

  @override
  String get yourServerAddress => 'L\'adresse de votre serveur CAAL';

  @override
  String get connectedToServer => 'Connecte au serveur CAAL';

  @override
  String get enterServerFirst => 'Entrez d\'abord une URL de serveur valide';

  @override
  String serverReturned(int code) {
    return 'Le serveur a renvoye $code';
  }

  @override
  String get couldNotConnect => 'Impossible de se connecter au serveur';

  @override
  String get couldNotReach => 'Impossible d\'atteindre le serveur';

  @override
  String get completeWizardFirst => 'Completez d\'abord l\'assistant de demarrage dans votre navigateur';

  @override
  String get enterServerToStart => 'Entrez l\'adresse de votre serveur pour commencer';

  @override
  String get completeWizardHint =>
      'Completez l\'assistant de demarrage dans votre navigateur, puis connectez-vous ici.';

  @override
  String get connectToServerFirst => 'Connectez-vous au serveur pour configurer les parametres de l\'agent';

  @override
  String get agent => 'Agent';

  @override
  String get agentName => 'Nom de l\'agent';

  @override
  String get wakeGreetings => 'Messages d\'accueil';

  @override
  String get onePerLine => 'Un message par ligne';

  @override
  String get providers => 'Fournisseurs';

  @override
  String get llmProvider => 'Fournisseur LLM';

  @override
  String get ollamaLocalPrivate => 'Local, prive';

  @override
  String get groqFastCloud => 'Cloud rapide';

  @override
  String get ollamaHost => 'Hote Ollama';

  @override
  String get apiKey => 'Cle API';

  @override
  String get model => 'Modele';

  @override
  String modelsAvailable(int count) {
    return '$count modeles disponibles';
  }

  @override
  String get apiKeyConfigured => 'Cle API configuree (entrez une nouvelle cle pour changer)';

  @override
  String get connectionFailed => 'Echec de la connexion';

  @override
  String get failedToConnect => 'Echec de la connexion';

  @override
  String get failedToValidate => 'Echec de la validation';

  @override
  String get invalidApiKey => 'Cle API invalide';

  @override
  String get ttsProvider => 'Fournisseur TTS';

  @override
  String get kokoroGpuNeural => 'TTS neuronal GPU';

  @override
  String get piperCpuLightweight => 'Leger sur CPU';

  @override
  String get voice => 'Voix';

  @override
  String get integrations => 'Integrations';

  @override
  String get homeAssistant => 'Home Assistant';

  @override
  String get hostUrl => 'URL de l\'hote';

  @override
  String get accessToken => 'Jeton d\'acces';

  @override
  String connectedEntities(int count) {
    return 'Connecte - $count entites';
  }

  @override
  String get connected => 'Connecte';

  @override
  String get n8nMcpNote => '/mcp-server/http sera ajoute automatiquement';

  @override
  String get llmSettings => 'Parametres LLM';

  @override
  String get temperature => 'Temperature';

  @override
  String get contextSize => 'Taille du contexte';

  @override
  String get maxTurns => 'Tours maximum';

  @override
  String get toolCache => 'Cache d\'outils';

  @override
  String get allowInterruptions => 'Autoriser les interruptions';

  @override
  String get interruptAgent => 'Interrompre l\'agent pendant qu\'il parle';

  @override
  String get endpointingDelay => 'Delai de fin (s)';

  @override
  String get endpointingDelayDesc => 'Temps d\'attente apres que vous arretez de parler';

  @override
  String get wakeWord => 'Mot d\'activation';

  @override
  String get serverSideWakeWord => 'Mot d\'activation serveur';

  @override
  String get activateWithWakePhrase => 'Activer avec la phrase d\'activation';

  @override
  String get wakeWordModel => 'Modele de mot d\'activation';

  @override
  String get threshold => 'Seuil';

  @override
  String get timeout => 'Delai (s)';

  @override
  String get language => 'Langue';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageFrench => 'Francais';

  @override
  String get changesNote =>
      'Note : Les changements de modele, taille du contexte et mot d\'activation prennent effet a la prochaine session.';

  @override
  String failedToLoad(String error) {
    return 'Echec du chargement des parametres : $error';
  }

  @override
  String failedToSave(String error) {
    return 'Echec de l\'enregistrement : $error';
  }

  @override
  String failedToSaveAgent(int code) {
    return 'Echec de l\'enregistrement des parametres de l\'agent : $code';
  }

  @override
  String get downloadingVoice => 'Telechargement du modele vocal...';

  @override
  String get messageHint => 'Message...';

  @override
  String get toolParameters => 'Parametres de l\'outil';
}
