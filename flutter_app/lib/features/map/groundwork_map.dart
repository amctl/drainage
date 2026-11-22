import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import '../../models/groundwork_models.dart';
import '../../models/ward_areas.dart';

class GroundworkMap extends StatefulWidget {
  const GroundworkMap({super.key, required this.area, required this.reports, required this.selectedReport, required this.onReportSelected});
  final String area;
  final List<GroundworkReport> reports;
  final GroundworkReport? selectedReport;
  final ValueChanged<GroundworkReport> onReportSelected;

  @override
  State<GroundworkMap> createState() => _GroundworkMapState();
}

class _GroundworkMapState extends State<GroundworkMap> {
  MapboxMap? _map;
  List<Map<String, dynamic>> _wards = [];
  String? _error;
  bool _loading = true;

  @override
  void initState() { super.initState(); _loadWards(); }

  Future<void> _loadWards() async {
    try {
      final parsed = jsonDecode(await rootBundle.loadString('assets/data/wards_delhi.geojson')) as Map<String, dynamic>;
      _wards = (parsed['features'] as List).cast<Map<String, dynamic>>().map((feature) {
        final copy = Map<String, dynamic>.from(feature);
        copy['properties'] = {...(feature['properties'] as Map<String, dynamic>? ?? {}), 'district': districtForWard(feature['properties'] as Map<String, dynamic>? ?? {})};
        return copy;
      }).toList();
      if (mounted) setState(() { _loading = false; });
      await _syncLayers(focusArea: true);
    } catch (error) {
      if (mounted) setState(() { _loading = false; _error = 'Ward boundaries could not load: $error'; });
    }
  }

  void _onMapCreated(MapboxMap map) {
    _map = map;
    map.setCamera(CameraOptions(center: Point(coordinates: Position(77.205, 28.617)), zoom: 10.7));
  }

  void _onMapLoadError(MapLoadingErrorEventData event) {
    if (mounted) setState(() { _error = 'Mapbox map failed to load: ${event.message}${event.sourceId == null ? '' : ' · source ${event.sourceId}'}'; });
  }

  Future<void> _onStyleLoaded(StyleLoadedEventData event) async {
    final map = _map;
    if (map == null) return;
    try {
      await map.style.addSource(GeoJsonSource(id: 'groundwork-wards', data: jsonEncode(_collection(_wards))));
      await map.style.addLayer(LineLayer(id: 'groundwork-ward-lines', sourceId: 'groundwork-wards', lineColor: 0xBB355B47, lineWidth: 1.15));
      await map.style.addSource(GeoJsonSource(id: 'groundwork-selected-wards', data: jsonEncode(_collection(const []))));
      await map.style.addLayer(FillLayer(id: 'groundwork-selected-fill', sourceId: 'groundwork-selected-wards', fillColor: 0x66E8A84B, fillOutlineColor: 0xFFB95E24));
      await map.style.addLayer(LineLayer(id: 'groundwork-selected-outline', sourceId: 'groundwork-selected-wards', lineColor: 0xFFF07B32, lineWidth: 2.2));
      await map.style.addSource(GeoJsonSource(id: 'groundwork-reports', data: jsonEncode(_collection(const []))));
      await map.style.addLayer(CircleLayer(id: 'groundwork-report-pins', sourceId: 'groundwork-reports', circleColor: 0xFFD77A32, circleRadius: 7, circleStrokeColor: 0xFFFFFFFF, circleStrokeWidth: 2));
      map.addInteraction(TapInteraction(FeaturesetDescriptor(layerId: 'groundwork-report-pins'), (feature, context) {
        final id = int.tryParse('${feature.properties['id']}');
        if (id == null) return;
        GroundworkReport? report;
        for (final item in widget.reports) {
          if (item.id == id) { report = item; break; }
        }
        if (report != null) widget.onReportSelected(report);
      }, radius: 18));
      if (mounted) setState(() { _error = null; });
      await _syncLayers(focusArea: true);
      final report = widget.selectedReport;
      if (report != null) await map.flyTo(CameraOptions(center: Point(coordinates: Position(report.lng, report.lat)), zoom: 14.2), MapAnimationOptions(duration: 900));
    } catch (error) {
      if (mounted) setState(() { _error = 'Map layers could not initialize: $error'; });
    }
  }

  Map<String, dynamic> _collection(List<Map<String, dynamic>> features) => {'type': 'FeatureCollection', 'features': features};

