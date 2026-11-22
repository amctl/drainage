import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import '../config/app_config.dart';

class AuthController {
  AuthController._();
  static final instance = AuthController._();
  String? configurationError;
  User? get user => Firebase.apps.isEmpty ? null : FirebaseAuth.instance.currentUser;

  Future<void> initialize() async {
    if (!AppConfig.hasFirebase) {
      configurationError = 'Firebase is not configured. Add the Firebase Web values, including FIREBASE_MESSAGING_SENDER_ID.';
      return;
    }
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(options: FirebaseOptions(apiKey: AppConfig.firebaseApiKey, authDomain: AppConfig.firebaseAuthDomain, projectId: AppConfig.firebaseProjectId, appId: AppConfig.firebaseAppId, messagingSenderId: AppConfig.firebaseMessagingSenderId));
      }
    } catch (error) {
      configurationError = 'Firebase could not initialize: $error';
    }
  }

  Future<void> signInWithGoogle() async {
    if (Firebase.apps.isEmpty) throw Exception(configurationError ?? 'Firebase is not initialized.');
    final provider = GoogleAuthProvider();
    await FirebaseAuth.instance.signInWithPopup(provider);
  }

  Future<void> signOut() async { if (Firebase.apps.isNotEmpty) await FirebaseAuth.instance.signOut(); }
  Future<String?> token() async => user?.getIdToken();
  Stream<User?> get changes => Firebase.apps.isEmpty ? Stream<User?>.value(null) : FirebaseAuth.instance.authStateChanges();
}
