import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../auth/auth_controller.dart';
import '../config/app_config.dart';
import '../data/groundwork_repository.dart';
import '../features/map/groundwork_map.dart';
import '../models/groundwork_models.dart';

const ink = Color(0xFF213F30), leaf = Color(0xFF557149), paper = Color(0xFFFBFAF7), border = Color(0xFFE2E3DA);

class GroundworkApp extends StatelessWidget {
  const GroundworkApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(title: 'Groundwork · Delhi drainage watch', debugShowCheckedModeBanner: false, theme: ThemeData(useMaterial3: true, scaffoldBackgroundColor: paper, colorScheme: ColorScheme.fromSeed(seedColor: leaf, surface: paper, primary: ink), fontFamily: 'Arial', textTheme: const TextTheme(displaySmall: TextStyle(fontFamily: 'Georgia'), headlineMedium: TextStyle(fontFamily: 'Georgia'), headlineSmall: TextStyle(fontFamily: 'Georgia'), titleLarge: TextStyle(fontFamily: 'Georgia')), appBarTheme: const AppBarTheme(backgroundColor: paper, foregroundColor: ink, elevation: 0)), home: const GroundworkHome());
}

class GroundworkHome extends StatefulWidget { const GroundworkHome({super.key}); @override State<GroundworkHome> createState() => _GroundworkHomeState(); }

class _GroundworkHomeState extends State<GroundworkHome> {
  final repo = GroundworkRepository.instance;
  final search = TextEditingController();
  GroundworkSnapshot? snapshot;
  String view = 'Map', area = 'All Delhi', query = '', notice = '';
  String reportSort = 'Relevance';
  int? selectedId;
  bool loading = true, busy = false;
  bool hideBanner = false;
  final Map<int, int> reportVoteDelta = {};
  final Map<int, int> commentVoteDelta = {};

  @override
  void initState() { super.initState(); _reload(); }
  @override
  void dispose() { search.dispose(); super.dispose(); }
  Future<void> _reload() async { final result = await repo.load(); if (mounted) setState(() { snapshot = result; loading = false; }); }
  List<GroundworkReport> get visibleReports {
    final reports = snapshot?.reports ?? GroundworkRepository.fallbackReports;
    return reports.where((report) => (area == 'All Delhi' || report.area == area || (area == 'North' && report.area == 'North Delhi')) && ('${report.title} ${report.place} ${report.area} ${report.kind}'.toLowerCase().contains(query.toLowerCase()))).toList();
  }
  GroundworkReport? get selected {
    for (final report in visibleReports) {
      if (report.id == selectedId) return report;
    }
    return null;
  }
  void showNotice(String value) { if (mounted) setState(() => notice = value); Future.delayed(const Duration(seconds: 5), () { if (mounted && notice == value) setState(() => notice = ''); }); }