  Future<void> _syncLayers({bool focusArea = false}) async {
    final map = _map;
    if (map == null || !(await map.style.styleSourceExists('groundwork-selected-wards'))) return;
    await map.style.setStyleSourceProperty('groundwork-wards', 'data', jsonEncode(_collection(_wards)));
    final selectedWards = widget.area == 'All Delhi' ? <Map<String, dynamic>>[] : _wards.where((feature) => feature['properties']?['district'] == widget.area).toList();
    await map.style.setStyleSourceProperty('groundwork-selected-wards', 'data', jsonEncode(_collection(selectedWards)));
    final points = widget.reports.map((report) => report.toFeature()).toList().cast<Map<String, dynamic>>();
    await map.style.setStyleSourceProperty('groundwork-reports', 'data', jsonEncode(_collection(points)));
    if (focusArea && widget.area != 'All Delhi' && selectedWards.isNotEmpty) {
      try {
        final bounds = _boundsFor(selectedWards);
        if (bounds == null) return;
        final camera = await map.cameraForCoordinateBounds(bounds, MbxEdgeInsets(top: 46, left: 46, bottom: 46, right: 46), null, null, 11.8);
        await map.flyTo(camera, MapAnimationOptions(duration: 1100));
      } catch (_) { /* Highlights still work if a malformed geometry cannot be fitted. */ }
    } else if (focusArea && widget.area == 'All Delhi') {
      await map.flyTo(CameraOptions(center: Point(coordinates: Position(77.205, 28.617)), zoom: 10.7), MapAnimationOptions(duration: 900));
    }
  }

  CoordinateBounds? _boundsFor(List<Map<String, dynamic>> features) {
    double? west, south, east, north;
    void visit(dynamic value) {
      if (value is List && value.length >= 2 && value[0] is num && value[1] is num) {
        final longitude = (value[0] as num).toDouble();
        final latitude = (value[1] as num).toDouble();
        west = west == null ? longitude : (longitude < west! ? longitude : west);
        east = east == null ? longitude : (longitude > east! ? longitude : east);
        south = south == null ? latitude : (latitude < south! ? latitude : south);
        north = north == null ? latitude : (latitude > north! ? latitude : north);
        return;
      }
      if (value is List) for (final item in value) { visit(item); }
    }

    for (final feature in features) { visit(feature['geometry']?['coordinates']); }
    final minLongitude = west;
    final minLatitude = south;
    final maxLongitude = east;
    final maxLatitude = north;
    if (minLongitude == null || minLatitude == null || maxLongitude == null || maxLatitude == null) return null;
    return CoordinateBounds(
      southwest: Point(coordinates: Position(minLongitude, minLatitude)),
      northeast: Point(coordinates: Position(maxLongitude, maxLatitude)),
      infiniteBounds: false,
    );
  }

  @override
  void didUpdateWidget(covariant GroundworkMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    final oldReportIds = oldWidget.reports.map((item) => item.id).join(',');
    final nextReportIds = widget.reports.map((item) => item.id).join(',');
    if (oldWidget.area != widget.area) _syncLayers(focusArea: true);
    else if (oldReportIds != nextReportIds) _syncLayers();
    if (oldWidget.selectedReport?.id != widget.selectedReport?.id && widget.selectedReport != null) {
      final report = widget.selectedReport!;
      _map?.flyTo(CameraOptions(center: Point(coordinates: Position(report.lng, report.lat)), zoom: 14.2), MapAnimationOptions(duration: 900));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (const String.fromEnvironment('MAPBOX_ACCESS_TOKEN').isEmpty) return const _MapMessage(text: 'Mapbox token is missing. Add MAPBOX_ACCESS_TOKEN to the Flutter build configuration.');
    if (_error != null) return _MapMessage(text: _error!);
    return Stack(children: [
      Positioned.fill(child: MapWidget(styleUri: MapboxStyles.MAPBOX_STREETS, onMapCreated: _onMapCreated, onStyleLoadedListener: _onStyleLoaded, onMapLoadErrorListener: _onMapLoadError)),
      if (_loading) const Positioned(top: 12, left: 12, child: Chip(avatar: SizedBox.square(dimension: 14, child: CircularProgressIndicator(strokeWidth: 2)), label: Text('Loading Delhi ward boundaries'))),
      if (!_loading && _wards.isEmpty) const Positioned(top: 12, left: 12, child: Chip(label: Text('Ward boundaries unavailable'))),
      Positioned(right: 12, top: 12, child: DecoratedBox(decoration: BoxDecoration(color: Colors.white.withValues(alpha: .94), borderRadius: BorderRadius.circular(12)), child: Padding(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), child: Text(widget.area == 'All Delhi' ? 'Delhi · all 13 areas' : '${widget.area} highlighted', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600))))),
    ]);
  }
}

class _MapMessage extends StatelessWidget {
  const _MapMessage({required this.text});
  final String text;
  @override
  Widget build(BuildContext context) => Center(child: Container(margin: const EdgeInsets.all(24), padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: const Color(0xFFFFF8E9), borderRadius: BorderRadius.circular(16)), child: Text(text, style: const TextStyle(color: Color(0xFF734B18)))));
}
