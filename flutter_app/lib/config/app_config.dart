class AppConfig {
  static const mapboxToken = String.fromEnvironment('MAPBOX_ACCESS_TOKEN');
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseKey = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');
  static const firebaseApiKey = String.fromEnvironment('FIREBASE_API_KEY');
  static const firebaseAuthDomain = String.fromEnvironment('FIREBASE_AUTH_DOMAIN');
  static const firebaseProjectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
  static const firebaseAppId = String.fromEnvironment('FIREBASE_APP_ID');
  static const firebaseMessagingSenderId = String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID');

  static bool get hasFirebase => [
        firebaseApiKey,
        firebaseAuthDomain,
        firebaseProjectId,
        firebaseAppId,
        firebaseMessagingSenderId,
      ].every((value) => value.trim().isNotEmpty);

  static String get supabaseProblem {
    if (supabaseUrl.isEmpty || supabaseKey.isEmpty) {
      return 'Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.';
    }
    return '';
  }
}