  Future<void> _signIn() async { try { await AuthController.instance.signInWithGoogle(); showNotice('Signed in with Google.'); } catch (error) { showNotice('Google sign-in failed: $error'); } }
  Future<bool> _requireUser() async {
    if (!repo.configured) { showNotice('Supabase is not connected. You can browse sample data, but database changes cannot be saved.'); return false; }
    if (AuthController.instance.user != null) return true;
    showNotice('Sign in with Google before saving comments, votes, or sources.');
    return false;
  }
  Future<void> _vote({required bool comment, required int id, required int value}) async {
    if (!await _requireUser()) return;
    try {
      final previous = await repo.currentVote(comment: comment, id: id) ?? 0;
      final optimistic = previous == value ? -value : value - previous;
      setState(() => (comment ? commentVoteDelta : reportVoteDelta)[id] = optimistic);
      await repo.setVote(comment: comment, id: id, value: value);
      final next = await repo.load();
      if (mounted) setState(() { snapshot = next; (comment ? commentVoteDelta : reportVoteDelta).remove(id); });
    } catch (error) {
      if (mounted) setState(() => (comment ? commentVoteDelta : reportVoteDelta).remove(id));
      showNotice('Vote could not be saved: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 900;
    return Scaffold(body: SafeArea(child: Column(children: [
      _Header(view: view, onView: (v) => setState(() => view = v), onReport: _showDemoReport, onHelp: _showHelp, onSignIn: _signIn),
      if (!snapshotIsConnected && !hideBanner) _DatabaseBanner(message: snapshot?.error ?? (AuthController.instance.configurationError ?? 'Sample data · Supabase is not connected.'), onDismiss: () => setState(() => hideBanner = true)),
      if (view == 'Map' || view == 'Community') _Filters(search: search, area: area, onArea: (v) => setState(() { area = v; selectedId = null; }), onSearch: (v) => setState(() { query = v; selectedId = null; })),
      Expanded(child: loading ? const Center(child: CircularProgressIndicator()) : view == 'Map' ? _mapPage(wide) : view == 'Community' ? _communityPage() : _budgetPage()),
      const _Footer(),
      if (notice.isNotEmpty) Padding(padding: const EdgeInsets.all(10), child: Material(color: ink, borderRadius: BorderRadius.circular(14), child: Padding(padding: const EdgeInsets.all(12), child: Text(notice, style: const TextStyle(color: Colors.white))))),
    ])));
  }

  bool get snapshotIsConnected => snapshot?.connected ?? false;

  Widget _mapPage(bool wide) {
    final reports = visibleReports;
    return Padding(padding: const EdgeInsets.fromLTRB(20, 8, 20, 18), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('DELHI DRAINAGE WATCH', style: TextStyle(color: leaf, letterSpacing: 1.4, fontSize: 11, fontWeight: FontWeight.bold)), SizedBox(height: 4), Text('A clearer view of what needs fixing.', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: ink))])), TextButton.icon(onPressed: _showDemoReport, icon: const Icon(Icons.add), label: const Text('Practice report'))]),
      const SizedBox(height: 10),
    Expanded(child: wide ? Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [Expanded(flex: 6, child: _mapPanel(reports)), const SizedBox(width: 16), Expanded(flex: 4, child: _reportList(reports))]) : Column(children: [Expanded(flex: 5, child: _mapPanel(reports)), const SizedBox(height: 12), Expanded(flex: 4, child: _reportList(reports))])),
    ]));
  }
  Widget _mapPanel(List<GroundworkReport> reports) => ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: LayoutBuilder(builder: (context, constraints) {
          final wide = constraints.maxWidth > 620;
          final report = selected;
          return Stack(children: [
            Positioned.fill(child: GroundworkMap(area: area, reports: reports, selectedReport: report, onReportSelected: (next) => setState(() => selectedId = next.id))),
            if (report != null)
              Positioned(
                top: wide ? 12 : null,
                bottom: wide ? null : 10,
                right: 10,
                left: wide ? null : 10,
                width: wide ? 270 : null,
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxHeight: constraints.maxHeight * (wide ? .82 : .58)),
                  child: _SelectedReportCard(report: report, onClose: () => setState(() => selectedId = null), onDiscussion: () => _showThread(report)),
                ),
              ),
          ]);
        }),
      );

  Widget _reportList(List<GroundworkReport> reports) => Container(decoration: BoxDecoration(color: Colors.white, border: Border.all(color: border), borderRadius: BorderRadius.circular(18)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Padding(padding: const EdgeInsets.fromLTRB(16, 14, 16, 8), child: Row(children: [Expanded(child: Text('${reports.length} reports · ${area == 'All Delhi' ? 'Delhi' : area}', style: const TextStyle(fontWeight: FontWeight.w700, color: ink))), TextButton(onPressed: () => setState(() => view = 'Community'), child: const Text('Community'))])),
    Expanded(child: reports.isEmpty ? const Center(child: Text('No reports match these filters.')) : ListView.separated(padding: const EdgeInsets.fromLTRB(12, 0, 12, 12), itemCount: reports.length, separatorBuilder: (_, __) => const SizedBox(height: 7), itemBuilder: (_, index) { final report = reports[index]; return _ReportCard(report: report, score: report.votes + (reportVoteDelta[report.id] ?? 0), selected: report.id == selectedId, onSelect: () => setState(() => selectedId = report.id), onThread: () => _showThread(report)); })),
  ]));

  Widget _communityPage() {
    final reports = visibleReports.toList();
    if (reportSort == 'Top') {
      reports.sort((a, b) => (b.votes + (reportVoteDelta[b.id] ?? 0)).compareTo(a.votes + (reportVoteDelta[a.id] ?? 0)));
    } else if (reportSort == 'New') {
      reports.sort((a, b) => a.age.compareTo(b.age));
    } else if (reportSort == 'Comment Count') {
      reports.sort((a, b) => (snapshot?.comments.where((comment) => comment.reportId == b.id).length ?? 0).compareTo(snapshot?.comments.where((comment) => comment.reportId == a.id).length ?? 0));
    } else if (reportSort == 'Hot') {
      reports.sort((a, b) => ((b.votes + (reportVoteDelta[b.id] ?? 0)) / (b.age + 2)).compareTo((a.votes + (reportVoteDelta[a.id] ?? 0)) / (a.age + 2)));
    } else {
      reports.sort((a, b) => a.id.compareTo(b.id));
    }
    return Padding(padding: const EdgeInsets.fromLTRB(20, 12, 20, 18), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Row(children: [const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('COMMUNITY NOTES', style: TextStyle(color: leaf, letterSpacing: 1.3, fontSize: 11, fontWeight: FontWeight.bold)), SizedBox(height: 5), Text('Small details help the whole neighbourhood.', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: ink))])), DropdownButton<String>(value: reportSort, items: const [DropdownMenuItem(value: 'Relevance', child: Text('Relevance')), DropdownMenuItem(value: 'Hot', child: Text('Hot')), DropdownMenuItem(value: 'Top', child: Text('Top')), DropdownMenuItem(value: 'New', child: Text('New')), DropdownMenuItem(value: 'Comment Count', child: Text('Comment Count'))], onChanged: (value) { if (value != null) setState(() => reportSort = value); })]), const SizedBox(height: 12), Expanded(child: reports.isEmpty ? const Center(child: Text('No reports found.')) : ListView.separated(itemCount: reports.length, separatorBuilder: (_, __) => const SizedBox(height: 10), itemBuilder: (_, i) { final report = reports[i]; return _CommunityCard(report: report, score: report.votes + (reportVoteDelta[report.id] ?? 0), comments: snapshot?.comments.where((c) => c.reportId == report.id).length ?? 0, onOpen: () => _showThread(report), onVote: (value) => _vote(comment: false, id: report.id, value: value)); }))]));
  }

  Widget _budgetPage() => _BudgetPage(links: snapshot?.sourceLinks ?? const [], connected: snapshotIsConnected, onNotice: showNotice, onSave: (zone, label, url) async { if (!await _requireUser()) return false; try { await repo.createSource(zone: zone, label: label, url: url); await _reload(); showNotice('Source link saved · not independently verified.'); return true; } catch (error) { showNotice('Source link could not be saved: $error'); return false; } });

  Future<void> _showThread(GroundworkReport report) async {
    final controller = TextEditingController();
    int? replyTo;
    String commentSort = 'Relevance';
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(builder: (context, refresh) {
        final comments = snapshot?.comments.where((comment) => comment.reportId == report.id).toList() ?? const <GroundworkComment>[];
        final roots = comments.where((comment) => comment.parentId == null).toList();
        if (commentSort == 'Top') {
          roots.sort((a, b) => (b.score + (commentVoteDelta[b.id] ?? 0)).compareTo(a.score + (commentVoteDelta[a.id] ?? 0)));
        } else if (commentSort == 'New') {
          roots.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        } else {
          roots.sort((a, b) => a.createdAt.compareTo(b.createdAt));
        }

        Widget commentTile(GroundworkComment comment, int depth) {
          final children = comments.where((child) => child.parentId == comment.id).toList();
          return Padding(
            padding: EdgeInsets.only(left: depth == 0 ? 0 : 22, bottom: 8),
            child: Card(
              color: const Color(0xFFF7F7F1),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [Expanded(child: Text(comment.author, style: const TextStyle(fontWeight: FontWeight.bold))), Text('Score ${comment.score + (commentVoteDelta[comment.id] ?? 0)}')]),
                  const SizedBox(height: 5),
                  Text(comment.text),
                  Wrap(alignment: WrapAlignment.end, children: [
                    TextButton(onPressed: busy ? null : () { replyTo = comment.id; refresh(() {}); }, child: const Text('Reply')),
                    IconButton(tooltip: 'Upvote comment', onPressed: () async { await _vote(comment: true, id: comment.id, value: 1); refresh(() {}); }, icon: const Icon(Icons.thumb_up_alt_outlined, size: 17)),
                    IconButton(tooltip: 'Downvote comment', onPressed: () async { await _vote(comment: true, id: comment.id, value: -1); refresh(() {}); }, icon: const Icon(Icons.thumb_down_alt_outlined, size: 17)),
                  ]),
                  if (children.isNotEmpty) ...children.map((child) => commentTile(child, depth + 1)),
                ]),
              ),
            ),
          );
        }

        String? replyName;
        if (replyTo != null) {
          for (final comment in comments) {
            if (comment.id == replyTo) { replyName = comment.author; break; }
          }
        }
        return AlertDialog(
          title: Text(report.title),
          content: SizedBox(
            width: 620,
            height: MediaQuery.sizeOf(context).height * .62,
            child: Column(children: [
              Align(alignment: Alignment.centerLeft, child: Text(report.place, style: const TextStyle(color: Colors.black54))),
              Row(children: [const Text('Discussion'), const Spacer(), DropdownButton<String>(value: commentSort, items: const [DropdownMenuItem(value: 'Relevance', child: Text('Relevance')), DropdownMenuItem(value: 'Top', child: Text('Top')), DropdownMenuItem(value: 'New', child: Text('New'))], onChanged: (value) { if (value != null) refresh(() => commentSort = value); })]),
              Expanded(child: roots.isEmpty ? const Center(child: Text('No discussion yet. Add the first neighbourly note.')) : ListView(children: roots.map((comment) => commentTile(comment, 0)).toList())),
              if (replyTo != null) Row(children: [Expanded(child: Text('Replying to ${replyName ?? 'neighbour'}', style: const TextStyle(fontSize: 12, color: leaf))), TextButton(onPressed: () => refresh(() => replyTo = null), child: const Text('Cancel'))]),
              TextField(controller: controller, maxLength: 500, minLines: 1, maxLines: 3, decoration: InputDecoration(labelText: replyTo == null ? 'Add a neighbourly note' : 'Write a reply')),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Close')),
            FilledButton(onPressed: busy ? null : () async {
              if (controller.text.trim().isEmpty || !await _requireUser()) return;
              setState(() => busy = true);
              final text = controller.text.trim();
              final parentId = replyTo;
              final optimisticId = -DateTime.now().microsecondsSinceEpoch;
              final optimistic = GroundworkComment(id: optimisticId, reportId: report.id, parentId: parentId, author: 'Neighbour', text: text, score: 0, createdAt: DateTime.now());
              if (mounted) setState(() => snapshot = GroundworkSnapshot(reports: snapshot!.reports, comments: [...snapshot!.comments, optimistic], sourceLinks: snapshot!.sourceLinks, connected: snapshot!.connected));
              controller.clear();
              replyTo = null;
              refresh(() {});
              try {
                final created = await repo.createComment(reportId: report.id, parentId: parentId, text: text);
                if (mounted) setState(() => snapshot = GroundworkSnapshot(reports: snapshot!.reports, comments: snapshot!.comments.map((item) => item.id == optimisticId ? created : item).toList(), sourceLinks: snapshot!.sourceLinks, connected: snapshot!.connected));
                refresh(() {});
              } catch (error) {
                if (mounted) setState(() => snapshot = GroundworkSnapshot(reports: snapshot!.reports, comments: snapshot!.comments.where((item) => item.id != optimisticId).toList(), sourceLinks: snapshot!.sourceLinks, connected: snapshot!.connected));
                refresh(() {});
                showNotice('Comment could not be saved: $error');
              } finally {
                if (mounted) { setState(() => busy = false); refresh(() {}); }
              }
            }, child: Text(replyTo == null ? 'Post note' : 'Post reply')),
          ],
        );
      }),
    );
    controller.dispose();
  }

  Future<void> _showDemoReport() async { await showDialog<void>(context: context, builder: (context) => const _DemoReportDialog()); }
  Future<void> _showHelp() async { await showDialog<void>(context: context, builder: (context) => const AlertDialog(title: Text('Groundwork is a demo'), content: Text('Reports and budgets are illustrative. Practice reports and photos stay in this browser. Nothing is sent to an authority, no RTI is filed, and source links are not verified.'))); }
}

