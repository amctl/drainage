class GroundworkReport {
  const GroundworkReport({
    required this.id,
    required this.title,
    required this.area,
    required this.place,
    required this.kind,
    required this.status,
    required this.time,
    required this.age,
    required this.votes,
    required this.author,
    required this.reputation,
    required this.lng,
    required this.lat,
    required this.source,
    this.photo = false,
  });

  final int id;
  final String title, area, place, kind, status, time, author, source;
  final int age, votes, reputation;
  final double lng, lat;
  final bool photo;

  factory GroundworkReport.fromJson(Map<String, dynamic> row) {
    final created = DateTime.tryParse('${row['created_at'] ?? ''}')?.toLocal();
    final ageHours = created == null ? 1 : DateTime.now().difference(created).inHours.clamp(1, 999999).toInt();
    return GroundworkReport(
      id: int.parse('${row['id']}'), title: '${row['title']}', area: '${row['area']}',
      place: '${row['place']}', kind: '${row['kind']}', status: '${row['status']}',
      time: ageHours < 24 ? '$ageHours hours ago' : '${(ageHours / 24).round()} days ago', age: ageHours,
      votes: (row['vote_score'] as num?)?.toInt() ?? 0, author: '${row['author'] ?? 'Neighbour'}',
      reputation: (row['reputation'] as num?)?.toInt() ?? 0, lng: (row['lng'] as num).toDouble(),
      lat: (row['lat'] as num).toDouble(), photo: row['photo'] == true, source: '${row['source'] ?? 'Resident report'}',
    );
  }

  Map<String, dynamic> toFeature() => {
        'type': 'Feature',
        'geometry': {'type': 'Point', 'coordinates': [lng, lat]},
        'properties': {'id': id, 'title': title, 'color': status == 'Resolved' ? '#368067' : status == 'Work underway' ? '#487ca1' : '#d77a32'},
      };
}

class GroundworkComment {
  const GroundworkComment({required this.id, required this.reportId, required this.author, required this.text, required this.score, required this.createdAt, this.parentId});
  final int id, reportId, score;
  final int? parentId;
  final String author, text;
  final DateTime createdAt;

  factory GroundworkComment.fromJson(Map<String, dynamic> row) => GroundworkComment(
        id: int.parse('${row['id']}'), reportId: int.parse('${row['report_id']}'),
        parentId: row['parent_id'] == null ? null : int.parse('${row['parent_id']}'),
        author: '${row['author'] ?? 'Neighbour'}', text: '${row['text']}',
        score: (row['vote_score'] as num?)?.toInt() ?? 0,
        createdAt: DateTime.tryParse('${row['created_at'] ?? ''}') ?? DateTime.now(),
      );
}

class SourceLink {
  const SourceLink({required this.id, required this.zone, required this.url, required this.label});
  final int id;
  final String zone, url, label;
  factory SourceLink.fromJson(Map<String, dynamic> row) => SourceLink(id: int.parse('${row['id']}'), zone: '${row['zone']}', url: '${row['url']}', label: '${row['label']}');
}

const delhiAreas = ['All Delhi', 'South East', 'Old Delhi', 'North', 'New Delhi', 'Central', 'Central North', 'South West', 'Outer North', 'North West', 'North East', 'East', 'South', 'West'];
