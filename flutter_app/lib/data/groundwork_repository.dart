import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/app_config.dart';
import '../models/groundwork_models.dart';

class GroundworkSnapshot {
  const GroundworkSnapshot({required this.reports, required this.comments, required this.sourceLinks, required this.connected, this.error});
  final List<GroundworkReport> reports;
  final List<GroundworkComment> comments;
  final List<SourceLink> sourceLinks;
  final bool connected;
  final String? error;
}

class GroundworkRepository {
  GroundworkRepository._();
  static final instance = GroundworkRepository._();
  SupabaseClient? _client;
  SupabaseClient? get client => _client;
  bool get configured => _client != null;

  void attach(SupabaseClient? client) => _client = client;

  static const fallbackReports = <GroundworkReport>[
    GroundworkReport(id: 1, title: 'A little rain. A very familiar problem.', area: 'Central', place: 'Connaught Place · Ward 84', kind: 'Waterlogging', status: 'Needs attention', time: '2 hours ago', age: 2, votes: 42, author: 'Aditi S.', reputation: 128, lng: 77.219, lat: 28.631, photo: true, source: 'Resident report'),
    GroundworkReport(id: 2, title: 'Blocked drain outside the neighbourhood market', area: 'Central', place: 'Karol Bagh · Ward 83', kind: 'Blocked drain', status: 'Needs attention', time: '4 hours ago', age: 4, votes: 31, author: 'Rahul M.', reputation: 86, lng: 77.188, lat: 28.651, photo: true, source: 'Resident report'),
    GroundworkReport(id: 3, title: 'Open manhole needs a cover, not a branch', area: 'South', place: 'Lajpat Nagar · Ward 144', kind: 'Open manhole', status: 'Needs attention', time: '6 hours ago', age: 6, votes: 56, author: 'Meera K.', reputation: 214, lng: 77.243, lat: 28.567, source: 'Resident report'),
    GroundworkReport(id: 4, title: 'Desilting work is underway on the main road', area: 'South', place: 'Vasant Vihar · Ward 153', kind: 'Desilting', status: 'Work underway', time: '1 day ago', age: 24, votes: 24, author: 'Neighbourhood desk', reputation: 160, lng: 77.158, lat: 28.56, source: 'Sample agency update'),
    GroundworkReport(id: 5, title: 'Overflow cleared. Let’s keep an eye on it.', area: 'North Delhi', place: 'Civil Lines · Ward 73', kind: 'Drain overflow', status: 'Resolved', time: '2 days ago', age: 48, votes: 18, author: 'Arjun B.', reputation: 72, lng: 77.222, lat: 28.68, source: 'Resident report'),
  ];
  static final fallbackComments = <GroundworkComment>[
    GroundworkComment(id: 1, reportId: 1, author: 'Nikhil R.', text: 'The crossing near the inner circle is affected too. Would help to check the connecting drain.', score: 8, createdAt: _sampleDate(1)),
    GroundworkComment(id: 2, reportId: 1, parentId: 1, author: 'Aditi S.', text: 'Yes, that is where the water starts collecting. Adding this as a sample follow-up.', score: 3, createdAt: _sampleDate(2)),
    GroundworkComment(id: 3, reportId: 2, author: 'Sana A.', text: 'This stretch gets blocked after every spell of rain.', score: 5, createdAt: _sampleDate(3)),
    GroundworkComment(id: 4, reportId: 3, author: 'Dev P.', text: 'Please be careful walking along this stretch after dark.', score: 6, createdAt: _sampleDate(4)),
  ];

  Future<GroundworkSnapshot> load() async {
    if (_client == null) return GroundworkSnapshot(reports: fallbackReports, comments: fallbackComments, sourceLinks: const [], connected: false, error: AppConfig.supabaseProblem.isEmpty ? 'Supabase is unavailable. Showing sample reports.' : AppConfig.supabaseProblem);
    try {
      final values = await Future.wait([
        _client!.from('report_summaries').select().order('created_at', ascending: false),
        _client!.from('comment_summaries').select().order('created_at'),
        _client!.from('source_links').select().order('created_at', ascending: false),
      ]);
      return GroundworkSnapshot(reports: (values[0] as List).map((e) => GroundworkReport.fromJson(e)).toList(), comments: (values[1] as List).map((e) => GroundworkComment.fromJson(e)).toList(), sourceLinks: (values[2] as List).map((e) => SourceLink.fromJson(e)).toList(), connected: true);
    } catch (error) {
      return GroundworkSnapshot(reports: fallbackReports, comments: fallbackComments, sourceLinks: const [], connected: false, error: 'Supabase unavailable: $error');
    }
  }

  Future<GroundworkComment> createComment({required int reportId, int? parentId, required String text}) async {
    final rows = await _client!.from('comments').insert({'report_id': reportId, 'parent_id': parentId, 'text': text.trim(), 'author': 'Neighbour'}).select();
    return GroundworkComment.fromJson({...rows.first, 'vote_score': 0});
  }

  Future<void> setVote({required bool comment, required int id, required int value}) async {
    final table = comment ? 'comment_votes' : 'report_votes';
    final key = comment ? 'comment_id' : 'report_id';
    final existing = await _client!.from(table).select('value').eq(key, id).maybeSingle();
    if (existing?['value'] == value) {
      await _client!.from(table).delete().eq(key, id);
    } else {
      await _client!.from(table).upsert({key: id, 'value': value}, onConflict: '$key,user_id');
    }
  }

  Future<int?> currentVote({required bool comment, required int id}) async {
    final table = comment ? 'comment_votes' : 'report_votes';
    final key = comment ? 'comment_id' : 'report_id';
    final row = await _client!.from(table).select('value').eq(key, id).maybeSingle();
    return (row?['value'] as num?)?.toInt();
  }

  Future<SourceLink> createSource({required String zone, required String label, required String url}) async {
    final uri = Uri.parse(url);
    if (!['http', 'https'].contains(uri.scheme)) throw const FormatException('Use an http(s) URL.');
    final row = await _client!.from('source_links').insert({'zone': zone, 'label': label.trim(), 'url': uri.toString()}).select().single();
    return SourceLink.fromJson(row);
  }
}

DateTime _sampleDate(int daysAgo) => DateTime.utc(2025, 1, daysAgo);