class _Header extends StatelessWidget {
  const _Header({required this.view, required this.onView, required this.onReport, required this.onHelp, required this.onSignIn});
  final String view;
  final ValueChanged<String> onView;
  final VoidCallback onReport, onHelp, onSignIn;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 8),
        child: LayoutBuilder(builder: (context, constraints) {
          final compact = constraints.maxWidth < 720;
          final veryCompact = constraints.maxWidth < 380;
          final navigation = compact
              ? PopupMenuButton<String>(
                  tooltip: 'Navigate',
                  onSelected: (item) => item == 'Help' ? onHelp() : onView(item),
                  itemBuilder: (context) => [for (final item in ['Map', 'Community', 'Budget']) PopupMenuItem(value: item, child: Text(item)), if (veryCompact) const PopupMenuItem(value: 'Help', child: Text('Help'))],
                  child: Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8), child: Row(mainAxisSize: MainAxisSize.min, children: [Text(view), const Icon(Icons.arrow_drop_down)])),
                )
              : Row(mainAxisSize: MainAxisSize.min, children: [for (final item in ['Map', 'Community', 'Budget']) Padding(padding: const EdgeInsets.symmetric(horizontal: 2), child: TextButton(onPressed: () => onView(item), style: TextButton.styleFrom(backgroundColor: view == item ? const Color(0xFFE9EDDF) : null), child: Text(item)))]);
          return Row(children: [
            Container(width: 34, height: 34, decoration: BoxDecoration(color: ink, borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.layers_outlined, color: Color(0xFFE2EBD5), size: 19)),
            if (!veryCompact) const SizedBox(width: 9),
            if (!veryCompact) const Text('GROUNDWORK', style: TextStyle(fontSize: 13, letterSpacing: 1.4, fontWeight: FontWeight.w800, color: ink)),
            const Spacer(),
            navigation,
            if (!veryCompact) IconButton(tooltip: 'Help', onPressed: onHelp, icon: const Icon(Icons.help_outline)),
            StreamBuilder<User?>(stream: AuthController.instance.changes, initialData: AuthController.instance.user, builder: (context, snapshot) {
              final user = snapshot.data;
              if (user == null) return compact ? IconButton(tooltip: 'Continue with Google', onPressed: onSignIn, icon: const Icon(Icons.login)) : OutlinedButton(onPressed: onSignIn, child: const Text('Continue with Google'));
              return Tooltip(message: user.email ?? user.displayName ?? 'Signed in', child: IconButton(onPressed: () => AuthController.instance.signOut(), icon: CircleAvatar(radius: 15, backgroundImage: user.photoURL == null ? null : NetworkImage(user.photoURL!), child: user.photoURL == null ? Text((user.displayName ?? 'N')[0]) : null)));
            }),
            if (!compact) const SizedBox(width: 4),
            compact ? IconButton(tooltip: 'Practice a report', onPressed: onReport, icon: const Icon(Icons.add_location_alt_outlined)) : FilledButton.tonalIcon(onPressed: onReport, icon: const Icon(Icons.add, size: 18), label: const Text('Practice report')),
          ]);
        }),
      );
}

