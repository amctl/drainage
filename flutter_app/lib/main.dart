import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app/groundwork_app.dart';
import 'auth/auth_controller.dart';
import 'config/app_config.dart';
import 'data/groundwork_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (AppConfig.mapboxToken.isNotEmpty) MapboxOptions.setAccessToken(AppConfig.mapboxToken);
  final auth = AuthController.instance;
  await auth.initialize();
  if (AppConfig.supabaseProblem.isEmpty) {
    try {
      await Supabase.initialize(url: AppConfig.supabaseUrl, anonKey: AppConfig.supabaseKey, accessToken: () => auth.token());
      GroundworkRepository.instance.attach(Supabase.instance.client);
    } catch (_) {
      GroundworkRepository.instance.attach(null);
    }
  }
  runApp(const GroundworkApp());
}