class _Filters extends StatelessWidget {
  const _Filters({required this.search, required this.area, required this.onArea, required this.onSearch});
  final TextEditingController search; final String area; final ValueChanged<String> onArea; final ValueChanged<String> onSearch;
  @override Widget build(BuildContext context) => Padding(padding: const EdgeInsets.fromLTRB(20, 2, 20, 10), child: LayoutBuilder(builder: (context, constraints) { final compact = constraints.maxWidth < 680; final searchBox = TextField(controller: search, onChanged: onSearch, decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: 'Search reports, places, or issue types', border: OutlineInputBorder(), isDense: true)); final region = DropdownButtonFormField<String>(key: ValueKey(area), initialValue: area, decoration: const InputDecoration(prefixIcon: Icon(Icons.map_outlined), labelText: 'Area', border: OutlineInputBorder(), isDense: true), items: [for (final option in delhiAreas) DropdownMenuItem(value: option, child: Text(option))], onChanged: (value) { if (value != null) onArea(value); }); return compact ? Row(children: [Expanded(child: searchBox), const SizedBox(width: 8), SizedBox(width: 158, child: region)]) : Row(children: [Expanded(child: searchBox), const SizedBox(width: 10), SizedBox(width: 220, child: region)]); }));
}

class _DatabaseBanner extends StatelessWidget {
  const _DatabaseBanner({required this.message, required this.onDismiss}); final String message; final VoidCallback onDismiss;
  @override Widget build(BuildContext context) => Container(width: double.infinity, margin: const EdgeInsets.fromLTRB(20, 0, 20, 5), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7), decoration: BoxDecoration(color: const Color(0xFFFFF4DE), borderRadius: BorderRadius.circular(9)), child: Row(children: [const Icon(Icons.info_outline, size: 16, color: Color(0xFF875C22)), const SizedBox(width: 8), Expanded(child: Text(message, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: Color(0xFF734B18)))), IconButton(onPressed: onDismiss, constraints: const BoxConstraints.tightFor(width: 28, height: 28), padding: EdgeInsets.zero, icon: const Icon(Icons.close, size: 16))]));
}

class _ReportCard extends StatelessWidget {
  const _ReportCard({required this.report, required this.selected, required this.onSelect, required this.onThread}); final GroundworkReport report; final bool selected; final VoidCallback onSelect, onThread;
  @override Widget build(BuildContext context) => InkWell(onTap: onSelect, borderRadius: BorderRadius.circular(13), child: Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: selected ? const Color(0xFFF1F3E9) : const Color(0xFFFBFAF7), border: Border.all(color: selected ? leaf : border), borderRadius: BorderRadius.circular(13)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(report.status.toUpperCase(), style: const TextStyle(color: Color(0xFF845320), fontSize: 9, letterSpacing: .9, fontWeight: FontWeight.bold)), const SizedBox(height: 5), Text(report.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: ink)), const SizedBox(height: 5), Text('${report.place} · ${report.time}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: Colors.black54)), Row(children: [Text('▲ ${report.votes}', style: const TextStyle(fontSize: 11, color: ink)), const Spacer(), TextButton(onPressed: onThread, child: const Text('Discussion'))])])));
}

class _SelectedReportCard extends StatelessWidget {
  const _SelectedReportCard({required this.report, required this.onClose, required this.onDiscussion});
  final GroundworkReport report;
  final VoidCallback onClose, onDiscussion;
  @override
  Widget build(BuildContext context) => Card(
        color: const Color(0xFFFFFEFB),
        elevation: 4,
        clipBehavior: Clip.antiAlias,
        child: SingleChildScrollView(padding: const EdgeInsets.all(14), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Expanded(child: Text(report.status, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: leaf))), IconButton(tooltip: 'Close selected report', onPressed: onClose, visualDensity: VisualDensity.compact, icon: const Icon(Icons.close, size: 19))]),
          Text(report.kind, style: const TextStyle(fontSize: 11, color: Colors.black54)),
          const SizedBox(height: 5),
          Text(report.title, style: const TextStyle(fontFamily: 'Georgia', fontSize: 20, height: 1.15, color: ink)),
          const SizedBox(height: 7),
          Text(report.place, style: const TextStyle(fontSize: 12)),
          const SizedBox(height: 4),
          Text('${report.time} · ${report.source}', style: const TextStyle(fontSize: 11, color: Colors.black54)),
          const SizedBox(height: 8),
          Text('Demo report · source not linked · status not verified${report.photo ? ' · demo photo attached (not displayed)' : ''}', style: const TextStyle(fontSize: 10, height: 1.4, color: Color(0xFF72571F))),
          const SizedBox(height: 5),
          SizedBox(width: double.infinity, child: FilledButton.tonal(onPressed: onDiscussion, child: const Text('View in community'))),
        ])),
      );
}

class _CommunityCard extends StatelessWidget {
  const _CommunityCard({required this.report, required this.score, required this.comments, required this.onOpen, required this.onVote}); final GroundworkReport report; final int score, comments; final VoidCallback onOpen; final ValueChanged<int> onVote;
  @override Widget build(BuildContext context) => Card(color: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15), side: const BorderSide(color: border)), child: Padding(padding: const EdgeInsets.all(16), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [Column(children: [IconButton(tooltip: 'Upvote report', onPressed: () => onVote(1), icon: const Icon(Icons.keyboard_arrow_up)), Text('$score', style: const TextStyle(fontWeight: FontWeight.bold)), IconButton(tooltip: 'Downvote report', onPressed: () => onVote(-1), icon: const Icon(Icons.keyboard_arrow_down))]), const SizedBox(width: 10), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('${report.status} · ${report.kind} · ${report.time}', style: const TextStyle(fontSize: 12, color: leaf)), const SizedBox(height: 6), Text(report.title, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w600, color: ink)), const SizedBox(height: 7), Text(report.place, style: const TextStyle(color: Colors.black54)), TextButton.icon(onPressed: onOpen, icon: const Icon(Icons.chat_bubble_outline, size: 17), label: Text('$comments comments · open discussion'))]))])));
}

class _BudgetPage extends StatefulWidget {
  const _BudgetPage({required this.links, required this.connected, required this.onNotice, required this.onSave}); final List<SourceLink> links; final bool connected; final ValueChanged<String> onNotice; final Future<bool> Function(String, String, String) onSave;
  @override State<_BudgetPage> createState() => _BudgetPageState();
}
class _BudgetPageState extends State<_BudgetPage> {
  final zones = const [('West Zone', 6.35, '48 km of drains', 19), ('Najafgarh', 4.73, '36 km of drains', 12), ('South Zone', 3.21, '24 km of drains', 9)]; int index = 0; final label = TextEditingController(), url = TextEditingController();
  String get rti => 'To,\nThe Public Information Officer\n[Relevant department]\n\nSubject: Information under Section 6(1) of the RTI Act, 2005\n\nPlease provide the following information for ${zones[index].$1}:\n1. Ward-wise drain desilting work orders and completion records for FY 2025–26.\n2. Allocated and spent amounts, with dates and work locations.\n3. Inspection reports and action taken records.\n\nApplicant: [Name]\nAddress: [Postal address]\nDate: [Date]\n\nThis is a draft for personal review. Confirm the correct PIO and fee before submitting.';
  @override void dispose() { label.dispose(); url.dispose(); super.dispose(); }
  @override Widget build(BuildContext context) { final zone = zones[index]; const total = 14.29; return Padding(padding: const EdgeInsets.fromLTRB(22, 13, 22, 18), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text('PUBLIC MONEY. PUBLIC QUESTIONS.', style: TextStyle(color: leaf, letterSpacing: 1.3, fontSize: 11, fontWeight: FontWeight.bold)), const SizedBox(height: 5), const Text('Follow every rupee.', style: TextStyle(fontSize: 25, fontWeight: FontWeight.w700, color: ink)), const Text('All figures and targets are illustrative.', style: TextStyle(color: Colors.black54)), const SizedBox(height: 14), Wrap(spacing: 8, runSpacing: 8, children: [for (var i = 0; i < zones.length; i++) ChoiceChip(label: Text('${zones[i].$1} · ₹${zones[i].$2.toStringAsFixed(2)} Cr'), selected: index == i, onSelected: (_) => setState(() => index = i))]), const SizedBox(height: 12), Expanded(child: LayoutBuilder(builder: (context, box) { final column = box.maxWidth < 760; return Flex(direction: column ? Axis.vertical : Axis.horizontal, crossAxisAlignment: CrossAxisAlignment.stretch, children: [Expanded(flex: 6, child: _rti(zone)), SizedBox(width: column ? 0 : 14, height: column ? 12 : 0), Expanded(flex: 4, child: _sources(zone))]; })), Align(alignment: Alignment.centerRight, child: Text('Illustrative total across 3 zones: ₹${total.toStringAsFixed(2)} Cr · not official budget data', style: const TextStyle(fontSize: 11, color: Colors.black54)))])); }
  Widget _rti((String, double, String, int) zone) => Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.white, border: Border.all(color: border), borderRadius: BorderRadius.circular(15)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('SECTION 6(1) · RTI ACT, 2005', style: TextStyle(fontSize: 10, color: leaf)), const SizedBox(height: 4), Text('Ask about ${zone.$1}.', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600)), const Text('A starting point, not a filed application. Confirm the correct PIO and fee, then submit it yourself.', style: TextStyle(fontSize: 12, color: Colors.black54)), const SizedBox(height: 8), Expanded(child: TextFormField(key: ValueKey(zone.$1), initialValue: rti, readOnly: true, maxLines: null, expands: true, style: const TextStyle(fontFamily: 'monospace', fontSize: 12), decoration: const InputDecoration(border: OutlineInputBorder(), filled: true, fillColor: Color(0xFFF8F7F3)))), const SizedBox(height: 8), FilledButton.icon(onPressed: () async { await Clipboard.setData(ClipboardData(text: rti)); widget.onNotice('RTI draft copied. It has not been filed.'); }, icon: const Icon(Icons.copy), label: const Text('Copy application'))]));
  Widget _sources((String, double, String, int) zone) => Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.white, border: Border.all(color: border), borderRadius: BorderRadius.circular(15)), child: ListView(children: [Text('Add a source, not a claim', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: ink)), const SizedBox(height: 5), Text('Links for ${zone.$1} are not independently verified. Budget figures remain illustrative.', style: const TextStyle(fontSize: 12, color: Colors.black54)), const SizedBox(height: 12), TextField(controller: label, maxLength: 100, decoration: const InputDecoration(labelText: 'Source label', border: OutlineInputBorder(), counterText: '')), const SizedBox(height: 8), TextField(controller: url, keyboardType: TextInputType.url, decoration: const InputDecoration(labelText: 'Source URL', hintText: 'https://', border: OutlineInputBorder())), const SizedBox(height: 8), FilledButton(onPressed: () async { if (label.text.trim().isEmpty || url.text.trim().isEmpty) { widget.onNotice('Enter a label and an http(s) URL.'); return; } if (await widget.onSave(zone.$1, label.text, url.text)) { label.clear(); url.clear(); } }, child: const Text('Save source link')), const Divider(height: 25), for (final link in widget.links.where((link) => link.zone == zone.$1)) ListTile(contentPadding: EdgeInsets.zero, leading: const Icon(Icons.link), title: Text(link.label), subtitle: Text(link.url, maxLines: 2, overflow: TextOverflow.ellipsis), onTap: () async { try { if (!await launchUrl(Uri.parse(link.url), mode: LaunchMode.externalApplication)) widget.onNotice('Could not open this source link.'); } catch (_) { widget.onNotice('Could not open this source link.'); } }), if (!widget.connected) const Text('Database records unavailable; saved links are not shown as persisted.', style: TextStyle(fontSize: 11, color: Colors.black54))]));
}

class _DemoReportDialog extends StatefulWidget {
  const _DemoReportDialog();
  @override
  State<_DemoReportDialog> createState() => _DemoReportDialogState();
}

class _DemoReportDialogState extends State<_DemoReportDialog> {
  final title = TextEditingController();
  PlatformFile? photo;
  int step = 0;
  bool checking = false;
  String outcome = 'Pass';
  String error = '';

  @override
  void dispose() { title.dispose(); super.dispose(); }

  Future<void> choosePhoto() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.image, withData: true);
    if (!mounted || result == null || result.files.isEmpty) return;
    final selected = result.files.first;
    final allowed = {'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'};
    if (!allowed.contains(selected.extension?.toLowerCase()) || selected.size > 10 * 1024 * 1024) {
      setState(() => error = 'Choose an image under 10 MB. The file has not been uploaded.');
      return;
    }
    setState(() { photo = selected; error = ''; });
  }

  Future<void> runChecks() async {
    setState(() { checking = true; error = ''; });
    await Future<void>.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    if (outcome == 'Simulated failure') {
      setState(() { checking = false; error = 'Simulated check failure. Choose “Pass” and retry. Nothing was sent.'; });
    } else {
      setState(() { checking = false; step = 2; });
    }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: Text(step == 3 ? 'Your demo is complete.' : 'Put the problem on the map.'),
        content: SizedBox(width: 440, child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('A PRACTICE REPORT ONLY · NOT VERIFIED', style: TextStyle(color: leaf, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
          const SizedBox(height: 8),
          Row(children: [for (final entry in ['Photo', 'Demo checks', 'Review', 'Complete'].indexed) Expanded(child: Padding(padding: const EdgeInsets.only(right: 5), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Container(height: 3, decoration: BoxDecoration(color: entry.$1 <= step ? leaf : border, borderRadius: BorderRadius.circular(4))), const SizedBox(height: 5), Text(entry.$2, style: const TextStyle(fontSize: 10, color: Colors.black54))])))]),
          const SizedBox(height: 14),
          if (step == 0) ...[
            const Text('Choose an image from your device. It stays in this browser and is never uploaded.'),
            const SizedBox(height: 10),
            OutlinedButton.icon(onPressed: choosePhoto, icon: const Icon(Icons.photo_outlined), label: Text(photo?.name ?? 'Choose a photo')),
            if (photo != null) Text('Selected: ${photo!.name}', style: const TextStyle(fontSize: 12, color: leaf)),
          ] else if (step == 1) ...[
            const Text('Location metadata is simulated. No real location is requested and the image is not analyzed.'),
            const SizedBox(height: 8),
            const Text('Demo location: Connaught Place, Central Delhi', style: TextStyle(fontSize: 12)),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(key: ValueKey(outcome), initialValue: outcome, decoration: const InputDecoration(labelText: 'Try a demo outcome', border: OutlineInputBorder()), items: const [DropdownMenuItem(value: 'Pass', child: Text('Pass')), DropdownMenuItem(value: 'Simulated failure', child: Text('Simulated failure'))], onChanged: checking ? null : (value) { if (value != null) setState(() { outcome = value; error = ''; }); }),
          ] else if (step == 2) ...[
            const Text('Demo checks passed. Nothing has been published or sent to an authority.'),
            const SizedBox(height: 10),
            TextField(controller: title, maxLength: 150, onChanged: (_) => setState(() {}), decoration: const InputDecoration(labelText: 'Issue title', border: OutlineInputBorder())),
            Text('Photo: ${photo?.name ?? 'selected locally'}\nLocation: simulated · duplicate result: simulated', style: const TextStyle(fontSize: 12, color: Colors.black54)),
          ] else ...[
            const Icon(Icons.check_circle_outline, size: 30, color: leaf),
            const SizedBox(height: 8),
            const Text('Demo checks passed. This practice submission is not saved. Your photo stayed in the browser. Nothing was sent to an authority.'),
          ],
          if (error.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(error, style: const TextStyle(color: Color(0xFF9B2C20), fontSize: 12))),
          const SizedBox(height: 6),
          const Text('Groundwork does not publish reports, upload photos, or file complaints.', style: TextStyle(fontSize: 11, color: Colors.black54)),
        ])),
        actions: [
          if (step < 3) TextButton(onPressed: checking ? null : () { if (step == 0) { Navigator.pop(context); } else { setState(() { error = ''; step--; }); } }, child: Text(step == 0 ? 'Cancel' : 'Back')),
          if (step == 0) FilledButton(onPressed: photo == null ? null : () => setState(() { step = 1; error = ''; }), child: const Text('Continue')),
          if (step == 1) FilledButton(onPressed: checking ? null : runChecks, child: Text(checking ? 'Running simulated checks…' : 'Run demo checks')),
          if (step == 2) FilledButton(onPressed: title.text.trim().isEmpty ? null : () => setState(() => step = 3), child: const Text('Complete demo submission')),
          if (step == 3) FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Done')),
        ],
      );
}

class _Footer extends StatelessWidget { const _Footer(); @override Widget build(BuildContext context) => Container(width: double.infinity, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8), decoration: const BoxDecoration(border: Border(top: BorderSide(color: border))), child: const Text('Groundwork · Delhi drainage watch   ·   Demo, not verified · illustrative reports and budgets', style: TextStyle(fontSize: 10, color: Colors.black54))); }
